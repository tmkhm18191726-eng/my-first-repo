import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from './theme';

type Props = {
  text: string;
  /** 1文字ずつ遅らせるフレーム数 */
  stagger?: number;
  fontSize?: number;
  gradient?: boolean;
};

/**
 * 文字を1つずつ、バネの動きで下から出す。
 *
 * CSS の animation-delay に相当するのが「フレームを引き算する」こと。
 * spring() に frame - delay を渡せば、その文字だけ遅れて動き出す。
 */
export const AnimatedTitle: React.FC<Props> = ({
  text,
  stagger = 2.5,
  fontSize = 96,
  gradient = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        fontFamily: theme.fontFamily,
        fontSize,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        lineHeight: 1.15,
      }}
    >
      {Array.from(text).map((char, i) => {
        const delay = i * stagger;

        const enter = spring({
          frame: frame - delay,
          fps,
          config: {damping: 14, mass: 0.7, stiffness: 120},
        });

        const y = interpolate(enter, [0, 1], [70, 0]);
        const scale = interpolate(enter, [0, 1], [0.7, 1]);

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translateY(${y}px) scale(${scale})`,
              opacity: enter,
              // 空白は幅がつぶれるので明示的に確保する
              whiteSpace: 'pre',
              ...(gradient
                ? {
                    backgroundImage: `linear-gradient(120deg, ${theme.accent3}, ${theme.accent}, ${theme.accent2})`,
                    backgroundSize: `${text.length}ch 100%`,
                    backgroundPosition: `${-i}ch 0`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }
                : {color: theme.text}),
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};
