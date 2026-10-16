// Æther's voice: plain, warm, human. Astrology terms live in the small print, with a definition.
// All lines are original to Æther unless an author is named; named authors are in the public domain.

export const pickBy = (arr, seed) => arr[((seed % arr.length) + arr.length) % arr.length];

// ---------- Home ----------
// How today feels, by the overall tone of the sky (internal names: gusty, golden, electric, misty, clear).
export const HOME_HEADLINES = {
  gusty: [
    "Today might ask a lot of you. Go gently.",
    "If today feels heavy, it's not just you.",
    "A little friction in the air today. You can move through it.",
  ],
  golden: [
    "There's kindness in the air today.",
    "Today has a soft, open feeling. Let good things in.",
    "A warm day for your heart. Say yes to something small and lovely.",
  ],
  electric: [
    "Something might shift today. Let it.",
    "Expect a surprise or two. Stay curious.",
    "Today has a spark in it. Notice what wakes you up.",
  ],
  misty: [
    "Today may feel a little dreamy. Trust your gut.",
    "Things might look softer than they are. Take your time.",
    "A day for listening to the quiet voice inside you.",
  ],
  clear: [
    "A calm, steady day. Small honest steps go far.",
    "Nothing to push against today. Just be here.",
    "Clear skies. A good day to begin something.",
  ],
};

// Supportive second lines in the plain-spoken spirit of writers like Louise Hay and Maya Angelou.
export const HOME_SUPPORT = {
  gusty: [
    "You don't have to fix everything today. You only have to be kind to yourself while it passes.",
    "Hard days are part of the weather, not a verdict on who you are.",
    "Breathe a little slower than the day wants you to.",
  ],
  golden: [
    "You are allowed to enjoy this without waiting for the other shoe to drop.",
    "Let today be easy. You've earned an easy one.",
    "Good things are looking for you. Leave the door open.",
  ],
  electric: [
    "Change is not the enemy. It's the sky making room.",
    "You don't need a plan for everything. You need to stay open.",
    "What surprises you today may be exactly what you needed.",
  ],
  misty: [
    "Not knowing yet is allowed. Clarity arrives in its own time.",
    "Be gentle with decisions today. Let them ripen.",
    "Your intuition is speaking softly. Get quiet enough to hear it.",
  ],
  clear: [
    "You are exactly where you need to be to take the next step.",
    "A quiet day is a gift. Use it to come home to yourself.",
    "Steady is beautiful too.",
  ],
};

// ---------- Plain names ----------
export const PLAIN_PLANET = {
  Sun: "the spotlight", Moon: "your moods", Mercury: "words and plans", Venus: "love and pleasure", Mars: "energy and temper",
  Jupiter: "luck and growth", Saturn: "pressure and patience", Uranus: "surprises", Neptune: "dreams and intuition", Pluto: "deep change",
};
export const PLAIN_NATAL = {
  Sun: "your sense of who you are", Moon: "your feelings", Mercury: "how you think and talk", Venus: "how you love",
  Mars: "your drive", Ascendant: "how you come across",
};

// Big headline for a personal transit: by planet and by how the angle feels (1 easy, -1 tense, 0 blended).
export const TRANSIT_HEADLINES = {
  Sun: { 1: "You're easy to see today, in the best way.", "-1": "You might feel a bit exposed today. That's okay.", 0: "The spotlight is on {n} today." },
  Moon: { 1: "Your heart has an easy rhythm right now.", "-1": "Moods may run high for a little while.", 0: "Your feelings are close to the surface today." },
  Mercury: { 1: "Words come easily today. Say the thing.", "-1": "Messages may get crossed. Read it twice before you send.", 0: "Your mind is busy, and it has something to say." },
  Venus: { 1: "Love and small pleasures are on your side today.", "-1": "Your heart might want two things at once.", 0: "Something sweet is touching {n}." },
  Mars: { 1: "You've got energy to spare. Spend it on something you love.", "-1": "You might feel on edge. That's energy looking for a door.", 0: "There's a fire in you today." },
  Jupiter: { 1: "Something is opening up for you.", "-1": "Too much of a good thing is possible today. Pace yourself.", 0: "Something in you is ready to grow." },
  Saturn: { 1: "Slow, steady effort pays off today.", "-1": "Today may feel heavy. It's teaching you, not punishing you.", 0: "Today asks you to take something seriously." },
  Uranus: { 1: "A happy surprise could find you.", "-1": "Expect the unexpected, and stay flexible.", 0: "Something in you wants to break free." },
  Neptune: { 1: "Your intuition is especially clear right now.", "-1": "Things may feel blurry. Don't force clarity.", 0: "Today feels dreamy and wide open." },
  Pluto: { 1: "You have more inner strength than you know.", "-1": "Something deep may be stirring. Let it rise.", 0: "A quiet, powerful change is underway in you." },
};

