export const businesses = [
  {
    id: "boreholes",
    name: "Boreholes",
    subtitle: "Drilling and installations",
    accent: "#91b69a",
    image: "assets/boreholes.webp",
    scene: "assets/boreholes-scene.webp",
    message: "Hi, could I please get a quotation for installing a borehole on my property?",
    demoCustomer: "Mia van Wyk",
    demoService: "Residential borehole drilling and installation",
    demoAmount: 48500,
  },
  {
    id: "asbestos",
    name: "Asbestos Removal",
    subtitle: "Removal and remediation",
    accent: "#e0ba80",
    image: "assets/asbestos.webp",
    scene: "assets/asbestos-scene.webp",
    message: "Good morning, we need a quotation for asbestos removal at one of our commercial properties.",
    demoCustomer: "Lerato Mokoena",
    demoService: "Commercial asbestos removal and remediation",
    demoAmount: 36800,
  },
  {
    id: "plant",
    name: "Plant Hire",
    subtitle: "Machinery and equipment",
    accent: "#a3bece",
    image: "assets/plant.webp",
    scene: "assets/plant-scene.webp",
    message: "Hi, do you have an excavator available for hire next week?",
    demoCustomer: "Sipho Dlamini",
    demoService: "20-ton excavator hire for five days",
    demoAmount: 24000,
  },
];

const seedRows = {
  boreholes: [
    ["Naledi Maseko", "naledi", "Borehole survey in Midrand", "WhatsApp", "New"],
    ["Jacob Petersen", "jacob", "Replacement pump in Paarl", "Email", "New"],
    ["Imani Nkosi", "imani", "Drilling and water yield test", "WhatsApp", "Quoted", 42750, "Sent"],
    ["Themba Radebe", "themba", "Irrigation borehole in Centurion", "Manual entry", "In progress", 64000, "Draft"],
    ["Aisha Daniels", "aisha", "Storage tank and pump installation", "Email", "Accepted", 18200, "Accepted"],
  ],
  asbestos: [
    ["Priya Naidoo", "priya", "Warehouse roof assessment in Durban", "Email", "New"],
    ["Karabo Mokoena", "karabo", "Asbestos ceiling panel removal", "WhatsApp", "New"],
    ["Yusuf Ismail", "yusuf", "Roof sheet remediation in Bellville", "Email", "Quoted", 58000, "Sent"],
    ["Rachel Mthembu", "rachel", "Commercial site assessment in Pinetown", "Manual entry", "In progress", 8500, "Draft"],
    ["Pieter van der Merwe", "pieter", "Safe disposal of removed roof sheets", "WhatsApp", "Accepted", 14600, "Accepted"],
  ],
  plant: [
    ["Thabo Mahlangu", "thabo", "TLB hire in Pretoria East", "WhatsApp", "New"],
    ["Jamie Smith", "jamie", "Mini excavator hire in Somerset West", "Email", "New"],
    ["Neo Mofokeng", "neo", "Two days of roller hire", "WhatsApp", "New"],
    ["Zanele Ndlovu", "zanele", "20-ton excavator hire in Germiston", "Email", "Quoted", 24500, "Sent"],
    ["Dylan Jacobs", "dylan", "Skid steer hire in Boksburg", "Manual entry", "Accepted", 12600, "Accepted"],
  ],
};

const seedEnquiryDayOffsets = {
  boreholes: [0, -1, -3, -5, -8],
  asbestos: [-1, -2, -2, -6, -9],
  plant: [0, -1, -1, -4, -7],
};

const sourceNames = ["WhatsApp", "Email", "Manual entry"];
const enquiryStatuses = ["New", "In progress", "Quoted", "Accepted", "Closed"];
const quotationStatuses = ["Draft", "Sent", "Accepted", "Declined"];
const storageKey = "ironstone.workspace.v1";
const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit",
});
const dateLabel = new Intl.DateTimeFormat("en-ZA", {
  timeZone: "UTC", year: "numeric", month: "short", day: "numeric",
});
const weekdayLabel = new Intl.DateTimeFormat("en-ZA", { timeZone: "UTC", weekday: "short" });
const rand = new Intl.NumberFormat("en-ZA", {
  style: "currency", currency: "ZAR", maximumFractionDigits: 2, minimumFractionDigits: 0,
});

