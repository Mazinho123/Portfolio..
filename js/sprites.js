/* All pixel art is drawn in code: sprite maps (one char = one pixel) and a few
   procedural generators. Every function returns a <canvas>. */
window.Sprites = (() => {
  'use strict';

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  /* rows: array of strings. mirror: append a reversed copy (for symmetric sprites).
     swap: char replacements applied only to the mirrored half (e.g. one-sided highlights). */
  function fromMap(rows, pal, opts = {}) {
    const full = rows.map(r => opts.mirror
      ? r + [...r].reverse().map(ch => (opts.swap && opts.swap[ch]) || ch).join('')
      : r);
    const w = Math.max(...full.map(r => r.length)), h = full.length;
    const c = mk(w, h), g = c.getContext('2d');
    full.forEach((row, y) => [...row].forEach((ch, x) => {
      const col = pal[ch];
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }));
    return c;
  }

  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed || 1;
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------------- Professor (32x48, left half mirrored) ---------------- */
  const PROF_PAL = {
    k: '#283038', h: '#7a4a2e', H: '#4e2e1c', s: '#f8d0a8', S: '#d8a070',
    w: '#f8f8f8', W: '#b8c4d0', t: '#2fa8a0', T: '#1d6f6a', p: '#4a4468',
    P: '#2e2a44', b: '#6a3e22', e: '#203040', m: '#9a3a3a'
  };
  const PROF_ROWS = [
    '...........kkkkk', '.........kkhhhhh', '........khhhhhhh', '.......khhhhhhhh',
    '.......khhHhhhhh', '.......khHhhhhhh', '.......khhssssss', '.......kHsssssss',
    '.......kHkkkkkss', '.......kskwseksk', '.......kskssekss', '.......kSkkkkkss',
    '.......kSssssssS', '........khssssss', '........khhshhhh', '........khhhhhkk',
    '.........khhhhhh', '..........khhhhh', '.....kkwwwkkkkkk', '....kwwwwwkttttt',
    '...kwwwwwwwktttt', '..kwwwwwwwWktttt', '..kwwwkwwwWktttt', '..kwwWkwwwWkTttt',
    '..kwwWkwwwWkTttt', '..kwwWkwwwWkTttt', '..kwwWkwwwWktttt', '..kwwWkwwwWktttt',
    '..kwwWkwwwWkTttt', '..kwwWkwwwWkTTtt', '..kkkkkwwwWkTTTT', '..kssskwwwWkpppp',
    '..kSsskwwwWkpppp', '...kkkkwwwWkpppp', '......kwwwWkpppP', '......kwwwWkpppP',
    '......kwwwWkpppP', '......kkkkkkpppP', '........kpppppPk', '........kpppppPk',
    '........kpppppPk', '........kpppppPk', '........kPppppPk', '........kPppppPk',
    '.......kbbbbbbk.', '......kbbbbbbbk.', '......kkkkkkkkk.', '................'
  ];
  function professor(o = {}) {
    const rows = PROF_ROWS.slice();
    if (o.blink) { rows[9] = '.......kskwssksk'; rows[10] = '.......kskskkkss'; }
    if (o.talk) { rows[15] = '........khhhhkmm'; rows[16] = '.........khhhhkm'; }
    return fromMap(rows, PROF_PAL, { mirror: true });
  }

  /* ---------------- Code Orb (16x16): a glowing crystal on a gold stand ---------------- */
  // Red top, white bottom, thin gold seam, sitting on a gold stand.
  const ORB_ROWS = [
    '.....kkk', '...kkrrr', '..krrrrr', '.krwwrrr', '.krwrrrr', 'krrrrrrr', 'kRrrrrrr', 'kyyyyyyy',
    'kGssssss', '.kGsssss', '.kGGssss', '..kGGGss', '...kkkkk', '..kyyyyy', '.kyYYYYY', '.kkkkkkk'
  ];
  const ORB_PAL = {
    k: '#202028', w: '#ffffff', r: '#e8382c', R: '#b02018',
    s: '#f8f8f8', G: '#c4c8d0', y: '#f2c43a', Y: '#b8861a'
  };
  const orb = () => fromMap(ORB_ROWS, ORB_PAL, { mirror: true, swap: { w: 'r' } });

  const arrow = () => fromMap(['kkkkkkk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'], { k: '#202028', r: '#f04040' });

  /* ---------------- Procedural project creature (16x16) ---------------- */
  function creature(seed, opts = {}) {
    const N = 16, r = rng(hashStr(seed));
    const g = Array.from({ length: N }, () => new Array(N).fill(0));
    const cy = N * (0.5 + r() * 0.1);
    for (let y = 1; y < N - 1; y++) {
      for (let x = 1; x < 8; x++) {
        const dx = (7.5 - x) / 6.5, dy = (y - cy) / (N * 0.42);
        const d = Math.hypot(dx, dy);
        const p = d < 0.5 ? 1 : 1.05 - d * 0.85;
        if (r() < p) { g[y][x] = 1; g[y][N - 1 - x] = 1; }
      }
    }
    const ey = Math.max(2, Math.floor(cy - 2 - r() * 2)), ex = 4 + Math.floor(r() * 2);
    for (let y = ey - 1; y <= ey + 2; y++) {
      for (let x = ex - 1; x <= ex + 2; x++) {
        if (y > 0 && y < N - 1 && x > 0) { g[y][x] = 1; g[y][N - 1 - x] = 1; }
      }
    }
    const filled = (y, x) => y >= 0 && y < N && x >= 0 && x < N && g[y][x] === 1;
    const nbrs = (y, x) => filled(y - 1, x) + filled(y + 1, x) + filled(y, x - 1) + filled(y, x + 1);
    // Smooth the noise: drop stray pixels, fill pinholes (stays symmetric since g is symmetric).
    for (let pass = 0; pass < 2; pass++) {
      const next = g.map(row => row.slice());
      for (let y = 1; y < N - 1; y++) {
        for (let x = 1; x < N - 1; x++) {
          const n = nbrs(y, x);
          if (g[y][x] === 1 && n <= 1) next[y][x] = 0;
          else if (g[y][x] === 0 && n >= 3) next[y][x] = 1;
        }
      }
      for (let y = 0; y < N; y++) g[y] = next[y];
    }
    const spots = new Set();
    for (let n = 0; n < 3; n++) {
      const sy = 1 + Math.floor(r() * (N - 2)), sx = 1 + Math.floor(r() * 7);
      if (filled(sy, sx) && Math.abs(sy - ey) > 1) { spots.add(sy + ',' + sx); spots.add(sy + ',' + (N - 1 - sx)); }
    }
    const hue = Math.floor(r() * 360), hue2 = (hue + 120 + Math.floor(r() * 120)) % 360;
    const body = `hsl(${hue},62%,58%)`, shade = `hsl(${hue},55%,40%)`, light = `hsl(${hue},75%,76%)`, accent = `hsl(${hue2},65%,55%)`;
    const c = mk(N, N), cx = c.getContext('2d');
    const px = (x, y, col) => { cx.fillStyle = col; cx.fillRect(x, y, 1, 1); };
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (g[y][x] === 1) {
          let col = body;
          if (!filled(y + 1, x) || y > cy + 3) col = shade;
          else if (!filled(y - 1, x)) col = light;
          if (spots.has(y + ',' + x)) col = accent;
          px(x, y, col);
        } else if (filled(y - 1, x) || filled(y + 1, x) || filled(y, x - 1) || filled(y, x + 1)) {
          px(x, y, '#202028');
        }
      }
    }
    if (!opts.back) for (const [x0, dir] of [[ex, 1], [N - 1 - ex, -1]]) { // back view: no face
      px(x0, ey, '#ffffff'); px(x0 + dir, ey, '#202028');
      px(x0, ey + 1, '#202028'); px(x0 + dir, ey + 1, '#202028');
    }
    return c;
  }

  /* ---------------- Avatar: pixelated photo or initials badge (48x48) ---------------- */
  function avatar(url, name) {
    const c = mk(48, 48), g = c.getContext('2d');
    const initials = () => {
      g.fillStyle = '#5878c8'; g.fillRect(0, 0, 48, 48);
      g.fillStyle = '#6a8ad8';
      for (let y = 0; y < 48; y += 8) for (let x = (y / 8) % 2 * 8; x < 48; x += 16) g.fillRect(x, y, 8, 8);
      const ini = String(name || '?').trim().split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
      g.font = '16px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#1c2448'; g.fillText(ini, 26, 27);
      g.fillStyle = '#ffffff'; g.fillText(ini, 24, 25);
      return c;
    };
    if (!url) return Promise.resolve(initials());
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(img.width, img.height);
        g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 48, 48);
        try { // posterize for a retro palette (skipped if the browser blocks pixel reads, e.g. file://)
          const d = g.getImageData(0, 0, 48, 48);
          for (let i = 0; i < d.data.length; i += 4) for (let k = 0; k < 3; k++) d.data[i + k] = Math.round(d.data[i + k] / 36) * 36;
          g.putImageData(d, 0, 0);
        } catch (e) { /* tainted canvas: keep the plain downscale */ }
        res(c);
      };
      img.onerror = () => res(initials());
      img.src = url;
    });
  }

  /* ---------------- Lab background (240x112) ---------------- */
  function labBackground() {
    const c = mk(240, 112), g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const r = rng(7);

    // wall, trim, baseboard
    R(0, 0, 240, 58, '#dfe4ec');
    for (let x = 12; x < 240; x += 24) R(x, 4, 1, 40, '#cdd4df');
    R(0, 0, 240, 4, '#8f9bb0'); R(0, 4, 240, 1, '#b5bfcf');
    R(0, 44, 240, 12, '#c9d1dd'); R(0, 44, 240, 1, '#aab4c4'); R(0, 47, 240, 1, '#d8dee8');
    R(0, 56, 240, 4, '#5e4e40'); R(0, 56, 240, 1, '#87735f');

    // wooden floor
    for (let i = 0, y = 60; y < 112; y += 8, i++) {
      R(0, y, 240, 8, i % 2 ? '#d6b684' : '#dcbd8c');
      R(0, y + 7, 240, 1, '#b8956a');
      for (let x = (i * 17) % 40; x < 240; x += 40) R(x, y, 1, 7, '#c4a274');
    }

    // bookshelf
    R(4, 6, 50, 52, '#4e3220'); R(6, 8, 46, 48, '#6e4a2e');
    const books = ['#c84848', '#4878c8', '#48a058', '#d8a838', '#8858b0', '#d87838', '#3a8a8a', '#e8e0d0'];
    for (const y0 of [8, 24, 40]) {
      let x = 7;
      while (x < 50) {
        const w = 2 + Math.floor(r() * 3), h = 9 + Math.floor(r() * 5);
        if (x + w > 51) break;
        R(x, y0 + 14 - h, w, h, books[Math.floor(r() * books.length)]);
        R(x, y0 + 14 - h, w, 1, 'rgba(255,255,255,.35)');
        R(x + w - 1, y0 + 14 - h, 1, h, 'rgba(0,0,0,.18)');
        x += w + (r() < 0.25 ? 1 : 0);
      }
      R(6, y0 + 14, 46, 2, '#4e3220');
    }

    // window + plant
    R(62, 6, 52, 34, '#7d889a'); R(64, 8, 48, 30, '#8fd0f4'); R(64, 8, 48, 12, '#b4e2fb');
    R(70, 14, 10, 3, '#fff'); R(72, 12, 6, 2, '#fff'); R(92, 27, 12, 3, '#eaf7ff'); R(95, 25, 6, 2, '#eaf7ff');
    R(87, 8, 2, 30, '#7d889a'); R(64, 22, 48, 2, '#7d889a');
    R(60, 40, 56, 3, '#6d7889'); R(60, 40, 56, 1, '#9aa5b6');
    R(100, 33, 8, 7, '#c0603a'); R(100, 33, 8, 1, '#d8784e');
    R(101, 27, 2, 6, '#3f9a4a'); R(104, 25, 2, 8, '#3f9a4a'); R(106, 28, 2, 5, '#57b860'); R(99, 29, 2, 3, '#57b860');

    // whiteboard with doodles
    R(122, 8, 66, 34, '#6f7a8a'); R(124, 10, 62, 28, '#f6f8fb');
    R(128, 14, 22, 1, '#3a6ad0'); R(128, 17, 30, 1, '#3a6ad0'); R(128, 20, 16, 1, '#d04a4a');
    [[160, 8], [165, 13], [170, 6], [175, 17]].forEach(([x, h]) => R(x, 34 - h, 3, h, '#3aa060'));
    R(158, 34, 22, 1, '#404858');
    const glyphs = [
      [[2, 0], [1, 1], [0, 2], [1, 3], [2, 4]],
      [[2, 0], [2, 1], [1, 2], [0, 3], [0, 4]],
      [[0, 0], [1, 1], [2, 2], [1, 3], [0, 4]]
    ];
    glyphs.forEach((pts, i) => pts.forEach(([x, y]) => R(128 + i * 5 + x, 25 + y, 1, 1, '#404858')));
    R(124, 38, 62, 3, '#9aa4b2'); R(130, 37, 6, 1, '#d04a4a');

    // research machine
    R(196, 12, 40, 46, '#6c7686'); R(198, 14, 36, 42, '#a9b3c3'); R(198, 14, 36, 1, '#c7cfdb');
    R(202, 17, 28, 16, '#1d2f36'); R(203, 18, 26, 14, '#23404a');
    R(205, 20, 14, 1, '#5ce890'); R(205, 23, 20, 1, '#5ce890'); R(205, 26, 10, 1, '#5ce890'); R(205, 29, 16, 1, '#3cb870');
    R(204, 38, 4, 3, '#a03030'); R(210, 38, 4, 3, '#e8b830'); R(216, 38, 4, 3, '#40b050');
    R(224, 37, 6, 6, '#5a6474'); R(225, 38, 4, 4, '#8a94a4');
    for (let y = 46; y < 54; y += 2) R(202, y, 28, 1, '#8a94a4');

    // table with orb cushions
    R(22, 104, 128, 4, 'rgba(60,40,20,.25)');
    R(26, 86, 6, 20, '#7a4c26'); R(140, 86, 6, 20, '#7a4c26');
    R(18, 70, 136, 10, '#e2b274'); R(18, 70, 136, 1, '#f4d09c'); R(18, 79, 136, 1, '#c89458');
    R(16, 80, 140, 7, '#a8703a'); R(16, 80, 140, 1, '#c88a4c'); R(16, 86, 140, 1, '#7a4c26');
    for (const x of [38, 76, 114]) { R(x - 1, 73, 18, 3, '#9a3a2a'); R(x - 1, 73, 18, 1, '#c0563e'); }

    return c;
  }

  return { fromMap, professor, orb, arrow, creature, avatar, labBackground, hashStr };
})();
