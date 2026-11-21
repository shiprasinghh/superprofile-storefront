// Curated, free-to-use Unsplash photos (Unsplash License), grouped by creator
// niche. The AI picks a theme; we pick the photo. Hand-picked photos are
// fast, never down, and always on-brand — unlike live image generation.

export const THEMES = [
  "yoga",
  "fitness",
  "meditation",
  "wellness",
  "nutrition",
  "cooking",
  "finance",
  "trading",
  "business",
  "tech",
  "design",
  "art",
  "kids",
  "study",
  "books",
  "astrology",
  "fashion",
  "beauty",
  "music",
  "dance",
  "photography",
  "call",
] as const;
export type Theme = (typeof THEMES)[number];

/** One line per theme, shown to the model so it can choose well. */
export const THEME_GUIDE: Record<Theme, string> = {
  yoga: "yoga practice",
  fitness: "workouts, gym, weight loss",
  meditation: "meditation, mindfulness, mental health",
  wellness: "massage, spa, physiotherapy, self-care",
  nutrition: "diet plans, healthy eating, salads",
  cooking: "Indian cooking, recipes, home chefs, baking",
  finance: "personal finance, money, savings, tax (rupee notes)",
  trading: "stock market, trading, crypto, investing charts",
  business: "coaching, careers, entrepreneurship, meetings",
  tech: "coding, software, laptops, digital skills",
  design: "graphic design, UI, digital illustration",
  art: "painting, drawing, crafts, art classes",
  kids: "kids activities, parenting, drawing for children",
  study: "exam prep, tutoring, students, teaching",
  books: "ebooks, guides, reading, writing",
  astrology: "astrology, tarot, spirituality",
  fashion: "fashion, styling, sarees, clothing",
  beauty: "makeup, skincare, beauty",
  music: "music lessons, guitar, singing",
  dance: "dance classes, Indian classical dance",
  photography: "photography, cameras, content creation",
  call: "1:1 video calls and online consultations",
};

const PHOTOS: Record<Theme, string[]> = {
  yoga: ["1758797315487-b3b225dff7d8", "1758797316894-c25b94e8426a", "1714892530388-7d0106430647", "1549951490-363c7e240302"],
  fitness: ["1571019613454-1cb2f99b2d8b", "1591258370814-01609b341790", "1584735935682-2f2b69dff9d2", "1714646442330-9068099f5521", "1586401100295-7a8096fd231a"],
  meditation: ["1506126613408-eca07ce68773", "1512438248247-f0f2a5a8b7f0", "1559595500-e15296bdbb48", "1536623975707-c4b3b2af565d"],
  wellness: ["1741522509438-a120c0bb5e88", "1745327883508-b6cd32e5dde5", "1544161515-4ab6ce6db874", "1696841212541-449ca29397cc", "1761470575018-135c213340eb"],
  nutrition: ["1512621776951-a57141f2eefd", "1498837167922-ddd27525d352", "1490818387583-1baba5e638af", "1540420773420-3366772f4999"],
  cooking: ["1728910156510-77488f19b152", "1596797038530-2c107229654b", "1565556250026-9ba22083e3e0", "1725483990188-41d4fb0d1e5a", "1603894584373-5ac82b2ae398"],
  finance: ["1565371767810-ef913a6c8315", "1509603148757-f2a393f18afa", "1565373679580-fc0cb538f49c", "1729077537326-91749c1c9197"],
  trading: ["1611974789855-9c2a0a7236a3", "1689732888407-310424e3a372", "1621264448270-9ef00e88a935", "1629339942248-45d4b10c8c2f"],
  business: ["1517245386807-bb43f82c33c4", "1580894732444-8ecded7900cd", "1758519289074-9de36003622b", "1551836022-d5d88e9218df"],
  tech: ["1525547719571-a2d4ac8945e2", "1614741118887-7a4ee193a5fa", "1555099962-4199c345e5dd", "1763568258129-3e019ef91b75"],
  design: ["1626785774573-4b799315345d", "1561070791-2526d30994b5", "1611532736597-de2d4265fba3", "1572044162444-ad60f128bdea", "1558655146-d09347e92766"],
  art: ["1541753866388-0b3c701627d3", "1658303135227-fcdfb0dab396", "1633887091273-a3bd71efddde", "1597274303632-880ef8660375"],
  kids: ["1605627079912-97c3810a11a4", "1616706161242-f1d591350d1c", "1637195141546-2469a5312504"],
  study: ["1434030216411-0b793f4b4173", "1571260899304-425eee4c7efc", "1560785496-3c9d27877182", "1585661417298-8236a5f449aa"],
  books: ["1610116306796-6fea9f4fae38", "1541963463532-d68292c34b19", "1506880018603-83d5b814b5a6", "1544716278-ca5e3f4abd8c"],
  astrology: ["1600429991827-5224817554f8", "1637757969279-c4d028905131", "1694144167581-8bc49479f6b7"],
  fashion: ["1619516388835-2b60acc4049e", "1503160865267-af4660ce7bf2", "1571908599407-cdb918ed83bf", "1619715613791-89d35b51ff81"],
  beauty: ["1596462502278-27bfdc403348", "1512496015851-a90fb38ba796", "1594465919760-441fe5908ab0", "1773688189414-7637b9b138e1"],
  music: ["1510915361894-db8b60106cb1", "1471478331149-c72f17e33c73", "1579797990179-4ca11c8b47fd", "1676468785588-1925f8186407"],
  dance: ["1463592177119-bab2a00f3ccb", "1764014792668-bc484714744f", "1645264090488-a019de493023", "1786452158003-a8b93e8b7b86"],
  photography: ["1542038784456-1ea8e935640e", "1541516160071-4bb0c5af65ba", "1502920917128-1aa500764cbd", "1502982720700-bfff97f2ecac"],
  call: ["1612831455359-970e23a1e4e9", "1588196749597-9ff075ee6b5b", "1590769398823-a62d7ecc25e6", "1616531770192-6eaea74c2456"],
};

