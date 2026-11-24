import {
  businesses, getWorkspace, getMetrics, saveEnquiry, saveQuotation,
  setQuotationStatus, saveFollowUp, completeFollowUp, currency, today, formatDate
} from './data.js';

const paths = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
  enquiries: '<path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-5 4V5a1 1 0 0 1 1-1Z"/><path d="M7 9h10M7 13h6"/>',
  quotations: '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v6h5M8.5 13h7M8.5 17h5"/>',
  clients: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 5a3 3 0 0 1 0 6m2 3a4 4 0 0 1 3 4v2"/>',
  'follow-ups': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  diagonal: '<path d="M6 18 18 6M8 6h10v10"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  boreholes: '<path d="M8 21h8M12 3v18M9 7h6L12 3 9 7Zm-3 8 6-8 6 8M6 15h12"/>',
  asbestos: '<path d="M12 3 4 6v5c0 4.8 3.3 8 8 10 4.7-2 8-5.2 8-10V6l-8-3Z"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>',
  plant: '<circle cx="9" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><path d="M5 18a3 3 0 0 1 3-3h9a3 3 0 0 1 0 6H8a3 3 0 0 1-3-3Zm7-3V7h4l2 8M11 8 6 5 3 12m0 0h4l2 2"/>'
};

const tabs = {
  overview: 'Overview',
  enquiries: 'Enquiries',
  quotations: 'Quotations',
  clients: 'Clients',
  'follow-ups': 'Follow-ups'
};

const enquiryStatuses = ['New', 'In progress', 'Quoted', 'Accepted', 'Closed'];
const quoteStatuses = ['Draft', 'Sent', 'Accepted', 'Declined'];
const sources = ['WhatsApp', 'Email', 'Manual entry'];
const tones = {
  New: 'green', Accepted: 'green', Sent: 'blue', Quoted: 'blue',
  'In progress': 'amber', Due: 'amber', Declined: 'red', WhatsApp: 'green'
};

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, token => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[token]));

const icon = name => '<svg aria-hidden="true" class="ws-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || paths.overview) + '</svg>';
const route = (id, section) => '#workspace/' + encodeURIComponent(id) + '/' + section;
const badge = label => '<span class="ws-badge" data-tone="' + (tones[label] || 'neutral') + '"><i></i>' + escapeHtml(label) + '</span>';
const initials = name => escapeHtml(name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase());
const dateLabel = date => date ? escapeHtml(formatDate(date)) : '—';
const empty = text => '<p class="ws-empty">' + escapeHtml(text) + '</p>';

function button(label, action, { id, primary = false, glyph } = {}) {
  return `<button type="button" class="ws-button${primary ? ' ws-primary' : ''}" data-ws-action="${action}"${id ? ` data-ws-id="${escapeHtml(id)}"` : ''}>${glyph ? icon(glyph) : ''}${escapeHtml(label)}</button>`;
}

function headingFor(section) {
  return {
    enquiries: ['Enquiries', 'Review incoming requests and turn them into quotations.', 'Add enquiry', 'add-enquiry'],
    quotations: ['Quotations', 'Prepare estimates and track customer decisions.', 'New quotation', 'add-quote'],
    clients: ['Clients', 'Contact details, requests and conversation history.'],
    'follow-ups': ['Follow-ups', 'Keep track of the people and requests that need your attention.', 'Add follow-up', 'add-follow']
  }[section];
}

function workspaceNavigation(business, section) {
  const links = Object.entries(tabs).map(([key, heading]) =>
    `<a href="${route(business.id, key)}"${section === key ? ' aria-current="page"' : ''}>${icon(key)}<span>${heading}</span></a>`
  ).join('');
  return `<div class="ws-controls">
    <a class="ws-back" href="#businesses">${icon('back')}<span>All businesses</span></a>
    <nav class="ws-tabs" aria-label="${escapeHtml(business.name)} workspace">${links}</nav>
  </div>`;
}

