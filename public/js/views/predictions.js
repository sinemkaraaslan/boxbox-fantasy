import { predictions, races, leagues, toast, DRIVERS, getDriverByCode, formatDate, escapeHtml } from '../api.js';

// Pole sitter için qualifying kilidi açık mı?
function isQualifyingOpen(race) {
  if (!race.qualifyingLockAt) return true; // Eski yarışlarda yoksa açık say
  return new Date() < new Date(race.qualifyingLockAt);
}

export async function renderPrediction(leagueId, raceId) {
  const app = document.getElementById('app');

  const [league, race, existing] = await Promise.all([
    leagues.detail(leagueId),
    races.detail(raceId),
    predictions.getMine(leagueId, raceId).catch(() => null)
  ]);

  const isLocked = new Date() >= new Date(race.predictionLockAt);
  const hasResults = race.isCompleted && race.finalResults && race.finalResults.length > 0;

  //Yarış bitti + tahmin var + puanlanmış -- SONUÇ ekranı
  if (hasResults && existing && existing.pointsBreakdown) {
    renderResultsView(app, league, race, existing);
    return;
  }

  //Yarış bitti + tahmin yok → "tahmin yapmamışsın" + yarış sonucu
  if (hasResults && !existing) {
    renderMissedRaceView(app, league, race);
    return;
  }

  //Lock kapalı + henüz sonuç yok -- "sonuç bekleniyor"
  if (isLocked && !hasResults) {
    app.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${escapeHtml(race.name)}</h1>
          <p class="page-subtitle">${escapeHtml(league.name)} · Round ${race.round}</p>
        </div>
        <a href="#/races" class="btn btn-ghost">← Geri</a>
      </div>
      <div class="empty-state">
        <div class="empty-icon">⏱️</div>
        <h2 class="empty-title">Tahmin Süresi Kapandı</h2>
        <p class="empty-text">Yarış sonuçları girildiğinde puanların hesaplanacak.</p>
        ${existing ? '<p class="text-mute">Tahminin alındı. Sonuçları bekle.</p>' : '<p class="text-mute">Bu yarış için tahmin yapmamışsın.</p>'}
      </div>
    `;
    return;
  }

  //Lock kapalı + tahmin var + puanlanmamış -- "puanlama bekleniyor"
  if (isLocked && existing && !existing.pointsBreakdown) {
    app.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${escapeHtml(race.name)}</h1>
          <p class="page-subtitle">${escapeHtml(league.name)} · Round ${race.round}</p>
        </div>
        <a href="#/races" class="btn btn-ghost">← Geri</a>
      </div>
      <div class="empty-state">
        <div class="empty-icon">⏳</div>
        <h2 class="empty-title">Puanlama Bekleniyor</h2>
        <p class="empty-text">Yarış tamamlandı ama puanların henüz hesaplanmadı.</p>
      </div>
    `;
    return;
  }

  //Lock açık -- tahmin formu
  renderFormView(app, leagueId, raceId, league, race, existing);
}

