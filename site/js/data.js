// Static reference data for Æther. Everything here ships with the app, so no lookup service is needed.

// Prototype city list: [name, region, lat, lon, IANA time zone]. The full app swaps this for the GeoNames list.
export const CITIES = [
  ["London", "United Kingdom", 51.5074, -0.1278, "Europe/London"],
  ["Manchester", "United Kingdom", 53.4808, -2.2426, "Europe/London"],
  ["Edinburgh", "United Kingdom", 55.9533, -3.1883, "Europe/London"],
  ["Dublin", "Ireland", 53.3498, -6.2603, "Europe/Dublin"],
  ["Paris", "France", 48.8566, 2.3522, "Europe/Paris"],
  ["Berlin", "Germany", 52.52, 13.405, "Europe/Berlin"],
  ["Amsterdam", "Netherlands", 52.3676, 4.9041, "Europe/Amsterdam"],
  ["Brussels", "Belgium", 50.8503, 4.3517, "Europe/Brussels"],
  ["Madrid", "Spain", 40.4168, -3.7038, "Europe/Madrid"],
  ["Barcelona", "Spain", 41.3874, 2.1686, "Europe/Madrid"],
  ["Lisbon", "Portugal", 38.7223, -9.1393, "Europe/Lisbon"],
  ["Rome", "Italy", 41.9028, 12.4964, "Europe/Rome"],
  ["Milan", "Italy", 45.4642, 9.19, "Europe/Rome"],
  ["Vienna", "Austria", 48.2082, 16.3738, "Europe/Vienna"],
  ["Zurich", "Switzerland", 47.3769, 8.5417, "Europe/Zurich"],
  ["Copenhagen", "Denmark", 55.6761, 12.5683, "Europe/Copenhagen"],
  ["Stockholm", "Sweden", 59.3293, 18.0686, "Europe/Stockholm"],
  ["Oslo", "Norway", 59.9139, 10.7522, "Europe/Oslo"],
  ["Helsinki", "Finland", 60.1699, 24.9384, "Europe/Helsinki"],
  ["Warsaw", "Poland", 52.2297, 21.0122, "Europe/Warsaw"],
  ["Prague", "Czechia", 50.0755, 14.4378, "Europe/Prague"],
  ["Budapest", "Hungary", 47.4979, 19.0402, "Europe/Budapest"],
  ["Athens", "Greece", 37.9838, 23.7275, "Europe/Athens"],
  ["Istanbul", "Türkiye", 41.0082, 28.9784, "Europe/Istanbul"],
  ["Kyiv", "Ukraine", 50.4501, 30.5234, "Europe/Kyiv"],
  ["Moscow", "Russia", 55.7558, 37.6173, "Europe/Moscow"],
  ["Cairo", "Egypt", 30.0444, 31.2357, "Africa/Cairo"],
  ["Lagos", "Nigeria", 6.5244, 3.3792, "Africa/Lagos"],
  ["Nairobi", "Kenya", -1.2921, 36.8219, "Africa/Nairobi"],
  ["Accra", "Ghana", 5.6037, -0.187, "Africa/Accra"],
  ["Johannesburg", "South Africa", -26.2041, 28.0473, "Africa/Johannesburg"],
  ["Cape Town", "South Africa", -33.9249, 18.4241, "Africa/Johannesburg"],
  ["Casablanca", "Morocco", 33.5731, -7.5898, "Africa/Casablanca"],
  ["Dubai", "United Arab Emirates", 25.2048, 55.2708, "Asia/Dubai"],
  ["Tel Aviv", "Israel", 32.0853, 34.7818, "Asia/Jerusalem"],
  ["Beirut", "Lebanon", 33.8938, 35.5018, "Asia/Beirut"],
  ["Tehran", "Iran", 35.6892, 51.389, "Asia/Tehran"],
  ["Karachi", "Pakistan", 24.8607, 67.0011, "Asia/Karachi"],
  ["Lahore", "Pakistan", 31.5204, 74.3587, "Asia/Karachi"],
  ["Delhi", "India", 28.6139, 77.209, "Asia/Kolkata"],
  ["Mumbai", "India", 19.076, 72.8777, "Asia/Kolkata"],
  ["Bengaluru", "India", 12.9716, 77.5946, "Asia/Kolkata"],
  ["Chennai", "India", 13.0827, 80.2707, "Asia/Kolkata"],
  ["Kolkata", "India", 22.5726, 88.3639, "Asia/Kolkata"],
  ["Hyderabad", "India", 17.385, 78.4867, "Asia/Kolkata"],
  ["Dhaka", "Bangladesh", 23.8103, 90.4125, "Asia/Dhaka"],
  ["Colombo", "Sri Lanka", 6.9271, 79.8612, "Asia/Colombo"],
  ["Kathmandu", "Nepal", 27.7172, 85.324, "Asia/Kathmandu"],
  ["Bangkok", "Thailand", 13.7563, 100.5018, "Asia/Bangkok"],
  ["Singapore", "Singapore", 1.3521, 103.8198, "Asia/Singapore"],
  ["Kuala Lumpur", "Malaysia", 3.139, 101.6869, "Asia/Kuala_Lumpur"],
  ["Jakarta", "Indonesia", -6.2088, 106.8456, "Asia/Jakarta"],
  ["Manila", "Philippines", 14.5995, 120.9842, "Asia/Manila"],
  ["Ho Chi Minh City", "Vietnam", 10.8231, 106.6297, "Asia/Ho_Chi_Minh"],
  ["Hong Kong", "China", 22.3193, 114.1694, "Asia/Hong_Kong"],
  ["Shanghai", "China", 31.2304, 121.4737, "Asia/Shanghai"],
  ["Beijing", "China", 39.9042, 116.4074, "Asia/Shanghai"],
  ["Taipei", "Taiwan", 25.033, 121.5654, "Asia/Taipei"],
  ["Seoul", "South Korea", 37.5665, 126.978, "Asia/Seoul"],
  ["Tokyo", "Japan", 35.6762, 139.6503, "Asia/Tokyo"],
  ["Osaka", "Japan", 34.6937, 135.5023, "Asia/Tokyo"],
  ["Sydney", "Australia", -33.8688, 151.2093, "Australia/Sydney"],
  ["Melbourne", "Australia", -37.8136, 144.9631, "Australia/Melbourne"],
  ["Brisbane", "Australia", -27.4698, 153.0251, "Australia/Brisbane"],
  ["Perth", "Australia", -31.9505, 115.8605, "Australia/Perth"],
  ["Auckland", "New Zealand", -36.8485, 174.7633, "Pacific/Auckland"],
  ["Honolulu", "United States", 21.3069, -157.8583, "Pacific/Honolulu"],
  ["Anchorage", "United States", 61.2181, -149.9003, "America/Anchorage"],
  ["Los Angeles", "United States", 34.0522, -118.2437, "America/Los_Angeles"],
  ["San Francisco", "United States", 37.7749, -122.4194, "America/Los_Angeles"],
  ["San Diego", "United States", 32.7157, -117.1611, "America/Los_Angeles"],
  ["Seattle", "United States", 47.6062, -122.3321, "America/Los_Angeles"],
  ["Portland", "United States", 45.5152, -122.6784, "America/Los_Angeles"],
  ["Las Vegas", "United States", 36.1699, -115.1398, "America/Los_Angeles"],
  ["Phoenix", "United States", 33.4484, -112.074, "America/Phoenix"],
  ["Denver", "United States", 39.7392, -104.9903, "America/Denver"],
  ["Salt Lake City", "United States", 40.7608, -111.891, "America/Denver"],
  ["Dallas", "United States", 32.7767, -96.797, "America/Chicago"],
  ["Houston", "United States", 29.7604, -95.3698, "America/Chicago"],
  ["Austin", "United States", 30.2672, -97.7431, "America/Chicago"],
  ["Chicago", "United States", 41.8781, -87.6298, "America/Chicago"],
  ["Minneapolis", "United States", 44.9778, -93.265, "America/Chicago"],
  ["New Orleans", "United States", 29.9511, -90.0715, "America/Chicago"],
  ["Nashville", "United States", 36.1627, -86.7816, "America/Chicago"],
  ["Atlanta", "United States", 33.749, -84.388, "America/New_York"],
  ["Miami", "United States", 25.7617, -80.1918, "America/New_York"],
  ["Detroit", "United States", 42.3314, -83.0458, "America/Detroit"],
  ["Washington, DC", "United States", 38.9072, -77.0369, "America/New_York"],
  ["Philadelphia", "United States", 39.9526, -75.1652, "America/New_York"],
  ["New York", "United States", 40.7128, -74.006, "America/New_York"],
  ["Boston", "United States", 42.3601, -71.0589, "America/New_York"],
  ["Toronto", "Canada", 43.6532, -79.3832, "America/Toronto"],
  ["Montreal", "Canada", 45.5017, -73.5673, "America/Toronto"],
  ["Vancouver", "Canada", 49.2827, -123.1207, "America/Vancouver"],
  ["Calgary", "Canada", 51.0447, -114.0719, "America/Edmonton"],
  ["Mexico City", "Mexico", 19.4326, -99.1332, "America/Mexico_City"],
  ["Guadalajara", "Mexico", 20.6597, -103.3496, "America/Mexico_City"],
  ["Havana", "Cuba", 23.1136, -82.3666, "America/Havana"],
  ["San Juan", "Puerto Rico", 18.4655, -66.1057, "America/Puerto_Rico"],
  ["Bogotá", "Colombia", 4.711, -74.0721, "America/Bogota"],
  ["Lima", "Peru", -12.0464, -77.0428, "America/Lima"],
  ["Santiago", "Chile", -33.4489, -70.6693, "America/Santiago"],
  ["Buenos Aires", "Argentina", -34.6037, -58.3816, "America/Argentina/Buenos_Aires"],
  ["São Paulo", "Brazil", -23.5505, -46.6333, "America/Sao_Paulo"],
  ["Rio de Janeiro", "Brazil", -22.9068, -43.1729, "America/Sao_Paulo"],
  ["Caracas", "Venezuela", 10.4806, -66.9036, "America/Caracas"],
  ["Reykjavík", "Iceland", 64.1466, -21.9426, "Atlantic/Reykjavik"],
];

