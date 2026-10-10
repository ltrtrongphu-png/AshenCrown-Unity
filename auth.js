const AUTH_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const AUTH_CONFIG = window.ASHEN_SUPABASE_CONFIG || {};
let supabase = null;
let currentSession = null;
let authInitError = '';
let modal = null;
let accountButton = null;
let mode = 'signin';
let recoveryMode = false;
let queuedSave = null;
let cloudTimer = null;
let lastCloudWrite = 0;
let cloudWriteInFlight = false;

const authReady = (async () => {
  const url = String(AUTH_CONFIG.url || '').trim();
  const publishableKey = String(AUTH_CONFIG.publishableKey || '').trim();
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) ||
      !/^(sb_publishable_[a-zA-Z0-9_-]+|eyJ[a-zA-Z0-9_.-]+)$/.test(publishableKey)) {
    authInitError = 'Website auth is not configured. Check auth-config.js.';
    return null;
  }
  try {
    const { createClient } = await import(AUTH_CDN);
    supabase = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'ashen-crown-auth'
      }
    });
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    currentSession = data.session || null;
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { recoveryMode = true; mode = 'recover'; if (modal) modal.hidden = false; }
      currentSession = session || null;
      updateAccountButton();
      renderAuthModal();
      window.dispatchEvent(new CustomEvent('ashen:auth', {
        detail: { event, session: currentSession, user: currentSession?.user || null }
      }));
      if (currentSession?.user && queuedSave) scheduleCloudFlush();
    });
    updateAccountButton();
    return supabase;
  } catch (error) {
    authInitError = error?.message || 'Could not initialize Supabase authentication.';
    console.error('[Ashen Crown] Authentication initialization failed:', authInitError);
    updateAccountButton();
    return null;
  }
})();

function addAuthStyles() {
  if (document.getElementById('ashen-auth-styles')) return;
  const style = document.createElement('style');
  style.id = 'ashen-auth-styles';
  style.textContent = '.nav-auth,.auth-entry{border:1px solid rgba(218,151,103,.46)!important;background:rgba(104,55,33,.25)!important;color:#e6b58f!important;padding:9px 12px!important;font:600 9px/1.2 Arial,sans-serif!important;letter-spacing:.1em!important;cursor:pointer!important;white-space:nowrap}.nav-auth:hover,.auth-entry:hover{background:rgba(155,81,46,.4)!important;color:#fff!important}.ashen-auth-overlay{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:18px;background:rgba(4,3,3,.82);backdrop-filter:blur(14px)}.ashen-auth-overlay[hidden]{display:none}.ashen-auth-card{position:relative;width:min(470px,100%);max-height:min(88vh,740px);overflow:auto;border:1px solid rgba(221,151,104,.42);background:linear-gradient(145deg,#1b1410,#090807 75%);color:#efe3d7;padding:28px;box-shadow:0 28px 100px #000}.ashen-auth-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,.09);padding-bottom:16px}.ashen-auth-eyebrow{margin:0 0 7px;color:#d28c60;font:700 9px Arial,sans-serif;letter-spacing:.2em}.ashen-auth-head h2{margin:0;font:600 32px Georgia,serif}.ashen-auth-close{border:0;background:none;color:#a28f80;font-size:26px;cursor:pointer}.ashen-auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:19px 0}.ashen-auth-tabs button,.ashen-auth-submit,.ashen-auth-signout,.ashen-auth-reset{border:1px solid rgba(219,153,105,.24);background:#18110d;color:#cbb7a6;padding:11px 12px;font:600 10px Arial,sans-serif;letter-spacing:.08em;cursor:pointer}.ashen-auth-tabs button[aria-selected=true],.ashen-auth-submit{background:#bf7048;color:#150c07;border-color:#bf7048}.ashen-auth-field{display:block;margin:13px 0;color:#b8a594;font:600 9px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}.ashen-auth-field input{display:block;width:100%;margin-top:7px;padding:12px;border:1px solid #463329;background:#0c0a09;color:#f4e9dd;font:14px Arial,sans-serif;outline:none}.ashen-auth-field input:focus{border-color:#d18a5e}.ashen-auth-submit,.ashen-auth-signout{width:100%;margin-top:12px}.ashen-auth-notice{min-height:23px;margin:12px 0 0;color:#d7a47d;font:12px/1.6 Arial,sans-serif;overflow-wrap:anywhere}.ashen-auth-notice[data-kind=error]{color:#f09583}.ashen-auth-note{margin:16px 0 0;color:#817266;font:10px/1.55 Arial,sans-serif}.ashen-auth-account{padding:20px 0 4px;color:#bfae9e;font:12px/1.7 Arial,sans-serif;overflow-wrap:anywhere}.ashen-auth-account strong{color:#f2d9c5}.ashen-auth-reset{display:block;width:100%;margin-top:8px;background:transparent}@media(max-width:700px){.nav-auth{font-size:8px!important;padding:8px!important}.ashen-auth-card{padding:20px}.ashen-auth-head h2{font-size:27px}}';
  document.head.appendChild(style);
}

