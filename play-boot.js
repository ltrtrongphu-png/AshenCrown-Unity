(() => {
  const stage = document.querySelector('.stage');
  if (!stage) return;
  const panel = document.createElement('div');
  panel.className = 'game-boot-status';
  panel.hidden = true;
  panel.setAttribute('role', 'alert');
  panel.setAttribute('aria-live', 'assertive');
  panel.innerHTML = '<div class="game-boot-card"><span class="game-boot-kicker">ASHEN CROWN · GAME ENGINE</span><h2>Could not start the 3D game</h2><p id="gameBootMessage"></p><div class="game-boot-actions"><button type="button" id="gameBootReload">Reload game</button><a href="./">Back to website</a></div></div>';
  stage.appendChild(panel);
  const message = panel.querySelector('#gameBootMessage');
  let ready = false;
  let timeoutId = 0;
  function showFailure(detail) {
    if (ready) return;
    message.textContent = detail || 'The 3D engine did not finish starting. Refresh the page. If the play area remains blank, make sure WebGL / hardware acceleration is enabled and that cdn.jsdelivr.net is reachable.';
    panel.hidden = false;
    console.error('[Ashen Crown] Game startup did not complete.');
  }
  window.addEventListener('ashen:game-ready', () => {
    ready = true;
    if (timeoutId) clearTimeout(timeoutId);
    panel.hidden = true;
  }, { once: true });
  window.addEventListener('error', event => {
    const target = event.target;
    const failedGameScript = target instanceof HTMLScriptElement && /(?:play\.js|three\.module\.js)/i.test(target.src || '');
    const gameStack = event.error?.stack && /play\.js|three\.module\.js/i.test(event.error.stack);
    if (!ready && (failedGameScript || gameStack)) {
      showFailure('The game engine script failed to load or initialize. Check your connection, reload, and allow the 3D engine CDN (cdn.jsdelivr.net).');
    }
  }, true);
  window.addEventListener('unhandledrejection', event => {
    const stack = event.reason?.stack || '';
    const text = String(event.reason?.message || event.reason || '');
    if (!ready && /play\.js|three|webgl|shader|renderer/i.test(stack + ' ' + text)) {
      showFailure('The 3D game reported an initialization error. Refresh the page. If it repeats, open the browser console and send the first red error message.');
    }
  });
  panel.querySelector('#gameBootReload').addEventListener('click', () => location.reload());
  timeoutId = setTimeout(() => {
    if (!ready) showFailure();
  }, 12000);
})();
