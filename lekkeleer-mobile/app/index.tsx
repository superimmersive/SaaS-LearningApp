import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/Header';
import { ActivityCard } from '@/components/ActivityCard';
import { ACTIVITIES, theme, WEEK_FOCUS, WEEK_LABELS } from '@/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const [weekIndex, setWeekIndex] = useState(0);

  function openActivity(id: 'lees' | 'spell') {
    router.push({ pathname: `/${id}`, params: { week: String(weekIndex + 1) } });
  }

  return (
    <View style={styles.root}>
      <Header badge="Dashboard" onLogoLongPress={() => router.push('/debug')} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.breadcrumb}>
          Term 1 › {WEEK_LABELS[weekIndex]} › Afrikaans
        </Text>

        <Text style={styles.sectionTitle}>Aktiwiteite vir hierdie week</Text>
        <Text style={styles.sectionSub}>Term 1 · {WEEK_LABELS[weekIndex]}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekRow}>
          {WEEK_LABELS.map((label, i) => (
            <Pressable
              key={label}
              onPress={() => setWeekIndex(i)}
              style={[styles.weekPill, i === weekIndex && styles.weekPillActive]}
            >
              <Text style={[styles.weekPillText, i === weekIndex && styles.weekPillTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.focusCard}>
          <Text style={styles.focusLabel}>Hierdie week se fokus</Text>
          <Text style={styles.focusText}>{WEEK_FOCUS[weekIndex] ?? ''}</Text>
        </View>

        <View style={styles.cards}>
          {ACTIVITIES.map((a) => (
            <ActivityCard
              key={a.id}
              emoji={a.emoji}
              title={a.title}
              description={a.description}
              subject={a.subject}
              onPress={() => openActivity(a.id)}
            />
          ))}
        </View>

        <Text style={styles.note}>
          Lees saam en Spell woorde — volledige aktiwiteite op foon.
        </Text>

        <Pressable onPress={() => router.push('/debug')} style={styles.debugLink}>
          <Text style={styles.debugLinkText}>🔧 Debug (microphone / speech)</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.sky,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  breadcrumb: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.navy,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.navy,
    textAlign: 'center',
  },
  sectionSub: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.muted,
    marginTop: 4,
    marginBottom: 16,
  },
  weekRow: {
    flexGrow: 0,
    marginBottom: 20,
    maxHeight: 44,
  },
  weekPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: theme.white,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.border,
  },
  weekPillActive: {
    backgroundColor: theme.blue,
    borderColor: theme.blue,
  },
  weekPillText: {
    fontWeight: '800',
    color: theme.navy,
    fontSize: 13,
  },
  weekPillTextActive: {
    color: theme.white,
  },
  focusCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    borderLeftWidth: 5,
    borderLeftColor: theme.yellow,
  },
  focusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  focusText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.navy,
    lineHeight: 20,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  note: {
    fontSize: 12,
    color: theme.muted,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  debugLink: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  debugLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.blue,
    textAlign: 'center',
  },
});
