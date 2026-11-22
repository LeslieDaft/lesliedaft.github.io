(() => {
  let context, score, ticker, step = 0;
  let enabled = false;
  let scene = 'field';
  const tracks = {
    field: { beat: .26, notes: [69,72,76,-1,74,72,67,64,65,69,72,-1,71,67,64,-1], bass: [45,48,41,43] },
    battle: { beat: .155, notes: [64,64,71,67,64,-1,74,71,62,62,69,65,62,60,67,-1], bass: [40,40,38,36] },
    last: { beat: .31, notes: [52,-1,-1,55,53,-1,-1,-1,50,-1,-1,56,55,-1,-1,-1], bass: [28,28,26,27] },
    title: { beat: .32, notes: [64,69,71,72,-1,67,64,-1,62,65,69,71,-1,64,62,-1], bass: [45,48,41,43] }
  };
  function tone(note, length, volume, type, at = context.currentTime, bus = score) {
    if (note < 0) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.exponentialRampToValueAtTime(volume, at + .015);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + length);
    oscillator.connect(envelope).connect(bus);
    oscillator.start(at);
    oscillator.stop(at + length + .02);
  }
  function tick() {
    const track = tracks[scene];
    tone(track.notes[step], track.beat * 1.7, .15, 'triangle');
    if (step % 4 === 0) tone(track.bass[step / 4], track.beat * 3.8, .12, 'sine');
    if (scene === 'last' && step % 8 === 0) tone(29, .7, .24, 'sine');
    step = (step + 1) % track.notes.length;
    ticker = setTimeout(tick, track.beat * 1000);
  }
  window.MissingCenturySound = {
    toggle() {
      if (!window.AudioContext && !window.webkitAudioContext) return false;
      if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        score = context.createGain();
        score.gain.value = .24;
        score.connect(context.destination);
      }
      enabled = !enabled;
      clearTimeout(ticker);
      if (enabled) { context.resume().catch(() => {}); tick(); }
      else context.suspend().catch(() => {});
      return enabled;
    },
    scene(value) {
      if (value === scene) return;
      scene = value;
      step = 0;
      clearTimeout(ticker);
      if (enabled) tick();
    },
    sfx(name) {
      if (!enabled) return;
      const notes = { talk:[72], select:[76], relic:[64,69,76], hit:[41,38], heal:[60,69,72], guard:[48,55], victory:[60,64,67,72], loss:[60,55,48], phase:[34,29,28], error:[47,43] };
      (notes[name] || notes.select).forEach((note, i) => tone(note,.15,.16,'triangle',context.currentTime + i * .065));
    }
  };
})();
