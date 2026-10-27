(() => {
  'use strict';

  const BUILD_ID = document.querySelector('meta[name="ashen-build-id"]')?.content || 'development';
  const AUTO_UPDATE_KEY = 'ashen-crown.auto-update.v1';
  const RELOAD_TARGET_KEY = 'ashen-crown.update-reload-target.v1';
  const CHECK_INTERVAL_MS = 5 * 60 * 1000;
  const state = {
    status: 'checking',
    message: 'Checking for updates…',
    buildId: BUILD_ID,
    workerBuildId: '',
    updateAvailable: false,
    autoUpdate: readAutoUpdatePreference(),
    online: navigator.onLine,
    installAvailable: false
  };

  let registration = null;
  let installPrompt = null;
  let checkInProgress = false;
  let applyInProgress = false;
  let retryTimer = 0;
  let checkTimer = 0;
  let banner = null;
  let bannerText = null;
  let applyButton = null;
  let dismissButton = null;

  function readAutoUpdatePreference() {
    try {
      return localStorage.getItem(AUTO_UPDATE_KEY) !== 'false';
    } catch {
      return true;
    }
  }

  function snapshot() {
    return { ...state };
  }

  function emit() {
    state.online = navigator.onLine;
    document.documentElement.dataset.ashenUpdateStatus = state.status;
    document.documentElement.dataset.ashenAutoUpdate = String(state.autoUpdate);
    updateBanner();
    window.dispatchEvent(new CustomEvent('ashen:app-update-state', { detail: snapshot() }));
  }

  function createBanner() {
    if (banner) return;
    banner = document.createElement('aside');
    banner.id = 'ashen-app-update-banner';
    banner.className = 'ashen-app-update-banner';
    banner.hidden = true;
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');

    bannerText = document.createElement('p');
    bannerText.className = 'ashen-app-update-copy';

    const actions = document.createElement('div');
    actions.className = 'ashen-app-update-actions';
    applyButton = document.createElement('button');
    applyButton.type = 'button';
    applyButton.textContent = 'Update now';
    applyButton.addEventListener('click', () => void applyUpdate(true));
    dismissButton = document.createElement('button');
    dismissButton.type = 'button';
    dismissButton.className = 'ashen-app-update-dismiss';
    dismissButton.textContent = 'Later';
    dismissButton.addEventListener('click', () => {
      banner.hidden = true;
      window.clearTimeout(retryTimer);
    });
    actions.append(applyButton, dismissButton);
    banner.append(bannerText, actions);
    document.body.appendChild(banner);
  }

  function updateBanner() {
    if (!banner) return;
    const visible = state.updateAvailable ||
      ['update-waiting-safe', 'update-save-blocked', 'update-check-failed'].includes(state.status);
    banner.hidden = !visible;
    if (!visible) return;
    bannerText.textContent = state.message;
    applyButton.textContent = state.status === 'applying' ? 'Updating…' : 'Update now';
    applyButton.disabled = applyInProgress || !navigator.onLine;
    dismissButton.hidden = state.autoUpdate && state.status === 'available';
  }

  function setStatus(status, message) {
    state.status = status;
    if (message) state.message = message;
    emit();
  }

  function readReloadTarget() {
    try {
      return sessionStorage.getItem(RELOAD_TARGET_KEY) || '';
    } catch {
      return '';
    }
  }

  function writeReloadTarget(value) {
    try {
      if (value) sessionStorage.setItem(RELOAD_TARGET_KEY, value);
      else sessionStorage.removeItem(RELOAD_TARGET_KEY);
    } catch {}
  }

  function handleWorkerVersion(version) {
    if (typeof version !== 'string' || !/^[a-f0-9]{16}$/i.test(version)) return;
    state.workerBuildId = version;
    if (version === BUILD_ID) {
      state.updateAvailable = false;
      if (readReloadTarget() === version) writeReloadTarget('');
      setStatus('current', 'You are using the latest available version.');
      window.clearTimeout(retryTimer);
      return;
    }

    state.updateAvailable = true;
    setStatus('available', 'A newer version is ready. Your local save will be checked before the game refreshes.');
    if (state.autoUpdate) scheduleAutoApply(900);
  }

  function probeWorkerVersion(worker = navigator.serviceWorker?.controller || registration?.active) {
    if (!worker || typeof MessageChannel !== 'function') return Promise.resolve(null);
    return new Promise(resolve => {
      const channel = new MessageChannel();
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        channel.port1.close();
        resolve(value);
      };
      const timeout = window.setTimeout(() => finish(null), 1500);
      channel.port1.onmessage = event => {
        const data = event.data;
        if (data?.type === 'ASHEN_APP_VERSION') finish(data.buildId || null);
      };
      try {
        worker.postMessage({ type: 'ASHEN_GET_VERSION' }, [channel.port2]);
      } catch {
        finish(null);
      }
    }).then(version => {
      if (version) handleWorkerVersion(version);
      return version;
    });
  }

  function scheduleAutoApply(delay = 4000) {
    window.clearTimeout(retryTimer);
    if (!state.autoUpdate || !state.updateAvailable || applyInProgress) return;
    retryTimer = window.setTimeout(() => void applyUpdate(false), delay);
  }

  async function applyUpdate(manual = false) {
    if (!state.updateAvailable || applyInProgress) return false;
    if (!navigator.onLine) {
      setStatus('update-waiting-safe', 'You are offline. The update will apply after a connection is restored.');
      return false;
    }
    if (!manual && !state.autoUpdate) return false;

    const target = state.workerBuildId;
    if (!manual && target && readReloadTarget() === target) {
      setStatus('update-check-failed', 'The app could not confirm the new page version after the last refresh. Reconnect and check again before retrying.');
      return false;
    }

    const lifecycle = window.AshenAppLifecycle;
    if (document.querySelector('.stage') && (!lifecycle || typeof lifecycle.canApplyUpdate !== 'function')) {
      setStatus('update-waiting-safe', 'Update is ready. Waiting for the game to finish starting before refreshing.');
      scheduleAutoApply(2000);
      return false;
    }
    if (typeof lifecycle?.canApplyUpdate === 'function' && !lifecycle.canApplyUpdate()) {
      setStatus('update-waiting-safe', 'Update is ready. It will apply when menus, combat and other active actions are clear.');
      scheduleAutoApply(4000);
      return false;
    }

    applyInProgress = true;
    setStatus('applying', 'Saving your journey safely before updating…');
    try {
      if (typeof lifecycle?.prepareForUpdate === 'function') {
        const prepared = await lifecycle.prepareForUpdate();
        if (!prepared) {
          applyInProgress = false;
          setStatus('update-save-blocked', 'Automatic update paused because the local save or cloud backup needs attention. Restore the save or wait for sync, then try again.');
          if (state.autoUpdate && !manual) scheduleAutoApply(8000);
          return false;
        }
      }
      if (target) writeReloadTarget(target);
      setStatus('applying', 'Update is ready. Refreshing to the latest build…');
      window.setTimeout(() => window.location.reload(), 200);
      return true;
    } catch (error) {
      applyInProgress = false;
      setStatus('update-save-blocked', 'Update paused to protect your save. ' + (error?.message || 'The save could not be verified.'));
      return false;
    }
  }

  async function checkForUpdates() {
    if (checkInProgress) return state.updateAvailable;
    if (!('serviceWorker' in navigator)) {
      setStatus('unsupported', 'Automatic updates need a browser that supports service workers and HTTPS.');
      return false;
    }
    if (!navigator.onLine) {
      setStatus('offline', 'Offline. The installed version remains available; updates will be checked when online.');
      return false;
    }

    checkInProgress = true;
    setStatus('checking', 'Checking the latest version…');
    try {
      if (!registration) {
        registration = await navigator.serviceWorker.register(new URL('./sw.js', location.href), {
          updateViaCache: 'none'
        });
        bindRegistration(registration);
      }
      await registration.update();
      await probeWorkerVersion();
      if (!state.updateAvailable && state.status === 'checking') {
        setStatus('current', 'You are using the latest available version.');
      }
      return state.updateAvailable;
    } catch (error) {
      setStatus(navigator.onLine ? 'update-check-failed' : 'offline',
        navigator.onLine
          ? 'Could not check for updates right now. The current version is still available.'
          : 'Offline. The current version is still available.');
      return false;
    } finally {
      checkInProgress = false;
    }
  }

  function bindRegistration(reg) {
    reg.addEventListener('updatefound', () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed') {
          void probeWorkerVersion(reg.active || navigator.serviceWorker.controller);
        }
      });
    });
    void probeWorkerVersion(reg.active || navigator.serviceWorker.controller);
  }

  async function installApp() {
    if (!installPrompt) {
      return {
        prompted: false,
        message: /iphone|ipad|ipod/i.test(navigator.userAgent)
          ? 'On iPhone or iPad, open Share in Safari and choose Add to Home Screen.'
          : 'Open your browser menu and choose Install app or Add to Home Screen if the option is available.'
      };
    }
    const prompt = installPrompt;
    installPrompt = null;
    state.installAvailable = false;
    emit();
    await prompt.prompt();
    const choice = await prompt.userChoice.catch(() => ({ outcome: 'dismissed' }));
    emit();
    return { prompted: true, outcome: choice?.outcome || 'dismissed' };
  }

  function setAutoUpdate(enabled) {
    state.autoUpdate = Boolean(enabled);
    try {
      localStorage.setItem(AUTO_UPDATE_KEY, String(state.autoUpdate));
    } catch {}
    emit();
    if (state.autoUpdate && state.updateAvailable) scheduleAutoApply(250);
    if (!state.autoUpdate) window.clearTimeout(retryTimer);
    return state.autoUpdate;
  }

  function init() {
    createBanner();
    emit();
    window.addEventListener('online', () => {
      state.online = true;
      emit();
      void checkForUpdates();
    });
    window.addEventListener('offline', () => {
      state.online = false;
      setStatus(state.updateAvailable ? 'update-waiting-safe' : 'offline',
        state.updateAvailable
          ? 'A newer version is known, but the device is offline. It will refresh after reconnecting.'
          : 'Offline. The installed version remains available.');
    });
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      installPrompt = event;
      state.installAvailable = true;
      emit();
    });
    window.addEventListener('appinstalled', () => {
      installPrompt = null;
      state.installAvailable = false;
      emit();
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void checkForUpdates();
    });
    window.addEventListener('focus', () => void checkForUpdates());

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'ASHEN_APP_VERSION') handleWorkerVersion(event.data.buildId);
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        void probeWorkerVersion();
      });
      navigator.serviceWorker.register(new URL('./sw.js', location.href), { updateViaCache: 'none' })
        .then(reg => {
          registration = reg;
          bindRegistration(reg);
          return registration.update().catch(() => {});
        })
        .then(() => probeWorkerVersion())
        .catch(() => {
          if (!navigator.onLine) setStatus('offline', 'Offline. The installed version remains available.');
          else setStatus('update-check-failed', 'Automatic updates could not start in this browser session.');
        });
    } else {
      setStatus('unsupported', 'This browser does not support automatic background updates.');
    }
    checkTimer = window.setInterval(() => {
      if (!document.hidden && navigator.onLine) void checkForUpdates();
    }, CHECK_INTERVAL_MS);
  }

  window.AshenAppUpdater = {
    getState: snapshot,
    getBuildId: () => BUILD_ID,
    checkForUpdates,
    applyUpdate: () => applyUpdate(true),
    setAutoUpdate,
    installApp,
    isInstallAvailable: () => Boolean(installPrompt)
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
