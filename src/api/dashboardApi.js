'use strict';

// import { getAccessToken } from '../auth/cognitoAuth'; // Direct Auth (주석처리)
import { userManager } from '../auth/userManager'; // OIDC

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function apiFetch(path, options = {}) {
  const user = await userManager.getUser();
  const headers = {
    ...options.headers,
    ...(user?.id_token ? { Authorization: `Bearer ${user.id_token}` } : (user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {})),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function normalizeRecipient(r) {
  return { ...r, name: r.recipientName };
}

export async function fetchRecipients() {
  const data = await apiFetch('/recipients');
  return (data.recipients || []).map(normalizeRecipient);
}

export async function fetchTodayCallStatus(date) {
  const query = date ? `?date=${date}` : '';
  return apiFetch(`/calls/today${query}`);
}

export async function fetchCallHistory(recipientName) {
  const data = await apiFetch(`/calls/history/${encodeURIComponent(recipientName)}`);
  return data.history || [];
}

export async function createRecipient(recipient) {
  return apiFetch('/recipients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipientName: recipient.name,
      age: Number(recipient.age) || 0,
      phoneNumber: recipient.phoneNumber,
      address: recipient.address || '',
      memo: recipient.memo || '',
      autoCallTime: recipient.autoCallTime || '09:00',
      autoCallEnabled: Boolean(recipient.autoCallEnabled),
    }),
  });
}

export async function updateRecipient(recipientId, fields) {
  return apiFetch(`/recipients/${recipientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
}

export async function createCorrection(contactId, { originalRiskLevel, correctedRiskLevel, reason }) {
  return apiFetch(`/calls/${contactId}/correction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalRiskLevel, correctedRiskLevel, reason }),
  });
}

export async function fetchCorrectionStats(day) {
  const query = day ? `?day=${day}` : '';
  return apiFetch(`/calls/corrections/stats${query}`);
}
