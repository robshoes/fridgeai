import { useEffect, useState } from 'react';
import { Animated } from 'react-native';

// Shared "breathing" loop backing Skeleton and any other micro-animation
// at a wait point (roadmap Fase 7) — one place for the timing/curve.
// useState (not useRef().current) for the stable Animated.Value: reading
// it during render is fine, reading a ref during render isn't.
export function usePulseAnimation() {
  const [opacity] = useState(() => new Animated.Value(0.3));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return opacity;
}
