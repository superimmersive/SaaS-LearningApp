import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

type Props = {
  badge?: string;
  onLogoLongPress?: () => void;
};

export function Header({ badge = 'Early access', onLogoLongPress }: Props) {
  const insets = useSafeAreaInsets();
  // Push the bar below the status bar / notch / Dynamic Island so the logo is never obscured.
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12 }]}>
      <Pressable onLongPress={onLogoLongPress} delayLongPress={600} disabled={!onLogoLongPress}>
        <Text style={styles.logo}>
          Lekke<Text style={styles.logoAccent}>Leer</Text>
        </Text>
      </Pressable>
      <Text style={styles.early}>{badge}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: theme.navy,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.white,
  },
  logoAccent: {
    color: theme.yellow,
  },
  early: {
    marginLeft: 'auto',
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'lowercase',
  },
});
