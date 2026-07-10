export function normalizeWord(word: string): string {
  return word
    .normalize('NFKD')
    .replace(/['’`"]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
    .trim();
}

export function ttsWord(word: string): string {
  return word.replace(/^[^\w']+|[^\w']+$/g, '');
}

export function tokenizeTranscript(transcript: string): string[] {
  return transcript
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => (row === 0 ? col : col === 0 ? row : 0)),
  );

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      matrix[row][col] =
        a[row - 1] === b[col - 1]
          ? matrix[row - 1][col - 1]
          : 1 + Math.min(matrix[row - 1][col], matrix[row][col - 1], matrix[row - 1][col - 1]);
    }
  }

  return matrix[a.length][b.length];
}

export function fuzzyMatch(spoken: string, expected: string): boolean {
  if (spoken === expected) return true;
  return levenshtein(spoken, expected) <= (expected.length <= 3 ? 1 : 2);
}

export function getCommonPrefixLength(previousWords: string[], nextWords: string[]): number {
  const max = Math.min(previousWords.length, nextWords.length);
  let index = 0;
  while (index < max && previousWords[index] === nextWords[index]) index += 1;
  return index;
}

/** Tracks Azure segment transcripts; partials grow within a segment, finals reset. */
export function createAzureTranscriptProcessor() {
  let segmentWords: string[] = [];

  function drainNewWords(transcript: string, resetSegment: boolean): string[] {
    const transcriptWords = tokenizeTranscript(transcript);
    if (!transcriptWords.length) {
      if (resetSegment) segmentWords = [];
      return [];
    }

    const prefix = getCommonPrefixLength(segmentWords, transcriptWords);
    const newWords = transcriptWords.slice(prefix);
    segmentWords = resetSegment ? [] : transcriptWords;
    return newWords;
  }

  return {
    processPartial(transcript: string) {
      return drainNewWords(transcript, false);
    },
    processFinal(transcript: string) {
      return drainNewWords(transcript, true);
    },
    reset() {
      segmentWords = [];
    },
  };
}

export type AzureTranscriptProcessor = ReturnType<typeof createAzureTranscriptProcessor>;
