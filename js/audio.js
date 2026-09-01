export function createAudio() {
  let ctx = null;
  function init() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function tone(freq, dur, type = 'square', vol = 0.07, delay = 0) {
    if (!ctx) return;
    try {
      const t = ctx.currentTime + delay;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur);
    } catch (_) {}
  }
  const play = {
    jump() { tone(500, 0.08); tone(700, 0.06, 'square', 0.06, 0.04); },
    coin() { tone(988, 0.06); tone(1319, 0.1, 'square', 0.06, 0.06); },
    stomp() { tone(250, 0.12, 'square', 0.07); },
    power() { [523, 659, 784].forEach((f, i) => tone(f, 0.07, 'square', 0.06, i * 0.07)); },
    death() { [400, 300, 200].forEach((f, i) => tone(f, 0.12, 'square', 0.08, i * 0.12)); },
    block() { tone(180, 0.05, 'square', 0.04); },
    fire() { tone(900, 0.04); tone(1300, 0.04, 'square', 0.04, 0.02); },
    flag() { [523, 587, 659, 784, 880, 988, 1175].forEach((f, i) => tone(f, 0.1, 'square', 0.06, i * 0.06)); },
    '1up'() { [523, 659, 784].forEach((f, i) => tone(f, 0.08, 'square', 0.06, i * 0.08)); },
  };
  return {
    init,
    event(name) { (play[name] || (() => {}))(); },
  };
}
