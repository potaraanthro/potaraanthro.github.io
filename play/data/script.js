// =====================================================================
// NIXY'S WORLD: the whole script. Every line the game shows lives here.
// Speakers: nixy, yasin, bob, bill, moth (GeekMoth), teacher, sys.
// A line is [speaker, text, mood?]. Moods for Nixy: happy, wink, surprised,
// thoughtful, sheepish. {name} and {business} are filled in at runtime.
// Lines marked DRAFT in comments still need Yasin's approval.
// =====================================================================

export const SPEAKERS = {
  nixy: { name: 'NIXY', color: '#22d3ee' },
  yasin: { name: 'FOUNDER', color: '#fbbf24' },
  bob: { name: 'BOB', color: '#facc15' },
  bill: { name: 'BILL', color: '#f472b6' },
  moth: { name: 'GEEKMOTH', color: '#a3e635' },
  teacher: { name: 'MS CHALK', color: '#fb923c' },
  coach: { name: 'COACH', color: '#93c5fd' },
  clerk: { name: 'ARCADE CLERK', color: '#f9a8d4' },
  npc: { name: 'COLLEAGUE', color: '#bef264' },
  ghost: { name: 'GHOSTLY RESIDENT', color: '#a5b8de' },
  past: { name: 'GHOST OF THE PAST', color: '#9fb4d8' },
  you: { name: 'YOU', color: '#ffd60a' },
  sys: { name: '', color: '#ffffff' },
};