export const ALL_PHOTO_IDS: string[] = Object.values(PHOTOS).flat();

export function photoCount(theme: Theme): number {
  return PHOTOS[theme].length;
}

/** Photo URL for a theme + index (index wraps, so "next photo" never runs out). */
export function photoUrl(theme: Theme, index: number, w = 800, h = 450): string {
  const list = PHOTOS[theme] ?? PHOTOS.business;
  const id = list[((index % list.length) + list.length) % list.length];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}

const KEYWORDS: [Theme, RegExp][] = [
  ["yoga", /yoga|asana|surya/i],
  ["meditation", /meditat|mindful|mental health|anxiety|stress/i],
  ["wellness", /massage|spa|physio|therap|self.?care|ayurved/i],
  ["nutrition", /diet|nutrition|healthy eating|weight loss|meal plan/i],
  ["fitness", /fitness|workout|gym|exercise|strength|run|zumba/i],
  ["cooking", /cook|recipe|chef|bak|food|kitchen/i],
  ["trading", /trad|stock|share market|crypto|invest|nifty|option/i],
  ["finance", /financ|money|tax|saving|ca\b|budget|loan|insurance/i],
  ["tech", /cod|program|developer|software|excel|tech|ai\b|data/i],
  ["design", /design|ui|ux|canva|figma|illustrat/i],
  ["art", /art|paint|draw|sketch|craft|warli|doodle|mandala/i],
  ["kids", /kid|child|parent|toddler|mom/i],
  ["study", /exam|upsc|neet|jee|tutor|teach|student|class|school|coach/i],
  ["astrology", /astro|tarot|numerolog|vastu|spiritual|zodiac/i],
  ["fashion", /fashion|styl|saree|cloth|outfit|boutique/i],
  ["beauty", /makeup|beauty|skin|hair|nail|bridal/i],
  ["music", /music|sing|guitar|piano|vocal|tabla/i],
  ["dance", /danc|kathak|bharatanatyam|choreo/i],
  ["photography", /photo|camera|video|reel|content creat|edit/i],
  ["business", /business|career|startup|marketing|sales|leader|interview/i],
];

/** Best-effort theme from free text, for old links or a missing model answer. */
export function guessTheme(text: string): Theme {
  for (const [theme, re] of KEYWORDS) if (re.test(text)) return theme;
  return "business";
}
