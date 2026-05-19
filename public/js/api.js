//API wrapper + state + helpers
//Auth: httpOnly cookie (server tarafında set ediliyor)

const API_BASE = 'http://localhost:3000/api';

//Token artık JavaScript'te tutulmuyor (httpOnly cookie tarayıcıda)
//Sadece kullanıcı bilgisini in-memory tutuyoruz
let currentUser = null;

export function getCurrentUser() { return currentUser; }

export function setCurrentUser(user) {
  currentUser = user;
}

export function clearAuth() {
  currentUser = null;
}

export function isAuthenticated() { return !!currentUser; }

/**
 * Sayfa açılışında veya refresh'te çağrılır.
 * Cookie'de geçerli token varsa user bilgisini getirir.
 */
export async function checkAuth() {
  try {
    const user = await api('GET', '/auth/me');
    currentUser = user;
    return true;
  } catch {
    currentUser = null;
    return false;
  }
}

export async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };

  const opts = {
    method,
    headers,
    credentials: 'include'  //Cookieleri otomatik gönder
  };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch {
    throw new Error('Sunucuya bağlanılamadı');
  }

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    if (data.details && Array.isArray(data.details)) {
      throw new Error(data.details.map(d => d.message).join(', '));
    }
    throw new Error(data.error || `Hata: ${res.status}`);
  }

  return data;
}

//Shortcuts
export const auth = {
  register: (data) => api('POST', '/auth/register', data),
  login: (data) => api('POST', '/auth/login', data),
  logout: () => api('POST', '/auth/logout'),
  me: () => api('GET', '/auth/me'),
  updateProfile: (data) => api('PATCH', '/auth/me', data),
};

export const leagues = {
  create: (data) => api('POST', '/leagues', data),
  list: () => api('GET', '/leagues'),
  detail: (id) => api('GET', `/leagues/${id}`),
  join: (inviteCode) => api('POST', '/leagues/join', { inviteCode }),
  standings: (id) => api('GET', `/leagues/${id}/standings`),
  delete: (id) => api('DELETE', `/leagues/${id}`),
};

export const races = {
  list: (season) => api('GET', `/races${season ? `?season=${season}` : ''}`),
  detail: (id) => api('GET', `/races/${id}`),
  calculatePoints: (id) => api('POST', `/races/${id}/calculate-points`),
};

export const predictions = {
  create: (leagueId, raceId, data) =>
    api('POST', `/leagues/${leagueId}/races/${raceId}/predictions`, data),
  getMine: (leagueId, raceId) =>
    api('GET', `/leagues/${leagueId}/races/${raceId}/predictions/me`),
  update: (id, data) => api('PUT', `/predictions/${id}`, data),
  delete: (id) => api('DELETE', `/predictions/${id}`),
};

export const users = {
  stats: () => api('GET', '/users/me/stats'),
  myPredictions: () => api('GET', '/users/me/predictions'),
};

//Toast
export function toast(message, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3500);
}

//2026 F1 grid
export const DRIVERS = [
  { code: 'NOR', name: 'Lando Norris',       lastName: 'Norris',     team: 'McLaren' },
  { code: 'PIA', name: 'Oscar Piastri',      lastName: 'Piastri',    team: 'McLaren' },
  { code: 'RUS', name: 'George Russell',     lastName: 'Russell',    team: 'Mercedes' },
  { code: 'ANT', name: 'Kimi Antonelli',     lastName: 'Antonelli',  team: 'Mercedes' },
  { code: 'VER', name: 'Max Verstappen',     lastName: 'Verstappen', team: 'Red Bull' },
  { code: 'HAD', name: 'Isack Hadjar',       lastName: 'Hadjar',     team: 'Red Bull' },
  { code: 'LEC', name: 'Charles Leclerc',    lastName: 'Leclerc',    team: 'Ferrari' },
  { code: 'HAM', name: 'Lewis Hamilton',     lastName: 'Hamilton',   team: 'Ferrari' },
  { code: 'ALB', name: 'Alex Albon',         lastName: 'Albon',      team: 'Williams' },
  { code: 'SAI', name: 'Carlos Sainz',       lastName: 'Sainz',      team: 'Williams' },
  { code: 'LAW', name: 'Liam Lawson',        lastName: 'Lawson',     team: 'Racing Bulls' },
  { code: 'LIN', name: 'Arvid Lindblad',     lastName: 'Lindblad',   team: 'Racing Bulls' },
  { code: 'ALO', name: 'Fernando Alonso',    lastName: 'Alonso',     team: 'Aston Martin' },
  { code: 'STR', name: 'Lance Stroll',       lastName: 'Stroll',     team: 'Aston Martin' },
  { code: 'OCO', name: 'Esteban Ocon',       lastName: 'Ocon',       team: 'Haas' },
  { code: 'BEA', name: 'Oliver Bearman',     lastName: 'Bearman',    team: 'Haas' },
  { code: 'HUL', name: 'Nico Hulkenberg',    lastName: 'Hulkenberg', team: 'Audi' },
  { code: 'BOR', name: 'Gabriel Bortoleto',  lastName: 'Bortoleto',  team: 'Audi' },
  { code: 'GAS', name: 'Pierre Gasly',       lastName: 'Gasly',      team: 'Alpine' },
  { code: 'COL', name: 'Franco Colapinto',   lastName: 'Colapinto',  team: 'Alpine' },
  { code: 'PER', name: 'Sergio Perez',       lastName: 'Perez',      team: 'Cadillac' },
  { code: 'BOT', name: 'Valtteri Bottas',    lastName: 'Bottas',     team: 'Cadillac' },
];

export const TEAMS = ['McLaren', 'Mercedes', 'Red Bull', 'Ferrari', 'Williams', 'Racing Bulls', 'Aston Martin', 'Haas', 'Audi', 'Alpine', 'Cadillac'];

export function getDriverByCode(code) {
  return DRIVERS.find(d => d.code === code);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
