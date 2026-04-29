/* ══════════════════════════════════════
   EXCHANGEFLOW CRM — script.js
   Vanilla JS, LocalStorage, no frameworks
══════════════════════════════════════ */

'use strict';

// ─── CONSTANTS ───────────────────────────────────────
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };
const STATUSES = ['New Lead','Contacted','Interested','Session Booked','Applicant','Applied','Matched','Approved','Realized'];
const STATUS_COLORS = {
  'New Lead':      '#6b7cff',
  'Contacted':     '#a78bfa',
  'Interested':    '#f472b6',
  'Session Booked':'#fb923c',
  'Applicant':     '#fbbf24',
  'Applied':       '#34d399',
  'Matched':       '#22d3ee',
  'Approved':      '#4f7cff',
  'Realized':      '#22d3a0',
};
const STATUS_CSS_CLASS = {
  'New Lead':      'status-new-lead',
  'Contacted':     'status-contacted',
  'Interested':    'status-interested',
  'Session Booked':'status-session-booked',
  'Applicant':     'status-applicant',
  'Applied':       'status-applied',
  'Matched':       'status-matched',
  'Approved':      'status-approved',
  'Realized':      'status-realized',
};
const CATEGORY_COLORS = {
  Fingerprint: '#4f7cff',
  Heartbeat:   '#f472b6',
  Teach:       '#22d3ee',
  Raise:       '#fbbf24',
  Impact:      '#34d399',
  Sustain:     '#22d3a0',
};

// ─── STATE ───────────────────────────────────────────
let eps = [];
let projects = [];
let members = [];
let draggedEPId = null;
let currentPage = 'dashboard';

// ─── STORAGE HELPERS ─────────────────────────────────
function save() {
  localStorage.setItem('ef_eps', JSON.stringify(eps));
  localStorage.setItem('ef_projects', JSON.stringify(projects));
  localStorage.setItem('ef_members', JSON.stringify(members));
}
function load() {
  eps      = JSON.parse(localStorage.getItem('ef_eps') || '[]');
  projects = JSON.parse(localStorage.getItem('ef_projects') || '[]');
  members  = JSON.parse(localStorage.getItem('ef_members') || '[]');
  if (!projects.length) seedProjects();
  if (!members.length) seedMembers();
  if (!eps.length) seedEPs();
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2,5);
}

