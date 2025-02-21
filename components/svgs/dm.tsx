import React from 'react';
import Svg, { Path } from 'react-native-svg';

const MessageIcon = (props) => (
  <Svg
    viewBox="0 0 512 512"
    width={props.width || 24}
    height={props.height || 24}
    fill={props.fill || "black"}
    {...props}
  >
    <Path d="M64 0C28.7 0 0 28.7 0 64L0 352c0 35.3 28.7 64 64 64l96 0 0 80c0 6.1 3.4 11.6 8.8 14.3s11.9 2.1 16.8-1.5L309.3 416 448 416c35.3 0 64-28.7 64-64l0-288c0-35.3-28.7-64-64-64L64 0z" />
  </Svg>
);

export default MessageIcon;