export const S = {
  // ---------- B. Grey Office ----------
  hello: [['nixy', "Hi! I'm Nixy. I'm Potara's company avatar."]],
  helloChoice: [
    { t: "Hi Nixy, what's this all about then?", v: 'go', primary: true },
    { t: 'Go away, I want a traditional website', v: 'trad' },
  ],
  intro: [
    ['nixy', 'Look around. Somewhere along the way, work tools went grey and the camera became a test.', 'thoughtful'], // DRAFT
    ['nixy', "We're wide-eyed optimists, building the future we're so in love with."],
    ['nixy', 'Interesting times call for interesting solutions.'],
    ['nixy', 'Potara is a future workplace consultancy.'],
    ['nixy', 'We analyse workflows, create collateral, build gamified sales experiences, and make company avatars like me.'], // DRAFT
    ['nixy', "And I've got some secret projects I might show you later. First, let me show you what I mean.", 'wink'], // DRAFT
  ],
  crtGag: [['nixy', 'Fifty grey initials and one brave camera. Ouch.', 'sheepish']], // DRAFT

  // ---------- C. Bait and switch (25 s cue sheet, times in ms) ----------
  bait: [
    { at: 0, line: null },
    { at: 3000, line: ['nixy', 'This is how we used to capture information. Load up a nice boring spreadsheet.'] },
    { at: 11000, line: ['nixy', 'Now, we run our room sim machine and let the client build and visualise their meeting rooms.'] },
    { at: 20000, line: ['nixy', 'Your sales team can hire us to deliver a workshop for more ideas that will stretch the imagination.'] },
    { at: 25000, line: null },
  ],

  // ---------- D. The question ----------
  interested: [['nixy', 'So. Are you interested?']], // DRAFT
  interestedChoice: [
    { t: 'Yes! This is interesting, show me more!!', v: 'yes', primary: true },
    { t: 'No thanks', v: 'no', primary: true },
    { t: "What if it's unprofessional?", v: 'unpro' },
    { t: 'Nobody has done it before, this seems too much', v: 'much' },
  ],
  unpro: [['nixy', "Professional needn't mean bland and boring. Look at how professional Nixy is.", 'wink']],
  much: [['nixy', 'We love sceptics as much as we love dreamers <3']],
  no: [['nixy', "No worries! The traditional site is right here if you want it. I'll be in the corner if you change your mind."]], // DRAFT
  noChoice: [
    { t: 'Take me to the traditional site', v: 'trad', primary: true },
    { t: 'Actually, show me', v: 'yes' },
  ],

  // ---------- E. Yes ----------
  yes: [
    ['nixy', "I love that you're interested! Thank you. I'm going to show you some secret projects we're working on."],
    ['nixy', "Yasin, our boss, probably won't like it... but you won't tell him, will you?", 'wink'],
  ],
  tellChoice: [
    { t: 'I will', v: 'will', primary: true },
    { t: "I won't", v: 'wont', primary: true },
  ],
  will: [['nixy', 'Aw shucks, I like your honesty.']],
  wont: [['nixy', "Ha! Famous last words. I'll hold you to it.", 'wink']], // DRAFT
  follow: [['nixy', 'Ok, follow me!']],
  firstSight: [['nixy', "This is the old town. It still runs on fax machines.", 'sheepish'], ['nixy', "And it's haunted. The residents never quite moved on. Stick close, there's something better through the woods.", 'thoughtful']], // DRAFT
  citySight: [['nixy', "Potara Technicity! Lights on, rooms that work, nobody haunting the printer.", 'happy'], ['nixy', "Keep an eye out for taped-up buildings. Secret projects. No peeking. Yet.", 'wink']], // DRAFT

  // ---------- F. Route quips ----------
  quips: ['This way!', 'Keep up!', 'Psst, try poking things.', 'Nearly there!', 'Ooh, what is that?'], // DRAFT
  noPeek: [['nixy', 'No peeking. Yet.', 'wink']],

  // ---------- G. Tall grass ----------
  encounter: [
    ['sys', 'Yasin appeared!!'],
    ['yasin', 'Hello, curious wanderer.'],
    ['yasin', 'Nixy! Have you been spilling company secrets?'],
    ['nixy', 'Yes!', 'sheepish'],
    ['yasin', 'Good Nixy!'],
    ['yasin', 'Have you been in good hands with Nixy?'],
  ],
  handsChoice: [
    { t: 'Yes', v: 'yes', primary: true },
    { t: 'No', v: 'no', primary: true },
  ],
  handsYes: [['yasin', 'Good.']],
  handsNo: [['yasin', 'Good. Honest. Nixy, take notes.']], // DRAFT
  shortPitch: [
    ['yasin', "Nixy is our company avatar. You probably have no idea what I'm talking about, but in a few short years, you will. Every company will have one."],
    ['yasin', "Potara is a future workplace consultancy. We don't just solve challenges, we build the future for our customers."],
    ['yasin', "There's more to this story. I'll be on the bench in Technicity. Come and find me and I'll tell you the rest."], // DRAFT
  ],

  // ---------- H. Nixy's ask ----------
  ask1: [['nixy', "Psst. Since I'm risking my job for you, it would probably work in my favour if I can show some results.", 'wink']],
  askEmail: ['nixy', 'Could I have your email address?'],
  askBusiness: ['nixy', 'And the name of your business?'],
  askNews: ['nixy', 'Can we send you a newsletter?'],
  newsChoice: [
    { t: 'Yes please', v: true, primary: true },
    { t: 'No thanks', v: false, primary: true },
  ],
  smallPrint: "We'll only use this to reply to you and, if you say yes, to send the occasional newsletter. Unsubscribe any time.", // DRAFT, have it checked
  askThanks: [['nixy', 'Thank you{, name}! My job is safe. Probably.', 'happy']], // DRAFT
  askSkipped: [['nixy', 'Fair enough. Mystery suits you.', 'wink']], // DRAFT
  askDone: [['nixy', "Secret projects: unlocked. Now the useful bit. Tell me what you're wrestling with and I'll take you straight there."]], // DRAFT
  nudgeYasin: 'Have you been back to see Yasin?',

  // ---------- I. Meeting Room Building ----------
  roomHello: [
    ['bill', "Hi, I'm Bill. I ask the questions."], // DRAFT
    ['bob', "I'm Bob. I build. Let's start with the room you've got."], // DRAFT
  ],
  roomDone: [
    ['bob', "There's your room."], // DRAFT
    ['bill', "Want us to scope it properly? Leave your details and we'll send this with it."], // DRAFT
  ],
  roomFirst: 'Bob and Bill! My favourite double act.', // DRAFT

  // ---------- J. Virtual Foreground ----------
  avatarAd: [
    ['nixy', "We design, create and deploy an avatar for your organisation that will capture the vibe you're going for."],
    ['nixy', "Who says you can't be stylish and professional?", 'wink'],
    ['nixy', 'Potara makes avatars to measure. Not stock cartoons from a settings menu.'],
    ['nixy', 'Each one is designed with the person: their culture, their style, their personality. And one detail that glows.'],
  ],
  avatarOffer: [['nixy', 'Want to see what yours could look like?']], // DRAFT
  avatarOfferChoice: [
    { t: 'Yes, make me one', v: 'yes', primary: true },
    { t: 'Maybe later', v: 'no' },
  ],
  avatarDone: [['nixy', 'Gorgeous. Want to talk to us about making it real?']], // DRAFT
  avatarFirst: 'My old stomping ground! Anything avatar-shaped is me.', // DRAFT

  // ---------- K. SI Enhancement Academy ----------
  moth: [['moth', "I'm GeekMoth. What do you do?"]],
  mothChoice: [
    { t: 'Sales', v: 'sales', primary: true },
    { t: 'Marketing', v: 'marketing', primary: true },
    { t: 'Technical work', v: 'tech', primary: true },
  ],
  mothAll: [['moth', "We analyse your workflow for ways to integrate with what you'd call AI. Synthetic Intelligence will drive the real intelligence: you. Symbiosis is the game."]],
  mothSales: [
    ['moth', 'Sales Demo Curation: we turn your demo into something people want to play. Like the one you are standing in.'], // DRAFT wording
    ['moth', 'Then Sales Avatar Curation: a gamified, corporate-branded sales experience with your own avatar out front.'],
  ],
  mothMarketing: [['moth', 'Collateral creation, tuned to your workflow and your voice.']], // DRAFT
  mothTech: [
    ['moth', "Whether it's SI agents that aid schematic design, testing or implementation, we curate the workflow that gets you what's needed."],
    ['moth', 'SI agent curation: your specialised workflows are analysed and tested. We create pilots, test them, and iterate.'],
  ],
  mothFirst: 'GeekMoth knows everything. Do not let them near a lamp.', // DRAFT

  // ---------- L. Schoolhouse (all DRAFT) ----------
  school: [
    ['teacher', 'Welcome. A school senses everything and closes almost none of its loops.'],
    ['teacher', 'Data goes up the hierarchy and never comes back down as a changed Tuesday.'],
    ['teacher', 'Our interventions connect schools with digital workflows: sense, model, act, and the return path that makes the change stick.'],
  ],
  schoolChoice: [
    { t: "I'm a teacher", v: 'teacher', primary: true },
    { t: 'I run a school or trust', v: 'leader', primary: true },
    { t: 'I look after IT', v: 'it', primary: true },
  ],
  schoolTeacher: [['teacher', 'Time back. Resources, reports and admin handed to workflows you trust, so the hours go to pupils.']],
  schoolLeader: [['teacher', 'A clear picture of what AI is in use in your school, and how it is governed. Then a plan you can stand behind.']],
  schoolIt: [['teacher', "A plan that fits the systems you already run and the licences you already pay for. Nothing bolted on."]],
  schoolFirst: 'Yasin used to teach. He still does the voice.', // DRAFT

  // ---------- M. The founder's full pitch ----------
  founderOpen: [],
  // The founder's speech, in beats. Each beat names a scene in the founder film (src/film.js),
  // which paints the whole frame behind the dialogue box. The film's mood rises beat by beat.
  founder: [
    { film: 'arrival', label: 'Hello', lines: [
      ['yasin', "Hi! I'm Yasin. Was the tour of Potara Technicity helpful?"],
    ], ask: {
      choices: [{ t: 'Yes', v: 'yes', primary: true }, { t: 'No', v: 'no', primary: true }],
      yes: [['yasin', "Yes, I'm glad! You should have something of an idea of what we do, then.", 'happy']],
      no: [['yasin', "No worries, that's what I'm here for."]],
    } },
    { film: 'clicks', label: 'Still here', lines: [
      ['yasin', "Here's something that's always puzzled me. We've been able to buy almost anything with a click for two decades, yet account managers, marketing managers and customer service reps are still here. Why?"],
    ] },
    { film: 'faces', label: 'Complicated', lines: [
      ['yasin', "Because human beings are complicated. We're complex enough that only we understand each other, and even then it's hit or miss. Some things we still want a person for."],
    ] },
    { film: 'dawn', label: 'The wake-up call', lines: [
      ['yasin', "That's the real wake-up call: AI isn't going to retire us. There's still plenty of work for us to do. And what's coming back is the good stuff: creativity, ingenuity and a little bit of fun.", 'happy'],
    ] },
    { film: 'fridays', label: 'Fridays', lines: [
      ['yasin', 'Picture a small team that used to spend every Friday compiling reports, now spending it building the thing nobody had time to try before.'],
      ['yasin', "I'm excited, because things I could only dream up before are now within reach, thanks to these fantastic tools in our hands.", 'happy'],
    ] },
    { film: 'potara', label: 'Why Potara', lines: [
      ['yasin', "That's why we started Potara. We're a future workplace consultancy."],
      ['yasin', 'Most people don\u2019t sit around saying, \u201cHmm, we really could use some more AI in this place.\u201d So we start with people, not technology. We help clients create and shape their own future working habits.'],
    ] },
    { film: 'technicity', label: 'Technicity', lines: [
      ['yasin', 'Potara Technicity is hiding something of a double meaning.'],
      ['yasin', "It's the name of our virtual city, but Technicity also refers to the quality, function, or effectiveness of a technology, as well as the general reliance on or integration of tools and systems into human society."],
    ] },
    { film: 'garden', label: 'In practice', lines: [
      ['yasin', 'In practice, we help teams try out new ways of working before they commit to them, and we speed up the adoption of the ideas that stick.'],
    ] },
    { film: 'bench', label: 'A call', lines: [
      ['yasin', "If you'd like to see what that could look like for you, book a call with Nixy and me.", 'happy'],
    ] },
    { film: 'dream', label: 'Dream together', lines: [
      ['yasin', "Because the future of work isn't something that happens to us. We get to dream it up. Let's dream together.", 'happy'],
    ] },
  ],
  founderAgain: [['yasin', 'Want to see any part again?']],
  founderHeard: 'Every word of that is true. I was there.', // DRAFT

  // ---------- N. Finale ----------
  finale: [['nixy', "That's the tour. Want to book a call with Yasin and me? Thirty minutes, no deck."]], // DRAFT
  finaleChoice: [
    { t: 'Book a call with Yasin and Nixy', v: 'book', primary: true },
    { t: 'Keep exploring', v: 'stay', primary: true },
    { t: 'Traditional site', v: 'trad' },
  ],
};

