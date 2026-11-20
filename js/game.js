/* Game engine: input, dialogue, lab scene, CODEX pages, contact card, quick view. */
(() => {
  'use strict';
  if (!window.PORTFOLIO) {
    // data.js failed to load (usually a typo such as a stray bracket or a missing comma).
    const s = document.getElementById('screen');
    s.innerHTML = '<div style="position:absolute;inset:0;padding:16px;background:#101018;color:#ff8a80;font-size:7px;line-height:12px">' +
      'ERROR: js/data.js did not load.<br><br>It probably has a syntax error (a stray bracket, quote or missing comma).<br><br>' +
      'Open the browser console (F12) to see the exact line.</div>';
    console.error('PORTFOLIO data missing: check js/data.js for a syntax error.');
    return;
  }
  const D = window.PORTFOLIO;
  const S = window.Sprites;
  const Snd = window.Sound;
  const SC = D.script || {};

  const NAME = String(D.name || 'Trainer').toUpperCase();
  const PROF = String(D.professor || 'Cedar').toUpperCase();
  const CPL = 26;        // chars per dialogue line (8px font in a 216px box)
  const LINES = 3;       // lines per dialogue page
  const TEXT_MS = 26;    // typewriter speed

  const SECTIONS = [
    { key: 'about', label: 'ABOUT ME', color: 'LEFT', pal: 'red', x: 38 },
    { key: 'projects', label: 'PROJECTS', color: 'MIDDLE', pal: 'red', x: 76 },
    { key: 'skills', label: 'SKILLS', color: 'RIGHT', pal: 'red', x: 114 }
  ];

  /* ---------------- helpers ---------------- */
  const fill = (s, extra = {}) => String(s == null ? '' : s).replace(/\{(\w+)\}/g, (m, k) =>
    k === 'NAME' ? NAME : k === 'PROF' ? PROF : (k in extra ? extra[k] : m));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const list = v => Array.isArray(v) ? v : (v ? [v] : []);
  const pad3 = n => String(n).padStart(3, '0');
  const paras = arr => list(arr).map(p => `<p>${esc(p)}</p>`).join('');
  const safeUrl = u => { u = String(u || '').trim(); return u && !/^(javascript|data|vbscript):/i.test(u) ? u : ''; };
  const barColor = v => v >= 70 ? '#48c858' : v >= 40 ? '#f0c030' : '#f05838';
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (tag === 'button') { e.type = 'button'; e.tabIndex = -1; }
    return e;
  }
  const TYPE_COLORS = ['#e0663a', '#3f7fe0', '#42a858', '#c9a227', '#9a59c9', '#d4508a', '#3aa6a6', '#7a8a9a', '#c8553d', '#5a6fd0'];
  const badge = t => `<span class="badge" style="background:${TYPE_COLORS[S.hashStr(String(t).toLowerCase()) % TYPE_COLORS.length]}">${esc(String(t).toUpperCase())}</span>`;

  function wrapText(text, cpl) {
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        if (!line) line = word;
        else if ((line + ' ' + word).length <= cpl) line += ' ' + word;
        else { out.push(line); line = word; }
        while (line.length > cpl) { out.push(line.slice(0, cpl)); line = line.slice(cpl); }
      }
      out.push(line);
    }
    return out;
  }

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return; } catch (e) { /* fall back */ }
    const ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
  }

  /* ---------------- DOM roots & scaling ---------------- */
  const screen = document.getElementById('screen');
  const holder = document.getElementById('screen-holder');
  const gameView = document.getElementById('game-view');
  const quick = document.getElementById('quick-view');
  const fit = () => { const w = holder.clientWidth; if (w) screen.style.transform = `scale(${w / 240})`; };
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(holder); else window.addEventListener('resize', fit);
  fit();

  /* ---------------- input ---------------- */
  const Input = {
    stack: [], locked: false,
    push(c) { this.stack.push(c); return c; },
    pop(c) { const i = this.stack.lastIndexOf(c); if (i >= 0) this.stack.splice(i, 1); },
    get top() { return this.stack[this.stack.length - 1]; },
    press(k) {
      if (this.locked) return;
      const c = this.top;
      if (!c) return;
      if (k === 'start' && !c.start) k = 'a';
      c.onKey(k);
    }
  };

  const KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
    Enter: 'start', z: 'a', ' ': 'a', x: 'b', Escape: 'b', Backspace: 'b',
    Shift: 'select', m: 'mute'
  };
  function flashPad(k) {
    const b = document.querySelector(`.console [data-key="${k}"]`);
    if (!b) return;
    b.classList.add('pressed');
    setTimeout(() => b.classList.remove('pressed'), 120);
  }
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || gameView.hidden) return;
    const k = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!k) return;
    e.preventDefault();
    Snd.init();
    if (k === 'mute') { toggleMute(); return; }
    if (e.repeat && !['up', 'down', 'left', 'right'].includes(k)) return;
    flashPad(k);
    Input.press(k);
  });
  document.querySelectorAll('.console [data-key]').forEach(b => {
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      Snd.init();
      b.classList.add('pressed');
      Input.press(b.dataset.key);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, () => b.classList.remove('pressed')));
  });

  /* ---------------- top-bar buttons ---------------- */
  const btnMute = document.getElementById('btn-mute');
  const btnQuick = document.getElementById('btn-quick');
  const syncMute = () => { btnMute.textContent = Snd.isMuted() ? 'SOUND: OFF' : 'SOUND: ON'; btnMute.setAttribute('aria-pressed', String(!Snd.isMuted())); };
  function toggleMute() { Snd.setMuted(!Snd.isMuted()); syncMute(); Snd.init(); Snd.move(); }
  btnMute.addEventListener('click', toggleMute);
  syncMute();

  function setQuick(on) {
    gameView.hidden = on;
    quick.hidden = !on;
    btnQuick.textContent = on ? 'PLAY GAME' : 'QUICK VIEW';
    if (on && !quick.dataset.built) { buildQuick(); quick.dataset.built = '1'; }
    try { history.replaceState(null, '', on ? '#quick' : location.pathname + location.search); } catch (e) { /* file:// */ }
    window.scrollTo(0, 0);
    if (!on) requestAnimationFrame(fit);
  }
  btnQuick.addEventListener('click', () => setQuick(quick.hidden));
  document.getElementById('brand').textContent = `${NAME} // PORTFOLIO`;
  document.title = `${D.name || 'Portfolio'} | Portfolio`;

  /* ---------------- screen effects ---------------- */
  const fader = el('div', 'fader');
  const flashEl = el('div', 'flash');
  screen.append(fader, flashEl);
  const Fx = {
    async out() { fader.style.opacity = '1'; await sleep(340); },
    async in() { fader.style.opacity = '0'; await sleep(340); },
    async flash() { flashEl.classList.remove('go'); void flashEl.offsetWidth; flashEl.classList.add('go'); await sleep(520); flashEl.classList.remove('go'); }
  };

  /* ---------------- professor sprite ---------------- */
  const Prof = {
    talking: false, cur: null,
    init(parent) {
      this.cv = el('canvas', 'prof');
      this.cv.width = 32; this.cv.height = 48;
      this.g = this.cv.getContext('2d');
      this.frames = { idle: S.professor(), blink: S.professor({ blink: true }), talk: S.professor({ talk: true }) };
      parent.appendChild(this.cv);
      let t = 0;
      setInterval(() => {
        t++;
        let f = 'idle';
        if (this.talking) f = t % 2 ? 'talk' : 'idle';
        else if (t % 34 === 0) f = 'blink';
        this.draw(f);
      }, 110);
      this.draw('idle');
    },
    draw(f) {
      if (this.cur === f) return;
      this.cur = f;
      this.g.clearRect(0, 0, 32, 48);
      this.g.drawImage(this.frames[f], 0, 0);
    }
  };

  /* ---------------- dialogue box ---------------- */
  const Dialog = {
    init(parent) {
      this.box = el('div', 'dialog');
      this.box.hidden = true;
      const speaker = el('div', 'speaker', 'PROF. ' + esc(PROF));
      this.tab = el('button', 'prof-tab', 'ABOUT PROF.<span class="q">?</span>');
      this.tab.setAttribute('aria-label', 'About the professor (contact info)');
      this.text = el('div', 'dtext');
      this.next = el('div', 'dnext');
      this.next.hidden = true;
      this.box.append(speaker, this.tab, this.text, this.next);
      parent.appendChild(this.box);
      this.tab.addEventListener('click', e => { e.stopPropagation(); Snd.init(); if (!Input.locked) openContact(); });
    },
    show() { this.box.hidden = false; },
    clear() { this.stop(); this.text.textContent = ''; this.next.hidden = true; },
    stop() { clearInterval(this.timer); this.timer = null; Prof.talking = false; },
    type(str, ms, onDone) {
      this.stop();
      this.full = str;
      this.next.hidden = true;
      this.text.textContent = '';
      let i = 0;
      Prof.talking = true;
      this.timer = setInterval(() => {
        i++;
        this.text.textContent = str.slice(0, i);
        if (i % 2 === 1 && /\S/.test(str[i - 1] || '')) Snd.text();
        if (i >= str.length) { this.stop(); if (onDone) onDone(); }
      }, ms);
    },
    finishNow() { this.stop(); this.text.textContent = this.full || ''; },
    paginate(text, extra) {
      const lines = wrapText(fill(text, extra), CPL);
      const out = [];
      for (let i = 0; i < lines.length; i += LINES) out.push(lines.slice(i, i + LINES).join('\n'));
      return out.length ? out : [''];
    },
    /* Types one page. hold=true waits for A after typing; hold=false resolves as soon as it's typed. */
    page(p, hold = true) {
      return new Promise(resolve => {
        let typed = false;
        const ctrl = {
          isDialog: true,
          onKey: k => {
            if (k === 'a' || k === 'b') {
              if (!typed) { this.finishNow(); done(); }
              else { Snd.move(); this.next.hidden = true; Input.pop(ctrl); resolve(); }
            } else if (k === 'select') openContact();
          }
        };
        const done = () => {
          typed = true;
          if (hold) this.next.hidden = false;
          else { Input.pop(ctrl); resolve(); }
        };
        Input.push(ctrl);
        this.type(p, TEXT_MS, done);
      });
    },
    async say(texts, extra) {
      this.show();
      for (const t of list(texts)) for (const p of this.paginate(t, extra)) await this.page(p);
    },
    async ask(text, options, extra) {
      this.show();
      const pages = this.paginate(text, extra);
      for (let i = 0; i < pages.length - 1; i++) await this.page(pages[i]);
      await this.page(pages[pages.length - 1], false);
      return Menu.choose(options, this.menuParent);
    },
    /* Non-blocking text (used while choosing an orb). */
    info(text, extra) { this.show(); this.type(this.paginate(text, extra)[0], 12); }
  };

  /* ---------------- YES / NO menu ---------------- */
  const Menu = {
    choose(options, parent) {
      return new Promise(resolve => {
        const box = el('div', 'choice');
        let sel = 0;
        const set = i => { sel = (i + options.length) % options.length; items.forEach((b, j) => b.classList.toggle('on', j === sel)); };
        const finish = i => {
          Input.pop(ctrl);
          box.remove();
          if (i === options.length - 1) Snd.back(); else Snd.confirm();
          resolve(i);
        };
        const items = options.map((o, i) => {
          const b = el('button', 'citem', esc(o));
          b.addEventListener('click', e => { e.stopPropagation(); if (Input.top === ctrl) finish(i); });
          b.addEventListener('pointerenter', () => set(i));
          box.appendChild(b);
          return b;
        });
        const ctrl = {
          onKey: k => {
            if (k === 'up' || k === 'left') { set(sel - 1); Snd.move(); }
            else if (k === 'down' || k === 'right') { set(sel + 1); Snd.move(); }
            else if (k === 'a') finish(sel);
            else if (k === 'b') finish(options.length - 1);
            else if (k === 'select') openContact();
          }
        };
        set(0);
        (parent || Lab.root).appendChild(box);
        Input.push(ctrl);
      });
    }
  };

  /* ---------------- lab scene ---------------- */
  const Lab = {
    init() {
      const root = this.root = el('div', 'scene lab');
      root.hidden = true;
      const bg = S.labBackground();
      bg.className = 'lab-bg';
      root.appendChild(bg);
      root.appendChild(el('div', 'led-blink'));
      Prof.init(root);
      this.orbs = SECTIONS.map((s, i) => {
        const b = el('button', 'orb');
        b.style.left = s.x + 'px';
        b.setAttribute('aria-label', `${s.color} orb: ${s.label}`);
        b.appendChild(S.orb(s.pal));
        b.addEventListener('click', e => { e.stopPropagation(); Choose.click(i); });
        b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') Choose.hover(i); });
        root.appendChild(b);
        return b;
      });
      this.cursor = S.arrow();
      this.cursor.className = 'orb-cursor';
      this.cursor.hidden = true;
      this.tag = el('div', 'orb-tag');
      this.tag.hidden = true;
      root.append(this.cursor, this.tag);
      // Clicking anywhere in the scene advances dialogue.
      root.addEventListener('click', () => { const t = Input.top; if (t && t.isDialog) Input.press('a'); });
      screen.appendChild(root);
      Dialog.init(root);
    },
    highlight(i) {
      this.orbs.forEach((b, j) => b.classList.toggle('sel', j === i));
      const on = i >= 0;
      this.cursor.hidden = this.tag.hidden = !on;
      if (!on) return;
      const cx = SECTIONS[i].x + 8;
      this.cursor.style.left = (cx - 3) + 'px';
      this.tag.style.left = cx + 'px';
      this.tag.textContent = SECTIONS[i].label;
    },
    markSeen(i) { this.orbs[i].classList.add('seen'); }
  };

  /* ---------------- choosing an orb ---------------- */
  const seen = new Set();
  const Choose = {
    sel: 0, ctrl: null,
    enter() {
      this.ctrl = {
        onKey: k => {
          if (k === 'left' || k === 'up') this.set(this.sel - 1);
          else if (k === 'right' || k === 'down') this.set(this.sel + 1);
          else if (k === 'a') this.pick();
          else if (k === 'select') openContact();
        }
      };
      Input.push(this.ctrl);
      this.set(this.sel, true);
    },
    active() { return !!this.ctrl && Input.top === this.ctrl && !Input.locked; },
    set(i, force) {
      i = (i + SECTIONS.length) % SECTIONS.length;
      if (i === this.sel && !force) return;
      if (!force) Snd.move();
      this.sel = i;
      Lab.highlight(i);
      const s = SECTIONS[i];
      Dialog.info(list(SC.blurbs)[i] || s.label, { COLOR: s.color, SECTION: s.label });
    },
    hover(i) { if (this.active()) this.set(i); },
    click(i) { if (!this.active()) return; if (i === this.sel) this.pick(); else this.set(i); },
    async pick() {
      Input.pop(this.ctrl);
      this.ctrl = null;
      const i = this.sel, s = SECTIONS[i];
      Snd.confirm();
      const ans = await Dialog.ask(SC.confirm || 'So! You want the {COLOR} ORB?', ['YES', 'NO'], { COLOR: s.color, SECTION: s.label });
      if (ans === 0) await openOrb(i);
      this.enter();
    }
  };

  async function openOrb(i) {
    Input.locked = true;
    Lab.highlight(-1);
    Dialog.clear();
    const orb = Lab.orbs[i];
    for (let n = 0; n < 3; n++) {
      orb.classList.add('shake'); Snd.shake();
      await sleep(280);
      orb.classList.remove('shake');
      await sleep(140);
    }
    Snd.open();
    Fx.flash();
    await sleep(200);
    Input.locked = false;
    await Dex.open(i);
    const first = !seen.has(i);
    seen.add(i);
    Lab.markSeen(i);
    await Dialog.say(list(SC.after)[i]);
    if (first && seen.size === SECTIONS.length) {
      await Dialog.say(SC.allSeen);
      const a = await Dialog.ask(SC.offerContact || "Want {NAME}'s contact info?", ['YES', 'NO']);
      if (a === 0) await openContact();
      else await Dialog.say(SC.declineContact);
    }
  }

  /* ---------------- CODEX (the dex device) ---------------- */
  const Dex = {
    init() {
      const d = this.root = el('div', 'dex');
      d.hidden = true;
      d.innerHTML = `
        <div class="dex-head"><span class="dex-logo">CODEX</span><span class="dex-title"></span><span class="dex-no"></span></div>
        <div class="dex-body"></div>
        <div class="dex-foot"><button class="dex-b" type="button" tabindex="-1">B:CLOSE</button><span class="dex-hint"></span></div>
        <div class="lid lid-top"><div class="lens"></div></div>
        <div class="lid lid-bot"><span>CODEX</span></div>`;
      this.title = d.querySelector('.dex-title');
      this.no = d.querySelector('.dex-no');
      this.body = d.querySelector('.dex-body');
      this.bBtn = d.querySelector('.dex-b');
      this.hint = d.querySelector('.dex-hint');
      this.bBtn.addEventListener('click', e => { e.stopPropagation(); Input.press('b'); });
      screen.appendChild(d);
    },
    setFoot(b, hint) { this.bBtn.textContent = 'B:' + b; this.hint.textContent = hint; },
    async open(i) {
      const s = SECTIONS[i];
      this.title.textContent = s.label;
      this.no.textContent = 'No.' + pad3(i + 1);
      this.body.innerHTML = '';
      this.page = PAGES[s.key]();
      this.body.appendChild(this.page.el);
      this.root.classList.remove('open');
      this.root.hidden = false;
      Input.locked = true;
      await sleep(260);
      this.root.classList.add('open');
      Snd.jingle();
      await sleep(420);
      Input.locked = false;
      if (this.page.enter) this.page.enter();
      return new Promise(res => {
        this.resolve = res;
        this.ctrl = Input.push({ onKey: k => this.page.onKey(k) });
      });
    },
    async close() {
      if (!this.ctrl) return;
      Input.pop(this.ctrl);
      this.ctrl = null;
      Snd.back();
      Input.locked = true;
      this.root.classList.remove('open');
      await sleep(420);
      this.root.hidden = true;
      Input.locked = false;
      const r = this.resolve;
      this.resolve = null;
      if (r) r();
    }
  };

  /* Scrollable text panel with blinking arrows. */
  function scroller(cls, html) {
    const wrap = el('div', 'panel ' + cls);
    const inner = el('div', 'sc', html);
    const up = el('div', 'sarr up'), dn = el('div', 'sarr dn');
    wrap.append(inner, up, dn);
    const upd = () => {
      up.hidden = inner.scrollTop <= 0;
      dn.hidden = inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 1;
    };
    inner.addEventListener('scroll', upd);
    requestAnimationFrame(upd);
    return { wrap, inner, upd, by(dy) { inner.scrollTop += dy; upd(); } };
  }
  function ensureVisible(container, item) {
    if (item.offsetTop < container.scrollTop) container.scrollTop = item.offsetTop;
    else if (item.offsetTop + item.offsetHeight > container.scrollTop + container.clientHeight) {
      container.scrollTop = item.offsetTop + item.offsetHeight - container.clientHeight;
    }
  }
  const kv = (k, v) => (v || v === 0) ? `<div class="kv"><span class="k">${k}</span><span class="v">${esc(v)}</span></div>` : '';

  const PAGES = {
    about() {
      const a = D.about || {};
      const root = el('div', 'pg about');
      const pic = el('div', 'panel portrait');
      S.avatar(D.photo, D.name || NAME).then(c => { c.className = 'avatar'; pic.appendChild(c); });
      const info = el('div', 'panel info', `
        <div class="nm"><span class="no">No.001</span> ${esc(NAME)}</div>
        <div class="ttl">${esc(D.title || '')}</div>
        <div class="types">${list(a.types).map(badge).join('')}</div>
        ${kv('HOME', a.location)}${kv('LEVEL', a.level != null && a.level !== '' ? 'LV.' + a.level : '')}${kv('LIKES', a.likes)}`);
      const bio = scroller('bio', paras(a.bio));
      root.append(pic, info, bio.wrap);
      Dex.setFoot('CLOSE', 'UP/DN:SCROLL');
      return {
        el: root,
        enter: bio.upd,
        onKey(k) {
          if (k === 'up') bio.by(-22);
          else if (k === 'down' || k === 'a') bio.by(22);
          else if (k === 'b') Dex.close();
          else if (k === 'select') openContact();
        }
      };
    },

    projects() {
      const P = list(D.projects);
      const root = el('div', 'pg proj');
      const lst = el('div', 'panel plist');
      const ul = el('div', 'sc');
      lst.appendChild(ul);
      const prev = el('div', 'panel ppreview');
      const det = el('div', 'pdetail');
      det.hidden = true;
      root.append(lst, prev, det);
      let sel = 0, mode = 'list', link = 0, links = [], desc = null;

      const items = P.map((p, i) => {
        const b = el('button', 'pitem', `<span class="no">${pad3(i + 1)}</span> ${esc(String(p.name || '').toUpperCase())}`);
        b.addEventListener('click', e => { e.stopPropagation(); if (mode !== 'list') return; if (i === sel) openDetail(); else select(i); });
        ul.appendChild(b);
        return b;
      });
      if (!P.length) { ul.innerHTML = '<div class="empty">NO DATA YET</div>'; prev.innerHTML = '<div class="empty">???</div>'; }

      function select(i, quiet) {
        if (!P.length) return;
        sel = (i + P.length) % P.length;
        items.forEach((b, j) => b.classList.toggle('on', j === sel));
        ensureVisible(ul, items[sel]);
        const p = P[sel];
        prev.innerHTML = `<div class="stage"><div class="plat"></div></div>
          <div class="pname">${esc(String(p.name || '').toUpperCase())}</div>
          <div class="types">${list(p.types).slice(0, 3).map(badge).join('')}</div>
          <div class="psum">${esc(p.summary || '')}</div>
          <button class="phint" type="button" tabindex="-1">A: VIEW ENTRY</button>`;
        const cv = S.creature(p.name || String(sel));
        cv.className = 'creature';
        prev.querySelector('.stage').appendChild(cv);
        prev.querySelector('.phint').addEventListener('click', e => { e.stopPropagation(); openDetail(); });
        if (!quiet) Snd.move();
      }
      function setLink(j) {
        if (!links.length) return;
        link = (j + links.length) % links.length;
        det.querySelectorAll('.plink').forEach((b, x) => b.classList.toggle('on', x === link));
      }
      function go() {
        const l = links[link];
        if (!l) return;
        Snd.confirm();
        if (l.battle) Battle.start(P[sel]);
        else window.open(l.url, '_blank', 'noopener');
      }
      function openDetail() {
        if (!P.length) return;
        const p = P[sel];
        mode = 'detail';
        Snd.confirm();
        links = [];
        // A project with a `battle` gets a playable demo battle instead of a live URL.
        const live = p.battle ? '' : safeUrl(p.live), code = safeUrl(p.code);
        if (p.battle) links.push({ label: 'LIVE DEMO', battle: true });
        if (live) links.push({ label: 'LIVE DEMO', url: live });
        if (code) links.push({ label: 'SOURCE CODE', url: code });
        list(p.links).forEach(l => { const u = safeUrl(l && l.url); if (u) links.push({ label: String(l.label || 'LINK').toUpperCase(), url: u }); });
        det.innerHTML = '';
        const head = el('div', 'panel phead', `<div class="pno">No.${pad3(sel + 1)}</div>
          <div class="pname">${esc(String(p.name || '').toUpperCase())}</div>
          <div class="types">${list(p.types).map(badge).join('')}</div>`);
        const cv = S.creature(p.name || String(sel));
        cv.className = 'creature sm';
        head.prepend(cv);
        desc = scroller('pdesc', paras(list(p.description).length ? p.description : p.summary));
        const lk = el('div', 'plinks');
        links.forEach((l, j) => {
          const b = el('button', 'plink', esc(l.label));
          b.addEventListener('click', e => { e.stopPropagation(); setLink(j); go(); });
          lk.appendChild(b);
        });
        if (!links.length) lk.innerHTML = '<span class="nolink">NO LINKS FOR THIS ENTRY</span>';
        det.append(head, desc.wrap, lk);
        lst.hidden = prev.hidden = true;
        det.hidden = false;
        link = 0;
        setLink(0);
        requestAnimationFrame(desc.upd);
        Dex.setFoot('BACK', links.length ? 'L/R:LINK A:OPEN' : 'UP/DN:SCROLL');
      }
      function closeDetail() {
        mode = 'list';
        det.hidden = true;
        lst.hidden = prev.hidden = false;
        Snd.back();
        ensureVisible(ul, items[sel]);
        Dex.setFoot('CLOSE', 'UP/DN:MOVE A:VIEW');
      }

      select(0, true);
      Dex.setFoot('CLOSE', 'UP/DN:MOVE A:VIEW');
      return {
        el: root,
        onKey(k) {
          if (k === 'select') { openContact(); return; }
          if (mode === 'list') {
            if (k === 'up' || k === 'left') select(sel - 1);
            else if (k === 'down' || k === 'right') select(sel + 1);
            else if (k === 'a') openDetail();
            else if (k === 'b') Dex.close();
          } else {
            if (k === 'up') desc.by(-22);
            else if (k === 'down') desc.by(22);
            else if (k === 'left') { setLink(link - 1); Snd.move(); }
            else if (k === 'right') { setLink(link + 1); Snd.move(); }
            else if (k === 'a') go();
            else if (k === 'b') closeDetail();
          }
        }
      };
    },

    skills() {
      const SK = D.skills || {};
      const cats = Object.keys(SK);
      const root = el('div', 'pg skills');
      const tabs = el('div', 'stabs');
      const panel = el('div', 'panel slist');
      const ul = el('div', 'sc');
      panel.appendChild(ul);
      root.append(tabs, panel);
      let tab = 0, sel = 0, rows = [];

      const tabBtns = cats.map((c, i) => {
        const b = el('button', 'stab', esc(c.toUpperCase()));
        b.addEventListener('click', e => { e.stopPropagation(); if (i !== tab) setTab(i); });
        tabs.appendChild(b);
        return b;
      });
      const fillBars = () => requestAnimationFrame(() => requestAnimationFrame(() =>
        rows.forEach(r => { r.querySelector('i').style.width = r.dataset.v + '%'; })));
      function setSel(j, quiet) {
        if (!rows.length) return;
        sel = clamp(j, 0, rows.length - 1);
        rows.forEach((r, x) => r.classList.toggle('on', x === sel));
        ensureVisible(ul, rows[sel]);
        if (!quiet) Snd.move();
      }
      function setTab(i, initial) {
        if (!cats.length) { ul.innerHTML = '<div class="empty">NO DATA YET</div>'; return; }
        tab = (i + cats.length) % cats.length;
        tabBtns.forEach((b, j) => b.classList.toggle('on', j === tab));
        tabs.scrollLeft = Math.max(0, tabBtns[tab].offsetLeft - 20);
        ul.innerHTML = '';
        ul.scrollTop = 0;
        rows = list(SK[cats[tab]]).map((s, j) => {
          const v = clamp(Math.round(Number(s.level) || 0), 0, 100);
          const r = el('div', 'srow', `<span class="sn">${esc(String(s.name || '').toUpperCase())}</span><span class="lv">LV</span><span class="bar"><i style="background:${barColor(v)}"></i></span><span class="sv">${v}</span>`);
          r.dataset.v = v;
          r.addEventListener('click', e => { e.stopPropagation(); setSel(j); });
          ul.appendChild(r);
          return r;
        });
        setSel(0, true);
        if (!initial) { Snd.move(); fillBars(); }
      }
      setTab(0, true);
      Dex.setFoot('CLOSE', 'L/R:TYPE UP/DN:MOVE');
      return {
        el: root,
        enter: fillBars,
        onKey(k) {
          if (k === 'left') setTab(tab - 1);
          else if (k === 'right') setTab(tab + 1);
          else if (k === 'up') setSel(sel - 1);
          else if (k === 'down') setSel(sel + 1);
          else if (k === 'b') Dex.close();
          else if (k === 'select') openContact();
        }
      };
    }
  };

  /* ---------------- contact card ("ABOUT PROF.?") ---------------- */
  let contactOpen = null;
  function openContact() {
    if (contactOpen) return contactOpen;
    Snd.confirm();
    const c = D.contact || {};
    const email = String(c.email || '').trim();
    contactOpen = new Promise(resolve => {
      const ov = el('div', 'overlay');
      const card = el('div', 'card');
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-label', 'Contact information');
      card.innerHTML = `
        <div class="card-head"><span>PROF. ${esc(PROF)}</span><span class="cid">SECRET FILE</span></div>
        <div class="card-pic"></div>
        <div class="card-txt">${esc(fill(SC.contactIntro || "I'm only {NAME}'s lab assistant. Here's how to reach the real deal:"))}</div>
        <div class="card-mail"><span class="lbl">EMAIL</span><span class="val">${esc(email || 'NOT SET')}</span></div>
        <div class="card-acts"></div>`;
      const pic = S.professor();
      card.querySelector('.card-pic').appendChild(pic);
      const val = card.querySelector('.val');
      const acts = [];
      if (email) {
        acts.push({ label: 'SEND MAIL', fn: () => { window.location.href = 'mailto:' + email; } });
        acts.push({ label: 'COPY', fn: async () => { await copyText(email); val.textContent = 'COPIED!'; setTimeout(() => { val.textContent = email; }, 1200); } });
      }
      list(c.links).forEach(l => { const u = safeUrl(l && l.url); if (u) acts.push({ label: String(l.label || 'LINK').toUpperCase(), fn: () => window.open(u, '_blank', 'noopener') }); });
      acts.push({ label: 'CLOSE', fn: () => close() });

      const box = card.querySelector('.card-acts');
      let sel = 0;
      const set = i => { sel = (i + acts.length) % acts.length; btns.forEach((b, j) => b.classList.toggle('on', j === sel)); };
      const run = () => { if (acts[sel].label !== 'CLOSE') Snd.confirm(); acts[sel].fn(); };
      const btns = acts.map((a, i) => {
        const b = el('button', 'cact', esc(a.label));
        b.addEventListener('click', e => { e.stopPropagation(); set(i); run(); });
        box.appendChild(b);
        return b;
      });
      const close = () => { Input.pop(ctrl); ov.remove(); Snd.back(); contactOpen = null; resolve(); };
      const ctrl = {
        onKey: k => {
          if (k === 'left' || k === 'up') { set(sel - 1); Snd.move(); }
          else if (k === 'right' || k === 'down') { set(sel + 1); Snd.move(); }
          else if (k === 'a') run();
          else if (k === 'b' || k === 'select') close();
        }
      };
      ov.addEventListener('click', e => { if (e.target === ov) close(); });
      ov.appendChild(card);
      screen.appendChild(ov);
      set(0);
      Input.push(ctrl);
    });
    return contactOpen;
  }

  /* ---------------- project demo battle ----------------
     Configured per project via `battle` in data.js. The player's moves are the
     project's commands; using them in the listed order wins the battle. */
  const Battle = {
    active: false,
    async start(p) {
      if (this.active || !p || !p.battle) return;
      this.active = true;
      const B = p.battle;
      const moves = list(B.moves).filter(m => m && m.name);
      const PLAYER = String(B.player || p.name || 'PARTNER').toUpperCase();
      const FOE = String(B.foe || 'WILD BUG').toUpperCase();
      const RIVAL = String(B.rival || 'RIVAL').toUpperCase();
      const FOE_MOVE = String(B.foeMove || 'TACKLE').toUpperCase();
      const ex = { PLAYER, FOE, RIVAL };
      const blocker = Input.push({ onKey: k => { if (k === 'select') openContact(); } });

      /* ---- scene ---- */
      const root = el('div', 'scene battle');
      const hpBox = side => `<div class="hpbox ${side}-box"><div class="nm"></div><div class="lvl"></div>
        <div class="hprow"><span class="hpl">HP</span><span class="hpbar"><i></i></span></div>${side === 'me' ? '<div class="hpnum"></div>' : ''}</div>`;
      root.innerHTML = `
        <div class="bplat foe-plat"></div><div class="bplat me-plat"></div>
        <div class="bspr foe-spr"></div><div class="bspr me-spr"></div>
        ${hpBox('foe')}${hpBox('me')}
        <div class="bbox"><div class="dtext"></div><div class="dnext" hidden></div></div>
        <div class="bmenu" hidden><div class="bmoves"></div><div class="bdesc"><div class="busage"></div><div class="btxt"></div></div></div>`;
      const q = s => root.querySelector(s);
      const foeSpr = q('.foe-spr'), meSpr = q('.me-spr');
      foeSpr.appendChild(S.creature(B.foeSeed || FOE));
      meSpr.appendChild(S.creature(p.name || PLAYER));
      const label = (box, name, lv) => {
        const nm = q(box + ' .nm');
        nm.textContent = name;
        if (name.length > 13) nm.classList.add('long');
        q(box + ' .lvl').textContent = 'Lv' + lv;
      };
      label('.foe-box', FOE, B.foeLevel || 50);
      label('.me-box', PLAYER, B.playerLevel || 50);
      const bars = { foe: q('.foe-box i'), me: q('.me-box i') };
      const meNum = q('.hpnum');

      // Battle message box reuses the dialogue engine with its own elements.
      const msg = Object.assign(Object.create(Dialog), { box: q('.bbox'), text: q('.dtext'), next: q('.dnext'), timer: null, full: '', menuParent: root });
      const say = t => msg.say(list(t), ex);
      root.addEventListener('click', () => { const t = Input.top; if (t && t.isDialog) Input.press('a'); });

      /* ---- move menu (shuffled so the order is the puzzle) ---- */
      const order = moves.slice();
      const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } };
      do shuffle(order); while (order.length > 1 && order.every((m, i) => m === moves[i]));
      const menu = q('.bmenu'), usage = q('.busage'), mtxt = q('.btxt');
      let msel = 0, mctrl = null, menuDone = null;
      const setM = i => {
        msel = (i + order.length) % order.length;
        mrows.forEach((b, j) => b.classList.toggle('on', j === msel));
        usage.textContent = order[msel].usage || order[msel].name;
        mtxt.textContent = order[msel].desc || '';
      };
      const mrows = order.map((m, i) => {
        const b = el('button', 'bmove', esc(m.name));
        b.addEventListener('click', e => {
          e.stopPropagation();
          if (!menuDone || Input.top !== mctrl) return;
          if (i === msel) menuDone(order[i]); else { setM(i); Snd.move(); }
        });
        b.addEventListener('pointerenter', e => { if (menuDone && Input.top === mctrl && e.pointerType === 'mouse') setM(i); });
        q('.bmoves').appendChild(b);
        return b;
      });
      const chooseMove = () => new Promise(resolve => {
        menu.hidden = false;
        setM(msel);
        mctrl = Input.push({
          onKey: k => {
            if (k === 'up' || k === 'left') { setM(msel - 1); Snd.move(); }
            else if (k === 'down' || k === 'right') { setM(msel + 1); Snd.move(); }
            else if (k === 'a') menuDone(order[msel]);
            else if (k === 'b') menuDone('run');
            else if (k === 'select') openContact();
          }
        });
        menuDone = v => {
          menuDone = null;
          Input.pop(mctrl);
          menu.hidden = true;
          if (v === 'run') Snd.back(); else Snd.confirm();
          resolve(v);
        };
      });

      /* ---- effects ---- */
      const setHP = async (side, v, instant) => {
        const bar = bars[side];
        bar.style.transition = instant ? 'none' : '';
        bar.style.width = v + '%';
        bar.style.background = v > 50 ? '#48c858' : v > 20 ? '#f0c030' : '#f05838';
        if (side === 'me') meNum.textContent = `${v}/100`;
        if (instant) { void bar.offsetWidth; bar.style.transition = ''; } else await sleep(700);
      };
      const anim = async (node, cls, ms) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); await sleep(ms); node.classList.remove(cls); };

      let step = 0, meHP = 100;
      const reset = () => {
        step = 0; meHP = 100;
        setHP('me', 100, true); setHP('foe', 100, true);
        foeSpr.classList.remove('fainted'); meSpr.classList.remove('fainted');
      };

      async function playerTurn(mv) {
        const idx = moves.indexOf(mv);
        await say(`${PLAYER} used ${mv.name}!`);
        Snd.attack();
        await anim(meSpr, 'lunge-r', 320);
        if (idx < step) { await say(mv.already || 'But it already ran! Nothing changed.'); return null; }
        if (idx > step) { await say([mv.fail || 'Out of order!', 'But it failed!']); return null; }
        step++;
        Snd.hit();
        await anim(foeSpr, 'hit', 600);
        await setHP('foe', Math.round(100 * (1 - step / moves.length)));
        await say([mv.success, "It's super effective!"]);
        if (step < moves.length) return null;
        foeSpr.classList.add('fainted');
        Snd.faint();
        await sleep(700);
        await say([`Foe ${FOE} fainted!`, ...list(B.rivalLose)]);
        return 'win';
      }

      async function foeTurn() {
        await say(`Foe ${FOE} used ${FOE_MOVE}!`);
        Snd.attack();
        await anim(foeSpr, 'lunge-l', 320);
        Snd.hit();
        anim(root, 'shake', 300);
        await anim(meSpr, 'hit', 600);
        meHP = Math.max(0, meHP - (13 + Math.floor(Math.random() * 6)));
        await setHP('me', meHP);
        const lines = list(B.foeLines);
        if (lines.length) await say(lines[Math.floor(Math.random() * lines.length)]);
        if (meHP > 0) return null;
        meSpr.classList.add('fainted');
        Snd.faint();
        await sleep(700);
        await say([`${PLAYER} fainted!`, ...list(B.rivalWin), ...list(B.hint)]);
        return 'lose';
      }

      /* ---- intro ---- */
      Input.locked = true;
      Snd.open();
      await Fx.flash();
      await Fx.flash();
      await Fx.out();
      reset();
      screen.appendChild(root);
      foeSpr.classList.add('intro-l');
      meSpr.classList.add('intro-r');
      await Fx.in();
      await sleep(450);
      foeSpr.classList.remove('intro-l');
      meSpr.classList.remove('intro-r');
      Input.locked = false;

      /* ---- battle loop ---- */
      let result = null;
      await say([`${RIVAL} wants to battle!`, `${RIVAL} sent out ${FOE}!`, `Go! ${PLAYER}!`]);
      while (!result) {
        const mv = await chooseMove();
        if (mv === 'run') {
          if (await msg.ask('Give up and go back to the CODEX?', ['YES', 'NO']) === 0) result = 'run';
          continue;
        }
        if (await playerTurn(mv) === 'win') { result = 'win'; break; }
        if (await foeTurn() === 'lose') {
          if (await msg.ask('Try again?', ['YES', 'NO']) === 0) {
            reset();
            await say(`Go! ${PLAYER}!`);
          } else result = 'lose';
        }
      }

      if (result === 'win') {
        msg.clear();
        const card = el('div', 'bresult', `<div class="rhead">YOU WIN!</div>
          <div class="rtext">${esc(fill(B.win || 'You win!', ex))}</div>
          <div class="rhint">A: BACK TO CODEX</div>`);
        root.appendChild(card);
        Snd.jingle();
        await new Promise(res => {
          const ctrl = Input.push({
            onKey: k => {
              if (k === 'a' || k === 'b') { Input.pop(ctrl); res(); }
              else if (k === 'select') openContact();
            }
          });
          card.addEventListener('click', e => { e.stopPropagation(); if (Input.top === ctrl) { Input.pop(ctrl); res(); } });
        });
      }

      /* ---- exit ---- */
      Input.locked = true;
      await Fx.out();
      root.remove();
      Input.pop(blocker);
      await Fx.in();
      Input.locked = false;
      this.active = false;
    }
  };

  /* ---------------- title screen ---------------- */
  function showTitle() {
    return new Promise(resolve => {
      const t = el('div', 'scene title');
      const fs = clamp(Math.floor(224 / Math.max(1, NAME.length)), 8, 16);
      t.innerHTML = `
        <div class="rays"></div><div class="stars"></div>
        <div class="logo" style="font-size:${fs}px">${esc(NAME)}</div>
        <div class="logo-sub">PORTFOLIO</div>
        <div class="edition">- POKEMON EDITION -</div>
        <div class="title-orbs"></div>
        <div class="press">PRESS START</div>
        <div class="copy">&copy; ${new Date().getFullYear()} ${esc(NAME)}</div>`;
      const orbs = t.querySelector('.title-orbs');
      ['red', 'blue', 'green'].forEach(p => orbs.appendChild(S.orb(p)));
      screen.appendChild(t);
      const ctrl = {
        start: true,
        onKey: k => { if (k === 'a' || k === 'start') { Input.pop(ctrl); Snd.confirm(); resolve(t); } }
      };
      t.addEventListener('click', () => { if (Input.top === ctrl) { Snd.init(); ctrl.onKey('a'); } });
      Input.push(ctrl);
    });
  }

  /* ---------------- quick (plain) view for skimmers ---------------- */
  function buildQuick() {
    const a = D.about || {}, c = D.contact || {};
    const email = String(c.email || '').trim();
    const projects = list(D.projects).map((p, i) => {
      const links = [];
      const live = p.battle ? '' : safeUrl(p.live), code = safeUrl(p.code);
      if (p.battle) links.push(`<a href="#" class="qv-battle" data-i="${i}">Live demo (play the battle)</a>`);
      if (live) links.push(`<a href="${esc(live)}" target="_blank" rel="noopener">Live demo</a>`);
      if (code) links.push(`<a href="${esc(code)}" target="_blank" rel="noopener">Source</a>`);
      list(p.links).forEach(l => { const u = safeUrl(l && l.url); if (u) links.push(`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(l.label || 'Link')}</a>`); });
      return `<article class="qv-card" data-i="${i}"><div class="qv-cr"></div><h3>${esc(p.name)}</h3>
        <p class="qv-types">${list(p.types).map(badge).join('')}</p>
        ${paras(list(p.description).length ? p.description : p.summary)}
        ${links.length ? `<p class="qv-links">${links.join(' · ')}</p>` : ''}</article>`;
    }).join('');
    const skills = Object.keys(D.skills || {}).map(cat => `<div class="qv-cat"><h3>${esc(cat)}</h3>` +
      list(D.skills[cat]).map(s => {
        const v = clamp(Math.round(Number(s.level) || 0), 0, 100);
        return `<div class="qv-skill"><span>${esc(s.name)}</span><span class="qv-bar"><i style="width:${v}%;background:${barColor(v)}"></i></span><span>${v}</span></div>`;
      }).join('') + '</div>').join('');
    const links = list(c.links).map(l => { const u = safeUrl(l && l.url); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(l.label || u)}</a>` : ''; }).filter(Boolean).join(' · ');
    const facts = [['Home', a.location], ['Level', a.level != null && a.level !== '' ? 'LV.' + a.level : ''], ['Likes', a.likes]]
      .filter(f => f[1]).map(f => `<li><b>${f[0]}:</b> ${esc(f[1])}</li>`).join('');
    quick.innerHTML = `
      <div class="qv">
        <header class="qv-hero">
          <div class="qv-av"></div>
          <div>
            <h1>${esc(D.name || NAME)}</h1>
            <p class="qv-title">${esc(D.title || '')}</p>
            <p class="qv-types">${list(a.types).map(badge).join('')}</p>
          </div>
        </header>
        <section><h2>About me</h2>${paras(a.bio)}${facts ? `<ul class="qv-facts">${facts}</ul>` : ''}</section>
        <section><h2>Projects</h2><div class="qv-grid">${projects || '<p>Coming soon.</p>'}</div></section>
        <section><h2>Technical skills</h2><div class="qv-skills">${skills}</div></section>
        <section><h2>Contact</h2>
          ${email ? `<p><a href="mailto:${esc(email)}">${esc(email)}</a></p>` : ''}
          ${links ? `<p>${links}</p>` : ''}
        </section>
      </div>`;
    quick.querySelectorAll('.qv-battle').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      Snd.init();
      setQuick(false);
      Battle.start(list(D.projects)[a.dataset.i]);
    }));
    quick.querySelectorAll('.qv-card').forEach(card => {
      const p = list(D.projects)[card.dataset.i];
      card.querySelector('.qv-cr').appendChild(S.creature(p.name || card.dataset.i));
    });
    S.avatar(D.photo, D.name || NAME).then(cv => quick.querySelector('.qv-av').appendChild(cv));
  }

  /* ---------------- boot ---------------- */
  async function main() {
    try {
      await Promise.race([
        Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('12px "VT323"')]),
        sleep(2500)
      ]);
    } catch (e) { /* fonts unavailable: fall back to monospace */ }
    Lab.init();
    Dex.init();
    if (location.hash === '#quick') setQuick(true);

    const title = await showTitle();
    await Fx.out();
    title.remove();
    Lab.root.hidden = false;
    Dialog.show();
    await Fx.in();
    await sleep(150);
    await Dialog.say(SC.intro);
    Choose.enter();
  }
  main();
})();