function workspaceHeader(business, section) {
  const options = businesses.map(item =>
    `<option value="${escapeHtml(item.id)}"${item.id === business.id ? ' selected' : ''}>${escapeHtml(item.name)}</option>`
  ).join('');
  return `<header class="ws-heading">
    <div class="ws-heading-main">
      <div class="ws-business-icon">${icon(business.id)}</div>
      <div>
        <p class="ws-context">${escapeHtml(business.description || business.subtitle || 'Business workspace')}</p>
        <${section === 'overview' ? 'h1' : 'p'} class="ws-business-name">${escapeHtml(business.name)}</${section === 'overview' ? 'h1' : 'p'}>
      </div>
    </div>
    <label class="ws-switcher"><span>Switch business</span><span class="ws-select">
      <select aria-label="Switch business">${options}</select>${icon('down')}
    </span></label>
  </header>`;
}

function metricCards(business, metrics) {
  const cards = [
    ['New enquiries', metrics.newEnquiries, 'enquiries', 'enquiries'],
    ['Pending quotations', metrics.pendingQuotations, 'quotations', 'quotations'],
    ['Accepted quotations', metrics.acceptedQuotations, 'quotations', 'check'],
    ['Follow-ups due', metrics.followUpsDue, 'follow-ups', 'follow-ups']
  ];
  return `<div class="ws-metrics">${cards.map(([label, count, section, glyph]) => `
    <a href="${route(business.id, section)}" class="ws-metric">
      <span class="ws-metric-top"><span>${label}</span><span class="ws-metric-icon">${icon(glyph)}</span></span>
      <span class="ws-metric-bottom"><strong>${count}</strong>${icon('diagonal')}</span>
    </a>`).join('')}</div>`;
}

function compactRow(action, item, name, detail, end, glyph) {
  return `<button type="button" class="ws-activity-row" data-ws-action="${action}" data-ws-id="${escapeHtml(item.id)}">
    <span class="ws-avatar">${glyph ? icon(glyph) : initials(name)}</span>
    <span class="ws-activity-label"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(detail)}</small></span>
    <span class="ws-activity-end">${end}</span>
  </button>`;
}

function activityPanel(business, section, heading, rows, emptyMessage, extraClass = '') {
  return `<section class="ws-activity ${extraClass}" aria-label="${heading}">
    <header><h2>${heading}</h2><a href="${route(business.id, section)}" aria-label="View all ${tabs[section].toLowerCase()}">View all ${icon('arrow')}</a></header>
    <div class="ws-activity-list">${rows.length ? rows.join('') : empty(emptyMessage)}</div>
  </section>`;
}

function overview(business, workspace) {
  const recent = [...workspace.enquiries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
    .map(item => compactRow('view-enquiry', item, item.customer, item.service, badge(item.status)));
  const outstanding = workspace.quotations.filter(item => ['Draft', 'Sent'].includes(item.status)).slice(0, 2)
    .map(item => compactRow('view-quote', item, item.customer, item.service, escapeHtml(currency(item.amount)), 'quotations'));
  const upcoming = workspace.followUps.filter(item => !item.completed).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2)
    .map(item => compactRow('view-follow', item, item.task, item.customer, dateLabel(item.date), 'calendar'));
  return `
    ${metricCards(business, getMetrics(business.id))}
    <div class="ws-activity-grid">
      ${activityPanel(business, 'enquiries', 'Recent enquiries', recent, 'No enquiries yet.', 'ws-activity-recent')}
      ${activityPanel(business, 'quotations', 'Outstanding quotations', outstanding, 'No outstanding quotations.')}
      ${activityPanel(business, 'follow-ups', 'Upcoming follow-ups', upcoming, 'No follow-ups scheduled.')}
    </div>`;
}

function listRow(action, item, name, detail, end, glyph) {
  return `<button type="button" class="ws-list-row" data-ws-action="${action}" data-ws-id="${escapeHtml(item.id)}">
    <span class="ws-avatar">${glyph ? icon(glyph) : initials(name)}</span>
    <span class="ws-list-label"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(detail)}</small></span>
    <span class="ws-list-end">${end}</span>
    <span class="ws-row-arrow">${icon('arrow')}</span>
  </button>`;
}

