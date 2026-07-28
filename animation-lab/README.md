# animation-lab

アニメーションの作り方を 2 通り試したもの。同じ「動くもの」でも、
ブラウザで見せるのか、動画ファイルとして書き出すのかで道具が変わります。

| | [`vanilla/`](./vanilla) | [`remotion/`](./remotion) |
|---|---|---|
| 何になる | ブラウザで動く Web ページ | MP4 / GIF の動画ファイル |
| 使うもの | HTML + CSS + 素の JavaScript | React + TypeScript + Remotion |
| 準備 | 不要 | `npm install` |
| 操作できる | できる（ボタン・スライダー） | できない（見るだけ） |
| 時間の扱い | 実時間（`requestAnimationFrame`） | フレーム番号（`useCurrentFrame()`） |
| 向いている用途 | サイトの演出、UI の動き、ローダー | OP 動画、SNS 用の告知、大量生成 |

---

## 1. `vanilla/` — HTML + JavaScript

`vanilla/index.html` をブラウザで開くだけ。ビルドもインストールも不要です。

```bash
open animation-lab/vanilla/index.html   # macOS
```

1 ファイルの中に、仕組みの違う 4 つのデモが入っています。

1. **CSS キーフレーム** — `@keyframes` と `animation-delay` だけ。JavaScript ゼロ。
   一番手軽で、GPU に載るので軽い。
2. **Web Animations API** — `element.animate()` が返す `Animation` を持っておくと、
   あとから `play()` / `reverse()` / `playbackRate` で操作できる。
3. **Canvas 描画** — `requestAnimationFrame` で 1 フレームずつ自分で描く。
   粒子どうしの距離で線を引くような、DOM では無理な表現ができる。
4. **SVG パス** — `stroke-dashoffset` を動かして線が伸びる表現。
   `getPointAtLength()` でパス上の座標を取り、先端に点を走らせている。

各デモに一時停止ボタンとスライダーが付いているので、
数値を変えたときの見え方をその場で確かめられます。

### 押さえておくと良いところ

- **`prefers-reduced-motion`** — OS の「視差効果を減らす」設定を尊重して、
  最初から止まった状態で表示する（アクセシビリティ上ほぼ必須）。
- **`devicePixelRatio`** — Canvas は実ピクセル数を上げないと Retina でぼやける。
- **`IntersectionObserver`** — 画面外に出たら `requestAnimationFrame` を止める。
  止めないとタブを開いている間ずっと CPU を焼き続けます。

---

## 2. `remotion/` — React + Remotion

React のコンポーネントを書くと、それが動画になります。

```bash
cd animation-lab/remotion
npm install

npm run dev        # ブラウザでプレビュー（Remotion Studio）
npm run render     # out/intro.mp4 を書き出す
npm run still      # out/cover.png（サムネイル用の1枚）
```

`npm run dev` で開く Studio には、動画編集ソフトのようなタイムラインがあり、
コードを保存すると即座に反映されます。まずこれを触るのが分かりやすいです。

### 中身

```
src/
  index.ts            registerRoot() — 入口
  Root.tsx            <Composition> の一覧（尺・fps・解像度・props をここで決める）
  Intro.tsx           本編。<Sequence> で3カットに分けている
  AnimatedTitle.tsx   文字を1つずつバネで出す
  FeatureRow.tsx      カード3枚を順にスライドイン
  BackgroundField.tsx 背景の光の粒
  theme.ts            色と書体
```

1920×1080 / 30fps / 10 秒の動画になります。

### 考え方が Web と違うところ

- **時間ではなくフレーム番号で考える。**
  `useCurrentFrame()` が返す「今何コマ目か」だけを見て、その瞬間の絵を返します。
  `setInterval` も `transition` も使いません。関数の戻り値が絵、という形です。

- **`spring()` で「バネ」の動きが作れる。**
  イージング曲線を選ぶかわりに、質量・硬さ・減衰を指定します。
  自然な弾みが出るので、UI っぽい動きにはこちらが手軽です。

- **遅らせたいときはフレームを引き算する。**
  CSS の `animation-delay` にあたるのが `frame - delay` を渡すこと。
  `AnimatedTitle.tsx` は、これだけで 1 文字ずつのズレを作っています。

- **`Math.random()` は使えない。**
  レンダリングはフレームを並列に処理するので、毎回違う値が返ると
  粒がフレームごとにワープします。seed を渡す `random('x-1')` を使います。

- **props で中身を差し替えられる。**
  `Root.tsx` の `defaultProps` を外から渡せば、同じ作りのまま
  文言違いの動画を何百本でも自動で書き出せます。ここが Remotion の一番の強みです。

### 書き出しについて

Remotion は Chrome を裏で動かして 1 フレームずつスクリーンショットを撮り、
ffmpeg で繋いでいます。ヘッドレス環境で Chrome が見つからない場合は
`--browser-executable` でパスを渡します。

```bash
npx remotion render Intro out/intro.mp4 \
  --browser-executable=/path/to/headless_shell
```

`out/` は `.gitignore` に入れてあります（動画をリポジトリに入れると重くなるため）。

---

## どちらを選ぶか

- サイトに埋め込む・ユーザーが触る → **vanilla**（CSS で足りるなら CSS だけで）
- 動画ファイルが欲しい・同じ形式で量産したい → **Remotion**
