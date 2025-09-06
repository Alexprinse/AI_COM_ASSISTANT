// Server-side enrichment utilities replicating client csvService heuristics

const urgentKeywords = ['urgent', 'critical', 'emergency', 'immediate', 'asap', 'downtime', 'blocked', 'system down'];
const mediumKeywords = ['help', 'support', 'issue', 'problem', 'error', 'billing'];
const positiveKeywords = ['thank', 'great', 'excellent', 'good', 'happy', 'satisfied'];
const negativeKeywords = ['angry', 'frustrated', 'terrible', 'awful', 'disappointed', 'upset', 'critical', 'urgent'];
const urgentBoosts = ['critical', 'emergency', 'immediate', 'downtime'];
const supportKeywords = ['support', 'query', 'request', 'help', 'issue', 'problem', 'error', 'assistance'];
const issueKeywords = ['login', 'password', 'billing', 'access', 'verification', 'downtime', 'api', 'integration'];

function determinePriority(subject, body) {
  const text = `${subject || ''} ${body || ''}`.toLowerCase();
  if (urgentKeywords.some(k => text.includes(k))) return 'urgent';
  if (mediumKeywords.some(k => text.includes(k))) return 'medium';
  return 'low';
}

function determineSentiment(subject, body) {
  const text = `${subject || ''} ${body || ''}`.toLowerCase();
  if (positiveKeywords.some(k => text.includes(k))) return 'positive';
  if (negativeKeywords.some(k => text.includes(k))) return 'negative';
  return 'neutral';
}

function calculatePriorityScore(priority, subject, body) {
  const base = { urgent: 4.0, medium: 2.0, low: 1.0 };
  let score = base[priority] || 1.0;
  const text = `${subject || ''} ${body || ''}`.toLowerCase();
  urgentBoosts.forEach(k => { if (text.includes(k)) score += 0.5; });
  return Math.min(score, 5.0);
}

function shouldFilterEmail(subject, body) {
  const text = `${subject || ''} ${body || ''}`.toLowerCase();
  return supportKeywords.some(k => text.includes(k));
}

function extractEntities(emailId, subject, body) {
  const entities = [];
  let entityId = 1;
  const text = `${subject || ''} ${body || ''}`;

  const phoneRegex = /[\+]?[1-9]?[\-\s]?\(?[0-9]{3}\)?[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const orderRegex = /(?:order|ord)[#\s]?([a-zA-Z0-9-]+)/gi;

  const phones = (body || '').match(phoneRegex);
  if (phones) {
    phones.forEach((p) => entities.push({ id: `e${entityId++}`, emailId, entityType: 'phone', value: p.trim() }));
  }
  const emails = (body || '').match(emailRegex);
  if (emails) {
    emails.forEach((e) => entities.push({ id: `e${entityId++}`, emailId, entityType: 'email', value: e }));
  }
  const orders = (body || '').match(orderRegex);
  if (orders) {
    orders.forEach((o) => entities.push({ id: `e${entityId++}`, emailId, entityType: 'order_id', value: o }));
  }
  issueKeywords.forEach((k) => {
    if (text.toLowerCase().includes(k)) {
      entities.push({ id: `e${entityId++}`, emailId, entityType: 'issue', value: k });
    }
  });

  return entities;
}

export function enrichEmail(email) {
  const priority = determinePriority(email.subject, email.bodyText);
  const sentiment = determineSentiment(email.subject, email.bodyText);
  const priorityScore = calculatePriorityScore(priority, email.subject, email.bodyText);
  const isFiltered = shouldFilterEmail(email.subject, email.bodyText);
  const entities = extractEntities(email.id, email.subject, email.bodyText);

  return {
    ...email,
    priority,
    sentiment,
    priorityScore,
    isFiltered,
    entities,
  };
}
