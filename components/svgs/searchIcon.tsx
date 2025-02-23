import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

const SearchIcon = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.width || 24}
    height={props.height || 24}
    fill={props.fill || "black"}
    {...props}
  >
    <Path
      d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z"
      fill="none"
      stroke={props.fill || "black"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <Line
      x1="16.511"
      x2="22"
      y1="16.511"
      y2="22"
      fill="none"
      stroke={props.fill || "black"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </Svg>
);

export default SearchIcon;
