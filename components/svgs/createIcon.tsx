import React from 'react';
import Svg, { Path } from 'react-native-svg';

const CreateIcon = (props) => (
  <Svg
    viewBox="0 0 12 12"
    width={props.width || 24}
    height={props.height || 24}
    fill={props.fill || "black"}
    {...props}
  >
    <Path
      d="M6 2v8m4-4H2"
      fill="none"
      stroke={props.fill || "black"}
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </Svg>
);

export default CreateIcon;
