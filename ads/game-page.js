(() => {
  const frame = document.getElementById('arcade-game');
  frame.addEventListener('load', () => {
    const touch = navigator.maxTouchPoints > 0 || matchMedia('(any-pointer: coarse)').matches;
    if (touch) {
      // Keep the game in view after its own Start button is tapped.
      frame.contentDocument.addEventListener('click', event => {
        const button = event.target.closest('button');
        const launchIds=['start','resume','begin','unpause','playAgain','freeBtn','campaignBtn','resumeBtn','enter','play-solo','play-public','create-private','join-private','start-room','resume-match','practice-btn','editor-btn'];
        if (button && (launchIds.includes(button.id) || /start|play|begin|take flight|resume|accept the dare|continue week|free roam/i.test(button.textContent))) frame.scrollIntoView({block:'start',behavior:'instant'});
      }, true);
    }
    // Arcade and tool links navigate the whole page, avoiding nested ads/game frames.
    frame.contentDocument.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link || link.hasAttribute('download')) return;
      const href = link.getAttribute('href');
      if (href.startsWith('#') || href.startsWith('javascript:')) return;
      const destination = new URL(href, frame.contentDocument.baseURI);
      if (destination.origin === location.origin && !link.target) link.target = '_top';
    }, true);
  });
  const fullscreen = document.getElementById('fullscreen-game');
  function focusGame() { frame.scrollIntoView({block:'start'}); frame.contentWindow.focus(); }
  document.getElementById('focus-game').addEventListener('click', focusGame);
  fullscreen.addEventListener('click', async () => {
    try { await frame.requestFullscreen(); frame.contentWindow.focus(); }
    catch { focusGame(); }
  });
  if (!document.fullscreenEnabled) fullscreen.hidden = true;
  // Game assets and storage stay on their original origin and in their original directory.
  if (location.search || location.hash) {
    const source = new URL(frame.getAttribute('src'), location.href);
    for (const [key,value] of new URLSearchParams(location.search)) source.searchParams.set(key,value);
    if (location.hash) source.hash = location.hash;
    frame.src = source.href;
  }
})();