function ensureAuthUi() {
  if (modal) return;
  addAuthStyles();
  accountButton = document.getElementById('accountOpen');
  if (!accountButton) {
    accountButton = document.createElement('button');
    accountButton.type = 'button';
    accountButton.className = 'auth-entry';
    accountButton.id = 'accountOpen';
    accountButton.textContent = 'ACCOUNT';
    const actions = document.querySelector('.top-actions');
    if (actions) actions.appendChild(accountButton);
    else (document.querySelector('#main-nav') || document.body).appendChild(accountButton);
  }
  modal = document.createElement('div');
  modal.className = 'ashen-auth-overlay';
  modal.id = 'ashenAuthModal';
  modal.hidden = true;
  modal.innerHTML = '<section class="ashen-auth-card" role="dialog" aria-modal="true" aria-labelledby="ashenAuthTitle"><header class="ashen-auth-head"><div><p class="ashen-auth-eyebrow">ASHEN CROWN · PLAYER ACCOUNT</p><h2 id="ashenAuthTitle">Your journey</h2></div><button type="button" class="ashen-auth-close" id="ashenAuthClose" aria-label="Close">×</button></header><div id="ashenAuthFormView"><div class="ashen-auth-tabs" id="ashenAuthTabs" role="tablist" aria-label="Account access"><button type="button" id="ashenSignInTab" aria-selected="true">SIGN IN</button><button type="button" id="ashenSignUpTab" aria-selected="false">CREATE ACCOUNT</button></div><form id="ashenAuthForm"><label class="ashen-auth-field">Email<input id="ashenAuthEmail" name="email" type="email" autocomplete="email" required maxlength="254"></label><label class="ashen-auth-field">Password<input id="ashenAuthPassword" name="password" type="password" autocomplete="current-password" minlength="8" required maxlength="128"></label><button class="ashen-auth-submit" id="ashenAuthSubmit" type="submit">SIGN IN</button><button class="ashen-auth-reset" id="ashenAuthReset" type="button">Forgot password?</button></form></div><div id="ashenAuthAccountView" hidden><div class="ashen-auth-account" id="ashenAuthAccountText"></div><button class="ashen-auth-signout" id="ashenAuthSignOut" type="button">SIGN OUT</button></div><p class="ashen-auth-notice" id="ashenAuthNotice" role="status" aria-live="polite"></p><p class="ashen-auth-note">Your cloud save is private to your account. Never share your password. Supabase row-level security restricts save access by authenticated user.</p></section>';
  document.body.appendChild(modal);
  accountButton.addEventListener('click', () => {
    modal.hidden = false;
    renderAuthModal();
    if (!currentSession) document.getElementById('ashenAuthEmail').focus();
  });
  document.getElementById('ashenAuthClose').addEventListener('click', closeAuthModal);
  modal.addEventListener('pointerdown', event => { if (event.target === modal) closeAuthModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal && !modal.hidden) closeAuthModal(); });
  document.getElementById('ashenSignInTab').addEventListener('click', () => setAuthMode('signin'));
  document.getElementById('ashenSignUpTab').addEventListener('click', () => setAuthMode('signup'));
  document.getElementById('ashenAuthForm').addEventListener('submit', submitAuthForm);
  document.getElementById('ashenAuthReset').addEventListener('click', resetPassword);
  document.getElementById('ashenAuthSignOut').addEventListener('click', signOut);
  if (recoveryMode) modal.hidden = false;
  renderAuthModal();
}