export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// Text glyphs; the ︎ selector asks iPhone to draw them as text, not emoji.
export const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map(g => g + "︎");

export const PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];

export const PLANET_GLYPHS = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀︎", Mars: "♂︎",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
};

// What each body stands for, in plain words.
export const PLANET_INFO = {
  Sun: { domain: "your sense of self", weight: 0.8, kind: "light" },
  Moon: { domain: "your feelings and body", weight: 0.65, kind: "light" },
  Mercury: { domain: "your thoughts and messages", weight: 0.7, kind: "swift" },
  Venus: { domain: "love, pleasure and ease", weight: 0.95, kind: "benefic" },
  Mars: { domain: "drive and temper", weight: 1.0, kind: "malefic" },
  Jupiter: { domain: "luck and growth", weight: 1.1, kind: "benefic" },
  Saturn: { domain: "pressure and responsibility", weight: 1.2, kind: "malefic" },
  Uranus: { domain: "sudden change", weight: 1.25, kind: "electric" },
  Neptune: { domain: "dreams and intuition", weight: 1.25, kind: "misty" },
  Pluto: { domain: "deep transformation", weight: 1.25, kind: "deep" },
};

export const ASPECTS = [
  { name: "conjunction", angle: 0, verb: "meets", harmony: 0 },
  { name: "sextile", angle: 60, verb: "opens a door to", harmony: 1 },
  { name: "square", angle: 90, verb: "squares off with", harmony: -1 },
  { name: "trine", angle: 120, verb: "flows with", harmony: 1 },
  { name: "opposition", angle: 180, verb: "stands opposite", harmony: -1 },
];

