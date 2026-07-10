import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

type Props = {
  emoji: string;
  title: string;
  description: string;
  subject: string;
  onPress: () => void;
};

export function ActivityCard({ emoji, title, description, subject, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.gradientBar} />
      <Text style={styles.tag}>{subject}</Text>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    minHeight: 200,
    backgroundColor: theme.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden',
  },
  cardPressed: {
    transform: [{ translateY: -2 }],
  },
  gradientBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: theme.blue,
  },
  tag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(59, 158, 212, 0.15)',
    color: theme.blue,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.navy,
    textAlign: 'center',
  },
  desc: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.muted,
    textAlign: 'center',
    marginTop: 6,
  },
});
