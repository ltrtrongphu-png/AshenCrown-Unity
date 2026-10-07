const header = document.querySelector('.site-header');
const menu = document.querySelector('.menu');
const nav = document.querySelector('#main-nav');
let lastScrollY = 0;

if (header) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    header.style.transform = scrollY > 30 && scrollY > lastScrollY ? 'translateY(-100%)' : 'translateY(0)';
    lastScrollY = scrollY;
  }, { passive: true });
}

function setMenuOpen(open) {
  if (!menu || !nav) return;
  nav.classList.toggle('mobile-open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}

if (menu && nav) {
  menu.addEventListener('click', () => setMenuOpen(menu.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuOpen(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      menu.focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (menu.getAttribute('aria-expanded') === 'true' && !nav.contains(event.target) && !menu.contains(event.target)) {
      setMenuOpen(false);
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) setMenuOpen(false);
  }, { passive: true });
}

document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const target = document.getElementById(link.getAttribute('href').slice(1));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  header?.style.setProperty('transform', 'translateY(0)');
}));

const glow = document.querySelector('.cursor-glow');
if (glow && window.matchMedia('(pointer:fine)').matches) {
  window.addEventListener('pointermove', event => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  }, { passive: true });
}

const actButtons = [...document.querySelectorAll('.act')];
const actSelection = document.querySelector('#actSelection');
actButtons.forEach(button => button.addEventListener('click', () => {
  actButtons.forEach(other => {
    const active = other === button;
    other.classList.toggle('active', active);
    other.setAttribute('aria-pressed', String(active));
  });
  if (actSelection) {
    actSelection.textContent = `Selected · ${button.querySelector('span')?.textContent || 'Act'} — ${button.querySelector('small')?.textContent || ''}`;
  }
}));

const journeyNote = document.querySelector('#journeyResumeNote');
const journeyCopy = {
  en: (chapter, day) => `Saved on this device · Chapter ${chapter} · Day ${day}. Enter the story demo to continue.`,
  vi: (chapter, day) => `Đã lưu trên thiết bị · Chương ${chapter} · Ngày ${day}. Vào game để tiếp tục.`,
  ja: (chapter, day) => `この端末に保存済み · 第${chapter}章 · ${day}日目。ストーリーデモから続けられます。`,
  ko: (chapter, day) => `이 기기에 저장됨 · ${chapter}장 · ${day}일차. 스토리 데모에서 이어서 플레이하세요.`,
  zh: (chapter, day) => `已保存在此设备 · 第${chapter}章 · 第${day}天。进入剧情试玩即可继续。`,
};

function refreshJourneyNote() {
  if (!journeyNote) return;
  try {
    const saved = JSON.parse(localStorage.getItem('ashen-crown-3d') || 'null');
    if (!saved || !Number.isFinite(Number(saved.level)) || Number(saved.level) < 1) {
      journeyNote.textContent = '';
      journeyNote.hidden = true;
      return;
    }
    const language = (window.AshenI18n?.language || document.documentElement.lang || 'en').slice(0, 2);
    const copy = journeyCopy[language] || journeyCopy.en;
    const chapter = Math.max(1, Number(saved.chapter) || 1);
    const day = Math.max(1, Number(saved.day) || 1);
    journeyNote.textContent = copy(chapter, day);
    journeyNote.hidden = false;
  } catch {
    journeyNote.textContent = '';
    journeyNote.hidden = true;
  }
}

refreshJourneyNote();
window.addEventListener('DOMContentLoaded', refreshJourneyNote);
window.addEventListener('pageshow', refreshJourneyNote);
window.addEventListener('storage', event => {
  if (event.key === 'ashen-crown-3d') refreshJourneyNote();
});
window.addEventListener('ashen:language', refreshJourneyNote);

const revealTargets = document.querySelectorAll('.feature,.progress-grid article,.system-list>div,.act');
if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      reveal.unobserve(entry.target);
    }
  }), { threshold: 0.12 });
  revealTargets.forEach(element => {
    element.classList.add('reveal');
    reveal.observe(element);
  });
} else {
  revealTargets.forEach(element => element.classList.add('is-visible'));
}