// The 27 lunar mansions of Vedic astrology, with a short gloss for each.
export const NAKSHATRAS = [
  ["Ashwini", "the swift healer"],
  ["Bharani", "the bearer"],
  ["Krittika", "the cutting flame"],
  ["Rohini", "the growing one"],
  ["Mrigashira", "the seeker"],
  ["Ardra", "the storm"],
  ["Punarvasu", "the return of the light"],
  ["Pushya", "the nourisher"],
  ["Ashlesha", "the coiling serpent"],
  ["Magha", "the throne of the ancestors"],
  ["Purva Phalguni", "the star of rest and pleasure"],
  ["Uttara Phalguni", "the star of kind patronage"],
  ["Hasta", "the skilled hand"],
  ["Chitra", "the bright jewel"],
  ["Swati", "the independent wind"],
  ["Vishakha", "the star of purpose"],
  ["Anuradha", "the star of devoted friendship"],
  ["Jyeshtha", "the eldest"],
  ["Mula", "the root"],
  ["Purva Ashadha", "the invincible"],
  ["Uttara Ashadha", "the later victory"],
  ["Shravana", "the listener"],
  ["Dhanishta", "the drum of plenty"],
  ["Shatabhisha", "the hundred healers"],
  ["Purva Bhadrapada", "the scorching fire"],
  ["Uttara Bhadrapada", "the deep water"],
  ["Revati", "the guardian of safe journeys"],
];

export const TITHIS = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami",
  "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi",
];

