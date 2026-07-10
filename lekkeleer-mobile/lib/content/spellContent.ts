export type SpellWord = { af: string; en: string };
export type SpellWeek = { label: string; words: SpellWord[] };
export const SPELL_EMOJIS: Record<string, string> = {
  das: "🧣", sak: "🎒", mat: "🟫", bal: "⚽", kam: "💈", kat: "🐱", vat: "🏺", tak: "🌿",
  tas: "👜", was: "🧺", nes: "🪺", pet: "🧢", bed: "🛏️", pen: "✏️", mes: "🔪", hek: "🚪",
  ek: "👤", tent: "⛺", emmer: "🪣", lig: "💡", pit: "🌱", lip: "💋", vis: "🐟", kis: "📦",
  pil: "💊", bril: "👓", gril: "😬", in: "📥", iglo: "🏔️", son: "☀️", rot: "🐀", rok: "👗",
  pop: "🪆", mot: "🦋", dop: "🔔", gom: "🗑️", som: "➕", hom: "👦", hok: "🐔",
  vyf: "5️⃣", rys: "🌾", byl: "🪓", pyp: "🚰", ys: "🧊", by: "🐝", pyl: "🏹", ryp: "❄️",
  lys: "📋", lyf: "🫀", bus: "🚌", hut: "🛖", sus: "👧", rug: "🎒", mus: "🐭", bul: "🐂",
  put: "⛏️", rus: "😴", lug: "🌬️", buk: "📚",
  katte: "🐱", matte: "🟫", vuur: "🔥", mure: "🧱", sakke: "🎒", sin: "✳️", sinne: "✳️",
  dam: "🌊", damme: "🌊", muur: "🏰", naam: "🏷️", raam: "🖼️", vere: "🪶", vure: "🔥",
  haan: "🐓", hane: "🐓", rane: "🐸", dame: "👑", name: "🏷️", veer: "🪶",
};
export const SPELL_WEEKS: SpellWeek[] = [
  { label: "Week 1", words: [
    { af: "das", en: "tie / scarf" }, { af: "sak", en: "bag / pocket" }, { af: "mat", en: "mat" },
    { af: "bal", en: "ball" }, { af: "kam", en: "comb" }, { af: "kat", en: "cat" },
    { af: "vat", en: "barrel / to grab" }, { af: "tak", en: "branch" }, { af: "tas", en: "bag / suitcase" },
    { af: "was", en: "washing / was" },
  ]},
  { label: "Week 2", words: [
    { af: "nes", en: "nest" }, { af: "pet", en: "cap / hat" }, { af: "bed", en: "bed" },
    { af: "pen", en: "pen" }, { af: "mes", en: "knife" }, { af: "hek", en: "gate / fence" },
    { af: "ek", en: "I / me" }, { af: "tent", en: "tent" }, { af: "emmer", en: "bucket" },
  ]},
  { label: "Week 3", words: [
    { af: "lig", en: "light / easy" }, { af: "pit", en: "seed / pip" }, { af: "lip", en: "lip" },
    { af: "vis", en: "fish" }, { af: "kis", en: "chest / box" }, { af: "pil", en: "pill" },
    { af: "bril", en: "glasses" }, { af: "gril", en: "shudder / grill" }, { af: "in", en: "in" },
    { af: "iglo", en: "igloo" },
  ]},
  { label: "Week 4", words: [
    { af: "son", en: "sun" }, { af: "rot", en: "rat / rotten" }, { af: "rok", en: "dress / skirt" },
    { af: "pop", en: "doll" }, { af: "mot", en: "moth" }, { af: "dop", en: "shell / to fail" },
    { af: "gom", en: "gum / eraser" }, { af: "som", en: "sum" }, { af: "hom", en: "him" },
    { af: "hok", en: "cage / coop" },
  ]},
  { label: "Week 5", words: [
    { af: "vyf", en: "five" }, { af: "rys", en: "rice" }, { af: "byl", en: "axe" },
    { af: "pyp", en: "pipe / tube" }, { af: "ys", en: "ice" }, { af: "by", en: "bee / at / by" },
    { af: "pyl", en: "arrow" }, { af: "ryp", en: "ripe / frost" }, { af: "lys", en: "list / pale" },
    { af: "lyf", en: "body" },
  ]},
  { label: "Week 6", words: [
    { af: "bus", en: "bus" }, { af: "hut", en: "hut" }, { af: "sus", en: "sister" },
    { af: "rug", en: "back (body)" }, { af: "mus", en: "mouse / beanie" }, { af: "bul", en: "bull" },
    { af: "put", en: "well / pit" }, { af: "rus", en: "to rest" }, { af: "lug", en: "air / sky" },
    { af: "buk", en: "to bend down" },
  ]},
  { label: "Week 7", words: [
    { af: "kat", en: "cat" }, { af: "katte", en: "cats" }, { af: "mat", en: "mat" },
    { af: "matte", en: "mats" }, { af: "vuur", en: "fire" }, { af: "mure", en: "walls" },
    { af: "sak", en: "bag" }, { af: "sakke", en: "bags" }, { af: "sin", en: "sense / sentence" },
    { af: "sinne", en: "senses" }, { af: "dam", en: "dam / pond" }, { af: "damme", en: "dams" },
  ]},
  { label: "Week 8", words: [
    { af: "muur", en: "wall" }, { af: "mure", en: "walls" }, { af: "vuur", en: "fire" },
    { af: "vure", en: "fires" }, { af: "veer", en: "feather / spring" }, { af: "vere", en: "feathers" },
    { af: "naam", en: "name" }, { af: "name", en: "names" }, { af: "raam", en: "frame / window" },
    { af: "rane", en: "frames" }, { af: "haan", en: "rooster" }, { af: "hane", en: "roosters" },
  ]},
];
