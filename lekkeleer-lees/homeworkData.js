/**
 * homeworkData.js – Weekly homework sheet content (Country House School format).
 * Week 1 digitised from the paper homework sheet; other weeks use a daily template.
 */

export const HOMEWORK_WEEKS = [
  {
    week: 1,
    label: "Week 1",
    dateRange: "13 April – 16 April",
    school: "Country House School",
    intro: "Onthou om elke dag te lees en jou spelwoorde te skryf!",
    dailyReminder: [
      "Spelling: Afrikaans en Engels (Week 1)",
      "Lees: Engels en Afrikaans (Leeskaart 1) elke dag",
    ],
    days: [
      {
        id: "monday",
        label: "Maandag",
        labelEn: "Monday",
        emoji: "📅",
        tasks: [
          { type: "spell", label: "Spelwoorde", detail: "Engels & Afrikaans — Week 1 woorde" },
          { type: "lees", label: "Lees", detail: "Leeskaart 1 — lees jou bladsy in die boek" },
          { type: "write", label: "Skryf", detail: "Kies 5 spelwoorde en skryf 'n sin vir elkeen." },
          {
            type: "math",
            label: "Wiskunde",
            detail: "Decompose in jou huiswerkboek:",
            items: ["33, 42, 23", "22, 16, 55"],
          },
        ],
      },
      {
        id: "tuesday",
        label: "Dinsdag",
        labelEn: "Tuesday",
        emoji: "📚",
        tasks: [
          { type: "spell", label: "Spelwoorde", detail: "Engels & Afrikaans — Week 1 woorde" },
          { type: "lees", label: "Lees", detail: "Leeskaart 1 — lees jou bladsy in die boek" },
          { type: "write", label: "Skryf", detail: "Kies 3 Afrikaanse spelwoorde om sinne te maak." },
          { type: "comprehension", label: "Begrip", detail: "Voltooi jou begrip-oefening in die boek." },
          {
            type: "math",
            label: "Wiskunde",
            detail: "Rangskik die getalle:",
            items: [
              "Grootste na kleinste: 12, 22, 2, 32, 42, 52",
              "Kleinste na grootste: 13, 3, 23, 53, 43, 32",
            ],
          },
        ],
      },
      {
        id: "wednesday",
        label: "Woensdag",
        labelEn: "Wednesday",
        emoji: "🎤",
        tasks: [
          { type: "spell", label: "Spelwoorde", detail: "Engels & Afrikaans — Week 1 woorde" },
          { type: "lees", label: "Lees", detail: "Leeskaart 1 — lees jou bladsy in die boek" },
          { type: "oral", label: "Show & Tell", detail: "Berei voor vir Show and Tell: \"My vakansie\"." },
          {
            type: "math",
            label: "Wiskunde",
            detail: "Voltooi:",
            items: [
              "1 meer as 14 · 2 minder as 15",
              "2 meer as 8 · 2 minder as 13",
              "2 minder as 10 · 2 meer as 1",
            ],
          },
        ],
      },
      {
        id: "thursday",
        label: "Donderdag",
        labelEn: "Thursday",
        emoji: "✏️",
        tasks: [
          { type: "spell", label: "Spelwoorde", detail: "Engels & Afrikaans — Week 1 woorde" },
          { type: "lees", label: "Lees", detail: "Leeskaart 1 — lees jou bladsy in die boek" },
          { type: "math", label: "Wiskunde", detail: "Bonds of 10 in jou huiswerklêer." },
          {
            type: "language",
            label: "Taal",
            detail: "Vul die korrekte woorde in. Woordbank: Mooi, rooi, strooi, kreef, twee, breek",
            items: [
              "Die blom is baie ______. Die appel is ______.",
              "Die boer ______ kos vir die hoenders.",
              "Die ______ loop op die strand.",
              "Ek het ______ honde.",
              "Moenie die glas ______ nie.",
            ],
          },
        ],
      },
    ],
  },
];

/** Placeholder weeks 2–8: same daily lees + spell rhythm until sheets are digitised. */
const DAY_NAMES = [
  { id: "monday", label: "Maandag", labelEn: "Monday", emoji: "📅" },
  { id: "tuesday", label: "Dinsdag", labelEn: "Tuesday", emoji: "📚" },
  { id: "wednesday", label: "Woensdag", labelEn: "Wednesday", emoji: "🎤" },
  { id: "thursday", label: "Donderdag", labelEn: "Thursday", emoji: "✏️" },
];

for (let w = 2; w <= 8; w += 1) {
  HOMEWORK_WEEKS.push({
    week: w,
    label: `Week ${w}`,
    dateRange: null,
    school: "Country House School",
    intro: "Onthou om elke dag te lees en jou spelwoorde te oefen!",
    dailyReminder: [
      `Spelling: Afrikaans en Engels (Week ${w})`,
      "Lees elke dag in jou leesboek",
    ],
    days: DAY_NAMES.map((d) => ({
      ...d,
      tasks: [
        { type: "spell", label: "Spelwoorde", detail: `Engels & Afrikaans — Week ${w} woorde` },
        { type: "lees", label: "Lees", detail: "Lees vandag se bladsy in jou boek" },
        { type: "write", label: "Skryf", detail: "Skryf jou spelwoorde in jou huiswerkboek." },
      ],
    })),
  });
}

export function getHomeworkWeek(weekIndex) {
  return HOMEWORK_WEEKS[weekIndex] ?? HOMEWORK_WEEKS[0];
}

export function getHomeworkDay(weekIndex, dayId) {
  const week = getHomeworkWeek(weekIndex);
  return week.days.find((d) => d.id === dayId) ?? null;
}