//FORM VIEW
function renderFormView(app, leagueId, raceId, league, race, existing) {
  const qualifyingOpen = isQualifyingOpen(race);
  
  const state = {
    podium: existing ? [...existing.podiumOrder] : Array(10).fill(null),
    poleSitter: existing?.poleSitter || null,
    fastestLap: existing?.fastestLap || null,
    dnfCount: existing?.dnfCount ?? 3,
    qualifyingOpen, // ⭐ State'e ekledik
  };

  app.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">${escapeHtml(race.name)}</h1>
        <p class="page-subtitle">${escapeHtml(league.name)} · Round ${race.round}</p>
      </div>
      <a href="#/races" class="btn btn-ghost">← Geri</a>
    </div>

    <div class="info-bar">
      <div class="info-item">
        <span class="info-label">📍 Pist</span>
        <span class="info-value">${escapeHtml(race.circuit)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">🏁 Yarış</span>
        <span class="info-value">${formatDate(race.raceDate)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">🔒 Tahmin Kilidi</span>
        <span class="info-value">${formatDate(race.predictionLockAt)}</span>
      </div>
      ${race.qualifyingLockAt ? `
        <div class="info-item">
          <span class="info-label">🎯 Qualifying Kilidi</span>
          <span class="info-value">${formatDate(race.qualifyingLockAt)}</span>
        </div>
      ` : ''}
      <div>
        <span class="badge badge-success">Tahmin Açık</span>
      </div>
    </div>

    <div class="predict-page">
      <div class="predict-slots">
        <div class="slots-header">
          <div class="slots-title">🏆 Senin Top 10</div>
          <div class="slots-progress" id="slotsProgress">0 / 10</div>
        </div>
        <div id="slotsList"></div>
      </div>

      <div>
        <div class="driver-pool">
          <div class="pool-header">
            <div class="pool-title">🏎️ Sürücüler</div>
            <div class="pool-hint">Tıklayarak sıraya ekle</div>
          </div>
          <div class="driver-grid" id="driverGrid"></div>
        </div>

        <div class="bonus-section">
          <div class="bonus-header">
            <div class="bonus-title">⚡ Bonus Tahminler</div>
            <div class="bonus-points">+40 PUAN</div>
          </div>

          <div class="bonus-grid">
            <div class="bonus-block">
              <label>
                🎯 Pole Sitter <span style="color: var(--gold); font-weight: 700;">+15</span>
                ${!qualifyingOpen ? '<span style="color: var(--racing-red); font-weight: 700; margin-left: 0.5rem;">🔒 Kilitli</span>' : ''}
              </label>
              ${!qualifyingOpen ? `
                <div style="background: rgba(225, 6, 0, 0.08); border: 1px solid rgba(225, 6, 0, 0.3); border-radius: var(--radius-sm); padding: 0.6rem 0.8rem; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--racing-red);">
                  Qualifying başladı, pole tahmini değiştirilemez
                </div>
              ` : ''}
              <div class="pill-row" id="poleRow" ${!qualifyingOpen ? 'style="opacity: 0.5; pointer-events: none;"' : ''}></div>
            </div>

            <div class="bonus-block">
              <label>⚡ Fastest Lap <span style="color: var(--gold); font-weight: 700;">+10</span></label>
              <div class="pill-row" id="flRow"></div>
            </div>

            <div class="bonus-block">
              <label>💥 DNF Sayısı <span style="color: var(--gold); font-weight: 700;">+15</span></label>
              <div class="dnf-control">
                <div class="dnf-display" id="dnfDisplay">${state.dnfCount}</div>
                <input type="range" min="0" max="20" value="${state.dnfCount}" class="dnf-slider" id="dnfSlider" />
                <div class="dnf-marks">
                  <span>0</span><span>5</span><span>10</span><span>15</span><span>20</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="submit-bar">
          <div class="submit-summary" id="submitSummary">
            <span id="summaryText">Lütfen tüm alanları doldur</span>
          </div>
          <div class="submit-actions">
            ${existing ? `<button class="btn btn-danger" id="deleteBtn">Sil</button>` : ''}
            <button class="btn btn-primary" id="submitBtn" disabled>
              ${existing ? '💾 Güncelle' : '🏁 Tahmin Yap'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderSlots(state);
  renderDriverGrid(state);
  renderBonusPills(state);
  attachDnfHandler(state);
  attachSubmitHandlers(leagueId, raceId, existing, state);
  updateSummary(state);
}

//SLOTS
function renderSlots(state) {
  const list = document.getElementById('slotsList');
  list.innerHTML = state.podium.map((code, i) => {
    const driver = code ? getDriverByCode(code) : null;
    if (!driver) {
      return `
        <div class="slot empty">
          <div class="slot-pos ${i < 3 ? `p${i + 1}` : ''}">${i + 1}</div>
          <div class="slot-content">
            <div class="slot-empty-text">— Boş —</div>
          </div>
        </div>
      `;
    }
    return `
      <div class="slot filled" data-pos="${i}">
        <div class="slot-team-strip" data-team="${driver.team}"></div>
        <div class="slot-pos ${i < 3 ? `p${i + 1}` : ''}">${i + 1}</div>
        <div class="slot-content">
          <div class="slot-code">${driver.code}</div>
          <div class="slot-name">${driver.lastName}</div>
        </div>
        <div class="slot-remove">✕</div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.slot.filled').forEach(el => {
    el.addEventListener('click', () => {
      const pos = parseInt(el.dataset.pos);
      const state = window._predictState;
      state.podium[pos] = null;
      renderSlots(state);
      renderDriverGrid(state);
      updateSummary(state);
    });
  });

  const filled = state.podium.filter(Boolean).length;
  const progress = document.getElementById('slotsProgress');
  progress.textContent = `${filled} / 10`;
  progress.classList.toggle('complete', filled === 10);

  window._predictState = state;
}

//DRIVER POOL
function renderDriverGrid(state) {
  const grid = document.getElementById('driverGrid');
  const podiumFull = state.podium.filter(Boolean).length === 10;

  grid.innerHTML = DRIVERS.map(d => {
    const pos = state.podium.indexOf(d.code);
    const isSelected = pos !== -1;
    const isDisabled = !isSelected && podiumFull;

    return `
      <div class="driver-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" data-code="${d.code}" data-team="${d.team}">
        ${isSelected ? `<div class="driver-pos-badge">P${pos + 1}</div>` : ''}
        <div class="driver-code">${d.code}</div>
        <div class="driver-lastname">${d.lastName}</div>
        <div class="driver-team">${d.team}</div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.driver-card').forEach(card => {
    card.addEventListener('click', () => {
      const code = card.dataset.code;
      const state = window._predictState;
      const currentPos = state.podium.indexOf(code);

      if (currentPos !== -1) {
        state.podium[currentPos] = null;
      } else {
        const emptyIdx = state.podium.indexOf(null);
        if (emptyIdx === -1) {
          toast('Top 10 dolu — önce bir sürücü çıkar', 'error');
          return;
        }
        state.podium[emptyIdx] = code;
      }

      renderSlots(state);
      renderDriverGrid(state);
      updateSummary(state);
    });
  });

  window._predictState = state;
}

//BONUS PILLS (Pole, FL)
function renderBonusPills(state) {
  const poleRow = document.getElementById('poleRow');
  const flRow = document.getElementById('flRow');

  function makePills(selected) {
    return DRIVERS.map(d => `
      <div class="pill ${selected === d.code ? 'selected' : ''}" data-code="${d.code}">
        ${d.code}
      </div>
    `).join('');
  }

  poleRow.innerHTML = makePills(state.poleSitter);
  flRow.innerHTML = makePills(state.fastestLap);

  // ⭐ Pole pill'leri sadece qualifying açıksa interaktif
  if (state.qualifyingOpen) {
    poleRow.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const state = window._predictState;
        state.poleSitter = state.poleSitter === pill.dataset.code ? null : pill.dataset.code;
        poleRow.querySelectorAll('.pill').forEach(p => {
          p.classList.toggle('selected', p.dataset.code === state.poleSitter);
        });
        updateSummary(state);
      });
    });
  }

  flRow.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const state = window._predictState;
      state.fastestLap = state.fastestLap === pill.dataset.code ? null : pill.dataset.code;
      flRow.querySelectorAll('.pill').forEach(p => {
        p.classList.toggle('selected', p.dataset.code === state.fastestLap);
      });
      updateSummary(state);
    });
  });
}

