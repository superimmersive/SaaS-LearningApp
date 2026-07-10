import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CtrlButton } from '@/components/CtrlButton';
import { Header } from '@/components/Header';
import { LoadingDots } from '@/components/LoadingDots';
import { SpokenWord } from '@/components/SpokenWord';
import { VoiceBar } from '@/components/VoiceBar';
import { theme, WEEK_FOCUS } from '@/constants/theme';
import { useLeesSaam } from '@/hooks/useLeesSaam';

export default function LeesScreen() {
  const router = useRouter();
  const { week } = useLocalSearchParams<{ week?: string }>();
  const weekNum = Math.min(8, Math.max(1, parseInt(week ?? '1', 10) || 1));
  const weekIndex = weekNum - 1;

  const lees = useLeesSaam(weekIndex);

  return (
    <View style={styles.root}>
      <Header badge="📖 Lees Saam" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.breadcrumb}>
          Term {lees.week.term} › Week {lees.week.week} › Afrikaans › Lees saam
        </Text>

        <Text style={styles.weekFocus}>{WEEK_FOCUS[weekIndex] ?? ''}</Text>

        <View style={styles.starsRow}>
          {lees.sentences.map((_, i) => (
            <Text key={i} style={[styles.star, lees.completed.has(i) && styles.starEarned]}>
              ⭐
            </Text>
          ))}
        </View>

        <VoiceBar
          voice={lees.voice}
          onVoiceChange={lees.setVoice}
          status={lees.ttsStatus}
          statusText={lees.ttsStatusText}
        />

        <View style={[styles.card, !lees.ttsReady && styles.cardLoading]}>
          <Text style={styles.unitLabel}>
            Term {lees.week.term} · Week {lees.week.week}
          </Text>
          <Text style={styles.sentenceNum}>
            {lees.current + 1} / {lees.sentences.length}
          </Text>
          <Text style={styles.emoji}>{lees.sentence.emoji}</Text>

          <View style={styles.sentenceWords}>
            {lees.words.map((word, index) => (
              <Pressable key={`${lees.current}-${index}`} onPress={() => lees.speakWord(index)}>
                <SpokenWord
                  text={word}
                  state={lees.wordStates[index] ?? 'default'}
                  baseStyle={styles.word}
                />
              </Pressable>
            ))}
          </View>

          {lees.showTranslation ? (
            <Text style={styles.translation}>{lees.sentence.en}</Text>
          ) : null}

          {!lees.ttsReady ? (
            <Text style={styles.loading}>Laai klank…</Text>
          ) : null}

          <View style={styles.cardActions}>
            <CtrlButton
              label="Speel"
              icon="🔊"
              variant="play"
              disabled={!lees.ttsReady || lees.listening || lees.playing}
              onPress={lees.playSentence}
              style={styles.cardBtn}
            />
            <CtrlButton
              label={lees.listening ? 'Stop' : 'Begin Lees'}
              icon={lees.listening ? '⏹' : '🎤'}
              variant="listen"
              // Begin Lees uses Azure STT, not TTS — never gate it on the audio preload.
              disabled={lees.playing}
              onPress={lees.toggleListen}
              style={styles.cardBtn}
            />
          </View>
        </View>

        <View style={[styles.micStatus, lees.listening && styles.micStatusActive]}>
          {lees.connecting ? (
            <LoadingDots color={theme.navy} />
          ) : (
            <Text style={styles.micText}>{lees.micMessage}</Text>
          )}
        </View>

        {lees.listening && !lees.connecting ? (
          <View style={styles.scoreChip}>
            <Text style={styles.scoreText}>✓ {lees.scoreCorrect}</Text>
            <Text style={styles.scoreSupport}>{lees.scoreCorrect > 0 ? 'Mooi so!' : 'Hou aan!'}</Text>
          </View>
        ) : null}

        <View style={styles.controls}>
          <CtrlButton
            label="Terug"
            icon="◀"
            onPress={() => lees.navigate(-1)}
            disabled={lees.current === 0}
          />
          <CtrlButton
            label="Volgende"
            icon="▶"
            onPress={() => lees.navigate(1)}
            disabled={lees.current >= lees.sentences.length - 1}
          />
        </View>

        <View style={styles.dotsRow}>
          {lees.sentences.map((_, index) => (
            <Pressable
              key={index}
              style={[
                styles.dot,
                index === lees.current && styles.dotCurrent,
                lees.completed.has(index) && styles.dotDone,
              ]}
              onPress={() => lees.goToSentence(index)}
            />
          ))}
        </View>

        <Pressable style={styles.backLink} onPress={() => router.replace('/')}>
          <Text style={styles.backLinkText}>← Terug na Dashboard</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={lees.showCelebration} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.celebration}>
            <Text style={styles.celebEmoji}>🏆</Text>
            <Text style={styles.celebTitle}>Fantasties gedoen! 🌟</Text>
            <Text style={styles.celebSub}>Jy het al {lees.sentences.length} sinne gelees!</Text>
            <CtrlButton label="🔄 Weer probeer!" variant="primary" onPress={lees.restartWeek} />
            <Pressable onPress={() => lees.setShowCelebration(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Sluit</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.sky },
  scroll: { padding: 16, paddingBottom: 32, alignItems: 'center' },
  breadcrumb: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.navy,
    marginBottom: 6,
    textAlign: 'center',
  },
  weekFocus: {
    fontSize: 12,
    color: theme.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 340,
    lineHeight: 17,
  },
  starsRow: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  star: { fontSize: 18, opacity: 0.25 },
  starEarned: { opacity: 1 },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
    borderTopWidth: 6,
    borderTopColor: theme.blue,
  },
  cardLoading: { opacity: 0.92 },
  unitLabel: { fontSize: 12, fontWeight: '700', color: theme.muted },
  sentenceNum: { fontSize: 13, fontWeight: '800', color: theme.blue, marginTop: 4 },
  emoji: { fontSize: 44, marginVertical: 12 },
  sentenceWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 4,
    rowGap: 6,
    marginBottom: 8,
  },
  word: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.navy,
    lineHeight: 32,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  translation: {
    fontSize: 14,
    color: theme.muted,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  loading: { fontSize: 12, color: theme.muted, marginBottom: 8 },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  cardBtn: { flex: 1 },
  micStatus: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: theme.white,
    borderWidth: 2,
    borderColor: theme.border,
  },
  micStatusActive: {
    borderColor: theme.green,
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
  },
  micText: { fontSize: 13, fontWeight: '700', color: theme.navy, textAlign: 'center' },
  scoreChip: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: theme.white,
  },
  scoreText: { fontWeight: '800', color: theme.green },
  scoreSupport: { fontWeight: '700', color: theme.muted, fontSize: 12 },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 99,
    backgroundColor: theme.border,
  },
  dotCurrent: {
    backgroundColor: theme.blue,
    transform: [{ scale: 1.2 }],
  },
  dotDone: {
    backgroundColor: theme.green,
  },
  backLink: { marginTop: 20 },
  backLinkText: { color: theme.blue, fontWeight: '700', fontSize: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 58, 92, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  celebration: {
    backgroundColor: theme.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  celebEmoji: { fontSize: 56 },
  celebTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.navy,
    marginTop: 8,
    textAlign: 'center',
  },
  celebSub: {
    fontSize: 14,
    color: theme.muted,
    marginVertical: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalClose: { marginTop: 12 },
  modalCloseText: { color: theme.blue, fontWeight: '700' },
});
