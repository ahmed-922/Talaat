import React from 'react';
import Svg, { Path } from 'react-native-svg';

const EyeFilledIcon = (props) => (
    <Svg 
    width={props.width || 24}
    height={props.height || 24}
    fill={props.fill || "black"}
    {...props}
    viewBox="0 0 384 512">
    <Path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
    </Svg>
);

export default EyeFilledIcon;
