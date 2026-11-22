(() => {
  const chapters = window.CHAPTERS;
  const art = window.MissingCenturyArt;
  const sound = window.MissingCenturySound;
  const byId = (id) => document.getElementById(id);
  const hub = byId('hub');
  const play = byId('play');
  const world = byId('world');
  const overlay = byId('overlay');
  const battleRoot = byId('battle');
  const saveName = 'daft-arcade:missing-century:v1';
  const roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
  const moves = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
  const keys = {
    ArrowUp:'up', w:'up', ArrowDown:'down', s:'down',
    ArrowLeft:'left', a:'left', ArrowRight:'right', d:'right'
  };
  const solid = new Set(['#','~','^','+']);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let data = readSave();
  let gameIndex = -1;
  let mode = 'hub';
  let field;
  let dialogue;
  let battle;
  let touchTimer;
  let movingLast = 0;

  function readSave() {
    try {
      const saved = JSON.parse(localStorage.getItem(saveName));
      if (saved && Array.isArray(saved.complete) && saved.fields && typeof saved.fields === 'object') return saved;
    } catch {}
    return {complete:[], fields:{}, keepsakes:{}};
  }

  function save() {
    try { localStorage.setItem(saveName, JSON.stringify(data)); } catch {}
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function button(text, action, className) {
    const node = element('button', text, className);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }

  function showHub() {
    gameIndex = -1;
    mode = 'hub';
    play.hidden = true;
    hub.hidden = false;
    byId('series-menu').hidden = true;
    sound.scene('title');
    document.title = 'The Missing Century · Daft Arcade';
    const list = byId('chapters');
    list.replaceChildren(...chapters.map((chapter, i) => {
      const cleared = data.complete.includes(i);
      const available = i === 0 || data.complete.includes(i - 1) || data.fields[i];
      const card = element('a', '', 'chapter-card');
      card.href = '?game=' + (i + 1);
      card.dataset.theme = chapter.theme;
      const glyph = ['✦','≋','◈','❧','♜','◇','☼','✧','◉','✶'][i];
      const thumbnail = document.createElement('canvas');
      thumbnail.width = 96;
      thumbnail.height = 56;
      thumbnail.setAttribute('aria-hidden', 'true');
      if (art.thumbnail) art.thumbnail(thumbnail, chapter.theme, i);
      else {
        const map = chapter.maps[0];
        const y = map.tiles.findIndex(row => row.includes('@'));
        art.render(thumbnail,{map,theme:chapter.theme,player:{x:map.tiles[y].indexOf('@'),y,facing:'down'},actors:map.actors,time:0});
      }
      const number = element('span', roman[i], 'chapter-number');
      number.dataset.glyph = glyph;
      card.append(thumbnail, number,
        element('h3', chapter.title), element('p', chapter.tagline),
        element('span', cleared ? 'Completed' : data.fields[i] ? 'Continue' : available ? 'Play' : 'Memory quiz', 'chapter-status'));
      card.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(i);
      });
      return card;
    }));
    byId('series-progress').textContent = data.complete.length + ' of 10 completed';
    const next = chapters.findIndex((_, i) => !data.complete.includes(i));
    const current = next < 0 ? 0 : next;
    byId('begin').textContent = data.fields[current] ? 'Continue Game ' + (current + 1) : 'Begin Game ' + (current + 1);
    byId('begin').onclick = () => navigate(current);
  }

  function navigate(index) {
    const url = new URL(location.href);
    url.hash = '';
    if (index < 0) url.searchParams.delete('game');
    else url.searchParams.set('game', index + 1);
    history.pushState({}, '', url);
    openCurrent();
  }

  function openCurrent() {
    if (battle) battle.destroy();
    battle = null;
    battleRoot.hidden = true;
    clearOverlay();
    endTouchMove();
    const requested = new URLSearchParams(location.search).get('game');
    const index = requested === null ? -1 : Number(requested) - 1;
    if (!Number.isInteger(index) || !chapters[index]) {
      showHub();
      return;
    }
    gameIndex = index;
    document.title = chapters[index].title + ' · The Missing Century';
    hub.hidden = true;
    play.hidden = false;
    byId('series-menu').hidden = false;
    world.hidden = false;
    byId('chapter-no').textContent = 'The Missing Century / Game ' + roman[index];
    byId('game-title').textContent = chapters[index].title;
    sound.scene('field');
    window.scrollTo(0, 0);

    if (data.fields[index]) {
      field = structuredClone(data.fields[index]);
      if (field.ending) showEnding();
      else enterField();
    } else {
      field = {map:0, x:0, y:0, facing:'down', flags:[], defeated:[], seen:[], items:[]};
      placeAtStart();
      updateField();
      if (index > 0) showQuiz();
      else startStory();
    }
  }

  function chapter() { return chapters[gameIndex]; }
  function map() { return chapter().maps[field.map]; }
  function actorId(actor) { return field.map + ':' + actor.x + ':' + actor.y; }
  function actors() { return map().actors.filter(actor => !field.defeated.includes(actorId(actor))); }

  function placeAtStart() {
    const y = map().tiles.findIndex(row => row.includes('@'));
    field.x = map().tiles[y].indexOf('@');
    field.y = y;
    field.facing = 'down';
  }

  function checkpoint() {
    data.fields[gameIndex] = structuredClone(field);
    save();
  }

  function startStory() {
    showDialogue(chapter().intro, () => {
      checkpoint();
      enterField();
    });
  }

  function draw(time) {
    if (mode === 'hub') art.cover(byId('cover'), time);
    else if (field && mode !== 'battle') {
      art.render(world, {
        map:map(), theme:map().theme || chapter().theme,
        player:{x:field.x,y:field.y,facing:field.facing},
        actors:actors().map(actor=>({...actor, done:field.flags.includes(actor.key)})), time
      });
    }
  }

  let lastDraw = -Infinity;
  function frame(milliseconds) {
    if (milliseconds - lastDraw > (reducedMotion.matches ? 180 : 39)) {
      draw(reducedMotion.matches ? 0 : milliseconds / 1000);
      lastDraw = milliseconds;
    }
    requestAnimationFrame(frame);
  }

  function clearOverlay() {
    overlay.hidden = true;
    overlay.replaceChildren();
  }

  function setOverlay(panel, focusTarget = panel.querySelector('button')) {
    overlay.replaceChildren(panel);
    overlay.hidden = false;
    focusTarget?.focus({preventScroll:true});
  }

  function setMode(next) {
    mode = next;
    if (next !== 'field') endTouchMove();
    byId('pause').disabled = !['field','pause'].includes(next);
    byId('interact').disabled = !['field','dialogue'].includes(next);
    document.querySelectorAll('[data-move]').forEach(node => { node.disabled = next !== 'field'; });
  }

  function updateField() {
    byId('area').textContent = map().name;
    const goal = map().objectives?.find(entry => !field.flags.includes(entry.until));
    byId('objective').textContent = goal?.text || map().objective || 'Find a way forward.';
    const nearest = inReach();
    const label = nearest && mode === 'field' ? nearest.name : '';
    if (byId('nearby').textContent !== label) byId('nearby').textContent = label;
    world.setAttribute('aria-label', map().name + ', position ' + (field.x + 1) + ', ' + (field.y + 1));
  }

  function enterField() {
    clearOverlay();
    setMode('field');
    updateField();
    world.tabIndex = -1;
    world.focus({preventScroll:true});
  }

  function normalizeAnswer(value) {
    return String(value || '').toLowerCase().trim().replace(/^(?:the|an?)\s+/, '')
      .replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, ' ');
  }

  function showQuiz() {
    setMode('quiz');
    const panel = element('section', '', 'quiz-panel panel');
    panel.append(element('p', 'The Recordkeeper', 'eyebrow'), element('h2', 'What do you remember?'),
      element('p', 'Answer all three questions about Game ' + roman[gameIndex - 1] + ' to open this adventure.'));
    const form = document.createElement('form');
    chapter().quiz.forEach(({question, options, answers}, questionIndex) => {
      const group = document.createElement('fieldset');
      group.append(element('legend', question));
      if (answers) {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'question-' + questionIndex;
        input.setAttribute('aria-label', question);
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.maxLength = 80;
        input.required = true;
        group.append(input);
        form.append(group);
        return;
      }
      const choices = element('div', '', 'choices');
      const order = options.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      order.forEach(index => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'question-' + questionIndex;
        input.value = index;
        input.required = true;
        label.append(input, element('span', options[index]));
        choices.append(label);
      });
      group.append(choices);
      form.append(group);
    });
    const response = element('p', '', 'quiz-response');
    response.setAttribute('role', 'status');
    const submit = element('button', 'Check answers', 'primary');
    submit.type = 'submit';
    const actions = element('div', '', 'panel-actions');
    actions.append(submit, button('Play Game ' + roman[gameIndex - 1], () => navigate(gameIndex - 1)),
      button('Series menu', () => navigate(-1)));
    form.append(response, actions);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const selections = new FormData(form);
      const passed = chapter().quiz.every(({answer, answers}, i) => {
        const selection = selections.get('question-' + i);
        return answers ? answers.some(value => normalizeAnswer(value) === normalizeAnswer(selection))
          : selection === String(answer);
      });
      if (passed) { sound.sfx('relic'); startStory(); }
      else {
        sound.sfx('error');
        response.textContent = 'The record is still incomplete. Look over your answers and try again.';
      }
    });
    panel.append(form);
    panel.tabIndex = -1;
    setOverlay(panel, panel);
  }

  function showDialogue(lines, after) {
    if (!Array.isArray(lines) || !lines.length) { after(); return; }
    dialogue = {lines, after, index:0};
    setMode('dialogue');
    drawDialogue();
  }

  const portraitMask = [
    '................', '.....hhhhhh.....', '....hhhhhhhh....', '...hhhHHhhhhh...',
    '...hhHHhhhHhh...', '...hhsssssshh...', '...hsspspsssh...', '...hsSpspsSsh...',
    '....ssssssss....', '.....ssmsss.....', '....ccsssscc....', '...cccssssccc...',
    '..ccccffffcccc..', '..cccffCfffccc..', '..ccccfffccccc..', '..cccccccccccc..'
  ];
  const castPaint = {
    ari: ['#482c41','#a04e46','#df7756','#ffcf79'],
    mira: ['#262b50','#625d98','#4a87aa','#94d9dc'],
    bram: ['#462b36','#9f6141','#698454','#c5d17a']
  };

  function drawPortrait(speaker) {
    const name = speaker.toLowerCase();
    const portrait = element('div', speaker === 'Story' ? '✦' : speaker.slice(0,1), 'portrait');
    portrait.dataset.speaker = name;
    portrait.setAttribute('aria-hidden', 'true');
    if (!castPaint[name]) return portrait;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const context = canvas.getContext('2d');
    const [h,H,c,f] = castPaint[name];
    const colors = {h,H,c,f,C:'#fff0b7',s:'#eeb587',S:'#c67b6d',p:'#231e2d',m:'#943f49'};
    portraitMask.forEach((row,y)=>[...row].forEach((pixel,x)=>{
      if (!colors[pixel]) return;
      context.fillStyle = colors[pixel];
      context.fillRect(x,y,1,1);
    }));
    canvas.style.cssText = 'width:100%;height:100%;image-rendering:pixelated';
    portrait.replaceChildren(canvas);
    return portrait;
  }

  function drawDialogue() {
    const {speaker, text} = dialogue.lines[dialogue.index];
    const panel = element('section', '', 'dialogue panel');
    panel.setAttribute('aria-live', 'polite');
    const portrait = drawPortrait(speaker);
    const copy = element('div', '', 'dialogue-copy');
    copy.append(element('p', speaker, 'eyebrow'), element('p', text, 'dialogue-text'));
    const next = button('Continue', advanceDialogue, 'primary');
    panel.append(portrait, copy, next);
    setOverlay(panel, next);
  }

  function advanceDialogue() {
    sound.sfx('talk');
    dialogue.index++;
    if (dialogue.index < dialogue.lines.length) { drawDialogue(); return; }
    const after = dialogue.after;
    dialogue = null;
    after();
  }

  function inReach() {
    const [dx,dy] = moves[field.facing];
    const nearby = actors().filter(actor => Math.abs(actor.x - field.x) + Math.abs(actor.y - field.y) <= 1);
    return nearby.find(actor => actor.x === field.x + dx && actor.y === field.y + dy) || nearby[0];
  }

  function walk(direction) {
    if (mode !== 'field') return;
    const [dx,dy] = moves[direction];
    const x = field.x + dx;
    const y = field.y + dy;
    const target = map().tiles[y]?.[x];
    const blocker = actors().find(actor => actor.x === x && actor.y === y);
    field.facing = direction;
    if (target && !solid.has(target) && !blocker) {
      field.x = x;
      field.y = y;
    }
    updateField();
  }

  function act() {
    if (mode === 'dialogue') { advanceDialogue(); return; }
    if (mode !== 'field') return;
    const actor = inReach();
    if (!actor) return;
    if (actor.requires?.some(key => !field.flags.includes(key))) {
      sound.sfx('error');
      showDialogue([{speaker:actor.name,text:actor.blocked || 'Something nearby must be put right first.'}], enterField);
      return;
    }
    if (actor.kind === 'enemy' || actor.kind === 'boss') {
      const alreadySeen = field.seen.includes(actorId(actor));
      showDialogue(alreadySeen ? [] : actor.lines, () => {
        if (!alreadySeen) field.seen.push(actorId(actor));
        startBattle(actor);
      });
      return;
    }
    const obtained = actor.key && field.flags.includes(actor.key);
    if (obtained && ['relic','chest'].includes(actor.kind)) {
      showDialogue([{speaker:actor.name,text:'You already collected this.'}], enterField);
      return;
    }
    sound.sfx(actor.kind === 'relic' || actor.kind === 'chest' ? 'relic' : 'talk');
    showDialogue(obtained ? actor.repeat || actor.lines : actor.lines, () => {
      collect(actor);
      if (actor.kind === 'gate' && Number.isInteger(actor.next)) {
        field.map = actor.next;
        placeAtStart();
      }
      checkpoint();
      enterField();
    });
  }

  function collect(actor) {
    if (actor.key && !field.flags.includes(actor.key)) field.flags.push(actor.key);
    if (actor.kind === 'chest' && !field.items.includes(actor.name)) field.items.push(actor.name);
  }

  function startBattle(actor) {
    checkpoint();
    setMode('battle');
    clearOverlay();
    world.hidden = true;
    battleRoot.hidden = false;
    sound.scene(gameIndex === 9 && actor.kind === 'boss' ? 'last' : 'battle');
    battle = window.MissingCenturyBattle.start(battleRoot, {
      chapter:gameIndex + 1, enemy:{name:actor.name, ...actor.foe, boss:actor.kind === 'boss'},
      bonus:field.items.length + (gameIndex === 9 ? Math.min(2, Object.values(data.keepsakes || {}).filter(Boolean).length) : 0),
      sfx: name => sound.sfx(name),
      onFinish(won) {
        battle?.destroy();
        battle = null;
        world.hidden = false;
        battleRoot.hidden = true;
        sound.scene('field');
        if (!won) { showDefeat(actor); return; }
        if (actor.kind === 'boss') { completeChapter(); return; }
        field.defeated.push(actorId(actor));
        collect(actor);
        checkpoint();
        if (actor.after) showDialogue(actor.after, enterField);
        else enterField();
      }
    });
  }

  function showDefeat(actor) {
    setMode('defeat');
    const panel = element('section', '', 'pause-panel panel');
    panel.append(element('h2', 'The party fell.'), element('p', 'Try again with full health or return to the field.'));
    const actions = element('div', '', 'panel-actions');
    actions.append(button('Retry battle', () => startBattle(actor), 'primary'), button('Return to field', enterField));
    panel.append(actions);
    setOverlay(panel);
  }

  function completeChapter() {
    // Persist the ending handoff before the player reads it.
    field.ending = true;
    checkpoint();
    showEnding();
  }

  function showEnding() {
    showDialogue(chapter().ending, () => {
      if (!data.complete.includes(gameIndex)) data.complete.push(gameIndex);
      data.keepsakes ||= {};
      data.keepsakes[gameIndex] ||= field.items.length;
      delete data.fields[gameIndex];
      save();
      sound.sfx('victory');
      setMode('ending');
      const isFinal = gameIndex === chapters.length - 1;
      const panel = element('section', '', 'ending-panel panel');
      panel.append(element('p', isFinal ? 'Series complete' : 'Game ' + roman[gameIndex] + ' complete', 'eyebrow'),
        element('h2', isFinal ? 'The century returns.' : chapter().title));
      const actions = element('div', '', 'panel-actions');
      if (!isFinal) actions.append(button('Begin Game ' + roman[gameIndex + 1], () => navigate(gameIndex + 1), 'primary'));
      actions.append(button('Series menu', () => navigate(-1), isFinal ? 'primary' : ''));
      panel.append(actions);
      setOverlay(panel);
    });
  }

  function togglePause() {
    if (mode === 'pause') { enterField(); return; }
    if (mode !== 'field') return;
    setMode('pause');
    checkpoint();
    const panel = element('section', '', 'pause-panel panel');
    panel.append(element('p', map().name, 'eyebrow'), element('h2', 'Paused'),
      element('p', field.items.length ? 'Battle supplies: ' + field.items.join(', ') : 'Progress saved in this browser.'));
    const actions = element('div', '', 'panel-actions');
    actions.append(button('Resume', enterField, 'primary'), button('Series menu', () => navigate(-1)));
    panel.append(actions);
    setOverlay(panel);
  }

  function endTouchMove() {
    clearInterval(touchTimer);
    touchTimer = null;
  }

  document.querySelectorAll('[data-move]').forEach(node => {
    node.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      node.setPointerCapture(event.pointerId);
      endTouchMove();
      walk(node.dataset.move);
      touchTimer = setInterval(() => walk(node.dataset.move), 125);
    });
    for (const name of ['pointerup','pointercancel','lostpointercapture']) node.addEventListener(name, endTouchMove);
    node.addEventListener('click', event => { if (event.detail === 0) walk(node.dataset.move); });
  });

  window.addEventListener('blur', endTouchMove);
  window.addEventListener('popstate', openCurrent);
  byId('series-menu').addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (mode === 'field') checkpoint();
    navigate(-1);
  });
  byId('pause').addEventListener('click', togglePause);
  byId('interact').addEventListener('click', act);
  byId('sound').addEventListener('click', event => {
    const enabled = sound.toggle();
    event.currentTarget.textContent = enabled ? 'Sound on' : 'Sound off';
    event.currentTarget.setAttribute('aria-pressed', String(enabled));
  });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === 'Escape' && ['field','pause'].includes(mode)) {
      event.preventDefault();
      if (!event.repeat) togglePause();
      return;
    }
    if (mode === 'field' && keys[key]) {
      event.preventDefault();
      const now = performance.now();
      if (!event.repeat || now - movingLast >= 82) {
        walk(keys[key]);
        movingLast = now;
      }
    }
    const buttonKey = (key === ' ' || key === 'Enter') && event.target instanceof HTMLButtonElement;
    if (['field','dialogue'].includes(mode) && !buttonKey && ['e',' ','Enter'].includes(key)) {
      event.preventDefault();
      if (!event.repeat) act();
    }
  });

  openCurrent();
  requestAnimationFrame(frame);
})();
