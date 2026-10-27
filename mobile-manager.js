(() => {
  'use strict';
  const stage = document.querySelector('.stage');
  if (!stage) return;

  const dock = document.createElement('nav');
  dock.id = 'mobileCommandDock';
  dock.className = 'mobile-command-dock';
  dock.setAttribute('aria-label', 'Mobile game controls');

  const overlay = document.createElement('div');
  overlay.id = 'mobileManagerOverlay';
  overlay.className = 'mobile-manager-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="mobile-manager-panel" role="dialog" aria-modal="true" aria-labelledby="mobileManagerTitle">
      <header class="mobile-manager-head">
        <div><span class="mobile-manager-kicker">ASHEN CROWN · MOBILE</span><h2 id="mobileManagerTitle">Field manager</h2></div>
        <button type="button" id="mobileManagerClose" aria-label="Close field manager">×</button>
      </header>
      <div class="mobile-manager-status-grid">
        <article><span>VERSION</span><b id="mobileManagerVersion">Checking…</b><small id="mobileManagerNetwork">NETWORK · CHECKING</small></article>
        <article><span>LOCAL SAVE</span><b id="mobileManagerSave">Checking…</b><small id="mobileManagerCloud">CLOUD · NOT SYNCED</small></article>
        <article><span>JOURNEY</span><b id="mobileManagerChapter">CHAPTER 01</b><small id="mobileManagerProgress">QUEST · 1 / 1</small></article>
      </div>
      <div class="mobile-manager-section-title">QUICK MANAGEMENT</div>
      <div class="mobile-manager-action-grid">
        <button type="button" data-mobile-command="inventory"><span>✦</span><b>Inventory</b><small>Gear & equipment</small></button>
        <button type="button" data-mobile-command="map"><span>⌖</span><b>World map</b><small>Journey locations</small></button>
        <button type="button" data-mobile-command="journal"><span>▤</span><b>Journal</b><small>Story & people</small></button>
        <button type="button" data-mobile-command="archive"><span>◈</span><b>Archive</b><small>Collection & goals</small></button>
        <button type="button" data-mobile-command="base"><span>⌂</span><b>Sanctuary</b><small>Travel & upgrades</small></button>
        <button type="button" data-mobile-command="role"><span>⚔</span><b>Combat role</b><small>Skills & appearance</small></button>
        <button type="button" data-mobile-command="settings"><span>⚙</span><b>Settings</b><small>Quality & controls</small></button>
        <button type="button" data-mobile-command="help"><span>?</span><b>Help</b><small>How to play</small></button>
      </div>
      <div class="mobile-manager-section-title">SAVE & APP</div>
      <div class="mobile-manager-app-actions">
        <button type="button" id="mobileExportSave">Export save</button>
        <button type="button" id="mobileImportSave">Import save</button>
        <button type="button" id="mobileCheckUpdates">Check updates</button>
        <button type="button" id="mobileInstallApp" hidden>Install app</button>
      </div>
      <div class="mobile-manager-preferences">
        <div><b>Automatic updates</b><small id="mobileAutoUpdateDescription">New versions apply when it is safe to refresh.</small></div>
        <button type="button" id="mobileAutoUpdateToggle" aria-pressed="true">ON</button>
      </div>
      <p id="mobileManagerFeedback" class="mobile-manager-feedback" role="status" aria-live="polite">Your local save stays on this device. Cloud backup requires sign-in.</p>
    </section>`;
  stage.append(dock, overlay);

  const dockActions = [
    { id: 'mobileDockMenu', label: 'MANAGE', icon: '☰', command: 'manager' },
    { id: 'mobileDockBag', label: 'BAG', icon: '✦', command: 'inventory' },
    { id: 'mobileDockMap', label: 'MAP', icon: '⌖', command: 'map' },
    { id: 'mobileDockJournal', label: 'JOURNAL', icon: '▤', command: 'journal' },
    { id: 'mobileDockPause', label: 'PAUSE', icon: 'Ⅱ', command: 'pause' }
  ];
  for (const action of dockActions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = action.id;
    button.dataset.mobileCommand = action.command;
    button.setAttribute('aria-label', action.label === 'MANAGE' ? 'Open mobile field manager' : action.label);
    const icon = document.createElement('span');
    icon.className = 'mobile-dock-icon';
    icon.textContent = action.icon;
    const label = document.createElement('small');
    label.textContent = action.label;
    button.append(icon, label);
    dock.appendChild(button);
  }

  const byId = id => document.getElementById(id);
  const on = (element, type, listener) => element?.addEventListener(type, listener);
  const commandButtons = overlay.querySelectorAll('[data-mobile-command]');
  let lastFocus = null;
  let refreshTimer = 0;

  function closeManager() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove('mobile-manager-open');
    dock.querySelector('#mobileDockMenu')?.setAttribute('aria-expanded', 'false');
    lastFocus?.focus?.();
  }

  function openManager() {
    if (!overlay.hidden) return;
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('mobile-manager-open');
    dock.querySelector('#mobileDockMenu')?.setAttribute('aria-expanded', 'true');
    refreshStatus();
    byId('mobileManagerClose')?.focus();
  }

  function dispatchKey(code, key) {
    closeManager();
    const eventInit = { key, code, bubbles: true, cancelable: true };
    window.dispatchEvent(new KeyboardEvent('keydown', eventInit));
    window.dispatchEvent(new KeyboardEvent('keyup', eventInit));
  }

  function runCommand(command) {
    switch (command) {
      case 'manager':
        openManager();
        return;
      case 'inventory':
        dispatchKey('KeyE', 'e');
        return;
      case 'map':
        dispatchKey('KeyM', 'm');
        return;
      case 'journal':
        dispatchKey('KeyJ', 'j');
        return;
      case 'archive':
        dispatchKey('KeyK', 'k');
        return;
      case 'base':
        dispatchKey('KeyB', 'b');
        return;
      case 'role':
        dispatchKey('KeyC', 'c');
        return;
      case 'settings':
        dispatchKey('KeyO', 'o');
        return;
      case 'help':
        dispatchKey('Slash', '?');
        return;
      case 'pause':
        dispatchKey('Escape', 'Escape');
        return;
    }
  }

  function updateStatusPill(element, value, kind = '') {
    if (!element) return;
    element.textContent = value;
    if (kind) element.dataset.state = kind;
  }

  function refreshStatus() {
    const updater = window.AshenAppUpdater;
    const updateState = updater?.getState?.() || {};
    const save = byId('saveStatus');
    const chapter = byId('chapterNumber');
    const progress = byId('questCount');
    const gameReady = document.documentElement.dataset.ashenGameReady === 'true';

    updateStatusPill(byId('mobileManagerVersion'), updater?.getBuildId?.()?.slice(0, 8) || 'LOCAL BUILD');
    updateStatusPill(byId('mobileManagerNetwork'),
      navigator.onLine ? 'NETWORK · ONLINE' : 'NETWORK · OFFLINE',
      navigator.onLine ? 'online' : 'offline');
    updateStatusPill(byId('mobileManagerSave'),
      save?.textContent?.trim() || (gameReady ? 'LOCAL SAVE READY' : 'STARTING…'),
      save?.dataset?.state || '');
    updateStatusPill(byId('mobileManagerCloud'), cloudStatusText, cloudStatusKind);
    updateStatusPill(byId('mobileManagerChapter'), chapter?.textContent?.trim() || 'CHAPTER 01');
    updateStatusPill(byId('mobileManagerProgress'), 'QUEST · ' + (progress?.textContent?.trim() || '1 / 1'));
    byId('mobileAutoUpdateToggle').textContent = updateState.autoUpdate === false ? 'OFF' : 'ON';
    byId('mobileAutoUpdateToggle').setAttribute('aria-pressed', String(updateState.autoUpdate !== false));
    byId('mobileInstallApp').hidden = !updater?.isInstallAvailable?.();
    byId('mobileInstallApp').textContent = updateState.installAvailable ? 'Install app' : 'Install app';
    const feedback = byId('mobileManagerFeedback');
    if (updateState.updateAvailable) {
      feedback.textContent = updateState.message || 'A newer version is available.';
      feedback.dataset.state = 'update';
      byId('mobileCheckUpdates').textContent = updateState.autoUpdate ? 'Update ready' : 'Apply update';
    } else {
      feedback.textContent = updateState.message || (navigator.onLine
        ? 'Your local save stays on this device. Cloud backup requires sign-in.'
        : 'Offline mode. Your installed game and local save remain on this device.');
      feedback.dataset.state = updateState.status || '';
      byId('mobileCheckUpdates').textContent = updateState.status === 'checking' ? 'Checking…' : 'Check updates';
    }
    byId('mobileCheckUpdates').disabled = updateState.status === 'checking';
  }

  let cloudStatusText = 'CLOUD · NOT SYNCED';
  let cloudStatusKind = 'idle';
  window.addEventListener('ashen:cloud-save', event => {
    const status = event.detail?.status || 'idle';
    const message = event.detail?.message || '';
    const labels = {
      idle: 'CLOUD · IDLE',
      'signed-out': 'CLOUD · SIGN IN',
      pending: 'CLOUD · PENDING',
      syncing: 'CLOUD · SYNCING',
      saved: 'CLOUD · SYNCED',
      retrying: 'CLOUD · RETRYING',
      rejected: 'CLOUD · NEEDS ATTENTION'
    };
    cloudStatusText = message && status === 'rejected' ? 'CLOUD · NEEDS ATTENTION' : (labels[status] || 'CLOUD · ' + status.toUpperCase());
    cloudStatusKind = status;
    refreshStatus();
  });

  on(dock, 'click', event => {
    const button = event.target.closest('[data-mobile-command]');
    if (button) runCommand(button.dataset.mobileCommand);
  });
  on(overlay, 'click', event => {
    if (event.target === overlay) closeManager();
    const button = event.target.closest('[data-mobile-command]');
    if (button) runCommand(button.dataset.mobileCommand);
  });
  on(byId('mobileManagerClose'), 'click', closeManager);
  on(byId('mobileExportSave'), 'click', () => {
    closeManager();
    byId('exportSaveButton')?.click();
  });
  on(byId('mobileImportSave'), 'click', () => {
    closeManager();
    byId('importSaveButton')?.click();
  });
  on(byId('mobileCheckUpdates'), 'click', async () => {
    const updater = window.AshenAppUpdater;
    if (!updater) return;
    if (updater.getState?.().updateAvailable) {
      await updater.applyUpdate();
    } else {
      await updater.checkForUpdates();
    }
    refreshStatus();
  });
  on(byId('mobileAutoUpdateToggle'), 'click', () => {
    const updater = window.AshenAppUpdater;
    if (!updater) return;
    updater.setAutoUpdate(updater.getState?.().autoUpdate === false);
    refreshStatus();
  });
  on(byId('mobileInstallApp'), 'click', async () => {
    const result = await window.AshenAppUpdater?.installApp?.();
    if (result?.message) byId('mobileManagerFeedback').textContent = result.message;
    else if (result?.outcome === 'accepted') byId('mobileManagerFeedback').textContent = 'App installation started.';
    else if (result?.outcome === 'dismissed') byId('mobileManagerFeedback').textContent = 'Installation was dismissed. You can use your browser menu later.';
    refreshStatus();
  });

  window.addEventListener('ashen:app-update-state', refreshStatus);
  window.addEventListener('online', refreshStatus);
  window.addEventListener('offline', refreshStatus);
  window.addEventListener('resize', refreshStatus, { passive: true });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !overlay.hidden) {
      closeManager();
      event.stopPropagation();
    }
  }, true);
  refreshTimer = window.setInterval(refreshStatus, 1500);
  refreshStatus();

  // Keep a simple lifecycle contract so update-manager can persist the local
  // game state before auto-refreshing a new build.
  window.addEventListener('ashen:game-ready', refreshStatus);
})();