// ─── SEED DATA ────────────────────────────────────────
function seedMembers() {
  members = [
    { id: generateId(), name: 'Rafi Islam',    email: 'rafi@ef.org' },
    { id: generateId(), name: 'Nadia Hossain', email: 'nadia@ef.org' },
    { id: generateId(), name: 'Tanvir Ahmed',  email: 'tanvir@ef.org' },
    { id: generateId(), name: 'Sadia Jahan',   email: 'sadia@ef.org' },
  ];
  save();
}
function seedProjects() {
  const now = new Date().toISOString().split('T')[0];
  projects = [
    { id: generateId(), country: 'Germany',     name: 'Smart Cities Engineering Internship',  category: 'Fingerprint', description: 'Work with Berlin tech firms on urban data infrastructure.', status: 'Open' },
    { id: generateId(), country: 'Turkey',       name: 'Public Health Research Program',       category: 'Heartbeat',   description: 'Assist in Istanbul clinics on preventive health outreach.', status: 'Open' },
    { id: generateId(), country: 'India',        name: 'Rural Education Initiative',            category: 'Teach',       description: 'Teach STEM subjects in underserved communities in Pune.', status: 'Closing Soon' },
    { id: generateId(), country: 'Colombia',     name: 'Social Innovation Lab',                 category: 'Impact',      description: 'Co-create solutions for urban displacement in Medellín.', status: 'Open' },
    { id: generateId(), country: 'Malaysia',     name: 'Sustainable Agriculture Project',       category: 'Sustain',     description: 'Implement eco-farming practices in Selangor rural zones.', status: 'Open' },
    { id: generateId(), country: 'Brazil',       name: 'Business Development Accelerator',      category: 'Raise',       description: 'Support São Paulo startups in scaling impact operations.', status: 'Closing Soon' },
    { id: generateId(), country: 'Egypt',        name: 'Renewable Energy Engineering',          category: 'Fingerprint', description: 'Work on solar panel installation projects across Luxor.', status: 'Open' },
    { id: generateId(), country: 'Indonesia',    name: 'Marine Conservation Program',           category: 'Sustain',     description: 'Protect coral reef ecosystems in the Lombok archipelago.', status: 'Open' },
  ];
  save();
}
function seedEPs() {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const past = (n) => { const d = new Date(today); d.setDate(d.getDate()-n); return fmt(d); };
  const future = (n) => { const d = new Date(today); d.setDate(d.getDate()+n); return fmt(d); };

  eps = [
    { id: generateId(), name: 'Ayesha Rahman',  email: 'ayesha@du.edu.bd',   phone: '+880 171 234 5678', university: 'Dhaka University',  degree: 'BSc CS', country: 'Germany',   projectType: 'Fingerprint', motivation: 'Eager to gain international tech experience.', status: 'Applied',       assignedId: members[0]?.id||'', lastContact: past(3), followup: future(2),  createdAt: past(10) },
    { id: generateId(), name: 'Sakib Al Hasan', email: 'sakib@buet.ac.bd',   phone: '+880 182 345 6789', university: 'BUET',              degree: 'BSc EEE', country: 'Turkey',   projectType: 'Heartbeat',   motivation: 'Passionate about global health challenges.',  status: 'Session Booked',assignedId: members[1]?.id||'', lastContact: past(1), followup: fmt(today), createdAt: past(7) },
    { id: generateId(), name: 'Fatima Noor',    email: 'fatima@nsu.edu',     phone: '+880 193 456 7890', university: 'NSU',               degree: 'BBA',     country: 'Colombia', projectType: 'Raise',       motivation: 'Want to understand social enterprise models.', status: 'Matched',       assignedId: members[2]?.id||'', lastContact: past(5), followup: future(5),  createdAt: past(15) },
    { id: generateId(), name: 'Mehedi Hasan',   email: 'mehedi@iu.ac.bd',    phone: '+880 154 567 8901', university: 'IU',                degree: 'BSc CE',  country: 'India',    projectType: 'Teach',       motivation: 'Teaching abroad is my dream.',               status: 'Interested',    assignedId: members[0]?.id||'', lastContact: past(8), followup: past(2),    createdAt: past(20) },
    { id: generateId(), name: 'Nishat Tasnim',  email: 'nishat@sust.edu',    phone: '+880 165 678 9012', university: 'SUST',              degree: 'MSc Env', country: 'Malaysia', projectType: 'Sustain',     motivation: 'Committed to environmental sustainability.',  status: 'Approved',      assignedId: members[3]?.id||'', lastContact: past(2), followup: future(10), createdAt: past(5) },
    { id: generateId(), name: 'Rakibul Islam',  email: 'rakib@ruet.ac.bd',   phone: '+880 176 789 0123', university: 'RUET',              degree: 'BSc ME',  country: 'Brazil',   projectType: 'Raise',       motivation: 'Business + engineering crossover interests.', status: 'New Lead',      assignedId: '',                lastContact: '',      followup: future(1),  createdAt: past(1) },
    { id: generateId(), name: 'Tamanna Akter',  email: 'tamanna@diu.edu.bd', phone: '+880 187 890 1234', university: 'DIU',               degree: 'MBBS',    country: 'Egypt',    projectType: 'Heartbeat',   motivation: 'Healthcare system comparison research.',      status: 'Contacted',     assignedId: members[1]?.id||'', lastContact: past(3), followup: past(1),    createdAt: past(8) },
    { id: generateId(), name: 'Arif Hossain',   email: 'arif@bracu.ac.bd',   phone: '+880 198 901 2345', university: 'BRAC University',   degree: 'BSc CS',  country: 'Germany',  projectType: 'Fingerprint', motivation: 'Wants to work at European tech startups.',   status: 'Realized',      assignedId: members[2]?.id||'', lastContact: past(30),followup: '',          createdAt: past(45) },
  ];
  save();
}

// ─── AUTH ─────────────────────────────────────────────
function handleLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  const err = document.getElementById('login-error');
  if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
    sessionStorage.setItem('ef_auth', '1');
    err.classList.add('hidden');
    showApp();
  } else {
    err.classList.remove('hidden');
  }
}
function handleLogout() {
  sessionStorage.removeItem('ef_auth');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !document.getElementById('login-screen').classList.contains('hidden')) {
    handleLogin();
  }
});

