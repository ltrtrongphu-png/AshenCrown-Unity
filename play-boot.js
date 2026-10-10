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
    message.textContent = detail || 'The 3D engine did not finish starting. Refresh the page. If the play area remains blank, make sure WebGL 2 / hardware acceleration is enabled and at least one configured 3D engine CDN is reachable.';
    panel.hidden = false;
    console.error('[Ashen Crown] Game startup did not complete:', detail || 'no diagnostic available');
  }
  window.addEventListener('ashen:game-init-error', event => {
    const d = event.detail || {};
    const diagnostic = d.diagnostic ? '\n\nDetails: ' + d.diagnostic : '';
    showFailure((d.message || 'The game engine could not initialize.') + diagnostic);
  });
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
      const raw = String(event.message || 'The browser could not load or execute the game engine script.');
      const source = event.filename ? '\n\nFile: ' + event.filename + ':' + (event.lineno || 0) + ':' + (event.colno || 0) : '';
      const guidance = /webgl|context/i.test(raw)
        ? '\n\nTry enabling Chrome hardware acceleration and confirm WebGL 2 is available.'
        : '\n\nCheck the network and whether the configured 3D engine CDNs are blocked.';
      showFailure(raw + source + guidance);
    }
  }, true);
  window.addEventListener('unhandledrejection', event => {
    const stack = event.reason?.stack || '';
    const text = String(event.reason?.message || event.reason || '');
    if (!ready && /play\.js|three|webgl|shader|renderer/i.test(stack + ' ' + text)) {
      showFailure(text + (stack ? '\n\n' + stack.split('\n').slice(0, 4).join('\n') : '') +
        '\n\nIf the message mentions WebGL, enable Chrome hardware acceleration. If it mentions fetch or a CDN, check that the network allows the fallback 3D engine hosts.');
    }
  });
  panel.querySelector('#gameBootReload').addEventListener('click', () => location.reload());
  timeoutId = setTimeout(() => {
    if (!ready) showFailure();
  }, 12000);
})();
