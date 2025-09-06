import { Email } from './types';
import { loadEmailsFromCSV } from './csvService';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8787';

export type Provider = 'csv' | 'gmail' | 'outlook' | 'imap';

// Check if Gmail needs authorization; returns auth URL if needed
export async function checkGmailAuth(): Promise<{ needsAuth: boolean; authUrl?: string }>{
  const url = new URL(`${SERVER_URL}/api/emails`);
  url.searchParams.set('provider', 'gmail');
  url.searchParams.set('max', '1');
  const res = await fetch(url.toString(), { credentials: 'include' });
  if (!res.ok) return { needsAuth: false };
  const data = await res.json();
  if (data?.authUrl && (!data.emails || data.emails.length === 0)) {
    return { needsAuth: true, authUrl: data.authUrl as string };
  }
  return { needsAuth: false };
}

export async function getGmailAuthUrl(): Promise<string | null> {
  const res = await fetch(`${SERVER_URL}/api/auth/google`, { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  return (data && data.authUrl) || null;
}

export async function fetchEmailsFromServer(provider: Exclude<Provider, 'csv'>, opts?: { max?: number; since?: string; signal?: AbortSignal; }): Promise<Email[]> {
  const url = new URL(`${SERVER_URL}/api/emails`);
  url.searchParams.set('provider', provider);
  if (opts?.max) url.searchParams.set('max', String(opts.max));
  if (opts?.since) url.searchParams.set('since', opts.since);

  const res = await fetch(url.toString(), { signal: opts?.signal, credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Server error ${res.status}`);
  }
  const data = await res.json();
  const emails = (data.emails || []) as any[];
  // Ensure receivedAt is Date on client
  return emails.map((e) => ({
    ...e,
    receivedAt: e.receivedAt ? new Date(e.receivedAt) : new Date(),
  })) as Email[];
}

export async function fetchEmails(provider: Provider, opts?: { max?: number; since?: string; signal?: AbortSignal; }): Promise<Email[]> {
  if (provider === 'csv') {
    return loadEmailsFromCSV();
  }
  try {
    const emails = await fetchEmailsFromServer(provider, opts);
    // Do not fallback to CSV for non-CSV providers; show real (possibly empty) results
    return emails || [];
  } catch (err) {
    // Propagate errors for non-CSV providers so UI can show a proper error instead of demo CSV
    throw err;
  }
}
