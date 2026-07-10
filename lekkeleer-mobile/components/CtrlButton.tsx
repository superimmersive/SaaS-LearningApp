import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

type Props = {
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'play' | 'listen' | 'nav' | 'primary';
  style?: ViewStyle;
};

export function CtrlButton({ label, icon, onPress, disabled, variant = 'nav', style }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? <Text style={[styles.icon, (variant === 'play' || variant === 'listen' || variant === 'primary') && styles.iconLight]}>{icon}</Text> : null}
      <Text style={[styles.label, (variant === 'play' || variant === 'listen' || variant === 'primary') && styles.labelLight]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 110,
  },
  play: { backgroundColor: theme.blue },
  listen: { backgroundColor: theme.green },
  nav: { backgroundColor: theme.white, borderWidth: 2, borderColor: theme.border },
  primary: { backgroundColor: theme.navy },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.98 }] },
  icon: { fontSize: 16 },
  iconLight: { color: theme.white },
  label: { fontSize: 14, fontWeight: '800', color: theme.navy },
  labelLight: { color: theme.white },
});
