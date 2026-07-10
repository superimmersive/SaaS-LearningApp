/** LekkeLeer design tokens (matches lekkeleer-lees web app) */
export const theme = {
  sky: '#e8f4ff',
  blue: '#3b9ed4',
  navy: '#1a3a5c',
  green: '#2ecc71',
  yellow: '#ffd93d',
  orange: '#ff8c42',
  pink: '#ff6b9d',
  white: '#ffffff',
  text: '#1a2332',
  muted: '#64748b',
  border: '#e2e8f0',
} as const;

export const WEEK_LABELS = [
  'Week 1', 'Week 2', 'Week 3', 'Week 4',
  'Week 5', 'Week 6', 'Week 7', 'Week 8',
] as const;

// Short Afrikaans focus blurb per week, shown on the dashboard and inside each activity so the
// child/parent knows what the reading + spelling words are practising. Edit freely to match the
// exact curriculum wording — these summarise the phonics pattern of each week's content.
export const WEEK_FOCUS = [
  'Kort /a/ klank — woorde soos das, sak, mat en kort sinne.',
  'Kort /e/ klank — woorde soos nes, pet, bed en kort sinne.',
  'Kort /i/ klank — woorde soos lig, pit, vis en kort sinne.',
  'Kort /o/ klank — woorde soos son, rot, pop en kort sinne.',
  '/y/ klank — woorde soos vyf, rys, byl en kort sinne.',
  'Kort /u/ klank — woorde soos bus, hut, sus en kort sinne.',
  'Meervoude & dubbel-konsonante — kat→katte, mat→matte.',
  'Lang vokale & meervoude — muur→mure, vuur→vure.',
] as const;

export type ActivityId = 'lees' | 'spell';

export const ACTIVITIES: {
  id: ActivityId;
  title: string;
  emoji: string;
  description: string;
  subject: string;
}[] = [
  {
    id: 'lees',
    title: 'Lees saam',
    emoji: '📖',
    description: 'Lees sinne saam met die rekenaar',
    subject: 'Afrikaans',
  },
  {
    id: 'spell',
    title: 'Spell woorde',
    emoji: '✏️',
    description: 'Leer woorde met flitskaarte',
    subject: 'Afrikaans',
  },
];