function workspaceList(workspace, section) {
  const [heading, description, actionLabel, action] = headingFor(section);
  let rows;
  let emptyMessage;
  switch (section) {
    case 'enquiries':
      rows = workspace.enquiries.map(item => listRow('view-enquiry', item, item.customer, item.service,
        `<span class="ws-list-detail">${escapeHtml(item.phone || item.email)}<small>${dateLabel(item.date)}</small></span>${badge(item.source)}${badge(item.status)}`));
      emptyMessage = 'New enquiries will appear here.';
      break;
    case 'quotations':
      rows = workspace.quotations.map(item => listRow('view-quote', item, item.customer, item.service,
        `<span class="ws-list-detail">${escapeHtml(currency(item.amount))}<small>${dateLabel(item.date)}</small></span>${badge(item.status)}`, 'quotations'));
      emptyMessage = 'Create a quotation here or start from an enquiry.';
      break;
    case 'clients':
      rows = workspace.clients.map(item => {
        const count = workspace.enquiries.filter(record => record.clientId === item.id).length;
        return listRow('view-client', item, item.name, [item.phone, item.email].filter(Boolean).join(' · '),
          `<span class="ws-list-detail">${count} ${count === 1 ? 'enquiry' : 'enquiries'}</span>`);
      });
      emptyMessage = 'Customers are added when you create an enquiry or quotation.';
      break;
    case 'follow-ups':
      rows = [...workspace.followUps].sort((a, b) => Number(a.completed) - Number(b.completed) || a.date.localeCompare(b.date))
        .map(item => listRow('view-follow', item, item.task, item.customer,
          `<span class="ws-list-detail">${dateLabel(item.date)}</span>${badge(item.completed ? 'Completed' : item.date <= today() ? 'Due' : 'Scheduled')}`, 'calendar'));
      emptyMessage = 'No follow-ups scheduled.';
      break;
  }
  return `<section aria-labelledby="ws-section-title" class="ws-section">
    <header class="ws-section-head"><div><h1 id="ws-section-title">${heading}</h1><p>${description}</p></div>
      ${action ? button(actionLabel, action, { primary: true, glyph: 'plus' }) : ''}
    </header>
    <div class="ws-record-list">${rows.length ? rows.join('') : empty(emptyMessage)}</div>
  </section>`;
}

function field(label, name, value = '', { type = 'text', required = false, wide = false, placeholder = '', attrs = '' } = {}) {
  return `<label class="ws-field${wide ? ' ws-field-wide' : ''}"><span>${label}</span>
    <input name="${name}" type="${type}" value="${escapeHtml(value)}"${required ? ' required' : ''} placeholder="${escapeHtml(placeholder)}" ${attrs}>
  </label>`;
}

function selectField(label, name, options, value, { wide = false, required = false } = {}) {
  return `<label class="ws-field${wide ? ' ws-field-wide' : ''}"><span>${label}</span>
    <select name="${name}"${required ? ' required' : ''}>${options.map(option => {
      const [key, text] = Array.isArray(option) ? option : [option, option];
      return `<option value="${escapeHtml(key)}"${key === value ? ' selected' : ''}>${escapeHtml(text)}</option>`;
    }).join('')}</select>
  </label>`;
}

function areaField(label, name, value, { required = false, placeholder = '' } = {}) {
  return `<label class="ws-field ws-field-wide"><span>${label}</span><textarea name="${name}" rows="3" maxlength="1000"${required ? ' required' : ''} placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea></label>`;
}

function customerFields(record) {
  return field('Customer name', 'customer', record.customer, { required: true, wide: true, attrs: 'maxlength="100"' }) +
    field('Phone', 'phone', record.phone, { type: 'tel', attrs: 'maxlength="40"' }) +
    field('Email', 'email', record.email, { type: 'email', attrs: 'maxlength="160"' });
}

function formContent(action, id, fields, submitLabel) {
  return `<form class="ws-form" data-ws-form="${action}"${id ? ` data-ws-id="${escapeHtml(id)}"` : ''}>
    <div class="ws-form-fields">${fields}</div>
    <p class="ws-form-error" role="alert" hidden></p>
    <div class="ws-dialog-actions">${button('Cancel', 'close-dialog')}<button class="ws-button ws-primary" type="submit">${submitLabel}</button></div>
  </form>`;
}

function enquiryForm(record = {}) {
  return formContent('enquiry', record.id,
    customerFields(record) +
    areaField('Service required', 'service', record.service, { required: true }) +
    selectField('Source', 'source', sources, record.source || 'Manual entry') +
    field('Date received', 'date', record.date || today(), { type: 'date', required: true }) +
    selectField('Status', 'status', enquiryStatuses, record.status || 'New', { wide: true }),
    record.id ? 'Save changes' : 'Add enquiry');
}