function closeAuthModal() { if (modal) modal.hidden = true; }
function setAuthNotice(message, kind = '') {
  const notice = document.getElementById('ashenAuthNotice');
  if (!notice) return;
  notice.textContent = message || '';
  notice.dataset.kind = kind;
}
function setAuthMode(nextMode) {
  if (recoveryMode) return;
  mode = nextMode === 'signup' ? 'signup' : 'signin';
  const signup = mode === 'signup';
  document.getElementById('ashenSignInTab').setAttribute('aria-selected', String(!signup));
  document.getElementById('ashenSignUpTab').setAttribute('aria-selected', String(signup));
  document.getElementById('ashenAuthTitle').textContent = signup ? 'Create your account' : 'Return to the ashes';
  document.getElementById('ashenAuthSubmit').textContent = signup ? 'CREATE ACCOUNT' : 'SIGN IN';
  document.getElementById('ashenAuthPassword').autocomplete = signup ? 'new-password' : 'current-password';
  document.getElementById('ashenAuthReset').hidden = signup;
  setAuthNotice(authInitError, authInitError ? 'error' : '');
}
function updateAccountButton() {
  const button = document.getElementById('accountOpen') || accountButton;
  if (!button) return;
  const email = currentSession?.user?.email;
  button.textContent = email ? 'ACCOUNT · ' + (email.length > 23 ? email.slice(0, 20) + '…' : email) : 'ACCOUNT / SIGN IN';
  button.title = email ? 'Signed in as ' + email : 'Sign in or create a player account';
}
function renderAuthModal() {
  if (!modal) return;
  const isSignedIn = Boolean(currentSession?.user);
  const showForm = !isSignedIn || recoveryMode;
  document.getElementById('ashenAuthFormView').hidden = !showForm;
  document.getElementById('ashenAuthAccountView').hidden = showForm;
  const accountPrefix = window.AshenI18n?.t?.('Signed in as') || 'Signed in as';
  const accountSuffix = window.AshenI18n?.t?.('. Your browser save will sync to your private cloud slot.') || '. Your browser save will sync to your private cloud slot.';
  document.getElementById('ashenAuthAccountText').textContent = isSignedIn ? accountPrefix + ' ' + (currentSession.user.email || 'player') + accountSuffix : '';
  document.getElementById('ashenAuthTabs').hidden = recoveryMode;
  if (recoveryMode) {
    document.getElementById('ashenAuthTitle').textContent = 'Set a new password';
    document.getElementById('ashenAuthSubmit').textContent = 'UPDATE PASSWORD';
    document.getElementById('ashenAuthPassword').autocomplete = 'new-password';
    document.getElementById('ashenAuthReset').hidden = true;
    setAuthNotice('Choose a new password with at least 8 characters.');
  } else if (isSignedIn) {
    setAuthNotice('Account connected.', '');
  } else {
    setAuthMode(mode);
  }
}
async function submitAuthForm(event) {
  event.preventDefault();
  setAuthNotice('');
  await authReady;
  if (!supabase) { setAuthNotice(authInitError || 'Authentication is unavailable right now.', 'error'); return; }
  const email = document.getElementById('ashenAuthEmail').value.trim();
  const password = document.getElementById('ashenAuthPassword').value;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setAuthNotice('Enter a valid email address.', 'error'); return; }
  if (password.length < 8) { setAuthNotice('Use a password with at least 8 characters.', 'error'); return; }
  const submit = document.getElementById('ashenAuthSubmit');
  submit.disabled = true;
  submit.textContent = 'PLEASE WAIT…';
  try {
    if (recoveryMode) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      recoveryMode = false; mode = 'signin';
      setAuthNotice('Password updated. You can sign in with the new password.');
      renderAuthModal();
    } else if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
      if (error) throw error;
      if (!data.session) setAuthNotice('Account created. Check your email to confirm it, then sign in here.');
      else setAuthNotice('Account created and signed in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setAuthNotice('Signed in. Syncing your journey…');
    }
  } catch (error) {
    setAuthNotice(error?.message || 'Could not complete account request.', 'error');
  } finally {
    submit.disabled = false;
    submit.textContent = recoveryMode ? 'UPDATE PASSWORD' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN';
  }
}
async function resetPassword() {
  await authReady;
  if (!supabase) { setAuthNotice(authInitError || 'Authentication is unavailable right now.', 'error'); return; }
  const email = document.getElementById('ashenAuthEmail').value.trim();
  if (!email) { setAuthNotice('Enter your email above first.', 'error'); return; }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
    if (error) throw error;
    setAuthNotice('If the address belongs to an account, a password reset email will be sent.');
  } catch (error) {
    setAuthNotice(error?.message || 'Could not request a password reset.', 'error');
  }
}
async function signOut() {
  await authReady;
  if (!supabase) return;
  const button = document.getElementById('ashenAuthSignOut');
  button.disabled = true;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setAuthNotice('Signed out. Your local browser save remains on this device.');
  } catch (error) {
    setAuthNotice(error?.message || 'Could not sign out.', 'error');
  } finally { button.disabled = false; }
}

