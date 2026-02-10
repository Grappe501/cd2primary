async function loadTeams(){
  const res = await fetch('/data/mock/teams.json', { cache: 'no-store' });
  if(!res.ok) throw new Error('Failed to load mock teams');
  return await res.json();
}

function byKey(key){
  return (a,b) => {
    if(key === 'points') return (b.points ?? 0) - (a.points ?? 0);
    if(key === 'teamName') return String(a.teamName).localeCompare(String(b.teamName));
    if(key === 'homeCounty') return String(a.homeCounty).localeCompare(String(b.homeCounty));
    if(key === 'lastApproved') return String(b.lastApproved ?? '').localeCompare(String(a.lastApproved ?? ''));
    return 0;
  };
}

function renderTop5(teams){
  const top = [...teams].sort(byKey('points')).slice(0,5);
  const host = document.querySelector('[data-top5]');
  if(!host) return;
  host.innerHTML = top.map((t, i) => `
    <div class="card" style="box-shadow:none;">
      <div class="spread" style="gap:1rem;">
        <div>
          <h2 style="margin:0 0 .25rem;">#${i+1} ${t.teamName}</h2>
          <p style="margin:0; color: var(--muted);">Home county: ${t.homeCounty} • Last approved: ${t.lastApproved ?? '—'}</p>
          <div class="badges" style="margin-top:.6rem;">
            ${(t.badges||[]).slice(0,3).map(b => `<span class="badge">${b}</span>`).join('')}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:2rem; font-weight:900; line-height:1;">${t.points ?? 0}</div>
          <small>points</small>
        </div>
      </div>
    </div>
  `).join('');
}

function renderTable(teams){
  const tbody = document.querySelector('tbody[data-teams]');
  if(!tbody) return;
  tbody.innerHTML = teams.map((t, idx) => `
    <tr>
      <td style="padding:.65rem .5rem; border-bottom:1px solid var(--border);">${idx+1}</td>
      <td style="padding:.65rem .5rem; border-bottom:1px solid var(--border); font-weight:800;">${t.teamName}</td>
      <td style="padding:.65rem .5rem; border-bottom:1px solid var(--border); color:var(--muted);">${t.homeCounty}</td>
      <td style="padding:.65rem .5rem; border-bottom:1px solid var(--border); text-align:right; font-weight:900;">${t.points ?? 0}</td>
      <td style="padding:.65rem .5rem; border-bottom:1px solid var(--border); color:var(--muted);">${t.lastApproved ?? '—'}</td>
      <td style="padding:.65rem .5rem; border-bottom:1px solid var(--border);">
        <div class="badges" style="margin:0;">
          ${(t.badges||[]).slice(0,4).map(b => `<span class="badge">${b}</span>`).join('')}
        </div>
      </td>
    </tr>
  `).join('');
}

function wireControls(allTeams){
  const sortSel = document.querySelector('[data-sort]');
  const countySel = document.querySelector('[data-county]');
  const searchInp = document.querySelector('[data-search]');

  function apply(){
    const sortKey = sortSel?.value || 'points';
    const county = countySel?.value || 'ALL';
    const q = (searchInp?.value || '').trim().toLowerCase();

    let teams = [...allTeams];

    if(county !== 'ALL'){
      teams = teams.filter(t => String(t.homeCounty).toLowerCase() === county.toLowerCase());
    }
    if(q){
      teams = teams.filter(t =>
        String(t.teamName).toLowerCase().includes(q) ||
        String(t.homeCounty).toLowerCase().includes(q)
      );
    }

    teams.sort(byKey(sortKey));
    renderTable(teams);
  }

  sortSel?.addEventListener('change', apply);
  countySel?.addEventListener('change', apply);
  searchInp?.addEventListener('input', apply);

  apply();
}

(async function init(){
  try{
    const teams = await loadTeams();
    renderTop5(teams);
    wireControls(teams);
  }catch(err){
    console.error(err);
    const el = document.querySelector('[data-error]');
    if(el) el.textContent = 'Could not load leaderboard data.';
  }
})();
