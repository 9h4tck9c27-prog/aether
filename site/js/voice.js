// æther's voice: plain, warm, human. Astrology terms live in the small print, with a definition.
// All lines are original to æther unless an author is named; named authors are in the public domain.

export const pickBy = (arr, seed) => arr[((seed % arr.length) + arr.length) % arr.length];

// ---------- Home ----------
// How today feels, by the overall tone of the sky (internal names: gusty, golden, electric, misty, clear).
export const HOME_HEADLINES = {
  gusty: [
    "Today might ask a lot of you. Go gently.",
    "If today feels heavy, it's not just you.",
    "A little friction in the air today. You can move through it.",
    "Some days push back. This might be one of them.",
    "The air feels a bit restless today. Hold on to what steadies you.",
    "Today could rub you the wrong way. It's the weather, not you.",
    "A bumpy sort of day. Keep your plans light and your heart soft.",
    "Things may not go to plan today. That's alright.",
    "Expect some resistance today, and be patient with it.",
    "A day to move slowly and choose your battles.",
  ],
  golden: [
    "There's kindness in the air today.",
    "Today has a soft, open feeling. Let good things in.",
    "A warm day for your heart. Say yes to something small and lovely.",
    "Things want to go your way today.",
    "Today is generous. Take what it offers.",
    "A good day to reach out to someone you love.",
    "The sky is smiling on you today.",
    "Easy does it, and easy is how it goes today.",
    "A day that feels like a deep breath.",
    "Something good is close. Keep your eyes open.",
  ],
  electric: [
    "Something might shift today. Let it.",
    "Expect a surprise or two. Stay curious.",
    "Today has a spark in it. Notice what wakes you up.",
    "Plans may change today. The new ones might be better.",
    "A buzzy, restless sort of day. Use the energy.",
    "Today is good for trying something new.",
    "Things are moving fast today. You can keep up.",
    "A day for breaking a habit you've outgrown.",
    "Something unexpected could turn out to be a gift.",
    "Today has a crackle to it. Follow what excites you.",
  ],
  misty: [
    "Today may feel a little dreamy. Trust your gut.",
    "Things might look softer than they are. Take your time.",
    "A day for listening to the quiet voice inside you.",
    "If things feel blurry today, don't rush to clear them.",
    "A soft-focus day. Good for dreaming, less good for deciding.",
    "Your feelings may know more than your thoughts today.",
    "A gentle, hazy day. Let yourself drift a little.",
    "Today is better for feeling than for figuring out.",
    "Not everything needs an answer today.",
    "A day for art, music and long thoughts.",
  ],
  clear: [
    "A calm, steady day. Small honest steps go far.",
    "Nothing to push against today. Just be here.",
    "Clear skies. A good day to begin something.",
    "A quiet day overhead. Use it however you like.",
    "Today is steady. A good day to catch up with yourself.",
    "Nothing dramatic in the sky today. That's its own kind of gift.",
    "A plain, peaceful day. Enjoy the ordinary.",
    "Today is good for tidy, simple progress.",
    "Calm overhead. Let some of it settle in you.",
    "An open day. Fill it with something that matters to you.",
  ],
};

