import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <h1 className="page-title">見守り通話</h1>
      <p className="page-lead">
        使う端末を選んでください。親のスマートフォンと自宅のパソコンで、開く画面が違います。
      </p>

      <Link className="role-link" href="/parent">
        <p className="role-link-title">👤 親用（スマートフォン）</p>
        <p className="role-link-desc">
          外出先や職場から、自宅のパソコンに話しかけるときはこちらです。
        </p>
      </Link>

      <Link className="role-link" href="/home">
        <p className="role-link-title">💻 自宅のパソコン用</p>
        <p className="role-link-desc">
          自宅の Windows ノートパソコンで開き、着信を待つ画面です。
        </p>
      </Link>

      <div className="card">
        <p className="section-title">この通話について</p>
        <ul className="note-list">
          <li>会話は録音も保存もされません。</li>
          <li>声は端末どうしで直接やりとりされ、サーバーには残りません。</li>
          <li>通話中は自宅のパソコンに「通話中」と大きく表示され、チャイムが鳴ります。</li>
          <li>緊急時の通報には使えません。119 番・110 番をご利用ください。</li>
        </ul>
      </div>
    </main>
  );
}
