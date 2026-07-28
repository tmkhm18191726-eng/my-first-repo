import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from './theme';

export type Feature = {
  label: string;
  desc: string;
  color: string;
};

/**
 * 3つの特徴を、左から順にスライドインさせる。
 * カードごとに delay をずらすだけでリズムが生まれる。
 */
export const FeatureRow: React.FC<{items: Feature[]}> = ({items}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div
      style={{
        display: 'flex',
        gap: 32,
        justifyContent: 'center',
        alignItems: 'stretch',
      }}
    >
      {items.map((item, i) => {
        const enter = spring({
          frame: frame - i * 7,
          fps,
          config: {damping: 18, mass: 0.9, stiffness: 100},
        });

        const x = interpolate(enter, [0, 1], [-60, 0]);

        return (
          <div
            key={item.label}
            style={{
              width: 400,
              padding: '36px 34px',
              borderRadius: 22,
              backgroundColor: 'rgba(20,24,41,0.72)',
              border: '1px solid rgba(255,255,255,0.09)',
              // 背景のぼかし玉がカード越しに透ける
              backdropFilter: 'blur(8px)',
              transform: `translateX(${x}px)`,
              opacity: enter,
              fontFamily: theme.fontFamily,
            }}
          >
            <div
              style={{
                width: 44,
                height: 6,
                borderRadius: 999,
                backgroundColor: item.color,
                marginBottom: 20,
              }}
            />
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: theme.text,
                marginBottom: 12,
              }}
            >
              {item.label}
            </div>
            <div style={{fontSize: 23, lineHeight: 1.65, color: theme.muted}}>
              {item.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
};