function quotationForm(record = {}, enquiryId = '') {
  const fields = customerFields(record) +
    areaField('Service description', 'service', record.service, { required: true }) +
    field('Amount (ZAR)', 'amount', record.amount, { type: 'number', required: true, attrs: 'min="0.01" step="0.01" max="999999999"' }) +
    field('Quotation date', 'date', record.date || today(), { type: 'date', required: true }) +
    areaField('Notes', 'notes', record.notes, { placeholder: 'Optional terms or scope' });
  return formContent('quote', record.id,
    fields + `<input type="hidden" name="enquiryId" value="${escapeHtml(record.enquiryId || enquiryId)}"><input type="hidden" name="clientId" value="${escapeHtml(record.clientId)}">`,
    record.id ? 'Save changes' : 'Save quotation');
}

function followUpForm(workspace, record = {}, type = '') {
  const context = type === 'quote' ? `<input type="hidden" name="quotationId" value="${escapeHtml(record.id)}">` :
    type === 'enquiry' ? `<input type="hidden" name="enquiryId" value="${escapeHtml(record.id)}">` : '';
  const client = record.clientId
    ? `<p class="ws-field-wide ws-dialog-lead">${escapeHtml(record.customer)}</p><input type="hidden" name="clientId" value="${escapeHtml(record.clientId)}">`
    : selectField('Client', 'clientId', [['', 'Choose a client'], ...workspace.clients.map(item => [item.id, item.name])], '', { wide: true, required: true });
  return formContent('follow', '',
    client +
    areaField('Reminder', 'task', record.service ? `Follow up on ${record.service}` : '', { required: true, placeholder: 'Call about the outstanding quotation' }) +
    field('Due date', 'date', today(), { type: 'date', required: true, wide: true }) + context, 'Add follow-up');
}

function detailList(items) {
  return `<dl class="ws-details">${items.map(([label, value]) => `<div><dt>${label}</dt><dd>${value || '—'}</dd></div>`).join('')}</dl>`;
}

function enquiryDetail(record) {
  return `
    <p class="ws-dialog-lead">${escapeHtml(record.service)}</p>
    ${detailList([['Phone', escapeHtml(record.phone)], ['Email', escapeHtml(record.email)], ['Source', badge(record.source)], ['Received', dateLabel(record.date)], ['Status', badge(record.status)]])}
    <div class="ws-dialog-actions">
      ${button('Add follow-up', 'follow-enquiry', { id: record.id })}
      ${button('Edit enquiry', 'edit-enquiry', { id: record.id })}
      ${button('Create quotation', 'quote-from-enquiry', { id: record.id, primary: true, glyph: 'plus' })}
    </div>`;
}

function quoteDetail(record, business) {
  const open = ['Draft', 'Sent'].includes(record.status);
  return `<div class="ws-quote-preview">
    <header><div><span>${escapeHtml(business.name)}</span><strong>Quotation</strong></div>${badge(record.status)}</header>
    <div class="ws-quote-content">
      ${detailList([['Prepared for', escapeHtml(record.customer)], ['Date', dateLabel(record.date)], ['Phone', escapeHtml(record.phone)], ['Email', escapeHtml(record.email)]])}
      <p class="ws-dialog-lead">${escapeHtml(record.service)}</p>
      ${record.notes ? `<p class="ws-notes">${escapeHtml(record.notes)}</p>` : ''}
    </div>
    <footer><span>Total · ZAR</span><strong>${escapeHtml(currency(record.amount))}</strong></footer>
  </div>
  <div class="ws-dialog-actions ws-quote-actions">
    ${open ? button('Add follow-up', 'follow-quote', { id: record.id }) : ''}
    ${record.status === 'Draft' ? button('Edit quotation', 'edit-quote', { id: record.id }) : ''}
    ${open ? button('Send quotation', 'send-quote', { id: record.id, primary: true, glyph: 'arrow' }) : ''}
  </div>
  <form class="ws-status-form" data-ws-form="quote-status" data-ws-id="${escapeHtml(record.id)}">
    ${selectField('Quotation status', 'status', quoteStatuses, record.status)}
    <button class="ws-button" type="submit">Update status</button>
    <p class="ws-form-error" role="alert" hidden></p>
  </form>`;
}

