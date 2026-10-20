// æther's storytelling layer: the pieces that make a reading feel like it knows you.
// Everything here is written to be read in any combination, as one warm voice.
// All lines are original to æther.

// ---------- Who you are: a steady thread through every reading ----------
// Sun = how you shine, Moon = how you feel, Rising = how you meet the world.
export const SIGN_NATURE = {
  Sun: {
    Aries: "you come alive when you can begin something", Taurus: "you shine when life feels steady and real",
    Gemini: "you light up through ideas and conversation", Cancer: "you shine brightest when you're caring for your people",
    Leo: "you were made to be seen and to warm a room", Virgo: "you shine by making things better, quietly and well",
    Libra: "you come alive in balance, beauty and good company", Scorpio: "you shine through depth and honesty, never small talk",
    Sagittarius: "you light up when there's somewhere new to go or learn", Capricorn: "you shine by building something that lasts",
    Aquarius: "you come alive when you can be fully, unusually yourself", Pisces: "you shine through imagination and a big, soft heart",
  },
  Moon: {
    Aries: "you feel things fast and need room to move", Taurus: "you feel safest with comfort, routine and good food",
    Gemini: "you sort out your feelings by talking them through", Cancer: "you feel things through home and the people closest to you",
    Leo: "you need to feel appreciated to feel okay", Virgo: "you calm yourself by tidying, fixing and helping",
    Libra: "you feel steadiest when things are fair and peaceful", Scorpio: "you feel everything deeply, even when you don't show it",
    Sagittarius: "you lift your mood with space, laughter and a change of scene", Capricorn: "you hold your feelings carefully and carry a lot quietly",
    Aquarius: "you need a little distance to understand how you feel", Pisces: "you soak up the feelings of everyone around you",
  },
  Ascendant: {
    Aries: "people meet your energy first", Taurus: "people feel your calm before anything else",
    Gemini: "people notice your curiosity and quick mind", Cancer: "people sense your warmth and care",
    Leo: "people notice your glow when you walk in", Virgo: "people see someone thoughtful and capable",
    Libra: "people meet your charm and your easy grace", Scorpio: "people sense your depth, even before you speak",
    Sagittarius: "people meet your openness and your humour", Capricorn: "people see someone steady and serious about life",
    Aquarius: "people notice that you're a little different, in the best way", Pisces: "people feel your gentleness straight away",
  },
};
const THREAD_LEAD = { Sun: "Your Sun is in", Moon: "Your Moon is in", Ascendant: "Your rising sign is" };
export function threadLine(point, sign) {
  const nature = SIGN_NATURE[point]?.[sign];
  return nature ? `${THREAD_LEAD[point]} ${sign}: ${nature}.` : null;
}

// ---------- What the planet is doing, said plainly ----------
export const PLANET_ROLE = {
  Sun: "The Sun, which lights up whatever it touches,",
  Moon: "The Moon, which carries the mood of the day,",
  Mercury: "Mercury, the planet of words and plans,",
  Venus: "Venus, the planet of love and pleasure,",
  Mars: "Mars, the planet of drive and temper,",
  Jupiter: "Jupiter, the planet of luck and growth,",
  Saturn: "Saturn, the planet of pressure and patience,",
  Uranus: "Uranus, the planet of surprises,",
  Neptune: "Neptune, the planet of dreams and intuition,",
  Pluto: "Pluto, the planet of deep change,",
};
export const ROLE_VERB = {
  1: ["is working with", "is lending a hand to", "is flowing easily with"],
  "-1": ["is pressing on", "is testing", "is rubbing up against"],
  0: ["is sitting right on top of", "is merging with", "is turning up the volume on"],
};
export const NATAL_PLAIN = {
  Sun: "your sense of who you are", Moon: "your feelings", Mercury: "the way you think and talk",
  Venus: "your heart", Mars: "your inner fire", Ascendant: "the way you come across",
};

