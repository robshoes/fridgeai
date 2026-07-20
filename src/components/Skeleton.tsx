import { Animated, type DimensionValue, StyleSheet } from 'react-native';

import { usePulseAnimation } from '../hooks/usePulseAnimation';
import { colors } from '../theme';

type Props = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
};

// Cheap, dependency-free shimmer: a looping opacity pulse rather than a
// moving gradient (would need react-native-linear-gradient/MaskedView).
// Used at the two wait points the roadmap calls out (photo analysis,
// recipe generation) plus list-loading states for consistency.
export function Skeleton({ width = '100%', height = 16, borderRadius = 4 }: Props) {
  const opacity = usePulseAnimation();
  return <Animated.View style={[styles.base, { width, height, borderRadius, opacity }]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
  },
});
