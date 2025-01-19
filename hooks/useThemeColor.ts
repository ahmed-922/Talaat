/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext.tsx';
import { lightTheme, darkTheme } from '../styles/themes';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof lightTheme & keyof typeof darkTheme
) {
  const { theme } = useContext(ThemeContext);

  if (theme === 'dark') {
    return props.dark || darkTheme[colorName];
  } else {
    return props.light || lightTheme[colorName];
  }
}
