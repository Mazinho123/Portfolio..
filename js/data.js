/* ==================================================================
   EDIT THIS FILE — every piece of portfolio content lives here.
   The game reads it on load; you never need to touch the other JS.
   ================================================================== */
window.PORTFOLIO = {
  name: "Devroop",
  title: "AI/ML and Backend developer",
  professor: "Oak",          // the lab professor's name
  photo: "",                   // e.g. "assets/me.jpg" — auto-pixelated. "" = initials badge

  /* ---------- LEFT ORB : ABOUT ME ---------- */
  about: {
    types: ["Developer", "Builder"],   // shown as type badges
    location: "Bengaluru,India",
    level: 3,                          // shown as LV.3 (years of experience, age, anything)
    likes: "Coffee,clean code,games",
    bio: [
      "Hi! I'm a developer who loves turning ideas into fast, friendly products. I love to learn and build new things.",
      "Currently focused on how to figuring out life and AI to make stuffs easier for people around.",
      "I love Pokemon."
    ]
  },

  /* ---------- MIDDLE ORB : PROJECTS ----------
     Each project gets its own pixel creature, generated from its name. */
  projects: [
    {
      name: "wt - Local Weight Tool",
      types: ["Python", "CLI", "Docker"],
      summary: "A Typer CLI that plans, builds and serves local LLM weights using llama.cpp Docker images.",
      description: [
        "Running local models means juggling weights, Docker images and ports by hand. wt wraps that into one CLI so you don't have to.",
        "It has commands to install, doctor, info, plan, build, serve, stop, list and clean. It works with llama.cpp Docker images and keeps its state in ~/.wt/.",

      ],
      live: "",                 // ignored when `battle` is set: LIVE DEMO starts the battle instead
      code: "https://github.com/Mazinho123/Weight-normalizer",

      /* LIVE DEMO battle. List `moves` in the CORRECT order; the game shuffles
         them in the menu. Using them in this order defeats the foe.
         {PLAYER} {FOE} {RIVAL} can be used inside any line. */
      battle: {
        player: "WT",
        playerLevel: 50,
        rival: "RIVAL",
        foe: "OPEN-SOURCE MODEL",
        foeLevel: 70,
        foeMove: "OPENSOURCED WEIGHTS",
        foeLines: [
          "Billions of raw parameters crash into {PLAYER}!",
          "A flood of unquantized weights fills the disk!",
          "Gigabytes of full-precision tensors hit {PLAYER}!"
        ],
        moves: [
          {
            name: "wt install",
            usage: "wt install",
            desc: "Checks Docker and pulls the right llama.cpp image for your GPU.",
            success: "Docker checked! The right llama.cpp image for your GPU was pulled.",
            fail: "Out of order! The setup isn't done yet.",
            already: "Docker and the image are already set up. Nothing changed!"
          },
          {
            name: "wt plan",
            usage: "wt plan <path>",
            desc: "Shows the build plan with time and disk estimates.",
            success: "The build plan is ready, with time and disk estimates!",
            fail: "Out of order! Run wt install first."
          },
          {
            name: "wt build",
            usage: "wt build <path> [-o dir]",
            desc: "Runs the full pipeline: extract, convert, quantize.",
            success: "Extracting... converting... quantizing! The weights shrink into a .gguf!",
            fail: "Out of order! There's no build plan yet. Try wt plan first."
          },
          {
            name: "wt serve",
            usage: "wt serve <path.gguf>",
            desc: "Serves the model on port 8080 with an OpenAI-style API.",
            success: "The model is live on port 8080 with an OpenAI-style API!",
            fail: "Out of order! There's no .gguf to serve yet. Build it first."
          }
        ],
        rivalLose: ["{RIVAL}: What?! You got it running locally in four commands?!"],
        rivalWin: ["{RIVAL}: Ha! Wrong order. Those weights are too heavy for you!"],
        hint: ["Hint: set it up, plan it, build it, then serve it!"],
        win: "It's a CLI tool so no live demo available, please make do with this!"
      }
    },
    {
      name: "Better-RAG",
      types: ["Python", "AI", "RAG", "FastAPI"],
      summary: "An agentic RAG pipeline that answers questions from your documents with citations and a confidence score.",
      description: ["Reads PDF, DOCX, HTML and TXT files, splits them into chunks, and indexes them for vector and keyword search.",
        "Combines vector search and BM25 with Reciprocal Rank Fusion, then reranks results with a cross-encoder.",
        "A router and planner break hard questions into steps, and an LLM judge checks if the evidence is enough before answering.",
        "Drafts answers with citations, verifies claims, and abstains when confidence is low.",
        "Built with FastAPI (/ingest, /query, /health), ChromaDB, and Groq with an Ollama fallback."],
      live: "",
      code: "https://github.com/Mazinho123/Better-RAG-"
    },
    {
      name: "Gaze Deviation & Proctoring Detection",
      types: ["Python", "AI", "Computer Vision", "OpenCV", "MediaPipe"],
      summary: "A proctoring proof of concept that tracks head pose, eye closure and gaze in real time to flag suspicious behavior during online exams.",
      description: [
        "Uses MediaPipe Face Mesh to track head pose, sustained eye closure and downward gaze on every frame.",
        "Includes an on-demand iris-based gaze test that checks the user is looking at the screen, with a 6-second observation window before a PASS or FAIL.",
        "A sliding-window phone-cheating detector scores 11 pupil, blink, fixation and gaze features into a 0 to 100 suspicion score, and logs an incident above 55.",
        "Thresholds adapt automatically to camera resolution (720p or 480p) to reduce false alerts.",
        "Works with live webcam or pre-recorded video, with a live dashboard and incident log."
      ],
      live: "https://example.com",
      code: "https://github.com/Mazinho123/Gaze_deviation_detection-"
    }
  ],

  /* ---------- RIGHT ORB : SKILLS ----------
     Each key becomes a tab. level is 0-100 (drawn as a stat bar). */
  skills: {
    "Languages": [
      { name: "JavaScript", level: 90 },
      { name: "TypeScript", level: 80 },
      { name: "Python", level: 75 },
      { name: "SQL", level: 65 }
    ],
    "Frameworks": [
      { name: "React", level: 88 },
      { name: "Node.js", level: 80 },
      { name: "Express", level: 72 },
      { name: "Tailwind", level: 70 }
    ],
    "Tools": [
      { name: "Git", level: 85 },
      { name: "Docker", level: 60 },
      { name: "AWS", level: 50 },
      { name: "Figma", level: 45 }
    ]
  },

  /* ---------- CONTACT (shown via "ABOUT PROF.?") ---------- */
  contact: {
    email: "dasguptadevroop@gmail.com",
    links: [
      { label: "GitHub", url: "https://github.com/Mazinho123" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/devroop-dasgupta-991539319/" }
    ]
  },

  /* ---------- PROFESSOR DIALOGUE ----------
     {NAME} = your name, {PROF} = professor name (both shown in CAPS).
     Long lines are wrapped and split into pages automatically. */
  script: {
    intro: [
      "Ah, a visitor! Sorry to keep you waiting!",
      "Welcome to my laboratory! My name is {PROF}. Folks around here call me the CODE PROFESSOR.",
      "I study a rare and fascinating species: the DEVELOPER. My favorite specimen is {NAME}!",
      "{NAME} sealed their whole story inside three POKEBALLS. They're on the table right over there.",
      "Pick any POKEBALL you like and I'll scan it with my CODEX.",
      "Oh! And if you're ever curious about me, tap ABOUT PROF. while I'm talking."
    ],
    // shown while hovering an orb: keep each one to ~3 short lines
    blurbs: [
      "POKEBALL ONE: who {NAME} is and what drives them.",
      "POKEBALL TWO: the PROJECTS {NAME} has built and shipped!",
      "POKEBALL THREE: every SKILL {NAME} has trained so far."
    ],
    confirm: "So! You want the {COLOR} ORB, the one with {SECTION}?",
    after: [
      ["Now you know who {NAME} is! Curious what they've built? Try another orb."],
      ["Quite a collection, right? {NAME} keeps adding new ones."],
      ["That's some serious training! {NAME} levels up every day."]
    ],
    allSeen: [
      "Wow! You've opened every Pokeball. You must really like {NAME}'s work!",
      "If you'd like to team up with {NAME}, I know exactly how to reach them."
    ],
    offerContact: "Want {NAME}'s contact info?",
    declineContact: ["No problem! Tap ABOUT PROF. anytime and I'll share it."],
    contactIntro: "Psst... between you and me, I'm only {NAME}'s lab assistant. Here's how to reach the real deal:"
  }
};