// ---------- How it might show up in real life (offered gently, never claimed) ----------
export const CONCRETE = {
  Sun: {
    1: ["You might find people really listen when you speak up.", "A small win could remind you what you're good at."],
    "-1": ["Someone's reaction might knock your confidence more than it deserves.", "You may feel torn between what you want and what's expected of you."],
    0: ["Something may ask you to show up as more fully yourself.", "You might feel a pull to make a decision that's truly yours."],
  },
  Moon: {
    1: ["A quiet evening, a warm meal or a familiar voice could be especially comforting.", "You may find it easier than usual to say how you feel."],
    "-1": ["Maybe a small comment stings more than it should, or home feels crowded.", "Old memories might drift up out of nowhere. They're only passing through."],
    0: ["You might cry at something small, or laugh harder than you expected.", "Your body may be telling you something. Listen to it first."],
  },
  Mercury: {
    1: ["That message you've been drafting might finally come out right.", "A conversation could clear the air about something that has hung over you."],
    "-1": ["A text might read colder than it was meant. Ask before you assume.", "You may catch yourself replaying a conversation in your head."],
    0: ["Your thoughts may race ahead of you. Write them down so they can rest.", "An idea might arrive while you're doing something else entirely."],
  },
  Venus: {
    1: ["Someone might show you unexpected kindness, or you might be the one who offers it.", "A little beauty, like flowers, music or a nice outfit, could lift the whole day."],
    "-1": ["You may want closeness and space at the same time.", "A small jealousy or longing might surface. It's information, not a verdict."],
    0: ["You might notice how much someone means to you.", "A craving for comfort or beauty could be a sign you need some care."],
  },
  Mars: {
    1: ["It's the right moment to tackle the thing you've put off.", "Moving your body could be a real pleasure."],
    "-1": ["Little delays might feel like big obstacles. Breathe before you react.", "You may feel snappy for no clear reason. It's energy, not a flaw."],
    0: ["You might feel a rush of motivation, or restlessness looking for an outlet.", "Something may spark you into action. Point it somewhere kind."],
  },
  Ascendant: {
    1: ["People may find you especially easy to talk to.", "A first impression could go especially well."],
    "-1": ["You may feel misread by someone. It says more about the day than about you.", "You might feel more on show than you'd like."],
    0: ["You may want to change something about how you present yourself.", "Others might notice a shift in you before you do."],
  },
};

// ---------- When it started and when it eases ----------
const DAY = 864e5;
function dayName(d, now) {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()), b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((a - b) / DAY);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (Math.abs(diff) <= 6) return (diff < 0 ? "last " : "") + d.toLocaleDateString(undefined, { weekday: "long" });
  const part = d.getDate() <= 10 ? "early" : d.getDate() <= 20 ? "mid" : "late";
  return `${part} ${d.toLocaleDateString(undefined, { month: "long" })}`;
}
function on(name) { return /^(today|tomorrow|yesterday|last )/.test(name) ? name : /^(early|mid|late) /.test(name) ? `in ${name}` : `on ${name}`; }
function by(name) { return name === "today" ? "later today" : `by ${name}`; }

// arc: { start: Date|null, peak: Date|null, end: Date|null, hours: bool }
export function timingLine(arc, now) {
  if (!arc) return "";
  if (arc.hours) return arc.endHours <= 3 ? "It's brief, and fades within a few hours." : `It's brief: it fades by ${arc.end.toLocaleTimeString(undefined, { hour: "numeric" }).toLowerCase()}.`;
  const s = arc.start && dayName(arc.start, now), p = arc.peak && dayName(arc.peak, now), e = arc.end && dayName(arc.end, now);
  const long = arc.start && now - arc.start > 21 * DAY;
  if (long && e) return `This is a long chapter: it began in ${s} and eases ${by(e)}.`;
  if (long) return `This is a long chapter that began in ${s}.`;
  if (s && p && arc.peak > now && p !== "today") return `It started building ${on(s)} and is strongest ${on(p)}.`;
  if (p === "today") return s && s !== "today" ? `It's been building since ${s} and is at its strongest now.` : "It's at its strongest now.";
  if (p && arc.peak < now && e) return `It peaked ${on(p)} and fades ${by(e)}.`;
  if (s && e) return `It began ${on(s)} and fades ${by(e)}.`;
  return "";
}

// ---------- Memory: noticing patterns across days ----------
// entries: earlier check-ins (not today's), newest last. feel: 0–1. themes: theme names.
export function memoryLine(entries, today, themesNow) {
  const bucket = f => (f < 0.42 ? "heavy" : f > 0.62 ? "golden" : "mixed");
  const byDay = {};
  for (const e of entries) byDay[e.day] = e;               // last check-in of each day wins
  const days = Object.keys(byDay).sort();
  if (!days.length) return null;
  const last = byDay[days[days.length - 1]];
  const gap = Math.round((new Date(today.day) - new Date(last.day)) / DAY);
  const nowB = bucket(today.feel), lastB = bucket(last.feel);
  // Streaks of heavy days, counting today.
  let streak = nowB === "heavy" ? 1 : 0;
  if (streak) for (let i = 1; i < 7; i++) {
    const d = new Date(new Date(today.day).getTime() - i * DAY).toISOString().slice(0, 10);
    if (byDay[d] && bucket(byDay[d].feel) === "heavy") streak++; else break;
  }
  if (streak >= 3) return `This is your ${["", "", "second", "third", "fourth", "fifth", "sixth", "seventh"][streak]} heavy day in a row. That's a lot to carry, and you're still showing up.`;
  if (gap >= 5) return "Welcome back. It's been a few days, and the sky has moved since you were last here.";
  // A theme that keeps coming back this week.
  const week = days.filter(d => (new Date(today.day) - new Date(d)) / DAY <= 7).map(d => byDay[d]);
  for (const t of themesNow) {
    const n = week.filter(e => (e.themes || []).includes(t)).length;
    if (n >= 2) return `${THEME_NAME[t]} has come up ${n === 2 ? "a few times" : "again and again"} this week. It's clearly on your heart.`;
  }
  if (gap === 1 && lastB === "heavy" && nowB !== "heavy") return "Yesterday felt heavier. Something has lifted a little since then.";
  if (gap === 1 && lastB === "golden" && nowB === "heavy") return "Yesterday felt lighter. Today has its own weather, and that doesn't erase the good.";
  if (gap === 1 && lastB === "heavy" && nowB === "heavy") return "Yesterday was heavy too. Be extra gentle with yourself tonight.";
  if (gap === 1 && lastB === "golden" && nowB === "golden") return "Two good days in a row. Let yourself trust it.";
  return null;
}
const THEME_NAME = { work: "Work", love: "Love", family: "Family", friends: "Friendship", body: "Your body", mind: "What's on your mind", money: "Money", creative: "Your creative life", home: "Home" };

