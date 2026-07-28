import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from './theme';

/**
 * 背景。ゆっくり回るグラデーションと、漂う光の粒。
 *
 * ここが Remotion の肝で、Math.random() ではなく remotion の random(seed) を使う。
 * レンダリングはフレームを並列に処理するので、毎回同じ値が返らないと
 * 粒がフレームごとにワープしてしまう。
 */
export const BackgroundField: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();

  const DOTS = 44;

  // 全編を通してゆっくり色相が流れる
  const hueShift = interpolate(frame, [0, durationInFrames], [0, 40]);

  return (
    <AbsoluteFill style={{backgroundColor: theme.bgDeep}}>
      {/* 大きなぼかし玉を2つ動かして、生きた背景にする */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 60% at ${
            30 + Math.sin(frame / 90) * 12
          }% ${35 + Math.cos(frame / 70) * 10}%, rgba(110,168,255,0.30), transparent 70%)`,
          filter: `hue-rotate(${hueShift}deg)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 55% at ${
            72 + Math.cos(frame / 110) * 10
          }% ${68 + Math.sin(frame / 80) * 12}%, rgba(255,122,196,0.22), transparent 70%)`,
          filter: `hue-rotate(${hueShift}deg)`,
        }}
      />

      {Array.from({length: DOTS}).map((_, i) => {
        // seed を固定すれば、どのフレームでも同じ粒が同じ軌道を通る
        const baseX = random(`x-${i}`) * width;
        const baseY = random(`y-${i}`) * height;
        const speed = 0.2 + random(`s-${i}`) * 0.6;
        const size = 2 + random(`r-${i}`) * 4;
        const phase = random(`p-${i}`) * Math.PI * 2;

        // 上へゆっくり流し、画面外に出たら下から戻す
        const y = (baseY - frame * speed + height * 2) % (height + 60) - 30;
        const x = baseX + Math.sin(frame / 40 + phase) * 18;
        const opacity = 0.15 + Math.abs(Math.sin(frame / 55 + phase)) * 0.5;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: theme.text,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
