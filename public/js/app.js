import { isAuthenticated, checkAuth, clearAuth, auth } from './api.js';
import { renderLogin, renderRegister } from './views/auth.js';
import { renderLeagues, renderLeagueDetail, renderCreateLeague, renderJoinLeague } from './views/leagues.js';
import { renderRaces } from './views/races.js';
import { renderPrediction } from './views/predictions.js';
import { renderProfile } from './views/profile.js';

const app = document.getElementById('app');
const navbar = document.getElementById('navbar');
const logoutBtn = document.getElementById('logoutBtn');

const routes = {
  '/login': renderLogin,
  '/register': renderRegister,
  '/leagues': renderLeagues,
  '/leagues/create': renderCreateLeague,
  '/leagues/join': renderJoinLeague,
  '/races': renderRaces,
  '/profile': renderProfile,
};

const dynamicRoutes = [
  { pattern: /^\/leagues\/([^\/]+)$/, handler: (m) => renderLeagueDetail(m[1]) },
  { pattern: /^\/leagues\/([^\/]+)\/races\/([^\/]+)\/predict$/, handler: (m) => renderPrediction(m[1], m[2]) },
];

function showLoader() {
  app.innerHTML = '<div class="loader"><div class="spinner"></div><div class="loader-text">Yükleniyor...</div></div>';
}

//router artık async — cookie kontrolü için API çağrısı yapıyor
async function router() {
  const path = location.hash.slice(1) || '/leagues';

  const isPublic = path === '/login' || path === '/register';

  //Eğer in-memory'de user yok ama public sayfa değilse, cookie'yi check et
  if (!isAuthenticated() && !isPublic) {
    showLoader();
    const ok = await checkAuth();
    if (!ok) {
      location.hash = '#/login';
      return;
    }
  }

  //Zaten login ise login/register sayfasına gitme
  if (isAuthenticated() && isPublic) {
    location.hash = '#/leagues';
    return;
  }

  if (isAuthenticated()) {
    navbar.classList.remove('hidden');
  } else {
    navbar.classList.add('hidden');
  }

  document.querySelectorAll('.nav-links a').forEach(a => {
    const route = a.dataset.route;
    if (route && path.startsWith(route)) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });

  if (routes[path]) {
    showLoader();
    Promise.resolve(routes[path](app)).catch(handleError);
    return;
  }

  for (const dr of dynamicRoutes) {
    const match = path.match(dr.pattern);
    if (match) {
      showLoader();
      Promise.resolve(dr.handler(match, app)).catch(handleError);
      return;
    }
  }

  app.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🏁</div>
      <h2 class="empty-title">Sayfa Bulunamadı</h2>
      <p class="empty-text">Bu route mevcut değil.</p>
      <a href="#/leagues" class="btn btn-primary">Liglere Dön</a>
    </div>
  `;
}

function handleError(err) {
  console.error(err);
  app.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <h2 class="empty-title">Bir Hata Oluştu</h2>
      <p class="empty-text">${err.message || 'Bilinmeyen hata'}</p>
      <button class="btn btn-primary" onclick="location.reload()">Yeniden Dene</button>
    </div>
  `;
}

//Logout butonu artık API çağırıyor — backend cookie'yi temizliyor
logoutBtn.addEventListener('click', async () => {
  try {
    await auth.logout();   //Backend cookie'yi sil
  } catch (err) {
    console.error('Logout error:', err);
  }
  clearAuth();             //Memory'deki user bilgisini sil
  location.hash = '#/login';
});

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
