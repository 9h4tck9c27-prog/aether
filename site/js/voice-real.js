// æther's "real talk" voice: same sky, same honesty, said the way a funny friend would say it.
// Blunter and shorter than the soft voice, never mean. Only headlines change; the explanations stay the same.

export const REAL_HOME_HEADLINES = {
  gusty: [
    "today might be a lot. not your fault.",
    "the vibes are off and it's not you.",
    "a bit of friction in the air. pick your battles.",
    "today could push back. push back gently.",
    "low-key chaotic sky. keep plans light.",
    "if people are annoying today, it's the weather.",
    "plans may flop. you won't.",
  ],
  golden: [
    "the sky is on your side today.",
    "main character energy, but make it kind.",
    "today's a yes day. say yes to something.",
    "soft launch a good mood. it's allowed.",
    "the universe owes you one and it's paying up.",
    "good day to text the person you've been thinking about.",
    "everything's a little easier today. enjoy it.",
  ],
  electric: [
    "plot twist energy today. stay curious.",
    "something's about to change. let it.",
    "chaotic good kind of day.",
    "plans might switch up. the new ones could slap.",
    "restless? use it. start the thing.",
    "expect a surprise. most of them are fine.",
    "your routine is begging for a remix.",
  ],
  misty: [
    "brain fog is real today. trust your gut instead.",
    "dreamy day. not a big-decisions day.",
    "if nothing feels clear, that's the assignment.",
    "vibes over logic today. honestly, valid.",
    "soft-focus day. make something, decide later.",
    "your feelings know more than your notes app today.",
    "not everything needs an answer by tonight.",
  ],
  clear: [
    "calm sky. quietly get stuff done.",
    "nothing to fight today. just be here.",
    "clean slate energy. start something small.",
    "boring in the best way. take the win.",
    "steady day. small moves count.",
    "no drama in the sky today. love that for you.",
    "a good day to finally do the easy thing.",
  ],
};

// By transiting planet, then 1 easy, -1 tense, 0 blended.
export const REAL_TRANSIT_HEADLINES = {
  Sun: {
    1: ["you're giving main character today.", "people can see you today. let them.", "being yourself is easy mode today."],
    "-1": ["your ego might get poked. it'll heal.", "feeling a bit exposed? same sky, different day tomorrow.", "what you want vs. what's expected. fight's on."],
    0: ["the spotlight's on you today.", "today is very much about you.", "something's lighting you up. notice it."],
  },
  Moon: {
    1: ["your heart's in a good mood.", "you and your feelings are actually getting along.", "emotionally? in sync today."],
    "-1": ["feelings are loud for a bit. it passes.", "tender day. handle yourself with care.", "small stuff might sting. don't take it personally."],
    0: ["feelings are right at the surface.", "your heart's doing all the talking today.", "big feels incoming. let them through."],
  },
  Mercury: {
    1: ["words are working today. say the thing.", "your brain is on. use it.", "good day for the convo you've been dodging."],
    "-1": ["words come out spicy today.", "reread before you hit send. twice.", "misunderstandings likely. assume the best."],
    0: ["your mind is busy and it has opinions.", "ideas are arriving fast. catch a few.", "today is all texts, talks and voice notes."],
  },
  Venus: {
    1: ["you're extra lovable today. not a drill.", "treat yourself. the sky said so.", "love and little pleasures are on your side."],
    "-1": ["your heart wants two things at once.", "love's complicated today. keep it simple.", "craving more than you need? notice it, kindly."],
    0: ["something sweet is happening to your heart.", "love is front and centre today.", "romance, beauty, snacks. all nearby."],
  },
  Mars: {
    1: ["you've got energy to burn. spend it well.", "brave mode: on.", "get-it-done day. go."],
    "-1": ["short fuse alert. breathe first, reply later.", "you might snap. move your body instead.", "that's not anger, it's energy looking for a door."],
    0: ["there's a fire in you today.", "ready to act. point it somewhere good.", "your drive is turned all the way up."],
  },
  Jupiter: {
    1: ["luck is leaning your way.", "aim higher today. seriously.", "a door is opening. walk through it."],
    "-1": ["too much of a good thing is possible today.", "don't say yes to everything. pick three.", "big promises are tempting. keep the real ones."],
    0: ["you're ready to grow.", "your world just got a little bigger.", "there's room to expand today."],
  },
  Saturn: {
    1: ["slow and steady actually wins today.", "you're building something that lasts.", "discipline feels weirdly easy today."],
    "-1": ["today might feel heavy. it's a lesson, not a punishment.", "you're being tested. you're stronger than the test.", "stuck? keep going, gently."],
    0: ["today wants you to take something seriously.", "grown-up day. you can handle it.", "something in your life wants structure."],
  },
  Uranus: {
    1: ["a good surprise might find you.", "break the routine. you'll be glad.", "something fresh is coming in. open a window."],
    "-1": ["expect the unexpected. stay flexible.", "something's getting shaken loose. let it.", "plans might wobble. you'll find a better one."],
    0: ["part of you wants to break free.", "you're ready for a change. even a tiny one.", "today wakes you up a little."],
  },
  Neptune: {
    1: ["your intuition is cooking today.", "dreamy, creative day. let it run.", "feeling connected to something bigger? that's real."],
    "-1": ["things are blurry. don't force it.", "focus is hard today. be nice to yourself.", "not everything is as it seems. check the details."],
    0: ["dreamy and wide open today.", "the line between you and everything feels thin.", "your imagination is wide awake."],
  },
  Pluto: {
    1: ["you're stronger than you think.", "ready to let something old go.", "quiet power. you've got it today."],
    "-1": ["something deep is stirring. let it come up.", "old feelings resurfacing. be kind to them.", "trying to control everything? loosen the grip."],
    0: ["a big quiet change is happening in you.", "you're in your transformation era.", "shedding a skin you've outgrown."],
  },
};

export const REAL_OPEN = {
  heavy: ["rough one? let's see what's going on up there.", "you're not imagining it. here's why.", "okay. let's look up for a sec."],
  mixed: ["bit of everything today. let's sort it.", "mixed signals. here's the sky's side.", "here's what's moving above you."],
  golden: ["good day? here's where it's coming from.", "let's see who in the sky is hyping you up.", "good days have reasons too."],
};

export const REAL_CLOSING = {
  heavy: [
    { text: "you don't have to be okay today. just be gentle with yourself." },
    { text: "heavy skies still move. so will this." },
    { text: "rest is productive. say it back." },
    { text: "not behind. not broken. just in a hard chapter." },
    { text: "be as nice to yourself tonight as you'd be to your best friend." },
  ],
  mixed: [
    { text: "some days are both. you're allowed to be both." },
    { text: "you don't need the whole map. just the next step." },
    { text: "you don't have to decide what today meant yet." },
    { text: "ordinary days count too." },
    { text: "half light, half shadow. still a whole vibe." },
  ],
  golden: [
    { text: "let the good day be good. you don't have to earn it." },
    { text: "screenshot this feeling." },
    { text: "happiness looks good on you. wear it more." },
    { text: "save a little of today's light for later." },
    { text: "today the sky agrees with you. enjoy that." },
  ],
};

export const REAL_QUESTIONS = {
  heavy: ["what's one thing that would make tonight 5% easier?", "who would you text if you let yourself?", "what can you put down until tomorrow?"],
  mixed: ["what was the best 10 minutes of today?", "what's one thing you'd do differently tomorrow?", "what are you actually feeling under the busy?"],
  golden: ["who do you want to share today with?", "what made today work? do it again.", "what would you tell yourself on a bad day, from here?"],
};