// The five philosophy fragments, copied from the Potara homepage.
// ---------- Technicity extras ----------
S.funnelPick = "Then {place} is your stop. Follow the gold line, I'll be right behind you."; // DRAFT
S.funnelTour = "The grand tour it is. Six stops, about a minute each. Follow the gold line."; // DRAFT
S.funnelExplore = "Explorer. I respect it. Hit Services, top right, any time you want the whole menu."; // DRAFT
S.mothIntro = [['moth', "Moth here. We don't sell AI. We find the dull bit of your week and give it to an agent. Pick your role."]]; // DRAFT
S.schoolIntro = [['teacher', "Here's the sequence that moved the grades. Same pupils, same teacher, better design."]]; // DRAFT
S.arcadeFirst = 'An actual arcade! Beat my high score.'; // DRAFT
S.trainFirst = 'Class is in session. Sit up straight.'; // DRAFT
S.arcadeHello = [['clerk', "Welcome to the Arcade. One game, no coins. Nixy's drone against the server racks."], ['clerk', "Every milestone you hit unlocks a bit of our lore. Nothing you've seen elsewhere."]]; // DRAFT
S.arcadeMenu = [{ t: 'Play', v: 'play', primary: true }, { t: 'Read what I\'ve unlocked', v: 'read', primary: true }, { t: 'Leave', v: 'leave' }];
S.arcadeDud = ['Out of order. Probably.', 'Insert coin... nothing. Try the middle cabinet.', 'High score: NIX. Nobody has beaten it.'];
S.arcadeNone = [['clerk', "Nothing unlocked yet. Score three in the middle cabinet and you'll get your first."]];
S.trainHello = [['coach', "Welcome to the Training Studio. We make custom training videos for clients."], ['coach', "Part teacher, part digital workplace expert. We build on Rosenshine's principles of instruction."]]; // DRAFT
S.trainMenu = [{ t: 'Watch the workshop video', v: 'video', primary: true }, { t: "Walk me through Rosenshine's principles", v: 'rosen', primary: true }, { t: 'Book a call with Yasin and Nixy', v: 'book' }, { t: 'Leave', v: 'leave' }];
S.trainTv = [['coach', "Here's a workshop we ran. Watch how small the steps are."]]; // DRAFT
S.trainRosen = [['coach', "Rosenshine studied the best teachers and found what they have in common. Ten ideas. We use all of them."]]; // DRAFT
S.trainEnd = [['coach', "Want training like that for your team? We'll build it around your tools and your people."]]; // DRAFT
// Colleagues in Technicity: each one says how they work differently. Meetings happen indoors, in rooms built for them.
S.npcLines = {
  // outside, by the booking kiosk
  npc1: ["I'm booking a room for this afternoon. The kiosk shows which rooms are free, and every one of them has a camera that works.", "We come in for the things that are better together. Workshops, whiteboards, lunch. Focus work happens wherever we focus best."],
  npc2: ["I'm heading into the Meeting Room Studio. Our team meeting's in there, where everyone can see and hear each other.", "Remote colleagues used to be faces on a laptop at the end of the table. Now they're on the wall, life size, same as us."],
  // outside, on the south plaza
  npc4: ["I work from home on Mondays and Fridays. I come in for people, not for a desk.", "Nobody books a room and then hunts for a cable here. You walk in, tap once, and you're in the meeting."],
  // inside the Meeting Room Studio: a real hybrid meeting, in a room built for one
  meet1: ["We're mid stand-up. Half the team is in Leeds, and you'd never know. The camera follows whoever's talking.", "Ten minutes, everyone heard, done. Then we all get on with our day."],
  meet2: ["See the wall? That's our Leeds office. They're not squinting at a laptop, they're in the room with us.", "We start on time now. The room's ready before we are."],
  // inside Virtual Foreground
  avatar: ["I'm glad I can use my virtual avatar and I don't have to be on camera at 9 o'clock on a Monday!", "My avatar gives my update at the early stand-up. I join properly at ten, with a coffee and a functioning face."],
}; // DRAFT
// The old town's ghostly residents. They never moved on.
S.ghostLines = [
  ["I've been waiting for this fax since 1998. Any day now.", "Don't go to the new town. They have... ideas."],
  ["Is it still Monday? It always feels like Monday here.", "My password is 'password'. It always has been. It always will be."],
  ["Shh. The printer is sleeping. Nobody wakes the printer.", "We had a meeting about having fewer meetings. It's still going."],
  ["Nobody comes back from Technicity the same.", "Change is coming. I can feel it in my floppy disks."],
]; // DRAFT

