import { businesses, getBusiness, getMetrics, getOperationsOverview, formatDate, today, resetDemo } from './data.js';
import { renderWorkspace } from './workspace.js';
import { renderDemo } from './demo.js';

const app = document.querySelector('#app');
const main = document.querySelector('#main');
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
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4l3 2"/>',
  check: '<path d="m5 12 4 4 10-10"/>'
};

let previousRoute;
let chosenCardOrigin;
let toastTimer;
const icon = name => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[name]}</svg>`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

function homeCard(business, index) {
  const { id, name, subtitle, accent, image } = business;
  const { openEnquiries, pendingQuotations } = getMetrics(id);
  return `
    <a class="business-card" href="#workspace/${id}" style="--card-accent:${accent}; --card-order:${index}" aria-label="Open ${name} workspace">
      <div class="card-image">
        <img src="${image}" alt="" width="780" height="520" decoding="async"${index ? ' loading="lazy"' : ''}>
        <div class="card-caption">
          <h3>${name}</h3>
          <p>${subtitle}</p>
        </div>
      </div>
      <div class="card-stats">
        <div><b data-count="${openEnquiries}">${openEnquiries}</b><span>Open enquiries</span></div>
        <div><b data-count="${pendingQuotations}">${pendingQuotations}</b><span>Pending quotations</span></div>
      </div>
      <span class="card-link card-arrow" aria-hidden="true">${icon('arrow')}</span>
    </a>`;
}

function enquiryChart(days, series) {
  const maxCount = Math.max(...series.flatMap(({ counts }) => counts));
  const step = Math.max(1, Math.ceil(maxCount / 3));
  const scale = [3 * step, 2 * step, step, 0];
  const plotHeight = 148;
  const baseline = 156;
  const countsByDay = days.map((_, day) => series.map(({ counts }) => counts[day]));
  const lines = series.map(({ business, counts }, index) => {
    const points = counts.map((count, day) => {
      // Separate tied marks visually while keeping their exact counts in the labels.
      const tiedSeries = countsByDay[day].flatMap((value, position) => value === count ? [position] : []);
      const offset = (tiedSeries.indexOf(index) - (tiedSeries.length - 1) / 2) * 5;
      return { x: 8 + day * 104, y: baseline - count / scale[0] * plotHeight + offset };
    });
    const coordinates = points.map(({ x, y }) => `${x},${y}`).join(' ');
    return `<g style="--chart-accent:${business.accent}; --series-order:${index}">
      <polyline class="trend-line" pathLength="1" points="${coordinates}"/>
      ${points.map(({ x, y }, day) => `<circle class="trend-point" cx="${x}" cy="${y}" r="3">
        <title>${days[day].label} · ${business.name}: ${counts[day]}</title>
      </circle>`).join('')}
    </g>`;
  }).join('');
  const summary = series.map(({ business, counts }) =>
    `${business.name}: ${days.map(({ label }, index) => `${label} ${counts[index]}`).join(', ')}.`
  ).join(' ');

  return `<section class="home-panel home-chart-panel" aria-labelledby="enquiry-activity">
    <header><h2 id="enquiry-activity">Enquiry activity</h2><span>Enquiries per day</span></header>
    <div class="home-chart-area">
      <div class="home-chart-scale" aria-hidden="true">${scale.map(value => `<span>${value}</span>`).join('')}</div>
      <svg class="home-chart" viewBox="0 0 640 164" preserveAspectRatio="none" role="img" aria-labelledby="enquiry-activity" aria-describedby="trend-description">
        <desc id="trend-description">${summary}</desc>
        <path class="trend-grid" d="${scale.map((_, index) => `M8 ${8 + index * plotHeight / 3} H632`).join(' ')}"/>
        ${lines}
      </svg>
      <div class="home-chart-labels" aria-hidden="true">${days.map(({ label }) => `<span>${label}</span>`).join('')}</div>
    </div>
    <div class="home-legend">${series.map(({ business }) =>
      `<span style="--chart-accent:${business.accent}">${business.name}</span>`
    ).join('')}</div>
  </section>`;
}

function attentionPanel(followUps) {
  const date = today();
  const showDate = due => due === date ? 'Today' : due < date ? 'Overdue' : formatDate(due);
  return `<section class="home-panel home-attention" aria-labelledby="attention-heading">
    <header><h2 id="attention-heading">Needs attention</h2><span>${followUps.length} ${followUps.length === 1 ? 'item' : 'items'}</span></header>
    ${followUps.length ? `<ul class="home-followups">${followUps.map(({ business, customer, task, date: due }) =>
      `<li><a href="#workspace/${business.id}/follow-ups" style="--chart-accent:${business.accent}">
        <span class="follow-icon">${icon('clock')}</span>
        <div><strong>${escapeHtml(task)}</strong><small>${business.name} · ${escapeHtml(customer)}</small></div>
        <time datetime="${escapeHtml(due)}">${showDate(due)}</time>
      </a></li>`
    ).join('')}</ul>` : '<p class="home-attention-empty">You’re all caught up.</p>'}
  </section>`;
}

function renderHome(animate) {
  const { days, series, followUps } = getOperationsOverview();
  main.innerHTML = `
    <div class="home-wrap${animate ? ' home-entrance' : ''}">
      <section class="home-hero" aria-labelledby="home-heading">
        <div>
          <h1 id="home-heading">Operations <span>overview.</span></h1>
          <div class="home-hero-foot">
            <p>Enquiries, quotes and follow-ups across all three businesses.</p>
            <a class="hero-action" href="#demo"><span class="hero-play">${icon('play')}</span>See how it works</a>
          </div>
        </div>
        <span class="home-date">Last 7 days</span>
      </section>
      <div class="home-boards">
        ${enquiryChart(days, series)}
        ${attentionPanel(followUps)}
      </div>
      <section class="business-picker" aria-labelledby="business-heading">
        <div class="business-heading"><h2 id="business-heading">Business workspaces</h2></div>
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
    renderHome(newPage);
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

function updateSceneMotion() {
  document.body.classList.toggle('motion-paused', document.hidden);
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
  const card = event.target.closest('.business-card, .home-panel');
  if (!card || motion.matches || event.pointerType !== 'mouse') return;
  const bounds = card.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - .5;
  const y = (event.clientY - bounds.top) / bounds.height - .5;
  card.classList.add('pointer-hover');
  card.style.setProperty('--card-shift', `${x * 9}px`);
  card.style.setProperty('--shift-x', `${x * -13}px`);
  card.style.setProperty('--shift-y', `${y * -9}px`);
});

main.addEventListener('pointerout', event => {
  const card = event.target.closest('.pointer-hover');
  if (card && !card.contains(event.relatedTarget)) card.classList.remove('pointer-hover');
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
document.addEventListener('visibilitychange', updateSceneMotion);
updateSceneMotion();
render();
