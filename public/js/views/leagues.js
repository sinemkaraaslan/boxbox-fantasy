import { leagues, toast, getCurrentUser, escapeHtml } from '../api.js';

export async function renderLeagues(app) {
  const myLeagues = await leagues.list();

  app.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Liglerim</h1>
        <p class="page-subtitle">Tahmin liglerin ve sıralamaların</p>
      </div>
      <div class="flex flex-gap">
        <a href="#/leagues/join" class="btn btn-secondary">+ Davet Kodu</a>
        <a href="#/leagues/create" class="btn btn-primary">+ Yeni Lig</a>
      </div>
    </div>

    ${myLeagues.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <h2 class="empty-title">Henüz lig yok</h2>
        <p class="empty-text">İlk ligini oluştur veya bir davet koduyla mevcut bir lige katıl.</p>
        <div class="flex flex-gap" style="justify-content: center;">
          <a href="#/leagues/create" class="btn btn-primary">Lig Oluştur</a>
          <a href="#/leagues/join" class="btn btn-secondary">Lige Katıl</a>
        </div>
      </div>
    ` : `
      <div class="grid grid-3">
        ${myLeagues.map(l => `
          <a href="#/leagues/${l.id}" class="league-card">
            <div class="league-card-head">
              <div>
                <div class="league-card-name">${escapeHtml(l.name)}</div>
              </div>
              ${l.LeagueMember.role === 'owner' ? '<span class="badge badge-primary">👑 Owner</span>' : '<span class="badge badge-secondary">Üye</span>'}
            </div>
            <div class="league-card-meta">${l.season} Sezonu</div>
            ${l.description ? `<div class="league-card-desc">${escapeHtml(l.description)}</div>` : '<div class="league-card-desc"></div>'}
            <div class="league-card-foot">
              <div>
                <span class="league-card-points-label">Toplam Puan</span>
                <span class="league-card-points">${l.LeagueMember.totalPoints}</span>
              </div>
              <span style="font-size: 1.5rem;">→</span>
            </div>
          </a>
        `).join('')}
      </div>
    `}
  `;
}

export function renderCreateLeague(app) {
  app.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Yeni Lig</h1>
        <p class="page-subtitle">Arkadaşlarınla rekabet et</p>
      </div>
      <a href="#/leagues" class="btn btn-ghost">← Geri</a>
    </div>

    <div class="auth-card" style="margin: 0; max-width: 600px; padding: 2rem;">
      <form id="leagueForm">
        <div class="form-group">
          <label for="name">Lig Adı *</label>
          <input type="text" id="name" class="form-input" required minlength="3" maxlength="60" placeholder="Örn: Mühendislik 2026" />
          <span class="form-hint">3-60 karakter</span>
        </div>

        <div class="form-group">
          <label for="description">Açıklama</label>
          <textarea id="description" class="form-textarea" maxlength="280" placeholder="Lig hakkında kısa açıklama..."></textarea>
        </div>

        <div class="form-group">
          <label for="season">Sezon</label>
          <select id="season" class="form-select">
            <option value="2026" selected>2026 Sezonu</option>
            <option value="2025">2025 Sezonu</option>
            <option value="2024">2024 Sezonu</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-check">
            <input type="checkbox" id="isPublic" />
            <span>Herkese açık lig (keşfedilebilir)</span>
          </label>
        </div>

        <button type="submit" class="btn btn-primary btn-full btn-lg" id="submitBtn">
          🏁 Lig Oluştur
        </button>
      </form>
    </div>
  `;

  document.getElementById('leagueForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('name').value.trim(),
      description: document.getElementById('description').value.trim() || undefined,
      season: parseInt(document.getElementById('season').value),
      isPublic: document.getElementById('isPublic').checked,
    };
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Oluşturuluyor...';

    try {
      const league = await leagues.create(data);
      toast('Lig oluşturuldu! 🏆', 'success');
      location.hash = `#/leagues/${league.id}`;
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = '🏁 Lig Oluştur';
    }
  });
}