// ---------- The first battle: the Ghost of the Past, at the edge of the old town ----------
S.ghostIntro = [
  ['sys', 'A cold wind blows through the old town...'],
  ['past', 'Leaving? Nobody leaves the old town.'],
  ['nixy', "Uh oh. It's the Ghost of the Past. It won't let anyone through to Technicity.", 'surprised'],
  ['sys', 'The GHOST OF THE PAST blocks the way! Defeat it to continue.'],
];
S.ghostAsk = 'What will you do?';
// the four moves; the description shows under each name
S.ghostMoves = [
  { v: 'opt', t: 'Optimism', d: 'Point at what could go right. Steady damage.' },
  { v: 'cre', t: 'Creativity', d: 'Turn the problem into something new. Hits hard.' },
  { v: 'use', t: "You're right, it's useless", d: 'Agree with the ghost and give up.' },
  { v: 'emp', t: 'Unlock Empathy', d: 'See the person behind the fear. Finishing move.', locked: 'Locked. Thin out its gloom first.' },
];
S.ghostHit = {
  opt: [['you', 'Machines can take the boring bits. We keep the interesting ones.'], ['sys', "It's super effective! The ghost's gloom flickers."]],
  cre: [['you', 'What if the AI books the room and takes the notes, and we do the thinking?'], ['sys', 'A critical hit! The ghost has never seen an idea like that.']],
  use: [['you', "You're right. It's useless."], ['sys', "It's not effective at all... The Ghost of the Past feeds on it and grows stronger."]],
};
S.ghostLocked = [['nixy', "Not yet! Its gloom is too thick to reach. Hit it with something hopeful first.", 'thoughtful']];
S.ghostUnlock = [['nixy', "Look! Its gloom is thinning. I think you can reach it now. Try empathy.", 'happy'], ['sys', 'UNLOCK EMPATHY is ready!']];
S.ghostCling = [['past', "You can't get rid of me that easily..."], ['nixy', "It's barely holding on. Stop fighting it. Try understanding it.", 'thoughtful']];
// the ghost's three attacks, each with a description and the things it says
S.ghostAttacks = {
  despair: { t: 'Despair', d: 'Drags your mood down to the basement.', lines: ['AI is gonna take our jobs!', "It's all downhill from here. It always was."] },
  hope: { t: 'Hopelessness', d: 'Convinces you nothing will ever change.', lines: ['We tried something new once. In 1998. Never again.', "Why bother learning it? They'll only change it next year."] },
  redund: { t: 'Redundancy', d: "Whispers that you've already been replaced.", lines: ["A robot does your job now. It doesn't even take lunch.", "They'll automate you by Friday. Then they'll automate Friday."] },
};
S.ghostFaint = [['sys', 'Your resolve hits zero...'], ['nixy', "Hey. Get up. We're not done. Ghosts hate it when you keep going.", 'happy'], ['sys', 'Nixy restores your resolve!']];
S.ghostEmpathy = [
  ['you', "Hey. It sounds like you're scared of being left behind."],
  ['you', "Lots of people are. You don't have to face it on your own."],
  ['past', '...You... understand?'],
];
S.ghostReveal = [
  ['sys', 'The Ghost of the Past turned into... the FOUNDER!'],
  ['yasin', 'Ha. You got me.', 'happy'],
  ['yasin', 'That ghost was me, ten years ago. Sure the machines were coming for my job.'],
  ['yasin', "Turns out the trick isn't fighting the future. It's understanding the people who are scared of it."],
  ['yasin', 'Nixy! Have you been spilling company secrets?'],
  ['nixy', 'Yes!', 'sheepish'],
  ['yasin', 'Good Nixy!'],
  ['yasin', 'Have you been in good hands with Nixy?'],
]; // DRAFT
S.ghostAfter = [['nixy', "You beat the Ghost of the Past! Technicity is through the woods. Come on!", 'happy']]; // DRAFT
export const FRAGMENTS = {
  star: { n: 1, t: 'Cybernetics', clue: 'Something in the night sky twinkles differently.',
    b: 'In 1948 Norbert Wiener named cybernetics after the Greek kybernetes, the steersman. Act, sense, adjust, repeat: people and machines steering together. Potara still works that way. Measure the room, tune it, measure again.' },
  arcade: { n: 2, t: 'The Arcade', clue: "There's an arcade in the city. Got a coin?",
    b: 'Vancouver, the early 1980s. William Gibson watched kids lean into arcade cabinets as if they wanted to climb inside. That picture grew into the word cyberspace, and into Neuromancer. People want to lean in. Good technology lets them.' },
  logo: { n: 3, t: 'Anthropotechnics', clue: 'Knock three times on the big logo.',
    b: 'Peter Sloterdijk describes humans as practising animals: we become who we are through training. You Must Change Your Life. Every tool is a practice partner, and a meeting room is where a team practises being a team.' },
  phone: { n: 4, t: 'The Marriage Counsellor', clue: 'The old phone has more to say.',
    b: "Potara's founder describes the job as cybernetic marriage counsellor. People and machines aren't enemies. They need a better room to talk in, and someone to help them listen." },
  vault: { n: 5, t: 'The Machine Myth', clue: 'Look behind the vault door.',
    b: "Thomas Rid's Rise of the Machines follows a dream that keeps coming back: that the machine might become a partner, not just a tool. Potara's version comes with a rule. A human is always in charge." },
};
export const READING_LIST = 'William Gibson, Neuromancer · Norbert Wiener, Cybernetics · Thomas Rid, Rise of the Machines · Peter Sloterdijk, You Must Change Your Life';
