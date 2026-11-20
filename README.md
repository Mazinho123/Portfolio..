# Code Orb Lab: a retro handheld-RPG portfolio

Open `index.html` in a browser. There's no build step and nothing to install.

## Make it yours
Everything lives in **`js/data.js`**:
- `name`, `title`, `photo` (optional; any square-ish photo gets auto-pixelated)
- `about`: type badges, location, level, likes, bio paragraphs (**left orb**)
- `projects`: name, types, summary, description, `live` / `code` links (**middle orb**)
- `skills`: each key becomes a tab, and each `level` (0-100) a stat bar (**right orb**)
- `contact`: email and links, shown when visitors tap **ABOUT PROF.?**
- `script`: every line the professor says (`{NAME}` / `{PROF}` get filled in)

### Demo battles (for projects without a live site)
Give a project a `battle` block (see the first project in `data.js`). Its **LIVE DEMO** button then starts a
battle where your moves are the project's commands. Using them in the listed order wins, and the menu
shuffles them each time. Wrong order fails, and the foe keeps attacking. After about 3 mistakes you faint
and get a hint plus "Try again?".

## Controls
Arrows / WASD move · Z or Enter = A · X or Esc = B · Shift = SELECT (contact card) · M = mute.
Everything is also clickable/tappable, and the on-screen console buttons work on phones.
The **QUICK VIEW** button (or `index.html#quick`) shows a plain, skimmable version for recruiters.

## Deploy
Push the folder to a GitHub repo and enable **GitHub Pages**, or drag the folder into Netlify / Vercel.

## Files
`index.html` · `css/style.css` · `js/data.js` (content) · `js/sprites.js` (pixel art) · `js/audio.js` (8-bit SFX) · `js/game.js` (engine)
