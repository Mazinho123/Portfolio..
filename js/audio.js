/* Tiny 8-bit sound effects made with the Web Audio API. No audio files needed. */
window.Sound = (() => {
  'use strict';
  let ctx = null, master = null, muted = false;
  try { muted = localStorage.getItem('codeorb-muted') === '1'; } catch (e) { /* storage blocked */ }

  function init() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.16;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { /* audio unavailable */ }
  }

  function tone(freq, dur, o = {}) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(o.vol == null ? 0.3 : o.vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  const N = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, E6: 1318.5 };

  return {
    init,
    isMuted: () => muted,
    setMuted(m) {
      muted = !!m;
      try { localStorage.setItem('codeorb-muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
    },
    text: () => tone(1250, 0.03, { vol: 0.1 }),
    move: () => tone(1046, 0.05, { vol: 0.2 }),
    confirm: () => { tone(988, 0.06, { vol: 0.25 }); tone(1319, 0.09, { vol: 0.25, at: 0.06 }); },
    back: () => { tone(784, 0.06, { vol: 0.22 }); tone(523, 0.08, { vol: 0.22, at: 0.06 }); },
    shake: () => tone(180, 0.08, { type: 'triangle', vol: 0.5 }),
    attack: () => tone(260, 0.12, { to: 780, vol: 0.2 }),
    hit: () => tone(140, 0.18, { type: 'sawtooth', to: 50, vol: 0.35 }),
    faint: () => tone(660, 0.6, { to: 90, vol: 0.25 }),
    open: () => { tone(220, 0.4, { to: 1760, vol: 0.22 }); tone(440, 0.4, { to: 3520, type: 'triangle', vol: 0.14 }); },
    jingle: () => {
      [[N.C5, 0], [N.E5, 0.09], [N.G5, 0.18]].forEach(([f, a]) => tone(f, 0.09, { at: a, vol: 0.2 }));
      tone(N.C6, 0.32, { at: 0.27, vol: 0.2 });
      tone(N.E6, 0.32, { at: 0.27, vol: 0.08, type: 'triangle' });
    }
  };
})();