// Supportive second lines in the plain-spoken spirit of writers like Louise Hay and Maya Angelou (all original).
export const HOME_SUPPORT = {
  gusty: [
    "You don't have to fix everything today. You only have to be kind to yourself while it passes.",
    "Hard days are part of the weather, not a verdict on who you are.",
    "Breathe a little slower than the day wants you to.",
    "You've made it through every hard day so far. That's a perfect record.",
    "Say no to one thing today, and mean it.",
    "Talk to yourself the way you'd talk to someone you love.",
    "Rough air doesn't mean you're flying wrong.",
    "It's okay to do the minimum today. The minimum still counts.",
    "Whatever is pushing on you, you are allowed to push back gently.",
    "Put your hand on your heart. You're still here, and that matters.",
  ],
  golden: [
    "You are allowed to enjoy this without waiting for the other shoe to drop.",
    "Let today be easy. You've earned an easy one.",
    "Good things are looking for you. Leave the door open.",
    "Share a little of your good mood. It grows when you give it away.",
    "Notice what's going right, and say it out loud.",
    "You deserve the good parts too. Every one of them.",
    "Let someone see you happy today.",
    "Say thank you to yourself for getting here.",
    "Joy is not a distraction from your life. It is your life.",
    "Take a picture in your mind. You'll want this one later.",
  ],
  electric: [
    "Change is not the enemy. It's the sky making room.",
    "You don't need a plan for everything. You need to stay open.",
    "What surprises you today may be exactly what you needed.",
    "If you feel restless, move your body. Walk it off, dance it out.",
    "Say yes to one unexpected thing.",
    "You are allowed to change your mind.",
    "The version of you that adapts is still you.",
    "Let the new thing be a little awkward. New things usually are.",
    "Not every jolt is a warning. Some are wake-up calls.",
    "Stay loose. The best moments today may be unplanned.",
  ],
  misty: [
    "Not knowing yet is allowed. Clarity arrives in its own time.",
    "Be gentle with decisions today. Let them ripen.",
    "Your intuition is speaking softly. Get quiet enough to hear it.",
    "Write down your dreams tonight. They may be trying to tell you something.",
    "You don't have to see the whole road. Just the next few steps.",
    "Being unsure is not the same as being lost.",
    "Give yourself some time near water today, even a bath counts.",
    "Trust the feeling you can't quite explain.",
    "Let some things stay a mystery for now.",
    "Be careful who you lend your energy to today.",
  ],
  clear: [
    "You are exactly where you need to be to take the next step.",
    "A quiet day is a gift. Use it to come home to yourself.",
    "Steady is beautiful too.",
    "Do one thing today that future you will thank you for.",
    "Small, kind routines are how big lives are built.",
    "There's nothing you need to prove today.",
    "Enjoy the quiet. Not every day has to be a story.",
    "Finish something small. It feels better than you'd think.",
    "You are allowed to simply be content.",
    "Check in with someone you haven't heard from in a while.",
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
// Each has a few versions so returning readers hear something new.
export const TRANSIT_HEADLINES = {
  Sun: {
    1: ["You're easy to see today, in the best way.", "You're shining a little brighter than usual.", "Today, being yourself is the easy part."],
    "-1": ["You might feel a bit exposed today. That's okay.", "Your ego might get bruised today. You'll heal fast.", "You may feel pulled between what you want and what's expected."],
    0: ["The spotlight is on {n} today.", "Today is about you, in a good way.", "Something is lighting up {n}."],
  },
  Moon: {
    1: ["Your heart has an easy rhythm right now.", "You're in tune with yourself today.", "Feelings flow easily right now. Let them."],
    "-1": ["Moods may run high for a little while.", "You might feel tender today. Handle yourself with care.", "Little things might sting more than usual. It'll pass."],
    0: ["Your feelings are close to the surface today.", "Your heart is doing a lot of the talking today.", "You may feel things more deeply than usual."],
  },
  Mercury: {
    1: ["Words come easily today. Say the thing.", "Your mind is sharp and clear right now.", "A good day for the conversation you've been putting off."],
    "-1": ["Messages may get crossed. Read it twice before you send.", "Your thoughts might race today. Write them down.", "Misunderstandings are likely. Assume good intent."],
    0: ["Your mind is busy, and it has something to say.", "Ideas are arriving fast today. Catch a few.", "Today is all about words: said, written and heard."],
  },
  Venus: {
    1: ["Love and small pleasures are on your side today.", "You're especially lovable today. Let people see it.", "Treat yourself to something beautiful today."],
    "-1": ["Your heart might want two things at once.", "Love might feel complicated today. Keep it simple.", "You may crave more than you need today. Notice it kindly."],
    0: ["Something sweet is touching {n}.", "Love is in the foreground today.", "Beauty and affection are close by today."],
  },
  Mars: {
    1: ["You've got energy to spare. Spend it on something you love.", "You're braver than usual today. Use it.", "A great day to get something done."],
    "-1": ["You might feel on edge. That's energy looking for a door.", "Your fuse may be short today. Take a breath before you react.", "Frustration might flare. Move your body to let it out."],
    0: ["There's a fire in you today.", "You're ready to act. Point it somewhere good.", "Your drive is turned all the way up today."],
  },
  Jupiter: {
    1: ["Something is opening up for you.", "Luck is leaning your way today.", "A good day to aim a little higher."],
    "-1": ["Too much of a good thing is possible today. Pace yourself.", "You may want to say yes to everything. Pick a few.", "Big promises are tempting today. Keep the ones you can."],
    0: ["Something in you is ready to grow.", "Your world is getting a little bigger.", "There's room to expand today."],
  },
  Saturn: {
    1: ["Slow, steady effort pays off today.", "You're building something that will last.", "Discipline feels easier than usual today."],
    "-1": ["Today may feel heavy. It's teaching you, not punishing you.", "You may feel tested today. You're stronger than the test.", "Things might feel slow or stuck. Keep going, gently."],
    0: ["Today asks you to take something seriously.", "A grown-up kind of day. You can handle it.", "Something in your life wants a firmer shape."],
  },
  Uranus: {
    1: ["A happy surprise could find you.", "Something fresh is coming in. Open a window.", "A great day to break your routine."],
    "-1": ["Expect the unexpected, and stay flexible.", "Something may get shaken loose today. Let it.", "Plans might wobble. You'll find a better way."],
    0: ["Something in you wants to break free.", "You're ready for a change, even a small one.", "Today wakes you up a little."],
  },
  Neptune: {
    1: ["Your intuition is especially clear right now.", "A dreamy, creative day. Let your imagination run.", "You may feel deeply connected to something bigger."],
    "-1": ["Things may feel blurry. Don't force clarity.", "Be gentle with yourself if focus is hard today.", "Not everything is as it seems today. Check the details."],
    0: ["Today feels dreamy and wide open.", "The line between you and the world feels thin today.", "Your imagination is wide awake."],
  },
  Pluto: {
    1: ["You have more inner strength than you know.", "You're ready to let go of something old.", "A quiet power is on your side."],
    "-1": ["Something deep may be stirring. Let it rise.", "Old feelings might resurface today. Be kind to them.", "You may feel a pull to control things. Try to loosen your grip."],
    0: ["A quiet, powerful change is underway in you.", "Something in you is transforming.", "You're shedding a skin you've outgrown."],
  },
};

// What it means, in one plain sentence, joined to how the person feels.
export const TRANSIT_PLAIN = {
  1: ["{P} {is} working with {n} right now, which tends to make things flow.", "{P} {is} lending a hand to {n} right now.", "{P} and {n} are getting along well right now."],
  "-1": ["{P} {is} pressing on {n} right now, which can feel like friction.", "{P} {is} rubbing up against {n} right now.", "{P} {is} testing {n} right now."],
  0: ["{P} and {n} are tangled together right now, so both feel louder.", "{P} {is} sitting right on top of {n} right now.", "{P} and {n} are blending into one strong note right now."],
};
// Singular plain names take "is"; the rest are plural.
export const PLAIN_SINGULAR = new Set(["Sun", "Pluto"]);

export const FEEL_BRIDGE = {
  heavy: {
    1: ["Even on a hard day, this is support you can lean on.", "It's a quiet ally, even if today doesn't feel like it.", "Something is on your side, even now."],
    "-1": ["That might be part of why today feels heavy. It's real, and it will pass.", "So if today feels hard, there's a reason. It won't last forever.", "That weight is real, and so is your strength to meet it."],
    0: ["That intensity may be part of the weight you're carrying.", "No wonder everything feels like a lot today.", "That can make feelings hit harder than usual."],
  },
  mixed: {
    1: ["This is the steady part of your day.", "Lean on this when the rest feels uncertain.", "This is the bit that's going right. Notice it."],
    "-1": ["That might explain the static in your day.", "That may be why things feel slightly off.", "Some of today's friction might come from here."],
    0: ["It can make a day feel full and hard to read.", "It might explain why today feels like a lot of things at once.", "It adds a strong flavour to an in-between day."],
  },
  golden: {
    1: ["This is a big part of why today feels good. Enjoy it.", "No wonder things feel easy. Make the most of it.", "This is the sky backing you up."],
    "-1": ["You're riding it well; today it reads as energy rather than strain.", "You're turning the pressure into fuel. Nice work.", "Even the tension is working for you today."],
    0: ["It's turning up the volume on a good day.", "It's adding extra sparkle to a good day.", "It makes a good day feel even fuller."],
  },
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
    { text: "Come what come may, time and the hour runs through the roughest day.", author: "William Shakespeare", work: "Macbeth" },
    { text: "Weeping may endure for a night, but joy cometh in the morning.", author: "Psalm 30:5", work: "King James Bible" },
    { text: "All shall be well, and all shall be well, and all manner of thing shall be well.", author: "Julian of Norwich", work: "Revelations of Divine Love" },
    { text: "The stars don't stop shining because clouds came. Neither do you." },
    { text: "You are not behind. You are not broken. You are in a hard chapter." },
    { text: "Rest is a kind of courage too." },
    { text: "Be as soft with yourself tonight as you would be with a friend." },
  ],
  mixed: [
    { text: "Some days are both. You are allowed to be both, too." },
    { text: "To every thing there is a season, and a time to every purpose under the heaven.", author: "Ecclesiastes 3:1", work: "King James Bible" },
    { text: "I am large, I contain multitudes.", author: "Walt Whitman", work: "Song of Myself, 1855" },
    { text: "You don't need the whole map. Just the next star." },
    { text: "There is nothing either good or bad, but thinking makes it so.", author: "William Shakespeare", work: "Hamlet" },
    { text: "Forever is composed of nows.", author: "Emily Dickinson" },
    { text: "There lives the dearest freshness deep down things.", author: "Gerard Manley Hopkins", work: "God's Grandeur, 1877" },
    { text: "An ordinary day is still a day under the whole sky." },
    { text: "Half light, half shadow. That's how the Moon looks most nights, and she's still beautiful." },
    { text: "You don't have to decide what today meant yet." },
    { text: "Every sky is made of more than one colour." },
  ],
  golden: [
    { text: "Let the good day be good. You don't have to earn the light." },
    { text: "Joy is not a reward. It's the weather you were made for." },
    { text: "Live in each season as it passes; breathe the air, drink the drink, taste the fruit.", author: "Henry David Thoreau", work: "Journal, 1853" },
    { text: "Remember this feeling. It's proof of what's possible." },
    { text: "Your joy is your sorrow unmasked.", author: "Kahlil Gibran", work: "The Prophet, 1923" },
    { text: "Heaven is under our feet as well as over our heads.", author: "Henry David Thoreau", work: "Walden, 1854" },
    { text: "A thing of beauty is a joy for ever.", author: "John Keats", work: "Endymion, 1818" },
    { text: "I dwell in Possibility.", author: "Emily Dickinson" },
    { text: "Forget not that the earth delights to feel your bare feet and the winds long to play with your hair.", author: "Kahlil Gibran", work: "The Prophet, 1923" },
    { text: "Today the sky and you agree. Enjoy the harmony." },
    { text: "Happiness looks good on you. Wear it often." },
    { text: "Keep a little of today's light for a cloudier day." },
  ],
};

// Theme lines answer the words the person wrote.
export const THEME_PLAIN = {
  work: { heavy: "Work is weighing on you. Remember: your worth isn't measured in a single day's output.", mixed: "Work is in the middle of everything today. Steady beats perfect.", golden: "Work is where today's light is landing. Let yourself enjoy it." },
  love: { heavy: "Matters of the heart feel louder today. Go gently with yourself and with them.", mixed: "Love is asking for honest, simple words today.", golden: "Your heart has good weather today. Say the warm thing." },
  family: { heavy: "Family can press on old bruises. Distance is allowed.", mixed: "Family weather is changeable today. Small kindnesses carry far.", golden: "Family feels close and warm. Let it in." },
  friends: { heavy: "Lean on the people who make you feel lighter.", mixed: "A friend may hold the missing piece of today.", golden: "Good company makes a good day even better." },
  body: { heavy: "Your body is part of the weather. Rest counts as doing something.", mixed: "Listen to what your body asks for first today.", golden: "You've got energy to spare. Use some of it on joy." },
  mind: { heavy: "Loud thoughts are louder on hard days. They're weather, not truth.", mixed: "Your mind is busy. Write one thing down and let the rest pass.", golden: "A clear mind is a gift. Use it on something you love." },
  money: { heavy: "Money worries feel heavier today. One practical step is enough.", mixed: "Keep money choices simple today.", golden: "Good news around money deserves a small celebration." },
  creative: { heavy: "Even heavy days feed the work. Make something small with it.", mixed: "Make something rough today. The sky likes a first draft.", golden: "Creative light is pouring in. Follow it." },
  home: { heavy: "Make one corner of home feel like yours today.", mixed: "Home is asking for a little care.", golden: "Home feels like a harbour today." },
};

export const OPEN_LINES = {
  heavy: ["Let's look at what's moving above you.", "You're not imagining it. Let's see why.", "Let's look up together for a minute.", "You're not alone in this. Here's what the sky is doing.", "Take a breath. Let's see what's going on up there."],
  mixed: ["Let's see what the sky is mixing for you.", "Here's what's moving above you today.", "A bit of everything today. Let's sort through it.", "Let's see what's behind today's mixed feelings.", "Here's the sky's side of the story."],
  golden: ["Let's see what's lighting you up.", "Here's what's shining on you today.", "Good days have reasons too. Here are yours.", "Let's see who in the sky is cheering for you.", "Here's where today's sunshine is coming from."],
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