export function renderJoinLeague(app) {
  app.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Lige Katıl</h1>
        <p class="page-subtitle">Davet koduyla hızlı katılım</p>
      </div>
      <a href="#/leagues" class="btn btn-ghost">← Geri</a>
    </div>

    <div class="auth-card" style="margin: 0; max-width: 500px; padding: 2rem;">
      <p class="text-mute mb-3" style="text-align: center;">Lig sahibinden aldığın 8 karakterli davet kodunu gir:</p>

      <form id="joinForm">
        <div class="form-group">
          <label for="inviteCode" style="text-align: center;">Davet Kodu</label>
          <input
            type="text"
            id="inviteCode"
            class="form-input"
            required
            maxlength="8"
            minlength="8"
            placeholder="ABC23XYZ"
            style="text-transform: uppercase; letter-spacing: 0.2em; font-family: 'JetBrains Mono', monospace; font-size: 1.4rem; text-align: center; padding: 1rem;"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-full btn-lg" id="submitBtn">
          🏁 Katıl
        </button>
      </form>
    </div>
  `;

  const input = document.getElementById('inviteCode');
  input.addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });

  document.getElementById('joinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = input.value.trim().toUpperCase();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Katılınıyor...';

    try {
      const result = await leagues.join(code);
      toast('Lige katıldın! 🏁', 'success');
      location.hash = `#/leagues/${result.league.id}`;
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = '🏁 Katıl';
    }
  });
}

export async function renderLeagueDetail(leagueId) {
  const app = document.getElementById('app');
  const [league, standings] = await Promise.all([
    leagues.detail(leagueId),
    leagues.standings(leagueId).catch(() => ({ standings: [] }))
  ]);

  const user = getCurrentUser();
  const isOwner = league.ownerId === user.id;

  app.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">${escapeHtml(league.name)}</h1>
        <p class="page-subtitle">${league.season} Sezonu · ${league.members.length} üye</p>
      </div>
      <a href="#/leagues" class="btn btn-ghost">← Liglerim</a>
    </div>

    ${league.description ? `<p class="text-mute mb-3">${escapeHtml(league.description)}</p>` : ''}

    ${isOwner ? `
      <div class="invite-box">
        <div class="invite-label">🎫 Davet Kodu</div>
        <div class="invite-code" id="inviteCode">${league.inviteCode}</div>
        <div class="invite-copy" id="copyBtn">📋 Kopyalamak için tıkla</div>
      </div>
    ` : ''}

    <div class="section-title">
      <span class="section-title-bar"></span>
      🏆 Lig Sıralaması
    </div>

    ${standings.standings.length === 0 ? `
      <div class="empty-state" style="padding: 2rem;">
        <p class="text-mute">Henüz puan kazanan olmadı. Yarışlar başlasın!</p>
      </div>
    ` : `
      <div class="standings mb-4">
        <div class="standings-header">
          <div>Sıra</div>
          <div>Oyuncu</div>
          <div>Puan</div>
        </div>
        ${standings.standings.map(s => `
          <div class="standings-row ${s.rank <= 3 ? `rank-${s.rank}` : ''}">
            <div class="standings-rank ${s.rank <= 3 ? `rank-${s.rank}` : ''}">
              ${s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : `P${s.rank}`}
            </div>
            <div class="standings-name-row">
              <div class="standings-name-avatar">${s.username[0].toUpperCase()}</div>
              <div>
                <div class="standings-name">${escapeHtml(s.username)}</div>
                ${s.userId === user.id ? '<span class="badge badge-secondary" style="margin-top: 0.2rem;">Sen</span>' : ''}
              </div>
            </div>
            <div>
              <span class="standings-points-label">Puan</span>
              <span class="standings-points">${s.totalPoints}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `}

    <div class="flex flex-gap mt-4">
      <a href="#/races" class="btn btn-primary">🏎️ Yarışlara Git</a>
      ${isOwner ? `<button class="btn btn-danger" id="deleteBtn">Ligi Sil</button>` : ''}
    </div>
  `;

  if (isOwner) {
    const copy = () => {
      navigator.clipboard.writeText(league.inviteCode);
      toast('Davet kodu kopyalandı! 📋', 'success');
    };
    document.getElementById('copyBtn').addEventListener('click', copy);
    document.getElementById('inviteCode').addEventListener('click', copy);

    document.getElementById('deleteBtn').addEventListener('click', async () => {
      if (!confirm(`"${league.name}" ligini silmek istediğine emin misin?`)) return;
      try {
        await leagues.delete(leagueId);
        toast('Lig silindi', 'success');
        location.hash = '#/leagues';
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }
}