async function requireUser() {
  await authReady;
  if (!supabase) throw new Error(authInitError || 'Authentication is not configured.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  currentSession = data.session || null;
  if (!currentSession?.user?.id) throw new Error('Sign in to sync your save.');
  return currentSession.user;
}
async function loadCloudSave() {
  const user = await requireUser();
  const { data, error } = await supabase.from('player_web_saves').select('save_json,updated_at').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data || null;
}
async function writeCloudSave(save) {
  const user = await requireUser();
  const encoded = JSON.stringify(save);
  if (encoded.length > 900000) throw new Error('Save is too large to sync.');
  const { error } = await supabase.from('player_web_saves').upsert({
    user_id: user.id,
    save_json: JSON.parse(encoded),
    save_text: 'Ashen Crown browser save',
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
  if (error) throw error;
}
async function flushCloudSave() {
  if (cloudWriteInFlight || !queuedSave || !currentSession?.user) return;
  const snapshot = queuedSave;
  queuedSave = null;
  cloudWriteInFlight = true;
  try {
    await writeCloudSave(snapshot);
    lastCloudWrite = Date.now();
  } catch (error) {
    console.warn('[Ashen Crown] Cloud save failed:', error?.message || error);
  } finally {
    cloudWriteInFlight = false;
    if (queuedSave) scheduleCloudFlush();
  }
}
function scheduleCloudFlush() {
  if (cloudTimer || !currentSession?.user || !queuedSave) return;
  const wait = Math.max(1500, 30000 - (Date.now() - lastCloudWrite));
  cloudTimer = setTimeout(() => { cloudTimer = null; void flushCloudSave(); }, wait);
}
function queueSave(save) {
  if (!currentSession?.user || !save || typeof save !== 'object') return;
  try {
    const encoded = JSON.stringify(save);
    if (encoded.length > 900000) return;
    queuedSave = JSON.parse(encoded);
    scheduleCloudFlush();
  } catch {}
}

window.AshenAuth = {
  ready: authReady,
  getSession: async () => { await authReady; return currentSession; },
  loadCloudSave,
  saveCloudSave: writeCloudSave,
  queueSave,
  signOut
};

function initAuthUi() { ensureAuthUi(); updateAccountButton(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAuthUi, { once: true });
else initAuthUi();