export function today() {
  const parts = Object.fromEntries(dateParts.formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function daysFromToday(days, currentDate = today()) {
  const date = new Date(currentDate + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDate(value) {
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) ? dateLabel.format(date) : "—";
}

export function currency(value) {
  return rand.format(value);
}

export function getBusiness(id) {
  return businesses.find(business => business.id === id);
}

function ensureBusiness(id) {
  const business = getBusiness(id);
  if (!business) throw new Error("Choose a business.");
  return business;
}

function seedWorkspace(id, businessIndex) {
  const workspace = { clients: [], enquiries: [], quotations: [], followUps: [] };
  seedRows[id].forEach((row, index) => {
    const [customer, mailbox, service, source, status, amount, quoteStatus] = row;
    const record = `${id}-${index + 1}`;
    const clientId = `client-${record}`;
    const enquiryId = `enquiry-${record}`;
    const quotationId = `quotation-${record}`;
    const phone = `+27 10 555 0${businessIndex + 1}${String(index + 1).padStart(2, "0")}`;
    const email = `${mailbox}@example.test`;
    const date = daysFromToday(seedEnquiryDayOffsets[id][index]);
    const communications = [{ date, source, message: `Enquiry received for ${service.toLowerCase()}.` }];
    workspace.clients.push({ id: clientId, name: customer, phone, email, communications });
    workspace.enquiries.push({ id: enquiryId, clientId, customer, phone, email, service, source, date, status });
    if (quoteStatus) {
      const channel = quoteStatus === "Draft" ? "" : source;
      workspace.quotations.push({
        id: quotationId, clientId, enquiryId, customer, phone, email, service,
        amount, notes: "Pricing includes the agreed site requirements. Valid for 14 days.",
        date: daysFromToday(-index), status: quoteStatus, channel,
      });
      if (channel) communications.push({
        date: daysFromToday(-index), source: channel, message: `Quotation ${quoteStatus.toLowerCase()} for ${service.toLowerCase()}.`,
      });
    }
    if (status === "Quoted" || index === 0) {
      workspace.followUps.push({
        id: `follow-up-${record}`, clientId, enquiryId, quotationId: quoteStatus ? quotationId : "",
        customer, task: quoteStatus ? "Check whether the quotation has been approved" : "Confirm site details",
        date: daysFromToday(quoteStatus ? 0 : 2), completed: false,
      });
    }
  });
  return workspace;
}

function seedState() {
  return {
    workspaces: Object.fromEntries(businesses.map(({ id }, index) => [id, seedWorkspace(id, index)])),
    demo: { businessId: businesses[0].id, stage: 1 },
  };
}

let state = seedState();
let storageAvailable = true;

function readState() {
  if (storageAvailable) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (getBusiness(saved?.demo?.businessId) && Number.isInteger(saved.demo.stage) &&
        saved.demo.stage >= 1 && saved.demo.stage <= 6 && businesses.every(({ id }) => {
        const workspace = saved.workspaces?.[id];
        return ["clients", "enquiries", "quotations", "followUps"].every(key => Array.isArray(workspace?.[key]));
      })) state = saved;
    } catch {
      // Keep the current session's data if browser storage is unavailable or unreadable.
    }
  }
  return state;
}

function writeState(next) {
  state = next;
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  globalThis.dispatchEvent?.(new Event("ironstone:records-changed"));
}

export function getWorkspace(id) {
  ensureBusiness(id);
  return readState().workspaces[id];
}

export function getMetrics(id) {
  const { enquiries, quotations, followUps } = getWorkspace(id);
  const date = today();
  return {
    openEnquiries: enquiries.filter(enquiry => !["Accepted", "Closed"].includes(enquiry.status)).length,
    newEnquiries: enquiries.filter(enquiry => enquiry.status === "New").length,
    pendingQuotations: quotations.filter(quote => ["Draft", "Sent"].includes(quote.status)).length,
    acceptedQuotations: quotations.filter(quote => quote.status === "Accepted").length,
    followUpsDue: followUps.filter(reminder => !reminder.completed && reminder.date <= date).length,
  };
}

export function getOperationsOverview() {
  const { workspaces } = readState();
  const currentDate = today();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = daysFromToday(index - 6, currentDate);
    return { date, label: weekdayLabel.format(new Date(date + "T00:00:00Z")) };
  });
  const series = businesses.map(business => {
    const dailyCounts = new Map(days.map(({ date }) => [date, 0]));
    for (const { date } of workspaces[business.id].enquiries) {
      if (dailyCounts.has(date)) dailyCounts.set(date, dailyCounts.get(date) + 1);
    }
    return { business, counts: [...dailyCounts.values()] };
  });
  const followUps = businesses.flatMap(business => workspaces[business.id].followUps
    .filter(reminder => !reminder.completed)
    .map(reminder => ({ ...reminder, business })))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  return { days, series, followUps };
}