function sendForm(record) {
  return `<p class="ws-dialog-lead">Simulate sending ${escapeHtml(currency(record.amount))} to ${escapeHtml(record.customer)}.</p>
    ${formContent('send', record.id, selectField('Send via', 'channel', ['WhatsApp', 'Email'], record.channel || 'WhatsApp', { wide: true }), 'Simulate send')}`;
}

function clientDetail(client, workspace) {
  const enquiries = workspace.enquiries.filter(item => item.clientId === client.id);
  const quotations = workspace.quotations.filter(item => item.clientId === client.id);
  return `
    ${detailList([['Phone', escapeHtml(client.phone)], ['Email', escapeHtml(client.email)]])}
    <section class="ws-client-section" aria-label="Previous enquiries"><h3>Previous enquiries</h3>
      ${enquiries.length ? enquiries.map(item => compactRow('view-enquiry', item, item.service, formatDate(item.date), badge(item.status), 'enquiries')).join('') : empty('No enquiries recorded.')}
    </section>
    <section class="ws-client-section" aria-label="Quotations"><h3>Quotations</h3>
      ${quotations.length ? quotations.map(item => compactRow('view-quote', item, item.service, currency(item.amount), badge(item.status), 'quotations')).join('') : empty('No quotations recorded.')}
    </section>
    <section class="ws-client-section" aria-label="Communication history"><h3>Communication history</h3>
      ${client.communications.length ? client.communications.map(item => `<div class="ws-communication"><div>${badge(item.source)}<small>${dateLabel(item.date)}</small></div><p>${escapeHtml(item.message)}</p></div>`).join('') : empty('No communications recorded.')}
    </section>`;
}

function followUpDetail(item) {
  return `<p class="ws-dialog-lead">${escapeHtml(item.task)}</p>
    ${detailList([['Client', escapeHtml(item.customer)], ['Due date', dateLabel(item.date)], ['Status', badge(item.completed ? 'Completed' : item.date <= today() ? 'Due' : 'Scheduled')]])}
    <div class="ws-dialog-actions">
      ${item.enquiryId ? button('View enquiry', 'view-enquiry', { id: item.enquiryId }) : ''}
      ${item.quotationId ? button('View quotation', 'view-quote', { id: item.quotationId }) : ''}
      ${item.completed ? '' : button('Mark complete', 'complete-follow', { id: item.id, primary: true, glyph: 'check' })}
    </div>`;
}

