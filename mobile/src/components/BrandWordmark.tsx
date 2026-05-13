import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

/**
 * PLACEHOLDER wordmark for DHL Global Forwarding PNG (mobile).
 *
 * Two-tier typographic mark — yellow "DHL" on red, plus a small
 * "GLOBAL FORWARDING" sublabel. Swap this single component for the real
 * logo asset (Image source={require(...)}) once it lands.
 *
 * Props:
 *   size      — "sm" | "md" | "lg" (default "md")
 *   theme     — "light" (default, on white) | "dark" (on dark surfaces)
 *   showSub   — hide the sublabel for tight headers (default true)
 */
type Props = {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  showSub?: boolean;
  testID?: string;
};

const sizeConfig = {
  sm: { tileFont: 13, tilePadH: 7, tilePadV: 3, subFont: 7,  subSpace: 1.6 },
  md: { tileFont: 18, tilePadH: 9, tilePadV: 4, subFont: 9,  subSpace: 1.8 },
  lg: { tileFont: 28, tilePadH: 13, tilePadV: 6, subFont: 11, subSpace: 2.2 },
};

export default function BrandWordmark({
  size = 'md',
  theme = 'light',
  showSub = true,
  testID = 'brand-wordmark',
}: Props) {
  const cfg = sizeConfig[size];
  const tileBg = theme === 'dark' ? Colors.dhlYellow : Colors.dhlRed;
  const tileText = theme === 'dark' ? Colors.dhlInk : Colors.dhlYellow;
  const subText = theme === 'dark' ? Colors.white : Colors.dhlInk;

  return (
    <View testID={testID} style={styles.wrap}>
      <View
        style={[
          styles.tile,
          {
            backgroundColor: tileBg,
            paddingHorizontal: cfg.tilePadH,
            paddingVertical: cfg.tilePadV,
          },
        ]}
      >
        <Text
          style={{
            color: tileText,
            fontSize: cfg.tileFont,
            fontWeight: '900',
            letterSpacing: -0.5,
            lineHeight: cfg.tileFont,
          }}
        >
          DHL
        </Text>
      </View>
      {showSub && (
        <Text
          testID="brand-wordmark-sub"
          style={{
            color: subText,
            fontSize: cfg.subFont,
            fontWeight: '700',
            letterSpacing: cfg.subSpace,
            marginTop: 2,
          }}
        >
          GLOBAL FORWARDING
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start' },
  tile: { borderRadius: 3 },
});
