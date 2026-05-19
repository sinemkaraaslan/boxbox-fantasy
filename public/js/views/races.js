import { races, leagues, formatDate, escapeHtml } from '../api.js';

export async function renderRaces(app) {
  const [allRaces, myLeagues] = await Promise.all([
    races.list(),
    leagues.list()
  ]);

  if (myLeagues.length === 0) {
    app.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Yarışlar</h1>
      </div>
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <h2 class="empty-title">Önce bir lige katılman gerek</h2>
        <p class="empty-text">Tahmin yapmak için bir ligin olmalı.</p>
        <a href="#/leagues" class="btn btn-primary">Liglere Git</a>
      </div>
    `;
    return;
  }

  if (allRaces.length === 0) {
    app.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Yarışlar</h1>
      </div>
      <div class="empty-state">
        <div class="empty-icon">🏁</div>
        <h2 class="empty-title">Henüz yarış yok</h2>
        <p class="empty-text">Admin sezon yarışlarını yükleyene kadar bekle.</p>
      </div>
    `;
    return;
  }

  const now = new Date();
  const seasons = [...new Set(allRaces.map(r => r.season))].sort((a, b) => b - a);
  let currentSeason = parseInt(localStorage.getItem('boxbox_season')) || seasons[0];
  if (!seasons.includes(currentSeason)) currentSeason = seasons[0];

  //3 durum: open (tahmin açık), locked (kilitli, sonuç bekliyor), completed (bitti)
  function getStatus(race) {
    if (race.isCompleted) return 'completed';
    const lockAt = new Date(race.predictionLockAt);
    if (now >= lockAt) return 'locked';
    return 'open';
  }

  function renderSeasonContent() {
    const currentRaces = allRaces.filter(r => r.season === currentSeason);
    const open = currentRaces.filter(r => getStatus(r) === 'open');
    const locked = currentRaces.filter(r => getStatus(r) === 'locked');
    const completed = currentRaces.filter(r => getStatus(r) === 'completed');

    return `
      ${open.length > 0 ? `
        <div class="section-title">
          <span class="section-title-bar"></span>
          🟡 Tahmin Açık
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-mute); font-weight: 400; margin-left: auto;">${open.length} yarış</span>
        </div>
        <div class="grid grid-2 mb-4">
          ${open.map(r => renderRaceCard(r, 'open')).join('')}
        </div>
      ` : ''}

      ${locked.length > 0 ? `
        <div class="section-title">
          <span class="section-title-bar" style="background: var(--silver-light);"></span>
          🔒 Sonuç Bekliyor
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-mute); font-weight: 400; margin-left: auto;">${locked.length} yarış</span>
        </div>
        <div class="grid grid-2 mb-4">
          ${locked.map(r => renderRaceCard(r, 'locked')).join('')}
        </div>
      ` : ''}

      ${completed.length > 0 ? `
        <div class="section-title">
          <span class="section-title-bar" style="background: var(--t-mercedes);"></span>
          🏁 Tamamlanan Yarışlar
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-mute); font-weight: 400; margin-left: auto;">${completed.length} yarış</span>
        </div>
        <div class="grid grid-2">
          ${completed.map(r => renderRaceCard(r, 'completed')).join('')}
        </div>
      ` : ''}

      ${currentRaces.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h2 class="empty-title">${currentSeason} sezonu için yarış yok</h2>
          <p class="empty-text">Başka bir sezon seç.</p>
        </div>
      ` : ''}
    `;
  }

  const currentRaces = allRaces.filter(r => r.season === currentSeason);

  app.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Yarışlar</h1>
        <p class="page-subtitle">${currentSeason} Sezonu · ${currentRaces.length} yarış</p>
      </div>
      <div class="flex flex-gap" style="align-items: center; flex-wrap: wrap;">
        <div class="flex" style="align-items: center; gap: 0.5rem;">
          <label class="text-mute" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Sezon:</label>
          <select id="seasonSelect" class="form-select" style="width: auto; padding: 0.6rem 1rem;">
            ${seasons.map(s => `<option value="${s}" ${s === currentSeason ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="flex" style="align-items: center; gap: 0.5rem;">
          <label class="text-mute" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Lig:</label>
          <select id="leagueSelect" class="form-select" style="width: auto; padding: 0.6rem 1rem;">
            ${myLeagues.map(l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <div id="seasonContent">${renderSeasonContent()}</div>
  `;

  document.getElementById('seasonSelect').addEventListener('change', (e) => {
    currentSeason = parseInt(e.target.value);
    localStorage.setItem('boxbox_season', currentSeason);
    const cur = allRaces.filter(r => r.season === currentSeason);
    document.querySelector('.page-subtitle').textContent = `${currentSeason} Sezonu · ${cur.length} yarış`;
    document.getElementById('seasonContent').innerHTML = renderSeasonContent();
    attachRaceClicks();
  });

  function attachRaceClicks() {
    document.querySelectorAll('.race-card').forEach(card => {
      card.addEventListener('click', () => {
        const raceId = card.dataset.raceId;
        const leagueId = document.getElementById('leagueSelect').value;
        location.hash = `#/leagues/${leagueId}/races/${raceId}/predict`;
      });
    });
  }

  attachRaceClicks();
}

function renderRaceCard(race, status) {
  const dateStr = formatDate(race.raceDate);

  let badge;
  if (status === 'open') {
    badge = '<span class="badge badge-warning">Tahmin Açık</span>';
  } else if (status === 'locked') {
    badge = '<span class="badge badge-secondary">🔒 Kilitli</span>';
  } else {
    badge = '<span class="badge badge-success">✓ Bitti</span>';
  }

  const cardClass = status === 'open' ? 'upcoming' : status === 'completed' ? 'completed' : 'locked';

  return `
    <div class="race-card ${cardClass}" data-race-id="${race.id}">
      <div class="race-card-head">
        <div>
          <div class="race-round">Round ${String(race.round).padStart(2, '0')}</div>
          <div class="race-name">${escapeHtml(race.name)}</div>
          <div class="race-meta">
            <span>📍 ${escapeHtml(race.circuit)}</span>
            <span>·</span>
            <span>📅 ${dateStr}</span>
          </div>
        </div>
        ${badge}
      </div>
      ${race.isCompleted && race.finalResults ? `
        <div class="podium">
          <div class="podium-spot p2">
            <div class="podium-position">P2</div>
            <div class="podium-driver">${race.finalResults[1] || '—'}</div>
          </div>
          <div class="podium-spot p1">
            <div class="podium-position">🏆 P1</div>
            <div class="podium-driver">${race.finalResults[0] || '—'}</div>
          </div>
          <div class="podium-spot p3">
            <div class="podium-position">P3</div>
            <div class="podium-driver">${race.finalResults[2] || '—'}</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}