function changeWorkspace(id, action) {
  ensureBusiness(id);
  const next = structuredClone(readState());
  const record = action(next.workspaces[id]);
  writeState(next);
  return record;
}

function text(value) {
  return String(value ?? "").trim();
}

function required(value, message) {
  const result = text(value);
  if (!result) throw new Error(message);
  return result;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `ironstone-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function saveRecord(records, record) {
  const index = records.findIndex(item => item.id === record.id);
  if (index < 0) records.unshift(record);
  else records[index] = record;
  return record;
}

function contacts(workspace, values, clientId = values.clientId) {
  const existing = workspace.clients.find(client => client.id === clientId);
  const customer = required(values.customer ?? existing?.name, "Enter a customer name.");
  const phone = text(values.phone ?? existing?.phone);
  const email = text(values.email ?? existing?.email);
  const phoneKey = phone.replace(/\D/g, "").replace(/^(?:0|27)(?=\d{9}$)/, "");
  const match = existing ?? workspace.clients.find(client =>
    (email && client.email.toLowerCase() === email.toLowerCase()) ||
    (phoneKey && client.phone.replace(/\D/g, "").replace(/^(?:0|27)(?=\d{9}$)/, "") === phoneKey) ||
    (!phone && !email && client.name.toLowerCase() === customer.toLowerCase())
  );
  const client = saveRecord(workspace.clients, {
    ...match, id: match?.id ?? createId(), name: customer,
    phone: existing ? phone : phone || match?.phone || "", email: existing ? email : email || match?.email || "",
    communications: match?.communications ?? [],
  });
  return { clientId: client.id, customer: client.name, phone: client.phone, email: client.email };
}

function logCommunication(workspace, clientId, source, message, demo = false, date = today()) {
  const client = workspace.clients.find(item => item.id === clientId);
  client?.communications.unshift({ date, source, message, ...(demo ? { demo: true } : {}) });
}

export function saveEnquiry(id, values) {
  return changeWorkspace(id, workspace => {
    const current = workspace.enquiries.find(enquiry => enquiry.id === values.id);
    const contact = contacts(workspace, { ...current, ...values });
    const date = values.date || current?.date || today();
    const source = sourceNames.includes(values.source) ? values.source : current?.source ?? "Manual entry";
    const service = required(values.service ?? current?.service, "Enter the service required.");
    const status = enquiryStatuses.includes(values.status) ? values.status : current?.status ?? "New";
    const enquiry = saveRecord(workspace.enquiries, {
      ...current, ...contact, id: current?.id ?? createId(), service, source, date, status,
    });
    if (!current) logCommunication(workspace, enquiry.clientId, source, `Enquiry received for ${service}.`, false, date);
    return enquiry;
  });
}

function quotationAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0.01) throw new Error("Enter a quotation amount greater than zero.");
  if (!Number.isSafeInteger(Math.round(amount * 100))) throw new Error("Enter a smaller quotation amount.");
  return Math.round(amount * 100) / 100;
}

export function saveQuotation(id, values) {
  return changeWorkspace(id, workspace => {
    const current = workspace.quotations.find(quote => quote.id === values.id);
    const enquiry = workspace.enquiries.find(item => item.id === (values.enquiryId ?? current?.enquiryId));
    const contact = contacts(workspace, { ...enquiry, ...current, ...values });
    const quote = saveRecord(workspace.quotations, {
      ...current, ...contact, id: current?.id ?? createId(),
      enquiryId: enquiry?.id ?? "", service: required(values.service ?? current?.service ?? enquiry?.service, "Enter a service description."),
      amount: quotationAmount(values.amount ?? current?.amount), notes: text(values.notes ?? current?.notes),
      date: values.date || current?.date || today(), status: current?.status ?? "Draft", channel: current?.channel ?? "",
    });
    if (quotationStatuses.includes(values.status) && values.status !== quote.status) {
      updateQuotation(workspace, quote, values.status, values.channel);
    }
    return quote;
  });
}

function updateQuotation(workspace, quote, status, channel) {
  if (!quotationStatuses.includes(status)) throw new Error("Choose a valid quotation status.");
  const sendChannel = channel === "WhatsApp" || channel === "Email" ? channel : "";
  if (quote.status !== status || (sendChannel && quote.channel !== sendChannel)) {
    logCommunication(workspace, quote.clientId, sendChannel || quote.channel || "Manual entry",
      `Quotation ${status.toLowerCase()} for ${quote.service}.`, quote.demo === true);
  }
  quote.status = status;
  if (sendChannel) quote.channel = sendChannel;

  const enquiry = workspace.enquiries.find(item => item.id === quote.enquiryId);
  if (enquiry && enquiry.status !== "Closed") {
    const related = workspace.quotations.filter(item => item.enquiryId === enquiry.id);
    if (related.some(item => item.status === "Accepted")) enquiry.status = "Accepted";
    else if (related.some(item => item.status === "Sent")) enquiry.status = "Quoted";
    else if (["Accepted", "Quoted"].includes(enquiry.status)) enquiry.status = "In progress";
  }
  if (status === "Accepted" || status === "Declined") {
    for (const reminder of workspace.followUps) {
      if (reminder.quotationId === quote.id) reminder.completed = true;
    }
  }
  return quote;
}

export function setQuotationStatus(id, quoteId, status, channel) {
  return changeWorkspace(id, workspace => {
    const quote = workspace.quotations.find(item => item.id === quoteId);
    if (!quote) throw new Error("Quotation unavailable.");
    return updateQuotation(workspace, quote, status, channel);
  });
}

export function saveFollowUp(id, values) {
  return changeWorkspace(id, workspace => {
    const current = workspace.followUps.find(reminder => reminder.id === values.id);
    const quotation = workspace.quotations.find(item => item.id === (values.quotationId ?? current?.quotationId));
    const enquiry = workspace.enquiries.find(item => item.id === (values.enquiryId ?? quotation?.enquiryId ?? current?.enquiryId));
    const clientId = values.clientId || quotation?.clientId || enquiry?.clientId || current?.clientId || "";
    const client = workspace.clients.find(item => item.id === clientId);
    return saveRecord(workspace.followUps, {
      ...current, id: current?.id ?? createId(), clientId, enquiryId: enquiry?.id ?? "", quotationId: quotation?.id ?? "",
      customer: required(values.customer ?? client?.name ?? current?.customer, "Enter a customer name."),
      task: required(values.task ?? current?.task, "Enter a follow-up task."),
      date: values.date || current?.date || today(), completed: current?.completed ?? false,
    });
  });
}

export function completeFollowUp(id, followUpId) {
  return changeWorkspace(id, workspace => {
    const reminder = workspace.followUps.find(item => item.id === followUpId);
    if (!reminder) throw new Error("Reminder unavailable.");
    reminder.completed = true;
    return reminder;
  });
}

export function getDemo() {
  const { demo, workspaces } = readState();
  const { enquiries, quotations, followUps } = workspaces[demo.businessId];
  return {
    ...demo,
    enquiry: enquiries.find(record => record.demo) ?? null,
    quotation: quotations.find(record => record.demo) ?? null,
    followUp: followUps.find(record => record.demo) ?? null,
  };
}

export function advanceDemo(id, nextStage, amount) {
  const business = ensureBusiness(id);
  const next = structuredClone(readState());
  const { demo, workspaces } = next;
  if (demo.stage === 1 && nextStage === 1) {
    next.demo.businessId = id;
    writeState(next);
    return getDemo();
  }
  if (nextStage !== demo.stage + 1 || nextStage > 6 || (demo.stage > 1 && id !== demo.businessId)) return getDemo();

  const workspace = workspaces[id];
  const date = today();
  const enquiry = workspace.enquiries.find(record => record.demo);
  const quotation = workspace.quotations.find(record => record.demo);
  if (nextStage === 2) {
    const customer = business.demoCustomer;
    const phone = `+27 10 555 019${businesses.indexOf(business) + 1}`;
    const email = `${customer.toLowerCase().replaceAll(" ", ".")}@example.test`;
    let client = workspace.clients.find(item => item.email === email || item.phone === phone);
    if (!client) {
      client = { id: createId(), name: customer, phone, email, demo: true, communications: [] };
      workspace.clients.unshift(client);
    }
    workspace.enquiries.unshift({
      id: createId(), clientId: client.id, customer: client.name, phone: client.phone, email: client.email,
      service: business.demoService, source: "WhatsApp",
      date, status: "New", demo: true,
    });
    logCommunication(workspace, client.id, "WhatsApp", business.message, true, date);
  }
  if (nextStage === 4) {
    const { clientId, customer, phone, email, service } = enquiry;
    workspace.quotations.unshift({
      id: createId(), enquiryId: enquiry.id, clientId, customer, phone, email, service,
      amount: quotationAmount(amount ?? business.demoAmount), notes: "Example quote. Valid for 14 days.",
      date, status: "Draft", channel: "", demo: true,
    });
  }
  if (nextStage === 5) {
    updateQuotation(workspace, quotation, "Sent", "WhatsApp");
    workspace.followUps.unshift({
      id: createId(), clientId: enquiry.clientId, enquiryId: enquiry.id, quotationId: quotation.id,
      customer: enquiry.customer, task: "Follow up on the WhatsApp quotation", date: daysFromToday(2),
      completed: false, demo: true,
    });
  }
  if (nextStage === 6) {
    updateQuotation(workspace, quotation, "Accepted", "WhatsApp");
    logCommunication(workspace, enquiry.clientId, "WhatsApp", "Thanks, happy to go ahead.", true, date);
  }
  next.demo = { businessId: id, stage: nextStage };
  writeState(next);
  return getDemo();
}

export function replayDemo(id = readState().demo.businessId) {
  ensureBusiness(id);
  const next = structuredClone(readState());
  for (const workspace of Object.values(next.workspaces)) {
    const enquiryIds = new Set(workspace.enquiries.filter(record => record.demo).map(record => record.id));
    const quotationIds = new Set(workspace.quotations.filter(record => record.demo).map(record => record.id));
    workspace.enquiries = workspace.enquiries.filter(record => !record.demo);
    workspace.quotations = workspace.quotations.filter(record => !record.demo);
    workspace.followUps = workspace.followUps.filter(record => !record.demo);
    const linkedClients = new Set();
    for (const record of [...workspace.enquiries, ...workspace.quotations, ...workspace.followUps]) {
      linkedClients.add(record.clientId);
      if (enquiryIds.has(record.enquiryId)) record.enquiryId = "";
      if (quotationIds.has(record.quotationId)) record.quotationId = "";
    }
    workspace.clients = workspace.clients.filter(client => !client.demo || linkedClients.has(client.id));
    for (const client of workspace.clients) {
      client.communications = client.communications.filter(event => !event.demo);
      delete client.demo;
    }
  }
  next.demo = { businessId: id, stage: 1 };
  writeState(next);
  return getDemo();
}

export function resetDemo() {
  writeState(seedState());
}