// What it means, in one plain sentence, joined to how the person feels.
export const TRANSIT_PLAIN = {
  1: "{P} {is} working with {n} right now, which tends to make things flow.",
  "-1": "{P} {is} pressing on {n} right now, which can feel like friction.",
  0: "{P} and {n} are tangled together right now, so both feel louder.",
};
// Singular plain names take "is"; the rest are plural.
export const PLAIN_SINGULAR = new Set(["Sun", "Pluto"]);

export const FEEL_BRIDGE = {
  heavy: { 1: "Even on a hard day, this is support you can lean on.", "-1": "That might be part of why today feels heavy. It's real, and it will pass.", 0: "That intensity may be part of the weight you're carrying." },
  mixed: { 1: "This is the steady part of your day.", "-1": "That might explain the static in your day.", 0: "It can make a day feel full and hard to read." },
  golden: { 1: "This is a big part of why today feels good. Enjoy it.", "-1": "You're riding it well; today it reads as energy rather than strain.", 0: "It's turning up the volume on a good day." },
};

// Small print: the astrology, with a definition.
export const ASPECT_DEFS = {
  conjunction: "A conjunction is when two planets line up in the same spot. Astrologers read it as their energies fusing into one strong note.",
  sextile: "A sextile is a 60° angle between two planets. Astrologers read it as an open door: real help, if you walk through it.",
  square: "A square is a 90° angle between two planets. Astrologers read it as friction that builds until something changes.",
  trine: "A trine is a 120° angle between two planets, the easiest angle there is. Astrologers read it as energy flowing without effort.",
  opposition: "An opposition is when two planets sit across the sky from each other. Astrologers read it as a tug of war that asks you to find balance.",
};
export const NATAL_DEF = "Your natal chart is a map of where the planets were at the moment you were born.";
export const RISING_DEF = "Your rising sign is the sign that was coming up over the horizon when you were born.";

export const ASPECT_WORD = { conjunction: "meets", sextile: "sextile", square: "square", trine: "trine", opposition: "opposite" };

// Timing pill, plain.
export function timingPill(days, building) {
  if (days != null && days < 0.6) return "Strongest today";
  if (building && days != null && days < 1.5) return "Building now, strongest tomorrow";
  if (building && days != null && days < 60) return `Building, strongest in about ${Math.round(days)} days`;
  if (building) return "A long, slow chapter";
  return "Easing off from here";
}

// ---------- The Moon's Vedic mansions, in plain words (same order as NAKSHATRAS) ----------
export const NAKSHATRA_PLAIN = [
  "A good day for fresh starts and quick healing.",
  "Something is ready to be carried, or let go.",
  "A day for honesty that cuts through the noise.",
  "Things you've planted are quietly growing.",
  "Curiosity is your best friend today.",
  "Feelings may storm, then clear the air.",
  "Whatever was lost has a way of coming back.",
  "One of the most nourishing days of the month. Let yourself be cared for.",
  "Pay attention to what's coiled beneath the surface.",
  "A day to honour where you come from.",
  "Rest is not laziness. Today it's medicine.",
  "Kindness and good friends go a long way today.",
  "Your hands know things. Make something.",
  "A day to make something beautiful.",
  "Bend like a young tree in the wind, and you won't break.",
  "Keep your eyes on what you truly want.",
  "A day for loyal friendship and showing up for each other.",
  "Step into your own authority today.",
  "A good night to get to the root of things.",
  "Your spirit is hard to defeat today.",
  "Slow, steady effort wins the day.",
  "Listen more than you speak. Something important is being said.",
  "There's a rhythm to today. Find it and dance.",
  "A day for healing, quietly and on your own terms.",
  "Big feelings can light the way forward.",
  "Still waters run deep today. Trust the quiet.",
  "Safe travels, in the world and inside yourself.",
];

// ---------- Everyone ----------
export function togetherPlain(c) {
  if (!c) return "The sky everyone shares is calm today.";
  const tone = c.asp.harmony > 0 ? "flowing together" : c.asp.harmony < 0 ? "pulling against each other" : "blending into one";
  return `For everyone today, ${PLAIN_PLANET[c.t]} and ${PLAIN_PLANET[c.n]} are ${tone}.`;
}
export function spaceWeatherPlain(kp) {
  if (kp == null) return null;
  if (kp >= 5) return "A solar storm is washing over Earth right now. Restless energy is in the literal air.";
  if (kp >= 4) return "The Sun is a little stormy today, and Earth's magnetic field is unsettled.";
  return "The Sun is quiet today, and Earth's magnetic field is calm.";
}

