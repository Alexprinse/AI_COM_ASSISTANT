import { google } from 'googleapis';
import { htmlToText } from 'html-to-text';
import { enrichEmail } from '../utils/enrich.mjs';

// In-memory token store for dev. For production, persist encrypted.
let oauthTokens = null;

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8787/api/auth/google/callback';
  if (!clientId || !clientSecret) return null;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAuthUrl() {
  const oAuth2Client = getOAuthClient();
  if (!oAuth2Client) return null;
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

export async function handleGoogleCallback(code) {
  const oAuth2Client = getOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  oauthTokens = tokens;
  return tokens;
}

function setClientCredentials(oAuth2Client) {
  if (oauthTokens) {
    oAuth2Client.setCredentials(oauthTokens);
  }
}

function decodeBase64Url(data) {
  if (!data) return '';
  const buff = Buffer.from(data, 'base64');
  return buff.toString('utf8');
}

function extractTextFromPayload(payload) {
  if (!payload) return '';
  const queue = [payload];
  let html = '';
  let text = '';
  while (queue.length) {
    const part = queue.shift();
    if (!part) continue;
    const mime = part.mimeType || '';
    if (mime === 'text/plain' && part.body?.data) {
      text += decodeBase64Url(part.body.data);
    } else if (mime === 'text/html' && part.body?.data) {
      html += decodeBase64Url(part.body.data);
    }
    if (Array.isArray(part.parts)) queue.push(...part.parts);
  }
  if (text.trim()) return text;
  if (html.trim()) return htmlToText(html);
  return '';
}

export async function fetchGmailEmails({ max = 25, since } = {}) {
  const oAuth2Client = getOAuthClient();
  if (!oAuth2Client) {
    return { emails: [], hint: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then authorize.' };
  }
  setClientCredentials(oAuth2Client);

  if (!oauthTokens?.access_token && !oauthTokens?.refresh_token) {
    const authUrl = getGoogleAuthUrl();
    return { emails: [], authUrl, hint: 'Authorize Gmail to proceed.' };
  }

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const qParts = [];
  if (since instanceof Date && !isNaN(since)) {
    const after = Math.floor(since.getTime() / 1000);
    qParts.push(`after:${after}`);
  }
  // Prefer INBOX; adjust if needed
  qParts.push('in:inbox');
  const q = qParts.join(' ');

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q,
    maxResults: Math.min(max, 100),
  });
  const messages = listRes.data.messages || [];
  const emails = [];

  for (const m of messages) {
    const msgRes = await gmail.users.messages.get({
      userId: 'me',
      id: m.id,
      format: 'full',
    });
    const msg = msgRes.data;
    const headers = Object.fromEntries((msg.payload?.headers || []).map(h => [h.name.toLowerCase(), h.value]));
    const from = headers['from'] || '';
    const to = headers['to'] || '';
    const subject = headers['subject'] || '';
    const dateStr = headers['date'] || msg.internalDate;
    const receivedAt = dateStr ? new Date(dateStr) : new Date();
    const bodyText = extractTextFromPayload(msg.payload);

    // Extract plain email addresses from From/To
    const fromEmail = (from.match(/<([^>]+)>/) || [null, from])[1] || '';
    const toEmail = (to.match(/<([^>]+)>/) || [null, to])[1] || '';

    const base = {
      id: String(msg.id),
      messageId: msg.id,
      fromEmail,
      toEmail: toEmail || 'support@company.com',
      subject,
      bodyText,
      receivedAt,
      isFiltered: false,
      sentiment: 'neutral',
      priority: 'low',
      priorityScore: 1,
      status: 'pending',
    };

    emails.push(enrichEmail(base));
  }

  emails.sort((a, b) => {
    const order = { urgent: 3, medium: 2, low: 1 };
    const diff = order[b.priority] - order[a.priority];
    if (diff !== 0) return diff;
    return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
  });

  return { emails };
}