//DNF SLIDER
function attachDnfHandler(state) {
  const slider = document.getElementById('dnfSlider');
  const display = document.getElementById('dnfDisplay');

  slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.dnfCount = val;
    display.textContent = val;
    updateSummary(state);
  });
}

//SUMMARY & SUBMIT
function updateSummary(state) {
  const podiumFull = state.podium.filter(Boolean).length === 10;
  const hasPole = !!state.poleSitter;
  const hasFL = !!state.fastestLap;
  
  // ⭐ Qualifying kapalıysa pole zorunlu değil
  const poleValid = state.qualifyingOpen ? hasPole : true;
  const valid = podiumFull && poleValid && hasFL;

  const summary = document.getElementById('summaryText');
  const btn = document.getElementById('submitBtn');

  if (!valid) {
    const missing = [];
    if (!podiumFull) missing.push(`${10 - state.podium.filter(Boolean).length} sürücü`);
    if (state.qualifyingOpen && !hasPole) missing.push('pole sitter');
    if (!hasFL) missing.push('fastest lap');
    summary.innerHTML = `<span class="text-mute">Eksik:</span> <strong>${missing.join(', ')}</strong>`;
    btn.disabled = true;
  } else {
    const polePart = state.qualifyingOpen ? 'pole + ' : '';
    summary.innerHTML = `<span class="text-mute">Hazır.</span> <strong>10 sürücü + ${polePart}fastest lap + ${state.dnfCount} DNF</strong>`;
    btn.disabled = false;
  }
}

