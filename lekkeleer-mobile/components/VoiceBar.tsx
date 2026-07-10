import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import type { VoiceName } from '@/lib/config';

type Props = {
  voice: VoiceName;
  onVoiceChange: (voice: VoiceName) => void;
  status: 'ok' | 'busy' | 'error';
  statusText: string;
};

export function VoiceBar({ voice, onVoiceChange, status, statusText }: Props) {
  return (
    <View style={styles.wrap}>
      {(['Adri', 'Willem'] as VoiceName[]).map((name) => (
        <Pressable
          key={name}
          style={[styles.btn, voice === name && styles.btnActive]}
          onPress={() => onVoiceChange(name)}
        >
          <Text style={[styles.btnText, voice === name && styles.btnTextActive]}>
            {name === 'Adri' ? '🎀 Adri (vrou)' : '🧔 Willem (man)'}
          </Text>
        </Pressable>
      ))}
      <Text style={[styles.status, status === 'error' && styles.statusError, status === 'busy' && styles.statusBusy]}>
        {statusText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: theme.white,
    borderWidth: 2,
    borderColor: theme.border,
  },
  btnActive: {
    backgroundColor: theme.blue,
    borderColor: theme.blue,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.navy,
  },
  btnTextActive: {
    color: theme.white,
  },
  status: {
    width: '100%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: theme.green,
    marginTop: 4,
  },
  statusBusy: { color: theme.orange },
  statusError: { color: '#e74c3c' },
});