// ─── SHOW/HIDE SCREENS ────────────────────────────────
function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('signup-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  load();
  populateMemberDropdowns();
  populateCountryFilters();
  navigate('dashboard');
}
function showLogin() {
  document.getElementById('signup-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

// ─── NAVIGATION ───────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nav) nav.classList.add('active');
  currentPage = page;
  closeSidebar();

  if (page === 'dashboard') renderDashboard();
  else if (page === 'ep-list') renderEPList();
  else if (page === 'funnel') renderFunnelBoard();
  else if (page === 'add-ep') {
    document.getElementById('ep-form-title').textContent = 'Add New EP';
    resetEPForm();
    populateMemberDropdowns();
  }
  else if (page === 'projects') renderProjects();
  else if (page === 'followups') renderFollowups();
}

// ─── MOBILE SIDEBAR ───────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const btn = document.getElementById('hamburger');
  const open = sidebar.classList.toggle('open');
  overlay.classList.toggle('open', open);
  btn.classList.toggle('open', open);
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

// ─── POPULATE DROPDOWNS ───────────────────────────────
function populateMemberDropdowns() {
  ['ep-assigned', 'filter-member'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const val = sel.value;
    sel.innerHTML = id === 'ep-assigned'
      ? '<option value="">Unassigned</option>'
      : '<option value="">All Members</option>';
    members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id; opt.textContent = m.name;
      sel.appendChild(opt);
    });
    sel.value = val;
  });
}
function populateCountryFilters() {
  const countries = [...new Set(eps.map(e => e.country).filter(Boolean))].sort();
  ['filter-country', 'project-filter-country'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">All Countries</option>';
    countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
  });
}

// ─── DASHBOARD ────────────────────────────────────────
function renderDashboard() {
  renderStats();
  renderFunnelBars();
  renderRecentActivity();
  renderOverdue();
}
function renderStats() {
  const total     = eps.length;
  const realized  = eps.filter(e => e.status === 'Realized').length;
  const active    = eps.filter(e => !['Realized','New Lead'].includes(e.status)).length;
  const unassigned= eps.filter(e => !e.assignedId).length;
  const overdue   = eps.filter(e => e.followup && isOverdue(e.followup)).length;
  const convRate  = total ? Math.round((realized / total) * 100) : 0;

  const statsData = [
    { label: 'Total EPs',     value: total,    sub: 'in pipeline',         color: 'var(--accent)' },
    { label: 'Active',        value: active,   sub: 'in progress',         color: 'var(--yellow)' },
    { label: 'Realized',      value: realized, sub: `${convRate}% conv.`,  color: 'var(--green)' },
    { label: 'Overdue',       value: overdue,  sub: 'need follow-up',      color: 'var(--red)' },
    { label: 'Unassigned',    value: unassigned,sub:'need a member',       color: 'var(--orange)' },
    { label: 'Members',       value: members.length, sub: 'oGX team',     color: 'var(--s2)' },
  ];
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = statsData.map(s => `
    <div class="stat-card" style="--accent-color:${s.color}">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>`).join('');
}
function renderFunnelBars() {
  const counts = {};
  STATUSES.forEach(s => counts[s] = 0);
  eps.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });
  const max = Math.max(...Object.values(counts), 1);
  const el = document.getElementById('funnel-bars');
  el.innerHTML = STATUSES.map(s => `
    <div class="funnel-bar-row">
      <div class="funnel-bar-label">${s}</div>
      <div class="funnel-bar-track">
        <div class="funnel-bar-fill" style="width:${(counts[s]/max)*100}%; background:${STATUS_COLORS[s]}"></div>
      </div>
      <div class="funnel-bar-count">${counts[s]}</div>
    </div>`).join('');
}
function renderRecentActivity() {
  const recent = [...eps].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,5);
  const el = document.getElementById('recent-activity');
  if (!recent.length) { el.innerHTML = '<div class="empty-state" style="padding:24px"><p>No EPs yet.</p></div>'; return; }
  el.innerHTML = recent.map(e => `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div>
        <div class="activity-text"><strong>${e.name}</strong> — ${e.status}</div>
        <div class="activity-time">${e.country || 'No country'} · ${e.university || 'No university'}</div>
      </div>
    </div>`).join('');
}
function renderOverdue() {
  const overdue = eps.filter(e => e.followup && isOverdue(e.followup));
  const el = document.getElementById('overdue-list');
  if (!overdue.length) { el.innerHTML = '<p style="color:var(--text-muted);padding:8px 0;font-size:13px">✓ No overdue follow-ups. Great work!</p>'; return; }
  el.innerHTML = overdue.map(e => {
    const m = members.find(x => x.id === e.assignedId);
    return `<div class="overdue-row">
      <div class="name">${e.name}</div>
      <div class="member">${m ? m.name : 'Unassigned'}</div>
      <div><span class="status-badge ${STATUS_CSS_CLASS[e.status]}">${e.status}</span></div>
      <div class="date">⚠ ${e.followup}</div>
      <button class="btn-icon" onclick="openEPModal('${e.id}')">View</button>
    </div>`;
  }).join('');
}

