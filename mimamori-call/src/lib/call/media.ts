import type { CallErrorCode } from "./status";
import type { MediaConfig } from "./types";

/**
 * マイクの取得、音量メーター、着信チャイム。
 *
 * ここでも録音は一切しない（MediaRecorder は使わない）。
 * 音量メーターは「マイクが本当に生きているか」を目で確かめるためだけのもので、
 * 音のデータはどこにも残さず、その場で捨てている。
 */

/** マイク（将来はカメラも）を借りる。 */
export async function getLocalMedia(media: MediaConfig): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new MicError("insecure-context");
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: media.audio
        ? {
            // 家庭の部屋で使うので、反響と雑音を抑える設定を有効にする
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : false,
      video: media.video,
    });
  } catch (error) {
    throw new MicError(classify(error));
  }
}

/**
 * マイクを使えるかどうかだけ先に確かめる。
 * 「待機開始」を押した時点で許可を求めておき、確認できたらすぐ手放す。
 * こうすると、実際に着信したときに許可を聞かれて出られない、という事態を防げる。
 */
export async function checkMicrophone(): Promise<void> {
  const stream = await getLocalMedia({ audio: true, video: false });
  stopStream(stream);
}

export function stopStream(stream: MediaStream | null): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

/** マイクが使えなかった理由を、画面に出す日本語の種類に変換する。 */
export class MicError extends Error {
  constructor(readonly code: CallErrorCode) {
    super(code);
    this.name = "MicError";
  }
}

function classify(error: unknown): CallErrorCode {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "insecure-context";
  }
  const name = error instanceof Error ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "mic-permission";
    case "NotFoundError":
    case "OverconstrainedError":
      return "mic-missing";
    case "NotReadableError":
      // 他のアプリがマイクを使っている場合など
      return "mic-missing";
    default:
      return "unknown";
  }
}

/**
 * マイクが拾っている音の大きさを、0〜1 の値で知らせ続ける。
 * 戻り値の関数を呼ぶと止まる。
 */
export function startLevelMeter(
  context: AudioContext,
  stream: MediaStream,
  onLevel: (level: number) => void,
): () => void {
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  // 解析するだけなので、スピーカーには繋がない。
  // （繋ぐと自分の声がスピーカーから返ってしまう）
  source.connect(analyser);

  const samples = new Float32Array(analyser.fftSize);
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  // 画面の更新が重くなりすぎないよう、1秒に約10回だけ知らせる
  timer = setInterval(() => {
    if (stopped) return;
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (const value of samples) {
      sum += value * value;
    }
    const rms = Math.sqrt(sum / samples.length);
    // 小さな声でもメーターが動くよう、少し強調して 0〜1 に収める
    onLevel(Math.min(1, rms * 6));
  }, 100);

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    try {
      source.disconnect();
      analyser.disconnect();
    } catch {
      // すでに切れている場合は無視
    }
  };
}

/**
 * 着信のチャイム。
 * 気づかないうちに通話が始まらないよう、はっきり聞こえる音を2回鳴らす。
 * 音声ファイルを置かずにその場で音を作るので、読み込み待ちがない。
 */
export function playChime(context: AudioContext): void {
  const now = context.currentTime;
  // ピンポン（高い音 → 低い音）を2回
  const notes = [
    { at: 0.0, freq: 987.77 },
    { at: 0.35, freq: 783.99 },
    { at: 0.9, freq: 987.77 },
    { at: 1.25, freq: 783.99 },
  ];

  for (const note of notes) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = note.freq;

    const start = now + note.at;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  }
}

/**
 * 音を扱う準備をする。
 * iPhone は「利用者がボタンを押した流れの中」でないと音を出せないので、
 * 「待機開始」や「接続する」を押した瞬間にこれを呼んでおく。
 */
export function ensureAudioContext(existing: AudioContext | null): AudioContext {
  const context = existing ?? new AudioContext();
  if (context.state === "suspended") {
    void context.resume();
  }
  return context;
}