function attachSubmitHandlers(leagueId, raceId, existing, state) {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.addEventListener('click', async () => {
    const data = {
      podiumOrder: state.podium,
      fastestLap: state.fastestLap,
      dnfCount: state.dnfCount
    };
    
    // ⭐ Pole sadece qualifying açıksa gönder
    if (state.qualifyingOpen) {
      data.poleSitter = state.poleSitter;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Kaydediliyor...';

    try {
      if (existing) {
        await predictions.update(existing.id, data);
        toast('Tahmin güncellendi! 🏁', 'success');
      } else {
        await predictions.create(leagueId, raceId, data);
        toast('Tahmin yapıldı! 🏁', 'success');
      }
      location.hash = '#/races';
    } catch (err) {
      toast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = existing ? '💾 Güncelle' : '🏁 Tahmin Yap';
    }
  });

  if (existing) {
    document.getElementById('deleteBtn').addEventListener('click', async () => {
      if (!confirm('Tahmini silmek istediğine emin misin?')) return;
      try {
        await predictions.delete(existing.id);
        toast('Tahmin silindi', 'success');
        location.hash = '#/races';
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }
}

//RESULTS VIEW — yarış sonuçlandı + tahmin var
function renderResultsView(app, league, race, prediction) {
  const bd = prediction.pointsBreakdown || {};
  const actual = race.finalResults || [];

  app.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">${escapeHtml(race.name)}</h1>
        <p class="page-subtitle">${escapeHtml(league.name)} · Round ${race.round} · Sonuçlandı</p>
      </div>
      <a href="#/races" class="btn btn-ghost">← Geri</a>
    </div>

    <div class="points-card">
      <div class="points-total">
        <div>
          <div class="points-total-label">Kazandığın Puan</div>
          <div class="text-mute" style="font-size: 0.85rem; margin-top: 0.3rem;">Maksimum 140 / 140</div>
        </div>
        <div>
          <span class="points-total-value">${prediction.pointsAwarded || 0}</span>
          <span class="points-total-unit">puan</span>
        </div>
      </div>

      <div class="breakdown-grid">
        <div class="breakdown-item">
          <div class="breakdown-label">🏎️ Podium</div>
          <div class="breakdown-value">+${bd.podium || 0}</div>
        </div>
        <div class="breakdown-item">
          <div class="breakdown-label">🎯 Pole</div>
          <div class="breakdown-value">+${bd.pole || 0}</div>
        </div>
        <div class="breakdown-item">
          <div class="breakdown-label">⚡ Fastest Lap</div>
          <div class="breakdown-value">+${bd.fastestLap || 0}</div>
        </div>
        <div class="breakdown-item">
          <div class="breakdown-label">💥 DNF</div>
          <div class="breakdown-value">+${bd.dnf || 0}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="result-list">
        <div class="result-list-title">📋 Senin Tahminin</div>
        ${prediction.podiumOrder.map((code, i) => {
          const driver = getDriverByCode(code);
          const correct = actual[i] === code;
          return `
            <div class="result-row ${correct ? 'correct' : ''}">
              <div class="result-pos">P${i + 1}</div>
              <div class="result-driver">${code}${driver ? ` · ${driver.lastName}` : ''}</div>
              ${correct ? '<div class="result-correct">✓</div>' : ''}
            </div>
          `;
        }).join('')}
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 1.5rem; flex-wrap: wrap; font-size: 0.85rem;">
          <div><span class="text-mute">Pole:</span> <strong>${prediction.poleSitter || '—'}</strong> ${prediction.poleSitter === race.poleSitter ? '<span class="result-correct">✓</span>' : ''}</div>
          <div><span class="text-mute">FL:</span> <strong>${prediction.fastestLap}</strong> ${prediction.fastestLap === race.fastestLap ? '<span class="result-correct">✓</span>' : ''}</div>
          <div><span class="text-mute">DNF:</span> <strong>${prediction.dnfCount}</strong> ${prediction.dnfCount === race.dnfCount ? '<span class="result-correct">✓</span>' : ''}</div>
        </div>
      </div>

      <div class="result-list">
        <div class="result-list-title">🏁 Gerçek Sonuç</div>
        ${actual.slice(0, 10).map((code, i) => {
          const driver = getDriverByCode(code);
          return `
            <div class="result-row">
              <div class="result-pos">P${i + 1}</div>
              <div class="result-driver">${code}${driver ? ` · ${driver.lastName}` : ''}</div>
            </div>
          `;
        }).join('')}
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 1.5rem; flex-wrap: wrap; font-size: 0.85rem;">
          <div><span class="text-mute">Pole:</span> <strong>${race.poleSitter || '—'}</strong></div>
          <div><span class="text-mute">FL:</span> <strong>${race.fastestLap || '—'}</strong></div>
          <div><span class="text-mute">DNF:</span> <strong>${race.dnfCount ?? '—'}</strong></div>
        </div>
      </div>
    </div>
  `;
}

//MISSED RACE VIEW
function renderMissedRaceView(app, league, race) {
  const actual = race.finalResults || [];

  app.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">${escapeHtml(race.name)}</h1>
        <p class="page-subtitle">${escapeHtml(league.name)} · Round ${race.round} · Sonuçlandı</p>
      </div>
      <a href="#/races" class="btn btn-ghost">← Geri</a>
    </div>

    <div class="empty-state mb-3">
      <div class="empty-icon">😔</div>
      <h2 class="empty-title">Bu Yarışa Tahmin Yapmamışsın</h2>
      <p class="empty-text">Yarış tamamlandı, sonuçlar aşağıda. Bir sonraki yarış için tahmin yapmayı unutma!</p>
    </div>

    <div class="result-list">
      <div class="result-list-title">🏁 Yarış Sonucu</div>
      ${actual.slice(0, 10).map((code, i) => {
        const driver = getDriverByCode(code);
        return `
          <div class="result-row">
            <div class="result-pos">P${i + 1}</div>
            <div class="result-driver">${code}${driver ? ` · ${driver.lastName}` : ''}</div>
          </div>
        `;
      }).join('')}
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 1.5rem; flex-wrap: wrap; font-size: 0.85rem;">
        <div><span class="text-mute">Pole:</span> <strong>${race.poleSitter || '—'}</strong></div>
        <div><span class="text-mute">FL:</span> <strong>${race.fastestLap || '—'}</strong></div>
        <div><span class="text-mute">DNF:</span> <strong>${race.dnfCount ?? '—'}</strong></div>
      </div>
    </div>
  `;
}