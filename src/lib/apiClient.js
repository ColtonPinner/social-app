const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_CLOUDFLARE_API_URL ||
  'http://localhost:4000';

export const authTokenKey = 'auth-token';

export function getAuthToken() {
  return localStorage.getItem(authTokenKey);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(authTokenKey, token);
    return;
  }
  localStorage.removeItem(authTokenKey);
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  return payload;
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
