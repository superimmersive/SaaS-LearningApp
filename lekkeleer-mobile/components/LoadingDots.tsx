import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

type Props = {
  color?: string;
  size?: number;
  style?: ViewStyle;
};

/**
 * Three softly pulsing dots — shown while we are connecting to Azure speech (before the mic is
 * actually live), instead of a wall of "Koppel aan Azure…" text. Each dot shares the same pulse
 * cycle but starts a beat apart so it reads as a gentle left-to-right wave.
 */
export function LoadingDots({ color = theme.navy, size = 10, style }: Props) {
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const dots = [d1, d2, d3];
    const animations = dots.map((dot, i) =>
      Animated.sequence([
        Animated.delay(i * 180),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, { toValue: 1, duration: 420, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0.3, duration: 420, useNativeDriver: true }),
          ]),
        ),
      ]),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [d1, d2, d3]);

  const dotStyle = (v: Animated.Value): Animated.WithAnimatedObject<ViewStyle> => ({
    opacity: v,
    transform: [{ scale: v }],
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  });

  return (
    <View style={[styles.row, style]}>
      <Animated.View style={dotStyle(d1)} />
      <Animated.View style={dotStyle(d2)} />
      <Animated.View style={dotStyle(d3)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
});
