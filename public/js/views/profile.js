import { users, auth, setCurrentUser, toast, DRIVERS, TEAMS, formatDateShort, escapeHtml } from '../api.js';

export async function renderProfile(app) {
  const [profile, stats, myPredictions] = await Promise.all([
    auth.me(),
    users.stats(),
    users.myPredictions()
  ]);

  const driverOptions = DRIVERS.map(d =>
    `<option value="${d.code}" ${profile.favoriteDriver === d.code ? 'selected' : ''}>${d.code} — ${d.name} (${d.team})</option>`
  ).join('');

  const teamOptions = TEAMS.map(t =>
    `<option value="${t}" ${profile.favoriteTeam === t ? 'selected' : ''}>${t}</option>`
  ).join('');

  const avg = stats.totalPredictions > 0 ? Math.round(stats.totalPoints / stats.totalPredictions) : 0;

  // Orphan tahminleri (ligi veya yarışı silinmiş) filtrele — null guard
  const validPredictions = myPredictions.filter(p => p.Race && p.League);

  app.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Profil</h1>
        <p class="page-subtitle">Hesabın ve istatistiklerin</p>
      </div>
    </div>

    <div class="profile-hero">
      <div class="profile-avatar">${profile.username[0].toUpperCase()}</div>
      <div class="profile-info">
        <h2>${escapeHtml(profile.username)}</h2>
        <p class="profile-email">${escapeHtml(profile.email)}</p>
        ${profile.bio ? `<p class="profile-bio">${escapeHtml(profile.bio)}</p>` : ''}
        <div class="profile-favs">
          ${profile.favoriteDriver ? `<span class="fav-pill driver">🏎️ ${profile.favoriteDriver}</span>` : ''}
          ${profile.favoriteTeam ? `<span class="fav-pill team">🏁 ${profile.favoriteTeam}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="section-title">
      <span class="section-title-bar"></span>
      📊 İstatistikler
    </div>

    <div class="grid grid-4 mb-4">
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-label">Toplam Puan</div>
        <div class="stat-value">${stats.totalPoints}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-label">Tahmin Sayısı</div>
        <div class="stat-value">${stats.totalPredictions}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏁</div>
        <div class="stat-label">Aktif Lig</div>
        <div class="stat-value">${stats.leagueCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-label">Ortalama Puan</div>
        <div class="stat-value">${avg}</div>
      </div>
    </div>

    <div class="section-title">
      <span class="section-title-bar"></span>
      ⚙️ Tercihlerini Güncelle
    </div>

    <div class="auth-card" style="margin: 0 0 2rem; max-width: 100%; padding: 2rem;">
      <form id="profileForm">
        <div class="grid grid-2">
          <div class="form-group">
            <label>Favori Sürücü</label>
            <select id="favoriteDriver" class="form-select">
              <option value="">— Seç —</option>
              ${driverOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Favori Takım</label>
            <select id="favoriteTeam" class="form-select">
              <option value="">— Seç —</option>
              ${teamOptions}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Bio</label>
          <textarea id="bio" class="form-textarea" maxlength="280" placeholder="Kendinden bahset...">${escapeHtml(profile.bio || '')}</textarea>
          <span class="form-hint">Max 280 karakter</span>
        </div>
        <button type="submit" class="btn btn-primary" id="profileSubmit">💾 Kaydet</button>
      </form>
    </div>

    <div class="section-title">
      <span class="section-title-bar"></span>
      📜 Tahmin Geçmişi
    </div>

    ${validPredictions.length === 0 ? `
      <div class="empty-state" style="padding: 2rem;">
        <p class="text-mute">Henüz tahmin yapmadın.</p>
        <a href="#/races" class="btn btn-primary mt-2">Yarışlara Git</a>
      </div>
    ` : `
      <div class="grid grid-2">
        ${validPredictions.map(p => `
          <div class="prediction-history-card">
            <div class="ph-head">
              <div>
                <div class="ph-race">${escapeHtml(p.Race.name)}</div>
                <div class="ph-league">${escapeHtml(p.League.name)} · ${p.Race.season} R${p.Race.round}</div>
                <div class="text-mute" style="font-size: 0.75rem; margin-top: 0.2rem;">${formatDateShort(p.Race.raceDate)}</div>
              </div>
              ${p.Race.isCompleted ? `
                <div style="text-align: right;">
                  <div class="ph-points">${p.pointsAwarded}</div>
                  <div class="text-mute" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em;">PUAN</div>
                </div>
              ` : '<span class="badge badge-warning">Bekliyor</span>'}
            </div>
            <div class="ph-podium">
              ${p.podiumOrder.slice(0, 3).map(d => `<span class="ph-driver">${d}</span>`).join('')}
              <span class="text-mute" style="font-size: 0.7rem; align-self: center; margin-left: 0.3rem;">+${p.podiumOrder.length - 3}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      favoriteDriver: document.getElementById('favoriteDriver').value || null,
      favoriteTeam: document.getElementById('favoriteTeam').value || null,
      bio: document.getElementById('bio').value.trim() || null,
    };
    const btn = document.getElementById('profileSubmit');
    btn.disabled = true;
    btn.textContent = 'Kaydediliyor...';

    try {
      const updated = await auth.updateProfile(data);
      setCurrentUser(updated);

      // Sadece profile-info kısmını yeniden çiz (partial re-render)
      const profileInfo = document.querySelector('.profile-info');
      profileInfo.innerHTML = `
        <h2>${escapeHtml(updated.username)}</h2>
        <p class="profile-email">${escapeHtml(updated.email)}</p>
        ${updated.bio ? `<p class="profile-bio">${escapeHtml(updated.bio)}</p>` : ''}
        <div class="profile-favs">
          ${updated.favoriteDriver ? `<span class="fav-pill driver">🏎️ ${updated.favoriteDriver}</span>` : ''}
          ${updated.favoriteTeam ? `<span class="fav-pill team">🏁 ${updated.favoriteTeam}</span>` : ''}
        </div>
      `;

      toast('Profil güncellendi 🏁', 'success');
      btn.disabled = false;
      btn.textContent = '💾 Kaydet';
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = '💾 Kaydet';
    }
  });
}