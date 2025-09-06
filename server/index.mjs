import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fetchImapEmails } from './providers/imap.mjs';
import { fetchGmailEmails, getGoogleAuthUrl, handleGoogleCallback } from './providers/gmail.mjs';

// Minimal server scaffold for provider-based email retrieval.
// NOTE: This is a stub; plug in Gmail/Outlook/IMAP adapters later.

const app = express();
const PORT = process.env.PORT || 8787;

// Support multiple allowed origins via comma-separated CORS_ORIGIN
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser or same-origin
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
// Google OAuth start
app.get('/api/auth/google', (req, res) => {
  const url = getGoogleAuthUrl();
  if (!url) return res.status(500).json({ error: 'Missing GOOGLE_CLIENT_ID/SECRET' });
  res.json({ authUrl: url });
});

// Google OAuth callback
app.get('/api/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');
  try {
    await handleGoogleCallback(String(code));
    res.send('Gmail authorized. You can close this window.');
  } catch (e) {
    console.error('Google callback error', e);
    res.status(500).send('Failed to authorize Gmail');
  }
});

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'email-backend', time: new Date().toISOString() });
});

// GET /api/emails?provider=gmail|outlook|imap&max=50&since=ISO
app.get('/api/emails', async (req, res) => {
  const provider = String(req.query.provider || 'gmail').toLowerCase();
  const max = Math.min(Number(req.query.max) || 20, 200);
  const since = req.query.since ? new Date(String(req.query.since)) : undefined;

  try {
    if (provider === 'imap') {
      const { emails, hint } = await fetchImapEmails({ max, since });
      return res.json({ emails, provider, hint, max, since: since?.toISOString() });
    }
    if (provider === 'gmail') {
      const { emails, hint, authUrl } = await fetchGmailEmails({ max, since });
      return res.json({ emails, provider, hint, authUrl, max, since: since?.toISOString() });
    }
    // Default stubs for gmail/outlook
    const hint = provider === 'outlook'
      ? 'Outlook adapter not configured yet. Add MSAL + Graph /me/messages.'
      : 'Unknown provider';
    return res.json({ emails: [], provider, hint, max, since: since?.toISOString() });
  } catch (e) {
    console.error('Error in /api/emails', e);
    res.status(500).json({ error: 'Failed to fetch emails', details: (e && e.message) || String(e) });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] email backend listening on http://localhost:${PORT}`);
});
