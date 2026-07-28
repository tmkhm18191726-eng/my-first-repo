import type { IceCandidateInit, MediaConfig } from "./types";

/**
 * WebRTC の接続そのものを扱う部分。
 *
 * ★ 将来ここに映像を足すときは、呼び出し元が渡す MediaConfig の video を true に
 *    するだけでよい。受け取った映像トラックも remoteStream に入るので、
 *    画面側で <video> に流せばそのまま映る。
 *
 * 音声・映像はここから相手の端末へ直接流れる。サーバーには渡らないし、
 * 録音もしない（このファイルに MediaRecorder は一切使わない）。
 */

/**
 * 相手の居場所を探すためのサーバー。
 * フェーズ2で、つながりにくい回線のための中継サーバー（TURN）をここに足す。
 */
export function defaultIceServers(): RTCIceServer[] {
  return [{ urls: "stun:stun.cloudflare.com:3478" }];
}

export type PeerHandlers = {
  /** 自分側の経路候補が見つかった。相手へ送ってもらう。 */
  onIceCandidate: (candidate: IceCandidateInit) => void;
  /** 相手の音声（将来は映像も）が届いた */
  onRemoteStream: (stream: MediaStream) => void;
  /** つながった／切れたなどの変化 */
  onStateChange: (state: RTCPeerConnectionState) => void;
};

export class CallPeer {
  private readonly pc: RTCPeerConnection;
  private readonly remoteStream = new MediaStream();
  /** 相手の情報が届く前に来た経路候補を、いったん貯めておく場所 */
  private pendingCandidates: IceCandidateInit[] = [];
  private remoteDescriptionSet = false;
  private closed = false;

  constructor(
    private readonly media: MediaConfig,
    private readonly handlers: PeerHandlers,
    iceServers: RTCIceServer[] = defaultIceServers(),
  ) {
    this.pc = new RTCPeerConnection({ iceServers });

    this.pc.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        this.handlers.onIceCandidate(event.candidate.toJSON() as IceCandidateInit);
      }
    });

    this.pc.addEventListener("track", (event) => {
      // 音声トラックも、将来の映像トラックも、同じ1つの流れにまとめる
      this.remoteStream.addTrack(event.track);
      this.handlers.onRemoteStream(this.remoteStream);
    });

    this.pc.addEventListener("connectionstatechange", () => {
      if (this.closed) return;
      this.handlers.onStateChange(this.pc.connectionState);
    });
  }

  /** 自分のマイク（将来はカメラも）を相手に送る準備をする。 */
  addLocalStream(stream: MediaStream): void {
    for (const track of stream.getTracks()) {
      this.pc.addTrack(track, stream);
    }
    // 映像を使わない場合でも、後から映像を足せるよう受け取り口だけ用意しておく
    if (!this.media.video && this.pc.getTransceivers().every((t) => t.receiver.track?.kind !== "video")) {
      try {
        this.pc.addTransceiver("video", { direction: "inactive" });
      } catch {
        // 対応していない環境では音声だけで続ける
      }
    }
  }

  /** 呼びかける側：接続情報を作る。 */
  async createOffer(): Promise<string> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer.sdp ?? "";
  }

  /** 受ける側：相手の接続情報を受け取り、返事を作る。 */
  async acceptOffer(sdp: string): Promise<string> {
    await this.pc.setRemoteDescription({ type: "offer", sdp });
    await this.flushCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer.sdp ?? "";
  }

  /** 呼びかけた側：相手の返事を受け取る。 */
  async acceptAnswer(sdp: string): Promise<void> {
    await this.pc.setRemoteDescription({ type: "answer", sdp });
    await this.flushCandidates();
  }

  /** 相手の経路候補を受け取る。相手の情報がまだなら貯めておく。 */
  async addIceCandidate(candidate: IceCandidateInit): Promise<void> {
    if (!this.remoteDescriptionSet) {
      this.pendingCandidates.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate(candidate);
    } catch {
      // 使えない候補は捨ててよい（別の経路で繋がる）
    }
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    for (const track of this.remoteStream.getTracks()) {
      track.stop();
    }
    try {
      this.pc.close();
    } catch {
      // すでに閉じている場合は無視
    }
  }

  private async flushCandidates(): Promise<void> {
    this.remoteDescriptionSet = true;
    const queued = this.pendingCandidates;
    this.pendingCandidates = [];
    for (const candidate of queued) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch {
        // 使えない候補は捨ててよい
      }
    }
  }
}
