import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {AnimatedTitle} from './AnimatedTitle';
import {BackgroundField} from './BackgroundField';
import {FeatureRow, type Feature} from './FeatureRow';
import {theme} from './theme';

export type IntroProps = {
  title: string;
  subtitle: string;
  closing: string;
};

const FEATURES: Feature[] = [
  {
    label: 'コードで動画',
    desc: 'React のコンポーネントが、そのまま 1 カットになる',
    color: theme.accent3,
  },
  {
    label: 'フレーム基準',
    desc: 'useCurrentFrame() で「今何コマ目か」を見て描く',
    color: theme.accent,
  },
  {
    label: 'データ差し替え',
    desc: 'props を変えるだけで、何百本でも書き出せる',
    color: theme.accent2,
  },
];

/** カットの前後を自動でフェードさせる薄いラッパー。 */
const Scene: React.FC<{
  durationInFrames: number;
  children: React.ReactNode;
}> = ({durationInFrames, children}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 10, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  return (
    <AbsoluteFill
      style={{
        opacity,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Intro: React.FC<IntroProps> = ({title, subtitle, closing}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // カットの尺（フレーム数）。合計 = durationInFrames になるように置く
  const S1 = 105;
  const S2 = 100;
  const S3 = durationInFrames - S1 - S2;

  // サブタイトルはタイトルが出そろってから
  const subEnter = spring({
    frame: frame - 34,
    fps,
    config: {damping: 20, mass: 1, stiffness: 90},
  });

  return (
    <AbsoluteFill style={{backgroundColor: theme.bg}}>
      <BackgroundField />

      {/* ---- カット1: タイトル ---- */}
      <Sequence durationInFrames={S1}>
        <Scene durationInFrames={S1}>
          <div style={{textAlign: 'center'}}>
            <AnimatedTitle text={title} fontSize={120} gradient />
            <div
              style={{
                marginTop: 26,
                fontFamily: theme.fontFamily,
                fontSize: 34,
                color: theme.muted,
                opacity: subEnter,
                transform: `translateY(${interpolate(subEnter, [0, 1], [24, 0])}px)`,
              }}
            >
              {subtitle}
            </div>
          </div>
        </Scene>
      </Sequence>

      {/* ---- カット2: 特徴3つ ---- */}
      <Sequence from={S1} durationInFrames={S2}>
        <Scene durationInFrames={S2}>
          <FeatureRow items={FEATURES} />
        </Scene>
      </Sequence>

      {/* ---- カット3: 締め ---- */}
      <Sequence from={S1 + S2} durationInFrames={S3}>
        <Scene durationInFrames={S3}>
          <AnimatedTitle text={closing} fontSize={76} stagger={2} gradient />
        </Scene>
      </Sequence>

      {/* ---- 全編を通した進捗バー ---- */}
      <AbsoluteFill style={{justifyContent: 'flex-end'}}>
        <div style={{height: 6, backgroundColor: 'rgba(255,255,255,0.08)'}}>
          <div
            style={{
              height: '100%',
              width: `${(frame / (durationInFrames - 1)) * 100}%`,
              background: `linear-gradient(90deg, ${theme.accent3}, ${theme.accent}, ${theme.accent2})`,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
