import { businesses, getBusiness, getMetrics, resetDemo } from './data.js';
import { renderWorkspace } from './workspace.js';
import { renderDemo } from './demo.js';

const app = document.querySelector('#app');
const main = document.querySelector('#main');
const video = document.querySelector('#background-video');
const businessScene = document.querySelector('#business-scene');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const resetDialog = document.querySelector('#reset-dialog');
const notificationDot = document.querySelector('#notification-dot');
const notificationList = document.querySelector('#notification-list');
const toast = document.querySelector('#shell-toast');
const sections = ['overview', 'enquiries', 'quotations', 'clients', 'follow-ups'];
const menus = [...document.querySelectorAll('.mast-menu')];

const glyphs = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  play: '<path d="m9 5 10 7-10 7z"/>',
  check: '<path d="m5 12 4 4 10-10"/>'
};

let previousRoute;
let chosenCardOrigin;
let toastTimer;
const icon = name => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[name]}</svg>`;

function homeCard(business, index) {
  const { id, name, subtitle, accent, image } = business;
  const { openEnquiries, pendingQuotations } = getMetrics(id);
  return `
    <a class="business-card" href="#workspace/${id}" style="--card-accent:${accent}; --card-order:${index}" aria-label="Open ${name} workspace">
      <div class="card-image">
        <img src="${image}" alt="" width="780" height="520" decoding="async"${index ? ' loading="lazy"' : ''}>
        <div class="card-caption">
          <span class="card-accent" aria-hidden="true"></span>
          <h3>${name}</h3>
          <p>${subtitle}</p>
        </div>
      </div>
      <div class="card-stats">
        <div><b data-count="${openEnquiries}">${openEnquiries}</b><span>Open enquiries</span></div>
        <div><b data-count="${pendingQuotations}">${pendingQuotations}</b><span>Pending quotations</span></div>
      </div>
      <div class="card-link"><span>Open workspace</span><span class="card-arrow">${icon('arrow')}</span></div>
    </a>`;
}

function renderHome(animate) {
  main.innerHTML = `
    <div class="home-wrap${animate ? ' home-entrance' : ''}">
      <section class="home-hero" aria-labelledby="home-heading">
        <h1 id="home-heading">Three businesses.<br><span>One workspace.</span></h1>
        <div class="home-hero-foot">
          <p>Manage your clients, enquiries and quotations without the unnecessary admin.</p>
          <a class="hero-action" href="#demo"><span class="hero-play">${icon('play')}</span>See how it works</a>
        </div>
      </section>
      <section class="business-picker" aria-labelledby="business-heading">
        <div class="business-heading"><h2 id="business-heading">Your businesses</h2><span aria-hidden="true"></span></div>
        <div class="business-grid">${businesses.map(homeCard).join('')}</div>
      </section>
    </div>`;
  if (animate && !motion.matches) animateCounts();
}

function animateCounts() {
  const numbers = [...main.querySelectorAll('[data-count]')];
  const start = performance.now();
  function tick(now) {
    if (!numbers[0]?.isConnected) return;
    const elapsed = now - start;
    numbers.forEach((number, index) => {
      const delay = 250 + Math.floor(index / 2) * 90;
      const progress = Math.max(0, Math.min(1, (elapsed - delay) / 720));
      number.textContent = Math.round(Number(number.dataset.count) * (1 - (1 - progress) ** 3));
    });
    if (elapsed < 1150) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function currentRoute() {
  const [page, id, section] = location.hash.slice(1).split('/');
  if (page === 'demo') return { page };
  if (page === 'workspace') {
    const business = getBusiness(id);
    if (business) return { page, business, section: sections.includes(section) ? section : 'overview' };
  }
  return { page: 'businesses' };
}

function updateNotifications() {
  const notifications = businesses.flatMap(business => {
    const count = getMetrics(business.id).followUpsDue;
    return count ? [`<li><a href="#workspace/${business.id}/follow-ups"><strong>${business.name}</strong><span>${count} ${count === 1 ? 'follow-up' : 'follow-ups'} due</span></a></li>`] : [];
  });
  notificationDot.hidden = !notifications.length;
  notificationList.innerHTML = notifications.join('') || '<li class="notification-empty">You’re all caught up.</li>';
}

function render({ navigate = false } = {}) {
  const route = currentRoute();
  const { page, business, section } = route;
  const newPage = previousRoute?.page !== page || previousRoute?.business?.id !== business?.id;
  document.body.dataset.page = page;
  app.classList.toggle('first-entrance', !previousRoute && page === 'businesses');

  if (business?.id !== businessScene.dataset.business) {
    businessScene.dataset.business = business?.id ?? '';
    if (business) {
      const highResolution = business.scene.replace(/\.webp$/, '-4k.webp');
      businessScene.srcset = `${business.scene} 1536w, ${highResolution} 3840w`;
      businessScene.src = business.scene;
    }
  }

  document.querySelectorAll('[data-nav]').forEach(link => {
    const active = link.dataset.nav === (page === 'workspace' ? 'businesses' : page);
    if (active) link.setAttribute('aria-current', page === 'workspace' ? 'location' : 'page');
    else link.removeAttribute('aria-current');
  });
  menus.forEach(menu => { menu.open = false; });
  updateNotifications();

  if (page === 'workspace') {
    document.title = `Ironstone · ${business.name}`;
    renderWorkspace(main, { business, section });
  } else if (page === 'demo') {
    document.title = 'Ironstone · How it works';
    renderDemo(main);
  } else {
    document.title = 'Ironstone · Business overview';
    renderHome(!previousRoute);
  }

  if (navigate) {
    main.focus({ preventScroll: true });
    if (newPage) window.scrollTo(0, 0);
    if (newPage && !motion.matches) {
      const origin = chosenCardOrigin ?? '50% 30%';
      main.animate(
        [{ opacity: 0, transform: 'translateY(10px) scale(.985)', transformOrigin: origin }, { opacity: 1, transform: 'none', transformOrigin: origin }],
        { duration: 340, easing: 'cubic-bezier(.16,1,.3,1)' }
      );
    }
  }
  chosenCardOrigin = undefined;
  previousRoute = route;
}

function syncVideo() {
  if (motion.matches || navigator.connection?.saveData || document.hidden) {
    video.pause();
    if (motion.matches) video.classList.remove('ready');
    return;
  }
  video.muted = true;
  if (!video.getAttribute('src')) video.src = video.dataset.source;
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) video.classList.add('ready');
  video.play().catch(() => video.classList.remove('ready'));
}

document.addEventListener('click', event => {
  const card = event.target.closest('.business-card');
  if (card && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
    const bounds = card.getBoundingClientRect();
    const mainTop = main.getBoundingClientRect().top;
    chosenCardOrigin = `${bounds.left + bounds.width / 2}px ${bounds.top - mainTop + bounds.height / 2}px`;
  }
  if (event.target.closest('[data-reset-demo]')) resetDialog.showModal();
  menus.forEach(menu => {
    if (!menu.contains(event.target) || event.target.closest('.mast-popover a, .mast-popover button')) menu.open = false;
  });
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const openMenu = menus.find(menu => menu.open);
  if (openMenu) {
    openMenu.open = false;
    openMenu.querySelector('summary').focus();
  }
});

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
});

main.addEventListener('pointermove', event => {
  const card = event.target.closest('.business-card');
  if (!card || motion.matches || event.pointerType !== 'mouse') return;
  const bounds = card.getBoundingClientRect();
  card.style.setProperty('--shift-x', `${((event.clientX - bounds.left) / bounds.width - .5) * -13}px`);
  card.style.setProperty('--shift-y', `${((event.clientY - bounds.top) / bounds.height - .5) * -9}px`);
});

resetDialog.querySelector('form').addEventListener('submit', event => {
  if (event.submitter?.value !== 'reset') return;
  resetDemo();
  render();
  toast.innerHTML = `${icon('check')} Demo data restored`;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
});

window.addEventListener('hashchange', () => render({ navigate: true }));
window.addEventListener('ironstone:records-changed', updateNotifications);
window.addEventListener('storage', updateNotifications);
document.addEventListener('visibilitychange', syncVideo);
motion.addEventListener('change', syncVideo);
video.addEventListener('loadeddata', () => {
  if (!motion.matches) video.classList.add('ready');
});
video.addEventListener('error', () => video.classList.remove('ready'));
syncVideo();
render();