export function renderWorkspace(root, { business, section = 'overview', notice = '' }) {
  const workspace = getWorkspace(business.id);
  if (!Object.hasOwn(tabs, section)) section = 'overview';
  root.innerHTML = `<div class="ws-stage" data-business="${escapeHtml(business.id)}">
    ${workspaceNavigation(business, section)}
    <div class="ws-frame">
      ${workspaceHeader(business, section)}
      ${section === 'overview' ? overview(business, workspace) : workspaceList(workspace, section)}
    </div>
    <dialog class="ws-dialog" aria-labelledby="ws-dialog-title">
      <header class="ws-dialog-head"><h2 id="ws-dialog-title"></h2><button type="button" class="ws-dialog-close" data-ws-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></header>
      <div class="ws-dialog-body"></div>
    </dialog>
    <div class="ws-feedback" role="status"${notice ? '' : ' hidden'}>${icon('check')}<span>${escapeHtml(notice)}</span></div>
  </div>`;
  const stage = root.querySelector('.ws-stage');
  const dialog = stage.querySelector('dialog');
  const find = (collection, id) => workspace[collection].find(item => item.id === id);
  const show = (title, content, focus = false) => {
    dialog.querySelector('h2').textContent = title;
    dialog.querySelector('.ws-dialog-body').innerHTML = content;
    if (!dialog.open) dialog.showModal();
    if (focus) dialog.querySelector('form input:not([type=hidden]), form select, form textarea')?.focus();
  };
  const refresh = message => {
    dialog.close();
    renderWorkspace(root, { business, section, notice: message });
    root.querySelector('.ws-frame h1').setAttribute('tabindex', '-1');
    root.querySelector('.ws-frame h1').focus({ preventScroll: true });
  };
  if (notice) {
    const feedback = stage.querySelector('.ws-feedback');
    setTimeout(() => { feedback.hidden = true; }, 4400);
  }

  stage.querySelector('.ws-switcher select').addEventListener('change', event => {
    location.hash = route(event.target.value, section);
  });

  stage.addEventListener('click', event => {
    const control = event.target.closest('[data-ws-action]');
    if (!control) return;
    const { wsAction: action, wsId: id } = control.dataset;
    switch (action) {
      case 'close-dialog': dialog.close(); break;
      case 'add-enquiry': show('Add enquiry', enquiryForm(), true); break;
      case 'view-enquiry': {
        const item = find('enquiries', id);
        if (item) show(item.customer, enquiryDetail(item));
        break;
      }
      case 'edit-enquiry': {
        const item = find('enquiries', id);
        if (item) show('Edit enquiry', enquiryForm(item), true);
        break;
      }
      case 'add-quote': show('New quotation', quotationForm(), true); break;
      case 'quote-from-enquiry': {
        const item = find('enquiries', id);
        if (item) show('Create quotation', quotationForm({ ...item, id: null, date: today() }, id), true);
        break;
      }
      case 'view-quote': {
        const item = find('quotations', id);
        if (item) show('Quotation preview', quoteDetail(item, business));
        break;
      }
      case 'edit-quote': {
        const item = find('quotations', id);
        if (item) show('Edit quotation', quotationForm(item), true);
        break;
      }
      case 'send-quote': {
        const item = find('quotations', id);
        if (item) show('Send quotation', sendForm(item), true);
        break;
      }
      case 'view-client': {
        const item = find('clients', id);
        if (item) show(item.name, clientDetail(item, workspace));
        break;
      }
      case 'add-follow':
        if (workspace.clients.length) show('Add follow-up', followUpForm(workspace), true);
        else show('Add follow-up', `<p class="ws-dialog-lead">Add an enquiry to create a client first.</p><div class="ws-dialog-actions">${button('Add enquiry', 'add-enquiry', { primary: true })}</div>`);
        break;
      case 'follow-enquiry':
      case 'follow-quote': {
        const isQuote = action === 'follow-quote';
        const item = find(isQuote ? 'quotations' : 'enquiries', id);
        if (item) show('Add follow-up', followUpForm(workspace, item, isQuote ? 'quote' : 'enquiry'), true);
        break;
      }
      case 'view-follow': {
        const item = find('followUps', id);
        if (item) show('Follow-up reminder', followUpDetail(item));
        break;
      }
      case 'complete-follow':
        try {
          completeFollowUp(business.id, id);
          refresh('Follow-up completed.');
        } catch (error) {
          show('Follow-up reminder', `<p role="alert" class="ws-form-error">${escapeHtml(error.message || 'The reminder could not be updated.')}</p>`);
        }
        break;
    }
  });

  stage.addEventListener('submit', event => {
    const form = event.target.closest('[data-ws-form]');
    if (!form) return;
    event.preventDefault();
    const { wsForm: action, wsId: id } = form.dataset;
    const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim()]));
    try {
      if (['enquiry', 'quote'].includes(action) && (!values.customer || !values.service)) {
        throw new Error('Enter a customer name and service description.');
      }
      switch (action) {
        case 'enquiry':
          saveEnquiry(business.id, { ...find('enquiries', id), ...values });
          refresh(id ? 'Enquiry updated.' : 'Enquiry added.');
          break;
        case 'quote':
          saveQuotation(business.id, { ...find('quotations', id), ...values, amount: Number(values.amount) });
          refresh(id ? 'Quotation updated.' : 'Quotation saved.');
          break;
        case 'quote-status':
          setQuotationStatus(business.id, id, values.status);
          refresh('Quotation status updated.');
          break;
        case 'send':
          setQuotationStatus(business.id, id, 'Sent', values.channel);
          refresh(`Simulated send via ${values.channel}.`);
          break;
        case 'follow': {
          if (!values.task) throw new Error('Enter a reminder.');
          const customer = find('clients', values.clientId);
          saveFollowUp(business.id, { ...values, customer: customer.name });
          refresh('Follow-up added.');
          break;
        }
      }
    } catch (error) {
      const alert = form.querySelector('.ws-form-error');
      alert.textContent = error.message || 'The record could not be saved.';
      alert.hidden = false;
    }
  });
}
