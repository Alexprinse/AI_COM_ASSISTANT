import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { htmlToText } from 'html-to-text';
import { enrichEmail } from '../utils/enrich.mjs';

function getImapConfig() {
  const host = process.env.IMAP_HOST;
  const port = Number(process.env.IMAP_PORT || 993);
  const secure = String(process.env.IMAP_SECURE || 'true') === 'true';
  const auth = {
    user: process.env.IMAP_USER,
    pass: process.env.IMAP_PASS,
  };
  if (!host || !auth.user || !auth.pass) {
    return null;
  }
  return { host, port, secure, auth };
}

async function* fetchSources(client, seqs) {
  // Fetch raw sources for multiple messages in one stream
  if (!seqs || seqs.length === 0) return;
  const ranges = [];
  // Compact consecutive sequences into ranges (e.g., 10:20)
  let start = seqs[0];
  let prev = seqs[0];
  for (let i = 1; i < seqs.length; i++) {
    const cur = seqs[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    ranges.push(start === prev ? String(start) : `${start}:${prev}`);
    start = prev = cur;
  }
  ranges.push(start === prev ? String(start) : `${start}:${prev}`);

  for (const r of ranges) {
    const messages = client.fetch(r, { source: true, envelope: true, internalDate: true, uid: true });
    for await (const msg of messages) {
      yield msg;
    }
  }
}

export async function fetchImapEmails({ max = 25, since } = {}) {
  const cfg = getImapConfig();
  if (!cfg) {
    return { emails: [], hint: 'Set IMAP_HOST, IMAP_USER, IMAP_PASS (and optionally IMAP_PORT, IMAP_SECURE) to enable IMAP.' };
  }

  const client = new ImapFlow(cfg);
  await client.connect();
  try {
    await client.mailboxOpen('INBOX');

    // Build search criteria
    const criteria = [];
    if (since instanceof Date && !isNaN(since)) {
      criteria.push(['SINCE', since]);
    }

    // Search recent emails; if no criteria, fetch last N by sequence
    let seqs = [];
    if (criteria.length > 0) {
      seqs = await client.search(criteria);
    } else {
      const status = await client.status('INBOX', { messages: true });
      const total = status.messages || 0;
      const start = Math.max(1, total - max + 1);
      for (let i = start; i <= total; i++) seqs.push(i);
    }

    // Limit to max from the end (newest last sequence)
    seqs = seqs.slice(-max);

  const emails = [];
  for await (const msg of fetchSources(client, seqs)) {

      const parsed = await simpleParser(msg.source);
      const fromAddr = parsed.from?.value?.[0]?.address || '';
      const toAddr = parsed.to?.value?.[0]?.address || '';
      const subject = parsed.subject || '';
      const html = parsed.html || '';
      const text = parsed.text || (html ? htmlToText(html) : '');
      const date = parsed.date || msg.internalDate || new Date();
      const messageId = parsed.messageId || `imap-${msg.uid}`;

      const email = {
        id: String(msg.uid),
        messageId,
        fromEmail: fromAddr,
        toEmail: toAddr || 'support@company.com',
        subject,
        bodyText: text,
        receivedAt: date,
        isFiltered: false,
        sentiment: 'neutral',
        priority: 'low',
        priorityScore: 1,
        status: 'pending',
      };

      const enriched = enrichEmail(email);
  emails.push(enriched);
    }

    // Sort by priority and received date desc
    emails.sort((a, b) => {
      const order = { urgent: 3, medium: 2, low: 1 };
      const diff = order[b.priority] - order[a.priority];
      if (diff !== 0) return diff;
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
    });

    return { emails };
  } finally {
    try { await client.logout(); } catch {}
  }
}
