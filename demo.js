import {
  advanceDemo, businesses, currency, formatDate, getDemo, getMetrics, replayDemo
} from "./data.js";

const steps = [
  ["Business", "Choose a business"],
  ["Capture", "New enquiry captured."],
  ["Quote", "Create a quotation."],
  ["Send", "Send the quotation."],
  ["Follow up", "Quotation sent and tracked."],
  ["Accepted", "Customer accepted."]
];

const icons = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6 6-6-6 6-6"/>',
  chat: '<path d="M20 11a8 8 0 0 1-8 8H9l-5 2 1.1-4A8 8 0 1 1 20 11Z"/><path d="M8 11h8m-8 3h5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  checks: '<path d="m2 12 4 4L16 6m-5 10L21 6"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4M9 12h6m-6 4h6"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  replay: '<path d="M4 11a8 8 0 1 1 2 6M4 5v6h6"/>'
};

function icon(name) {
  return `<svg class="wa-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}

function text(value) {
  const entities = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"};
  return String(value ?? "").replace(/[&<>"']/g, character => entities[character]);
}

function customerName(business, demo) {
  return demo.enquiry?.customer ?? business.demoCustomer;
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map(word => word[0] || "").join("").toUpperCase();
}

function phone(business, demo, animated) {
  const {stage, quotation} = demo;
  const customer = customerName(business, demo);
  const sent = stage >= 5 && quotation;
  return `
    <section class="wa-phone-wrap" aria-label="Simulated WhatsApp conversation">
      <div class="wa-phone-label">${icon("chat")} WhatsApp</div>
      <div class="wa-phone">
        <div class="wa-phone-screen">
          <div class="wa-phone-status"><span>09:41</span><i></i><span class="wa-phone-signal" aria-hidden="true">▮▮▮ <b></b></span></div>
          <header class="wa-chat-header">
            <span class="wa-avatar">${text(initials(customer))}</span>
            <div><b>${text(customer)}</b><span>${text(business.name)}</span></div>
            ${icon("chat")}
          </header>
          <div class="wa-conversation">
            <span class="wa-chat-date">Today</span>
            ${stage === 1 ? `<div class="wa-phone-empty">${icon("chat")}<span>Waiting for the first message</span></div>` : `
              <div class="wa-bubble wa-incoming ${animated && stage === 2 ? "wa-enter" : ""}">
                ${text(business.message)} <time>09:41</time>
              </div>
            `}
            ${sent ? `
              <div class="wa-bubble wa-outgoing ${animated && stage === 5 ? "wa-enter" : ""}">
                Hi ${text(customer.split(" ")[0])}, here’s your quote.
                <div class="wa-chat-quote">${icon("file")}<div><b>${text(currency(quotation.amount))}</b><span>${text(quotation.service)}</span></div></div>
                <time>09:42 ${icon("checks")}</time>
              </div>
            ` : ""}
            ${stage === 6 ? `<div class="wa-bubble wa-incoming ${animated ? "wa-enter" : ""}">Thanks, happy to go ahead. <time>09:43</time></div>` : ""}
          </div>
          <div class="wa-phone-bottom"><div></div></div>
        </div>
      </div>
    </section>`;
}

function metric(label, value, changed) {
  return `
    <div class="wa-mini-metric">
      <span>${label}</span>
      <div>
        <strong class="${changed ? "wa-count-in" : ""}">${value}</strong>
        ${changed ? `<span class="wa-delta" aria-label="increased by one">+1</span>` : ""}
      </div>
    </div>`;
}

function activity(business, demo) {
  const {stage, enquiry, quotation, followUp} = demo;
  const customer = customerName(business, demo);
  switch (stage) {
    case 1:
      return `
        <div class="wa-action-panel wa-idle">
          <span class="wa-action-icon">${icon("chat")}</span>
          <div><h2>Incoming enquiries</h2><p>${text(business.message)}</p></div>
        </div>`;
    case 2:
      return `
        <div class="wa-action-panel">
          <span class="wa-action-icon">${icon("chat")}</span>
          <div><h2>${text(customer)}</h2><p>${text(enquiry?.service ?? business.demoService)}</p><small>WhatsApp · ${text(formatDate(enquiry?.date))}</small></div>
          <span class="wa-status">${text(enquiry?.status ?? "New")}</span>
        </div>`;
    case 3:
      return `
        <form class="wa-quote-form" id="wa-quote-form">
          <div class="wa-action-panel">
            <span class="wa-action-icon">${icon("file")}</span>
            <div><h2>${text(customer)}</h2><p>${text(enquiry?.service ?? business.demoService)}</p></div>
          </div>
          <label for="wa-amount">Quotation amount</label>
          <div class="wa-amount-wrap"><span>R</span><input id="wa-amount" name="amount" type="number" inputmode="decimal" step="0.01" min="0.01" max="99999999.99" required value="${business.demoAmount}"></div>
        </form>`;
    case 4:
    case 5:
    case 6:
      return `
        <div class="wa-action-panel">
          <span class="wa-action-icon">${icon("file")}</span>
          <div><h2>${text(currency(quotation?.amount))}</h2><p>${text(customer)} · ${text(quotation?.service)}</p></div>
          <span class="wa-status">${text(quotation?.status)}</span>
        </div>
        ${followUp ? `
          <div class="wa-follow-up">
            ${icon(followUp.completed ? "check" : "clock")}
            <div><b>${text(followUp.task)}</b><span>${followUp.completed ? "Reminder completed" : `Due ${text(formatDate(followUp.date))}`}</span></div>
          </div>
        ` : ""}
      `;
    default:
      return "";
  }
}

function miniature(business, demo, animated) {
  const metrics = getMetrics(business.id);
  return `
    <section class="wa-mini-wrap" aria-label="Live dashboard preview">
      <div class="wa-phone-label">${icon("grid")} Ironstone workspace</div>
      <div class="wa-mini">
        <header class="wa-mini-head">
          <span class="wa-mini-logo">${icon("grid")}</span>
          <div><b>${text(business.name)}</b><span>Overview</span></div>
          <span class="wa-mini-live"><i></i> Live preview</span>
        </header>
        <div class="wa-mini-content">
          <div class="wa-mini-metrics">
            ${metric("New enquiries", metrics.newEnquiries, animated && demo.stage === 2)}
            ${metric("Pending quotes", metrics.pendingQuotations, animated && demo.stage === 4)}
            ${metric("Accepted quotes", metrics.acceptedQuotations, animated && demo.stage === 6)}
          </div>
          <div class="wa-mini-activity ${animated ? "wa-enter" : ""}">
            <p class="wa-activity-label" id="wa-current-stage">${steps[demo.stage - 1][1]}</p>
            ${activity(business, demo)}
            ${demo.stage === 5 ? '<p class="wa-reminder-note">The dashboard reminds you when a quote needs a follow-up.</p>' : ""}
          </div>
        </div>
      </div>
    </section>`;
}

function progress(stage) {
  return `
    <ol class="wa-progress" aria-label="Demonstration progress">
      ${steps.map(([name], index) => {
        const current = stage === index + 1;
        const complete = stage > index + 1;
        return `<li ${current ? 'aria-current="step"' : ""} class="${current ? "wa-current" : ""} ${complete ? "wa-past" : ""}">
          <span aria-hidden="true">${complete ? icon("check") : index + 1}</span><b>${name}</b>
        </li>`;
      }).join("")}
    </ol>`;
}

function controls(business, stage) {
  const labels = ["Next step", "Create quotation", "Save quotation", "Send via WhatsApp", "Simulate acceptance"];
  const primary = 'class="wa-button wa-primary" aria-describedby="wa-current-stage"';
  const callToAction = stage === 6
    ? `<a ${primary} href="#workspace/${business.id}">Explore Dashboard ${icon("arrow")}</a>`
    : stage === 3
      ? `<button ${primary} type="submit" form="wa-quote-form">${labels[stage - 1]} ${icon("arrow")}</button>`
      : `<button ${primary} type="button" data-wa-action="next">${labels[stage - 1]} ${icon("arrow")}</button>`;
  return `
    <footer class="wa-controls">
      <a class="wa-button wa-back" href="#businesses" aria-label="Return to dashboard" title="Return to dashboard">${icon("back")} <span>Return to dashboard</span></a>
      <div>
        <button class="wa-button wa-replay" type="button" data-wa-action="replay" aria-label="Replay demo" title="Replay demo">${icon("replay")} <span>${stage === 6 ? "Replay Demo" : "Replay"}</span></button>
        ${callToAction}
      </div>
    </footer>`;
}

function businessSelector(business) {
  return `
    <div class="wa-selector" role="group" aria-label="Choose a business">
      ${businesses.map(option => `<button type="button" data-wa-business="${option.id}" aria-pressed="${business.id === option.id}" style="--wa-dot: ${option.accent}">
        <span></span>${text(option.name)}
      </button>`).join("")}
    </div>`;
}

export function renderDemo(root, {animated = false, focusActivity = false} = {}) {
  const demo = getDemo();
  const {stage, businessId} = demo;
  const business = businesses.find(option => option.id === businessId) || businesses[0];
  const transferring = animated && [2, 5, 6].includes(stage);
  const toPhone = [4, 5].includes(stage);
  root.innerHTML = `
    <article class="wa-demo" style="--wa-business: ${business.accent}" aria-labelledby="wa-title">
      <header class="wa-intro">
        <span class="wa-demo-label"><i></i> Simulated WhatsApp integration</span>
        <h1 id="wa-title" tabindex="-1">${stage === 6 ? "Less admin. More business." : "From message to accepted quote."}</h1>
        <p>${stage === 6 ? "Every enquiry, quotation and client conversation. Organised in one place." : "See how a WhatsApp enquiry moves through your business."}</p>
        ${stage === 1 ? businessSelector(business) : ""}
      </header>
      ${progress(stage)}
      <div class="wa-stage">
        ${phone(business, demo, animated)}
        <div class="wa-connector${transferring ? " wa-transferring" : ""}${toPhone ? " wa-to-phone" : ""}" aria-hidden="true"><i></i><span>${icon("arrow")}</span><i></i></div>
        ${miniature(business, demo, animated)}
      </div>
      ${controls(business, stage)}
      <div class="wa-error" role="alert" hidden></div>
    </article>`;

  const page = root.querySelector(".wa-demo");
  const conversation = page.querySelector(".wa-conversation");
  conversation.scrollTop = conversation.scrollHeight;
  if (focusActivity) {
    const next = stage === 6 ? page.querySelector("#wa-title") : page.querySelector(".wa-primary");
    (stage === 3 ? page.querySelector("#wa-amount") : next)?.focus({preventScroll: true});
    if (matchMedia("(max-width: 620px)").matches) {
      const result = {
        2: ".wa-phone",
        3: ".wa-mini-wrap",
        4: ".wa-mini-wrap",
        5: ".wa-phone",
        6: "#wa-title"
      }[stage];
      page.querySelector(result)?.scrollIntoView({block: "center"});
    }
  }

  const runDemoAction = (operation, options) => {
    try {
      operation();
      renderDemo(root, options);
    } catch {
      const feedback = page.querySelector(".wa-error");
      feedback.hidden = false;
      feedback.textContent = "The demo could not save this change. Check that browser storage is available and try again.";
    }
  };

  page.addEventListener("click", event => {
    const selection = event.target.closest("[data-wa-business]");
    if (selection) {
      const selectedId = selection.dataset.waBusiness;
      runDemoAction(() => advanceDemo(selectedId, 1));
      root.querySelector(`[data-wa-business="${selectedId}"]`)?.focus({preventScroll: true});
      return;
    }
    const action = event.target.closest("[data-wa-action]")?.dataset.waAction;
    if (action === "replay") {
      runDemoAction(() => replayDemo(business.id));
      root.querySelector("[data-wa-business][aria-pressed=true]")?.focus();
    }
    if (action === "next") {
      runDemoAction(() => advanceDemo(business.id, stage + 1), {animated: true, focusActivity: true});
    }
  });

  page.querySelector("#wa-quote-form")?.addEventListener("submit", event => {
    event.preventDefault();
    const amount = new FormData(event.currentTarget).get("amount");
    runDemoAction(() => advanceDemo(business.id, 4, Number(amount)), {animated: true, focusActivity: true});
  });
}
