import React from 'react';
import {Composition} from 'remotion';
import {Intro} from './Intro';

/**
 * 動画の目録。ここに並べた <Composition> が Remotion Studio の
 * サイドバーに出て、そのまま `remotion render <id>` の id になる。
 */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Intro"
      component={Intro}
      durationInFrames={300} // 30fps × 10秒
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        title: 'Remotion',
        subtitle: 'React で書く、コードの動画',
        closing: 'コードで、動画をつくる',
      }}
    />
  );
};
