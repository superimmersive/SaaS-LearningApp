import { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type TextStyle } from 'react-native';
import { theme } from '@/constants/theme';

export type SpokenWordState = 'default' | 'pending' | 'active' | 'correct' | 'karaoke';

type Props = {
  text: string;
  state: SpokenWordState;
  baseStyle?: StyleProp<TextStyle>;
};

/**
 * A word whose correctness highlight (green) animates IN quickly when recognised and FADES back
 * to default black when the state returns to 'default' — so completed words don't stay green
 * forever; the highlight only lives during/just after a "Begin Lees" pass and can loop back in
 * on a re-read. 'active'/'pending'/'karaoke' are applied immediately (no fade needed).
 */
export function SpokenWord({ text, state, baseStyle }: Props) {
  // 0 = default look (navy, no pill), 1 = correct look (green pill). Fades slowly on the way out.
  const correct = useRef(new Animated.Value(state === 'correct' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(correct, {
      toValue: state === 'correct' ? 1 : 0,
      // Snap the green IN quickly when a word is recognised, but let it drain out very gently
      // (~1.4s) once the read-back is done so it reads as a soft, calming fade.
      duration: state === 'correct' ? 160 : 1400,
      useNativeDriver: false, // colour/background interpolation isn't supported by the native driver
    }).start();
  }, [state, correct]);

  // 'active', 'pending' and 'karaoke' are discrete, immediate looks.
  if (state === 'active' || state === 'pending' || state === 'karaoke') {
    return (
      <Animated.Text style={[baseStyle, DISCRETE[state]]} allowFontScaling>
        {text}
      </Animated.Text>
    );
  }

  // 'default' and 'correct' share one animated colour/background so the green can fade out.
  const color = correct.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.navy, '#16a34a'],
  });
  const backgroundColor = correct.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(46, 204, 113, 0)', 'rgba(46, 204, 113, 0.15)'],
  });

  return (
    <Animated.Text style={[baseStyle, { color, backgroundColor }]} allowFontScaling>
      {text}
    </Animated.Text>
  );
}

const DISCRETE: Record<'active' | 'pending' | 'karaoke', TextStyle> = {
  // Current target word: bold yellow highlight, like the web "Begin Lees" experience.
  active: { color: theme.navy, backgroundColor: theme.yellow, transform: [{ scale: 1.08 }] },
  // Upcoming words during listening are dimmed so the next word to read stands out.
  pending: { color: '#cbd5e1' },
  // Karaoke word during "Speel" playback.
  karaoke: { color: theme.navy, backgroundColor: 'rgba(255, 217, 61, 0.55)', transform: [{ scale: 1.06 }] },
};
