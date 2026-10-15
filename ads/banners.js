/* Manual banners only: one request per slot, never refresh on a timer. */
(() => {
  'use strict';
  const requested = new WeakSet();
  function privacyLink() {
    const existing = [...document.querySelectorAll('a[href]')].find(a => /(?:^|\/)privacy\.html(?:[?#]|$)/.test(a.getAttribute('href')));
    if (existing) { existing.textContent = 'Privacy Policy'; return; }
    const footer = document.createElement('footer');
    footer.style.cssText = 'text-align:center;padding:16px;font:12px Arial,sans-serif';
    const link = document.createElement('a');
    link.href = '/privacy.html'; link.textContent = 'Privacy Policy'; link.style.color = '#a3ada8';
    footer.append(link); document.body.append(footer);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', privacyLink, {once:true});
  else privacyLink();
  function requestBanners() {
    // Queue in DOM order, as required by the AdSense push API.
    document.querySelectorAll('ins.daft-banner').forEach(slot => {
      if (requested.has(slot) || !slot.clientWidth || !slot.clientHeight) return;
      requested.add(slot);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
      catch (error) { console.warn('Banner could not be loaded.', error); }
    });
  }
  requestBanners();
  // Hidden narrow-screen slots are requested only if they later become visible.
  window.addEventListener('resize', requestBanners, {passive:true});
})();
