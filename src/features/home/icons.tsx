/** Small line icons drawn in code, so tabs and the add menu need no words or emoji. */
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../../theme';

export type IconName = 'home' | 'chart' | 'gear' | 'camera' | 'barcode' | 'pencil' | 'bolt' | 'plus' | 'check' | 'flame';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = colors.text, strokeWidth = 2.2 }: IconProps) {
  const line = { stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' ? (
        <>
          <Path d="M3.5 11.2 12 4l8.5 7.2" {...line} />
          <Path d="M5.8 10v8.2a1.6 1.6 0 0 0 1.6 1.6h9.2a1.6 1.6 0 0 0 1.6-1.6V10" {...line} />
          <Path d="M10 19.6v-4.8h4v4.8" {...line} />
        </>
      ) : null}
      {name === 'chart' ? (
        <>
          <Path d="M5 20V13" {...line} />
          <Path d="M12 20V5" {...line} />
          <Path d="M19 20V10" {...line} />
        </>
      ) : null}
      {name === 'gear' ? (
        <>
          <Circle cx={12} cy={12} r={3} {...line} />
          <Path
            d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"
            {...line}
          />
        </>
      ) : null}
      {name === 'camera' ? (
        <>
          <Path d="M4.6 7.6h2.6l1.5-2.2h6.6l1.5 2.2h2.6A1.6 1.6 0 0 1 21 9.2v8.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V9.2a1.6 1.6 0 0 1 1.6-1.6Z" {...line} />
          <Circle cx={12} cy={13.2} r={3.4} {...line} />
        </>
      ) : null}
      {name === 'barcode' ? (
        <>
          <Path d="M4 6v12M8 6v12M11 6v12M15 6v12M20 6v12" {...line} />
          <Path d="M17.6 6v12" {...line} strokeWidth={1.2} />
        </>
      ) : null}
      {name === 'pencil' ? (
        <>
          <Path d="M4 20l1-4.4L16.2 4.4a1.7 1.7 0 0 1 2.4 0l1 1a1.7 1.7 0 0 1 0 2.4L8.4 19 4 20Z" {...line} />
          <Path d="M14.4 6.2l3.4 3.4" {...line} />
        </>
      ) : null}
      {name === 'bolt' ? <Path d="M13 3 5.5 13.2H11l-1 7.8 7.5-10.2H12L13 3Z" {...line} /> : null}
      {name === 'plus' ? <Path d="M12 5v14M5 12h14" {...line} /> : null}
      {name === 'check' ? <Path d="M5 12.6l4.4 4.4L19 7.4" {...line} /> : null}
      {name === 'flame' ? (
        <Path d="M12 3c.6 3-1.2 4.4-2.6 6.2C8 11 7 12.6 7 14.6A5 5 0 0 0 12 20a5 5 0 0 0 5-5.4c0-2-1-3.4-2-4.6-.4 1.2-1 1.8-1.8 2.2C13.6 9.4 13.4 5.6 12 3Z" {...line} />
      ) : null}
    </Svg>
  );
}
