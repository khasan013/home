// ============================================================
// src/api/index.js
// All backend calls in one place
// ============================================================

const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token helpers ─────────────────────────────────────────
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');


// ── Core fetch wrapper ────────────────────────────────────
async function request(method, path, body = null, auth = true) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Some endpoints may return an empty body.
  }

  if (!res.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed (${res.status})`
    );
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  register: (body) =>
    request('POST', '/auth/register', body, false),

  login: (body) =>
    request('POST', '/auth/login', body, false),

  verifyOtp: (body) =>
    request('POST', '/auth/verify-otp', body, false),

  resendOtp: (body) =>
    request('POST', '/auth/resend-otp', body, false),

  forgotPassword: (body) =>
    request('POST', '/auth/forgot-password', body, false),

  resetPassword: (body) =>
    request('POST', '/auth/reset-password', body, false),
};

// ── Homes ─────────────────────────────────────────────────
export const homeApi = {
  create: (body) => request('POST', '/home', body),

  getAll: () => request('GET', '/home'),

  getById: (homeId) =>
    request('GET', `/home/${homeId}`),

  joinByCode: async (code) => {
    if (!code?.trim()) {
      throw new Error('Please enter an invite code');
    }

    return request('POST', '/home/join', {
      inviteCode: code.trim().toUpperCase(),
    });
  },

  getInviteCode: (homeId) =>
    request('GET', `/home/${homeId}/invite`),
};

// ── Meals ─────────────────────────────────────────────────
export const mealApi = {
  add: (homeId, body) =>
    request('POST', `/meal/${homeId}`, body),

  getAll: (homeId) =>
    request('GET', `/meal/${homeId}`),

  update: (homeId, mealId, body) =>
    request('PUT', `/meal/${homeId}/${mealId}`, body),

  remove: (homeId, mealId) =>
    request('DELETE', `/meal/${homeId}/${mealId}`),
};

// ── Expenses ──────────────────────────────────────────────
export const expenseApi = {
  add: (homeId, body) =>
    request('POST', `/expense/${homeId}`, body),

  getAll: (homeId) =>
    request('GET', `/expense/${homeId}`),

  remove: (homeId, expId) =>
    request('DELETE', `/expense/${homeId}/${expId}`),
};

// ── Report ────────────────────────────────────────────────
export const reportApi = {
  get: (homeId) =>
    request('GET', `/report/${homeId}`),
};

// ── Admin ─────────────────────────────────────────────────
export const adminApi = {
  // Members
  getMembers: (homeId) =>
    request('GET', `/admin/${homeId}/members`),

  promoteUser: (homeId, userId) =>
    request('PUT', `/admin/${homeId}/members/${userId}/promote`),

  removeUser: (homeId, userId) =>
    request('DELETE', `/admin/${homeId}/members/${userId}`),

  // Penalties
  getPenalties: (homeId) =>
    request('GET', `/admin/${homeId}/penalties`),

  addPenalty: (homeId, body) =>
    request('POST', `/admin/${homeId}/penalties`, body),

  removePenalty: (homeId, penId) =>
    request('DELETE', `/admin/${homeId}/penalties/${penId}`),

  // 🔥 BILL (YOU WERE MISSING THIS)
  sendBill: (homeId, body) =>
    request('POST', `/admin/${homeId}/bill/send`, body),
};