// ---------- Opening line: their own word, said back to them ----------
export const ECHO_TITLES = {
  heavy: ["{name}you called today {word}. Let's look at why.", "{name}feeling {word} is real. It's not just you.", "{name}you called today {word}. The sky has been leaning on you."],
  mixed: ["{name}you called today {word}. Here's the sky's side of it.", "{name}{word} sounds about right. The sky is mixing its colours.", "{name}you called today {word}. Let's see what's moving."],
  golden: ["{name}you called today {word}. The sky agrees.", "{name}you're feeling {word}, and with good reason.", "{name}you called today {word}. You're not imagining it."],
};
export function echoTitle(bucket, word, name, seed) {
  const list = ECHO_TITLES[bucket];
  const t = list[((seed % list.length) + list.length) % list.length];
  const w = word.toLowerCase();
  let s = t.replace("{name}", name ? `${name}, ` : "").replace("{word}", w).replace("{Word}", w);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------- One question to sit with ----------
export const QUESTIONS = {
  heavy: [
    "What's one thing you could put down tonight, even for an hour?",
    "If a friend felt the way you do today, what would you tell them?",
    "What would \"enough for today\" look like?",
    "Who could you let in on how today really felt?",
    "What is this feeling trying to protect?",
  ],
  mixed: [
    "What part of today do you want to keep, and what can you leave behind?",
    "What's asking for your attention underneath the noise?",
    "What would make tomorrow feel a little lighter?",
    "Where did you feel most like yourself today?",
  ],
  golden: [
    "What helped today feel good, and how could you invite more of it?",
    "Who would you love to share this feeling with?",
    "What do you want to remember about today?",
    "What did you do today that you're quietly proud of?",
  ],
  theme: {
    work: "What would you do differently at work if you trusted yourself a little more?",
    love: "What do you need to hear from the people you love, and could you say it first?",
    family: "What boundary, or what kindness, would help with family right now?",
    friends: "Which friend would you like to feel closer to?",
    body: "What is your body asking you for tonight?",
    mind: "If your worry could speak plainly, what would it ask for?",
    money: "What's one small, practical step that would ease your mind about money?",
    creative: "What wants to be made, if no one ever had to see it?",
    home: "What would make home feel more like yours this week?",
  },
};
export function questionFor(bucket, themes, seed) {
  if (themes.length && seed % 2 === 0) return QUESTIONS.theme[themes[0]];
  const list = QUESTIONS[bucket];
  return list[((seed % list.length) + list.length) % list.length];
}

// The small label on a transit card, from the same arc as the sentence so they never disagree.
export function arcPill(arc, now) {
  if (!arc) return "";
  if (arc.hours) return "For the next few hours";
  if (arc.start && now - arc.start > 21 * DAY && (!arc.end || arc.end - now > 21 * DAY)) return "A long, slow chapter";
  const p = arc.peak && dayName(arc.peak, now);
  if (p === "today") return "Strongest today";
  if (arc.peak > now) return p === "tomorrow" ? "Building, strongest tomorrow" : `Building, strongest ${on(p)}`;
  return "Easing off from here";
}

// ---------- The Moon tonight ----------
export const PHASE_MEANING = {
  "New Moon": "a time for quiet beginnings and fresh intentions",
  "Waxing crescent": "a time for small first steps",
  "First quarter": "a time to push past doubt and act",
  "Waxing gibbous": "a time to refine, adjust and keep going",
  "Full Moon": "a time when feelings peak and things come to light",
  "Waning gibbous": "a time to share what you've learned and say thank you",
  "Last quarter": "a time to let go of what didn't work",
  "Waning crescent": "a time to rest before the next cycle begins",
};
export function moonNext(hours) {
  if (hours <= 1) return "within the hour";
  if (hours < 20) return `in about ${hours} hours`;
  if (hours < 36) return "tomorrow";
  return "in about two days";
}