// Paraphrased lines from the traditions, each with its source. Written in our own words.
export const ECHOES = {
  Moon: [
    { text: "Ptolemy taught that the Moon, the closest light to us, stirs bodies and moods faster than any planet.", source: "Ptolemy, Tetrabiblos, 2nd century" },
    { text: "Lilly judged a question by the Moon's next meeting: where she goes next is how the matter unfolds.", source: "William Lilly, Christian Astrology, 1647" },
  ],
  benefic: [
    { text: "The Hellenistic astrologers called Venus and Jupiter the benefics, the givers of good things. They asked only that you notice the gift.", source: "Hellenistic tradition, 1st to 4th century" },
    { text: "Dorotheus counted a benefic touching the Moon among the surest signs of a sweet day.", source: "Dorotheus of Sidon, 1st century" },
  ],
  malefic: [
    { text: "Vettius Valens wrote that knowing the season of a hardship brings calm, because a season always turns.", source: "Vettius Valens, Anthology, 2nd century" },
    { text: "The old astrologers said Saturn teaches through weight, and that what he builds lasts.", source: "Hellenistic tradition" },
  ],
  electric: [
    { text: "Kepler believed the soul answers the sky's geometry the way an ear answers a chord, sometimes with a jolt.", source: "Johannes Kepler, Tertius Interveniens, 1610" },
  ],
  misty: [
    { text: "Babylonian scribes wrote down the sky night after night beside the weather and the river, as if heaven and earth kept one diary.", source: "Babylonian Astronomical Diaries, from 652 BCE" },
  ],
  deep: [
    { text: "Abu Ma'shar watched the slow planets to mark the turning points of whole eras. Some days are small chapters of a long story.", source: "Abu Ma'shar, 9th century" },
  ],
  nakshatra: [
    { text: "Varahamihira read the coming rains from the Moon's walk through the lunar mansions.", source: "Varahamihira, Brihat Samhita, 6th century" },
    { text: "Al-Biruni described the lunar mansions as the Moon's nightly resting places along her road.", source: "Al-Biruni, Book of Instruction, 1029" },
  ],
  general: [
    { text: "John Goad spent thirty years in London comparing the planets' aspects with his weather diary.", source: "John Goad, Astro-Meteorologica, 1686" },
    { text: "Manilius wrote that the heavens are woven into us, so to read the sky is to read ourselves.", source: "Manilius, Astronomica, 1st century" },
  ],
};

// Theme words people use, mapped to a theme. Used to make the reading answer what they wrote.
export const THEMES = {
  work: ["work", "job", "boss", "interview", "promotion", "office", "career", "meeting", "deadline", "fired", "hired", "client", "project", "shift"],
  love: ["love", "date", "crush", "partner", "boyfriend", "girlfriend", "husband", "wife", "breakup", "broke up", "ex", "kiss", "relationship", "wedding"],
  family: ["mom", "mum", "dad", "mother", "father", "sister", "brother", "family", "parents", "kid", "kids", "son", "daughter", "grandma", "grandpa"],
  friends: ["friend", "friends", "party", "bestie", "group chat", "roommate"],
  body: ["tired", "exhausted", "sleep", "sick", "ill", "headache", "period", "cramps", "gym", "run", "body", "pain"],
  mind: ["anxious", "anxiety", "stress", "stressed", "worried", "overthinking", "panic", "sad", "lonely", "cry", "cried"],
  money: ["money", "rent", "bills", "debt", "paid", "salary", "broke", "budget"],
  creative: ["art", "music", "song", "wrote", "writing", "paint", "design", "create", "creative", "studio", "film"],
  home: ["home", "move", "moving", "apartment", "flat", "house"],
};

export const THEME_LINES = {
  work: {
    heavy: "With work weighing on you, remember the sky asks for patience with timing, not proof of your worth.",
    mixed: "Work sits in the middle of today; steady effort lands better than big swings.",
    golden: "Work is where today's light is landing. Let yourself enjoy it.",
  },
  love: {
    heavy: "Matters of the heart feel louder under a sky like this. Go gently with yourself and with them.",
    mixed: "Love is asking for honest, simple words today.",
    golden: "The heart has good weather today. Say the warm thing.",
  },
  family: {
    heavy: "Family can press on old bruises on days like this. Distance is allowed.",
    mixed: "Family weather is changeable today; small kindnesses carry far.",
    golden: "Family feels close and warm under this sky. Let it in.",
  },
  friends: {
    heavy: "Lean on the people who make you feel lighter.",
    mixed: "A friend may hold the missing piece of today.",
    golden: "Good company multiplies a sky like this.",
  },
  body: {
    heavy: "Your body is part of the weather. Rest counts as doing something.",
    mixed: "Listen to what your body asks for first today.",
    golden: "Your body has energy to spend. Spend some of it on joy.",
  },
  mind: {
    heavy: "Loud thoughts are louder under tense skies. They are weather, not truth.",
    mixed: "Your mind is busy; write one thing down and let the rest pass.",
    golden: "A clear mind is a gift today. Use it on something you love.",
  },
  money: {
    heavy: "Money worries feel heavier under pressure from the sky. One practical step is enough today.",
    mixed: "Keep money choices simple today.",
    golden: "Good news around money deserves a small celebration.",
  },
  creative: {
    heavy: "Even heavy days feed the work. Make something small with it.",
    mixed: "Make something unpolished today; the sky likes a first draft.",
    golden: "Creative light is pouring in. Follow it.",
  },
  home: {
    heavy: "Home is where today's pressure lives. Make one corner feel like yours.",
    mixed: "Home is asking for a little care today.",
    golden: "Home feels like a harbour today.",
  },
};