// ---------- The final card: one line to carry with you ----------
// Original lines unless an author is named. Named lines are public domain.
export const CLOSING_LINES = {
  heavy: [
    { text: "Even the longest night is only the sky turning. You're allowed to rest while it does." },
    { text: "You don't have to be okay today. You only have to be gentle with yourself." },
    { text: "Your pain is the breaking of the shell that encloses your understanding.", author: "Kahlil Gibran", work: "The Prophet, 1923" },
    { text: "Hope is the thing with feathers that perches in the soul.", author: "Emily Dickinson" },
    { text: "Heavy skies still move. So will this." },
    { text: "The deeper that sorrow carves into your being, the more joy you can contain.", author: "Kahlil Gibran", work: "The Prophet, 1923" },
  ],
  mixed: [
    { text: "Some days are both. You are allowed to be both, too." },
    { text: "To every thing there is a season, and a time to every purpose under the heaven.", author: "Ecclesiastes 3:1", work: "King James Bible" },
    { text: "I am large, I contain multitudes.", author: "Walt Whitman", work: "Song of Myself, 1855" },
    { text: "You don't need the whole map. Just the next star." },
    { text: "There is nothing either good or bad, but thinking makes it so.", author: "William Shakespeare", work: "Hamlet" },
  ],
  golden: [
    { text: "Let the good day be good. You don't have to earn the light." },
    { text: "Joy is not a reward. It's the weather you were made for." },
    { text: "Live in each season as it passes; breathe the air, drink the drink, taste the fruit.", author: "Henry David Thoreau", work: "Journal, 1853" },
    { text: "Remember this feeling. It's proof of what's possible." },
    { text: "Your joy is your sorrow unmasked.", author: "Kahlil Gibran", work: "The Prophet, 1923" },
  ],
};

// Theme lines answer the words the person wrote.
export const THEME_PLAIN = {
  work: { heavy: "Work is weighing on you. Remember: your worth isn't measured in a single day's output.", mixed: "Work is in the middle of everything today. Steady beats perfect.", golden: "Work is where today's light is landing. Let yourself enjoy it." },
  love: { heavy: "Matters of the heart feel louder today. Go gently with yourself and with them.", mixed: "Love is asking for honest, simple words today.", golden: "Your heart has good weather today. Say the warm thing." },
  family: { heavy: "Family can press on old bruises. Distance is allowed.", mixed: "Family weather is changeable today. Small kindnesses carry far.", golden: "Family feels close and warm. Let it in." },
  friends: { heavy: "Lean on the people who make you feel lighter.", mixed: "A friend may hold the missing piece of today.", golden: "Good company makes a good day even better." },
  body: { heavy: "Your body is part of the weather. Rest counts as doing something.", mixed: "Listen to what your body asks for first today.", golden: "You've got energy to spend. Spend some on joy." },
  mind: { heavy: "Loud thoughts are louder on hard days. They're weather, not truth.", mixed: "Your mind is busy. Write one thing down and let the rest pass.", golden: "A clear mind is a gift. Use it on something you love." },
  money: { heavy: "Money worries feel heavier today. One practical step is enough.", mixed: "Keep money choices simple today.", golden: "Good news around money deserves a small celebration." },
  creative: { heavy: "Even heavy days feed the work. Make something small with it.", mixed: "Make something rough today. The sky likes a first draft.", golden: "Creative light is pouring in. Follow it." },
  home: { heavy: "Make one corner of home feel like yours today.", mixed: "Home is asking for a little care.", golden: "Home feels like a harbour today." },
};

export const OPEN_LINES = {
  heavy: ["Let's look at what's moving above you.", "You're not imagining it. Let's see why."],
  mixed: ["Let's see what the sky is mixing for you.", "Here's what's moving above you today."],
  golden: ["Let's see what's lighting you up.", "Here's what's shining on you today."],
};

