import React from 'react';
import { ViewStyle } from 'react-native';
import Svg, { G } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
  opacity?: number;
  style?: ViewStyle;
};

type BaseSvgIconProps = IconProps & {
  viewBox?: string;
  children: React.ReactNode;
};

export default function BaseSvgIcon({
  size = 24,
  color = '#000',
  opacity = 1,
  style,
  children,
  viewBox = '0 0 24 24',
}: BaseSvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox={viewBox} style={style}>
      <G fill={color} opacity={opacity}>
        {children}
      </G>
    </Svg>
  );
}