// ─── EP LIST ──────────────────────────────────────────
function renderEPList() {
  const query   = (document.getElementById('search-input')?.value || '').toLowerCase();
  const status  = document.getElementById('filter-status')?.value || '';
  const memberId= document.getElementById('filter-member')?.value || '';
  const country = document.getElementById('filter-country')?.value || '';

  let filtered = eps.filter(e => {
    if (status   && e.status !== status) return false;
    if (memberId && e.assignedId !== memberId) return false;
    if (country  && e.country !== country) return false;
    if (query && !`${e.name} ${e.email} ${e.university} ${e.country}`.toLowerCase().includes(query)) return false;
    return true;
  });

  document.getElementById('ep-count-label').textContent = `${filtered.length} participant${filtered.length !== 1 ? 's' : ''}`;
  const tbody = document.getElementById('ep-table-body');
  const empty = document.getElementById('ep-empty');

  if (!filtered.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  tbody.innerHTML = filtered.map(e => {
    const m = members.find(x => x.id === e.assignedId);
    const fClass = dateClass(e.followup);
    return `<tr>
      <td><div class="ep-name-cell">${e.name}</div><div class="ep-email-cell">${e.email}</div></td>
      <td class="ep-email-cell">${e.email}</td>
      <td>${e.university || '—'}</td>
      <td>${e.country || '—'}</td>
      <td>${m ? `<span class="member-chip">${m.name}</span>` : '<span class="member-chip unassigned">Unassigned</span>'}</td>
      <td><span class="status-badge ${STATUS_CSS_CLASS[e.status]}">${e.status}</span></td>
      <td><span class="${fClass}">${e.followup || '—'}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" onclick="openEPModal('${e.id}')" title="View">👁</button>
          <button class="btn-icon" onclick="editEP('${e.id}')" title="Edit">✏</button>
          <button class="btn-icon danger" onclick="confirmDelete('ep','${e.id}')" title="Delete">✕</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  populateMemberDropdowns();
  populateCountryFilters();
}

function dateClass(dateStr) {
  if (!dateStr) return 'date-normal';
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr);
  if (d < today) return 'date-overdue';
  if (d.toDateString() === today.toDateString()) return 'date-today';
  return 'date-normal';
}
function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(dateStr) < today;
}
function isToday(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

// ─── EP FORM ──────────────────────────────────────────
function resetEPForm() {
  ['ep-id','ep-name','ep-email','ep-phone','ep-university','ep-degree','ep-motivation','ep-last-contact','ep-followup'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('ep-country').value = '';
  document.getElementById('ep-project-type').value = '';
  document.getElementById('ep-assigned').value = '';
  document.getElementById('ep-status').value = 'New Lead';
}

function saveEP() {
  const name = document.getElementById('ep-name').value.trim();
  const email = document.getElementById('ep-email').value.trim();
  if (!name || !email) { showToast('Name and Email are required.', 'error'); return; }

  const id = document.getElementById('ep-id').value;
  const assignedId = document.getElementById('ep-assigned').value;
  const prevAssigned = id ? (eps.find(e => e.id === id)?.assignedId || '') : '';

  const data = {
    id: id || generateId(),
    name,
    email,
    phone:       document.getElementById('ep-phone').value.trim(),
    university:  document.getElementById('ep-university').value.trim(),
    degree:      document.getElementById('ep-degree').value.trim(),
    country:     document.getElementById('ep-country').value,
    projectType: document.getElementById('ep-project-type').value,
    assignedId,
    status:      document.getElementById('ep-status').value,
    lastContact: document.getElementById('ep-last-contact').value,
    followup:    document.getElementById('ep-followup').value,
    motivation:  document.getElementById('ep-motivation').value.trim(),
    createdAt:   id ? (eps.find(e => e.id === id)?.createdAt || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
  };

  if (id) {
    const idx = eps.findIndex(e => e.id === id);
    if (idx > -1) eps[idx] = data;
  } else {
    eps.push(data);
  }
  save();

  // Notify if newly assigned
  if (assignedId && assignedId !== prevAssigned) {
    const m = members.find(x => x.id === assignedId);
    if (m) triggerAssignNotification(m, data);
  }

  populateCountryFilters();
  populateMemberDropdowns();
  showToast(id ? 'EP updated successfully.' : 'EP added to pipeline!', 'success');
  navigate('ep-list');
}

function editEP(id) {
  const ep = eps.find(e => e.id === id);
  if (!ep) return;
  document.getElementById('ep-form-title').textContent = 'Edit EP';
  document.getElementById('ep-id').value         = ep.id;
  document.getElementById('ep-name').value       = ep.name;
  document.getElementById('ep-email').value      = ep.email;
  document.getElementById('ep-phone').value      = ep.phone || '';
  document.getElementById('ep-university').value = ep.university || '';
  document.getElementById('ep-degree').value     = ep.degree || '';
  document.getElementById('ep-country').value    = ep.country || '';
  document.getElementById('ep-project-type').value = ep.projectType || '';
  document.getElementById('ep-assigned').value   = ep.assignedId || '';
  document.getElementById('ep-status').value     = ep.status;
  document.getElementById('ep-last-contact').value = ep.lastContact || '';
  document.getElementById('ep-followup').value   = ep.followup || '';
  document.getElementById('ep-motivation').value = ep.motivation || '';
  navigate('add-ep');
}

function deleteEP(id) {
  eps = eps.filter(e => e.id !== id);
  save();
  populateCountryFilters();
  closeModal('confirm-modal');
  showToast('EP deleted.', 'success');
  if (currentPage === 'ep-list') renderEPList();
  else if (currentPage === 'dashboard') renderDashboard();
  else if (currentPage === 'funnel') renderFunnelBoard();
}

// ─── EP DETAIL MODAL ──────────────────────────────────
function openEPModal(id) {
  const ep = eps.find(e => e.id === id);
  if (!ep) return;
  const m = members.find(x => x.id === ep.assignedId);
  document.getElementById('modal-ep-name').textContent = ep.name;
  document.getElementById('modal-ep-body').innerHTML = `
    <div class="ep-detail-grid">
      ${detail('Email', ep.email)}
      ${detail('Phone', ep.phone)}
      ${detail('University', ep.university)}
      ${detail('Degree', ep.degree)}
      ${detail('Preferred Country', ep.country)}
      ${detail('Project Type', ep.projectType)}
      ${detail('Assigned To', m ? m.name : 'Unassigned')}
      ${detail('Status', `<span class="status-badge ${STATUS_CSS_CLASS[ep.status]}">${ep.status}</span>`)}
      ${detail('Last Contact', ep.lastContact || '—')}
      ${detail('Next Follow-up', `<span class="${dateClass(ep.followup)}">${ep.followup || '—'}</span>`)}
    </div>
    ${ep.motivation ? `<div class="card-header" style="margin:0 0 8px"><h3>Motivation / Notes</h3></div><div class="ep-detail-notes">${ep.motivation}</div>` : ''}
    <div style="display:flex; gap:8px; flex-wrap:wrap">
      <button class="btn-primary" onclick="editEP('${ep.id}'); closeModal('ep-modal')">Edit EP</button>
      <button class="btn-secondary" onclick="quickStatusChange('${ep.id}')">Update Status</button>
      ${ep.assignedId ? `<a class="btn-secondary" href="mailto:${ep.email}?subject=Exchange Update - ${ep.name}&body=Hi ${ep.name},%0D%0A%0D%0AWe wanted to follow up on your exchange application.%0D%0A%0D%0ARegards,%0D%0AExchangeFlow Team">Email EP</a>` : ''}
      <button class="btn-icon danger" onclick="confirmDelete('ep','${ep.id}')">Delete</button>
    </div>`;
  document.getElementById('ep-modal').classList.remove('hidden');
}
function detail(label, val) {
  return `<div class="ep-detail-row"><label>${label}</label><span>${val || '—'}</span></div>`;
}
function quickStatusChange(id) {
  const ep = eps.find(e => e.id === id);
  if (!ep) return;
  const next = STATUSES[STATUSES.indexOf(ep.status) + 1];
  if (!next) { showToast('EP is already at final stage.', 'success'); return; }
  ep.status = next;
  save();
  openEPModal(id); // re-render
  showToast(`Status updated to "${next}"`, 'success');
}

// ─── FUNNEL BOARD ─────────────────────────────────────
function renderFunnelBoard() {
  const board = document.getElementById('funnel-board');
  board.innerHTML = '';
  STATUSES.forEach(status => {
    const col = document.createElement('div');
    col.className = 'funnel-col';
    col.dataset.status = status;
    const color = STATUS_COLORS[status];
    const statusEPs = eps.filter(e => e.status === status);
    col.innerHTML = `
      <div class="funnel-col-header" style="border-color:${color}">
        <span class="funnel-col-title" style="color:${color}">${status}</span>
        <span class="funnel-col-count" style="color:${color}">${statusEPs.length}</span>
      </div>
      <div class="funnel-cards funnel-drop-zone" id="drop-${status.replace(/\s/g,'-')}">
        ${statusEPs.map(e => funnelCard(e)).join('')}
      </div>`;
    board.appendChild(col);

    // Drop zone events
    const zone = col.querySelector('.funnel-drop-zone');
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (draggedEPId) {
        const ep = eps.find(x => x.id === draggedEPId);
        if (ep && ep.status !== status) {
          ep.status = status;
          save();
          renderFunnelBoard();
          showToast(`${ep.name} moved to "${status}"`, 'success');
        }
        draggedEPId = null;
      }
    });
  });
}
function funnelCard(ep) {
  return `<div class="funnel-card" draggable="true" data-id="${ep.id}"
    ondragstart="draggedEPId='${ep.id}'; this.classList.add('dragging')"
    ondragend="this.classList.remove('dragging')"
    onclick="openEPModal('${ep.id}')">
    <div class="funnel-card-name">${ep.name}</div>
    <div class="funnel-card-uni">${ep.university || 'No university'}</div>
    ${ep.country ? `<span class="funnel-card-country">🌍 ${ep.country}</span>` : ''}
  </div>`;
}

// ─── PROJECT HUB ──────────────────────────────────────
function renderProjects() {
  const query    = (document.getElementById('project-search')?.value || '').toLowerCase();
  const country  = document.getElementById('project-filter-country')?.value || '';
  const category = document.getElementById('project-filter-category')?.value || '';

  // Update country filter
  const allCountries = [...new Set(projects.map(p => p.country))].sort();
  const cSel = document.getElementById('project-filter-country');
  if (cSel) {
    const cur = cSel.value;
    cSel.innerHTML = '<option value="">All Countries</option>' + allCountries.map(c => `<option${c===cur?' selected':''}>${c}</option>`).join('');
  }

  let filtered = projects.filter(p => {
    if (country  && p.country !== country) return false;
    if (category && p.category !== category) return false;
    if (query && !`${p.name} ${p.country} ${p.description}`.toLowerCase().includes(query)) return false;
    return true;
  });

  const grid = document.getElementById('project-grid');
  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">◎</div><p>No projects found.</p></div>';
    return;
  }
  grid.innerHTML = filtered.map(p => {
    const statusClass = p.status === 'Open' ? 'open' : p.status === 'Closing Soon' ? 'closing' : 'closed';
    const catColor = CATEGORY_COLORS[p.category] || 'var(--accent)';
    return `<div class="project-card" style="--cat-color:${catColor}">
      <div class="project-card-header">
        <div class="project-card-name">${p.name}</div>
        <span class="project-status ${statusClass}">${p.status}</span>
      </div>
      <div class="project-country">🌍 ${p.country}</div>
      <div class="project-desc">${p.description}</div>
      <span class="project-category">${p.category}</span>
      <div class="project-actions">
        <button class="btn-icon" onclick="openProjectModal('${p.id}')">Edit</button>
        <button class="btn-icon danger" onclick="confirmDelete('project','${p.id}')">Delete</button>
      </div>
    </div>`;
  }).join('');
}

function openProjectModal(id) {
  document.getElementById('project-modal-title').textContent = id ? 'Edit Project' : 'Add Project';
  document.getElementById('project-id').value = '';
  document.getElementById('proj-country').value = '';
  document.getElementById('proj-name').value = '';
  document.getElementById('proj-category').value = 'Fingerprint';
  document.getElementById('proj-status').value = 'Open';
  document.getElementById('proj-desc').value = '';

  if (id) {
    const p = projects.find(x => x.id === id);
    if (p) {
      document.getElementById('project-id').value = p.id;
      document.getElementById('proj-country').value = p.country;
      document.getElementById('proj-name').value = p.name;
      document.getElementById('proj-category').value = p.category;
      document.getElementById('proj-status').value = p.status;
      document.getElementById('proj-desc').value = p.description;
    }
  }
  document.getElementById('project-modal').classList.remove('hidden');
}
function saveProject() {
  const country = document.getElementById('proj-country').value.trim();
  const name    = document.getElementById('proj-name').value.trim();
  if (!country || !name) { showToast('Country and Name are required.', 'error'); return; }
  const id = document.getElementById('project-id').value;
  const data = {
    id: id || generateId(),
    country, name,
    category:    document.getElementById('proj-category').value,
    status:      document.getElementById('proj-status').value,
    description: document.getElementById('proj-desc').value.trim(),
  };
  if (id) {
    const idx = projects.findIndex(p => p.id === id);
    if (idx > -1) projects[idx] = data;
  } else {
    projects.push(data);
  }
  save();
  closeModal('project-modal');
  renderProjects();
  showToast('Project saved!', 'success');
}
function deleteProject(id) {
  projects = projects.filter(p => p.id !== id);
  save();
  closeModal('confirm-modal');
  renderProjects();
  showToast('Project deleted.', 'success');
}

// ─── FOLLOW-UP TRACKER ────────────────────────────────
function renderFollowups() {
  const today = new Date(); today.setHours(0,0,0,0);
  const overdue  = eps.filter(e => e.followup && isOverdue(e.followup)).sort((a,b) => a.followup.localeCompare(b.followup));
  const todayEPs = eps.filter(e => e.followup && isToday(e.followup));
  const upcoming = eps.filter(e => {
    if (!e.followup) return false;
    const d = new Date(e.followup);
    return d > today && !isToday(e.followup);
  }).sort((a,b) => a.followup.localeCompare(b.followup)).slice(0, 10);

  const el = document.getElementById('followup-sections');
  el.innerHTML = `
    ${followupSection('overdue', '⚠ Overdue', overdue)}
    ${followupSection('today', '📅 Due Today', todayEPs)}
    ${followupSection('upcoming', '📋 Upcoming', upcoming)}
  `;
}
function followupSection(type, title, list) {
  if (!list.length && type !== 'upcoming') return `
    <div>
      <div class="followup-section-title ${type}">${title}</div>
      <p style="color:var(--text-muted);font-size:13px;padding-left:4px">None — you're all caught up!</p>
    </div>`;
  if (!list.length) return '';
  return `<div>
    <div class="followup-section-title ${type}">${title} <span style="font-size:12px;opacity:0.7">(${list.length})</span></div>
    ${list.map(e => {
      const m = members.find(x => x.id === e.assignedId);
      return `<div class="followup-card ${type}" onclick="openEPModal('${e.id}')">
        <div class="followup-info">
          <div class="followup-name">${e.name}</div>
          <div class="followup-meta">${e.university || 'No university'} · ${m ? m.name : 'Unassigned'} · <span class="status-badge ${STATUS_CSS_CLASS[e.status]}" style="font-size:10px">${e.status}</span></div>
        </div>
        <div class="followup-date ${type}">${e.followup}</div>
        <button class="btn-icon" onclick="event.stopPropagation(); editEP('${e.id}')">Update</button>
      </div>`;
    }).join('')}
  </div>`;
}

// ─── MEMBERS MANAGER ──────────────────────────────────
function openMembersModal() {
  renderMembersList();
  document.getElementById('members-modal').classList.remove('hidden');
}
function renderMembersList() {
  const el = document.getElementById('members-list');
  el.innerHTML = members.map(m => `
    <div class="member-row">
      <div class="user-avatar" style="width:28px;height:28px;font-size:10px">${m.name.split(' ').map(w=>w[0]).join('').substr(0,2).toUpperCase()}</div>
      <div class="m-name">${m.name}</div>
      <div class="m-email">${m.email}</div>
      <button class="btn-icon danger" onclick="deleteMember('${m.id}')">✕</button>
    </div>`).join('');
}
function addMember() {
  const name  = document.getElementById('new-member-name').value.trim();
  const email = document.getElementById('new-member-email').value.trim();
  if (!name) { showToast('Name is required.', 'error'); return; }
  members.push({ id: generateId(), name, email });
  save();
  document.getElementById('new-member-name').value = '';
  document.getElementById('new-member-email').value = '';
  renderMembersList();
  populateMemberDropdowns();
  showToast('Member added!', 'success');
}
function deleteMember(id) {
  members = members.filter(m => m.id !== id);
  eps.forEach(e => { if (e.assignedId === id) e.assignedId = ''; });
  save();
  renderMembersList();
  populateMemberDropdowns();
  showToast('Member removed.', 'success');
}

// ─── NOTIFICATIONS ────────────────────────────────────
function triggerAssignNotification(member, ep) {
  const msg = `You have been assigned a new EP: ${ep.name}.\nPlease contact them within 24 hours.\nEmail: ${ep.email}`;
  const subject = encodeURIComponent(`New EP Assignment: ${ep.name}`);
  const body = encodeURIComponent(`Hi ${member.name},\n\nYou have been assigned a new Exchange Participant:\n\nName: ${ep.name}\nEmail: ${ep.email}\nCountry: ${ep.country}\nStatus: ${ep.status}\n\nPlease contact them within 24 hours.\n\nExchangeFlow CRM`);
  if (member.email) {
    const a = document.createElement('a');
    a.href = `mailto:${member.email}?subject=${subject}&body=${body}`;
    a.click();
  }
  showToast(`📧 ${member.name} assigned to ${ep.name}`, 'success');
}

// ─── SIGNUP (PUBLIC EP FORM) ──────────────────────────
function handleSignup() {
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const motivation = document.getElementById('signup-motivation').value.trim();
  if (!name || !email || !motivation) { showToast('Please fill in required fields.', 'error'); return; }

  const ep = {
    id:          generateId(),
    name,
    email,
    phone:       document.getElementById('signup-phone').value.trim(),
    university:  document.getElementById('signup-university').value.trim(),
    degree:      document.getElementById('signup-degree').value.trim(),
    country:     document.getElementById('signup-country').value,
    projectType: document.getElementById('signup-project-type').value,
    motivation,
    status:      'New Lead',
    assignedId:  '',
    lastContact: '',
    followup:    '',
    createdAt:   new Date().toISOString().split('T')[0],
  };
  load(); eps.push(ep); save();
  document.getElementById('signup-success').classList.remove('hidden');
  ['signup-name','signup-email','signup-phone','signup-university','signup-degree','signup-motivation'].forEach(id => document.getElementById(id).value = '');
}

// ─── DATA EXPORT / IMPORT ────────────────────────────
function exportData() {
  const data = { eps, projects, members, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `exchangeflow-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!', 'success');
}
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.eps) eps = data.eps;
      if (data.projects) projects = data.projects;
      if (data.members) members = data.members;
      save();
      populateMemberDropdowns();
      populateCountryFilters();
      renderDashboard();
      showToast('Data imported successfully!', 'success');
    } catch {
      showToast('Invalid JSON file.', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ─── CONFIRM DELETE ───────────────────────────────────
function confirmDelete(type, id) {
  const item = type === 'ep' ? eps.find(e => e.id === id) : projects.find(p => p.id === id);
  if (!item) return;
  document.getElementById('confirm-text').textContent = `Are you sure you want to delete "${item.name}"? This cannot be undone.`;
  const btn = document.getElementById('confirm-action-btn');
  btn.onclick = () => { type === 'ep' ? deleteEP(id) : deleteProject(id); };
  document.getElementById('confirm-modal').classList.remove('hidden');
}

// ─── MODAL HELPERS ────────────────────────────────────
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ─── TOAST ────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = (type === 'success' ? '✓ ' : '✕ ') + msg;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

// ─── FOLLOW-UP AUTO CHECK ─────────────────────────────
function checkFollowupReminders() {
  const todayEPs = eps.filter(e => e.followup && isToday(e.followup));
  if (todayEPs.length) {
    showToast(`📅 ${todayEPs.length} follow-up(s) due today!`, 'success');
  }
}

// ─── INIT ─────────────────────────────────────────────
(function init() {
  // Check if already logged in
  if (sessionStorage.getItem('ef_auth')) {
    showApp();
  } else {
    // Default: show login
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('signup-screen').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
  }
  // Add manage members link to sidebar
  const nav = document.querySelector('.sidebar-nav');
  if (nav) {
    const divider = nav.querySelector('.nav-section-label:last-of-type');
    const link = document.createElement('a');
    link.className = 'nav-item';
    link.innerHTML = '<span class="nav-icon">◈</span> Manage Members';
    link.onclick = openMembersModal;
    nav.insertBefore(link, divider);
  }
})();

// Follow-up reminder on load
window.addEventListener('load', () => {
  if (sessionStorage.getItem('ef_auth')) {
    load();
    setTimeout(checkFollowupReminders, 1500);
  }
});