// ---------- Weather where you are (MET Norway) ----------
// Groups MET Norway symbol codes into a handful of moods.
export function weatherKind(symbol) {
  const s = symbol || "";
  if (/thunder/.test(s)) return "storm";
  if (/snow|sleet/.test(s)) return "snow";
  if (/rain/.test(s)) return "rain";
  if (/fog/.test(s)) return "fog";
  if (/cloudy/.test(s) && !/partly/.test(s)) return "cloud";
  if (/partly|fair/.test(s)) return "fair";
  if (/clear/.test(s)) return "clear";
  return "cloud";
}
export const WEATHER_WORD = { storm: "thunder about", snow: "snow", rain: "rain", fog: "fog", cloud: "cloudy", fair: "some sun, some cloud", clear: "clear skies" };
// One gentle line that ties the weather outside to the day inside. {bucket} → kind → lines.
export const WEATHER_LINES = {
  heavy: {
    storm: ["There's thunder outside too. Storms are loud, and they pass.", "Even the weather is restless today. You don't have to match it."],
    snow: ["Snow slows everything down. Let it slow you down too.", "Everything gets quieter under snow. You're allowed to get quieter."],
    rain: ["It's raining where you are. Some days the sky cries along with you.", "Rain outside. A good excuse for a slower, softer day."],
    fog: ["Fog outside, fog inside. You only need to see the next step.", "It's hard to see far today. That's alright. Close is enough."],
    cloud: ["A grey sky overhead. Grey isn't forever; it's just today.", "Clouds over you today. The Sun is still up there, holding its place."],
    fair: ["Some sun is getting through outside. Let a little of it reach you.", "Patchy sun today. Stand in it for a minute if you can."],
    clear: ["The sky is clear where you are, even if you aren't. Step out and look up for a moment.", "Clear skies outside. Some fresh air might carry a bit of the weight."],
  },
  mixed: {
    storm: ["Thunder in the forecast. A good day to keep plans flexible.", "Stormy outside. Keep somewhere cosy in reach."],
    snow: ["Snow where you are. The world gets softer, and so can you.", "Snow outside. Warm drinks and slow mornings are recommended."],
    rain: ["Rain where you are. Good weather for thinking things through.", "A rainy one outside. Bring an umbrella, and a bit of patience."],
    fog: ["Foggy out there. Take today one step at a time.", "Fog outside. Things will come into focus as the day goes on."],
    cloud: ["Cloudy overhead. A steady, unhurried sort of day.", "Grey skies outside. Easy does it."],
    fair: ["A mix of sun and cloud where you are, a bit like the day itself.", "Sun and cloud taking turns outside. You can take turns too."],
    clear: ["Clear skies where you are. A good day to get outside for a bit.", "The weather is on your side today. Clear and open."],
  },
  golden: {
    storm: ["Thunder outside, warmth inside. Your good day doesn't need good weather.", "Storms outside can't touch the glow you're carrying."],
    snow: ["Snow outside and a bright day inside. Lovely combination.", "Snow where you are. Something about today feels like a fresh page."],
    rain: ["Rain outside, but you're carrying your own sunshine today.", "Rain where you are. Dance in it, if you feel like it."],
    fog: ["Fog outside, but you can see clearly today.", "A soft, foggy day outside to match a soft, happy one inside."],
    cloud: ["Clouds overhead, but your day is bright anyway.", "Grey outside, golden inside."],
    fair: ["Sun breaking through where you are. Fitting, for a day like this.", "Sun and cloud outside, and mostly sun inside."],
    clear: ["Clear skies where you are, and inside too. Soak it up.", "The sky is clear and so are you. Enjoy every bit of it."],
  },
};
// Fahrenheit for the US and a couple of others; Celsius everywhere else.
export function useFahrenheit() {
  try {
    const loc = new Intl.Locale(navigator.language || "en-US");
    const region = loc.region || (loc.maximize && loc.maximize().region);
    return ["US", "LR", "MM", "BS", "BZ", "KY", "PW"].includes(region);
  } catch { return false; }
}
export function weatherShort(w) {
  if (!w || w.temp == null) return "";
  const f = useFahrenheit();
  const t = Math.round(f ? w.temp * 9 / 5 + 32 : w.temp);
  return `${t}°${f ? "F" : "C"}, ${WEATHER_WORD[weatherKind(w.symbol)]}`;
}

// ---------- After a few heavy days in a row ----------
export const CARE = {
  kicker: "A gentle check-in",
  title: "You've had a few heavy days in a row",
  lead: "That's a lot to carry, and you don't have to carry it alone. The sky is good company, but people are better. If you can, tell someone you trust how it's been.",
  more: "If it ever feels like too much, talking to someone right now can really help. It's free and confidential.",
};
// Crisis lines by country, chosen from the phone's language/region settings.
export function careLine() {
  let region = "";
  try { const l = new Intl.Locale(navigator.language || ""); region = l.region || ""; } catch { }
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { }
  if (region === "US" || (!region && /^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana)/.test(tz)))
    return { label: "Call or text 988", href: "tel:988", note: "988 Suicide & Crisis Lifeline, any time, day or night." };
  if (region === "CA") return { label: "Call or text 988", href: "tel:988", note: "988 Suicide Crisis Helpline, any time, day or night." };
  if (["GB", "IE"].includes(region) || /^Europe\/(London|Dublin)/.test(tz))
    return { label: "Call Samaritans: 116 123", href: "tel:116123", note: "Free, any time, day or night." };
  if (region === "AU" || /^Australia\//.test(tz)) return { label: "Call Lifeline: 13 11 14", href: "tel:131114", note: "Any time, day or night." };
  return { label: "Find a helpline near you", href: "https://findahelpline.com", note: "Free, confidential support in your country." };
}
