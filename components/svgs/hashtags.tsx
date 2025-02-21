import React from 'react';
import Svg, { Path } from 'react-native-svg';

const CustomIcon = (props) => (
  <Svg
    viewBox="0 -960 960 960"
    width={props.width || 24}
    height={props.height || 24}
    fill={props.fill || "black"}
    {...props}
  >
    <Path d="m240-160 40-160H120l20-80h160l40-160H180l20-80h160l40-160h80l-40 160h160l40-160h80l-40 160h160l-20 80H660l-40 160h160l-20 80H600l-40 160h-80l40-160H360l-40 160h-80Zm140-240h160l40-160H420l-40 160Z" />
  </Svg>
);

export default CustomIcon;
