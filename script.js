'use strict';
/* ══════════════════════════════════════════════════
   EXCHANGEFLOW CRM — script.js v3.0
   Fixes: edit form preload, cancel, RBAC isolation,
   CSV dept field, email template, member analytics,
   bidirectional status, theme persistence
══════════════════════════════════════════════════ */

// ─── CONSTANTS ────────────────────────────────────
const ADMIN_CREDS = { username:'Firoz', password:'Firoz123', role:'admin', name:'Firoz' };

const STATUSES = [
  'New Lead','Contacted','Interested','Session Booked',
  'Applicant','Applied','Matched','Approved','Realized'
];
const STATUS_COLORS = {
  'New Lead':'#6b7cff','Contacted':'#a78bfa','Interested':'#f472b6',
  'Session Booked':'#fb923c','Applicant':'#fbbf24','Applied':'#34d399',
  'Matched':'#22d3ee','Approved':'#4f7cff','Realized':'#22d3a0'
};
const STATUS_CSS = {
  'New Lead':'status-new-lead','Contacted':'status-contacted','Interested':'status-interested',
  'Session Booked':'status-session-booked','Applicant':'status-applicant','Applied':'status-applied',
  'Matched':'status-matched','Approved':'status-approved','Realized':'status-realized'
};
const PRODUCT_CSS = { oGV:'product-ogv', oGTa:'product-ogta', oGTe:'product-ogte' };
const CATEGORY_COLORS = {
  Fingerprint:'#4f7cff', Heartbeat:'#f472b6', Teach:'#22d3ee',
  Raise:'#fbbf24', Impact:'#34d399', Sustain:'#22d3a0'
};
const COUNTRIES = [
  'Germany','Poland','Turkey','India','Malaysia','Colombia',
  'Brazil','Mexico','Egypt','Morocco','Indonesia','Philippines','Other'
];

// ─── STATE ────────────────────────────────────────
let eps      = [];
let projects = [];
let members  = [];
let currentUser  = null;
let draggedEPId  = null;
let currentPage  = 'dashboard';
let prevPage     = 'dashboard';
let loginRole    = 'admin';

// ─── STORAGE ──────────────────────────────────────
function save() {
  localStorage.setItem('ef_eps',      JSON.stringify(eps));
  localStorage.setItem('ef_projects', JSON.stringify(projects));
  localStorage.setItem('ef_members',  JSON.stringify(members));
}
function load() {
  eps      = JSON.parse(localStorage.getItem('ef_eps')      || '[]');
  projects = JSON.parse(localStorage.getItem('ef_projects') || '[]');
  members  = JSON.parse(localStorage.getItem('ef_members')  || '[]');
  if (!projects.length) seedProjects();
  if (!members.length)  seedMembers();
  if (!eps.length)      seedEPs();
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2,6);
}

// ─── SEED DATA ────────────────────────────────────
function seedMembers() {
  members = [
    { id:genId(), name:'Rafi Islam',    email:'rafi@ef.org',    username:'rafi',    password:'rafi123',    role:'user' },
    { id:genId(), name:'Nadia Hossain', email:'nadia@ef.org',   username:'nadia',   password:'nadia123',   role:'user' },
    { id:genId(), name:'Tanvir Ahmed',  email:'tanvir@ef.org',  username:'tanvir',  password:'tanvir123',  role:'user' },
    { id:genId(), name:'Sadia Jahan',   email:'sadia@ef.org',   username:'sadia',   password:'sadia123',   role:'user' },
  ];
  save();
}
function seedProjects() {
  projects = [
    { id:genId(), country:'Germany',   name:'Smart Cities Engineering',       category:'Fingerprint', description:'Work with Berlin tech firms on urban data infrastructure.',  status:'Open' },
    { id:genId(), country:'Turkey',    name:'Public Health Research',          category:'Heartbeat',   description:'Assist in Istanbul clinics on preventive health outreach.', status:'Open' },
    { id:genId(), country:'India',     name:'Rural Education Initiative',      category:'Teach',       description:'Teach STEM subjects in underserved communities in Pune.',    status:'Closing Soon' },
    { id:genId(), country:'Colombia',  name:'Social Innovation Lab',           category:'Impact',      description:'Co-create solutions for urban displacement in Medellín.',    status:'Open' },
    { id:genId(), country:'Malaysia',  name:'Sustainable Agriculture',         category:'Sustain',     description:'Implement eco-farming practices in Selangor rural zones.',   status:'Open' },
    { id:genId(), country:'Brazil',    name:'Business Development Accelerator',category:'Raise',       description:'Support São Paulo startups in scaling impact operations.',   status:'Closing Soon' },
    { id:genId(), country:'Egypt',     name:'Renewable Energy Engineering',    category:'Fingerprint', description:'Work on solar panel projects across Luxor.',                 status:'Open' },
    { id:genId(), country:'Indonesia', name:'Marine Conservation Program',     category:'Sustain',     description:'Protect coral reef ecosystems in the Lombok archipelago.',  status:'Open' },
  ];
  save();
}
function seedEPs() {
  const today = new Date();
  const fmt   = d => d.toISOString().split('T')[0];
  const past  = n => { const d=new Date(today); d.setDate(d.getDate()-n); return fmt(d); };
  const future= n => { const d=new Date(today); d.setDate(d.getDate()+n); return fmt(d); };
  const m = members;
  eps = [
    { id:genId(), name:'Ayesha Rahman',  email:'ayesha@du.edu.bd',   phone:'+880 171 234 5678', university:'Dhaka University', department:'Computer Science', degree:'BSc CS',  country:'Germany',   focusProduct:'oGTe', projectType:'Fingerprint', motivation:'Eager to gain international tech experience.',  status:'Applied',        assignedId:m[0]?.id||'', lastContact:past(3),  followup:future(2),  createdAt:past(10) },
    { id:genId(), name:'Sakib Al Hasan', email:'sakib@buet.ac.bd',   phone:'+880 182 345 6789', university:'BUET',             department:'EEE',              degree:'BSc EEE', country:'Turkey',    focusProduct:'oGV',  projectType:'Heartbeat',   motivation:'Passionate about global health challenges.',   status:'Session Booked', assignedId:m[1]?.id||'', lastContact:past(1),  followup:fmt(today), createdAt:past(7) },
    { id:genId(), name:'Fatima Noor',    email:'fatima@nsu.edu',     phone:'+880 193 456 7890', university:'NSU',              department:'Business',         degree:'BBA',     country:'Colombia',  focusProduct:'oGTa', projectType:'Raise',       motivation:'Want to understand social enterprise models.',  status:'Matched',        assignedId:m[2]?.id||'', lastContact:past(5),  followup:future(5),  createdAt:past(15) },
    { id:genId(), name:'Mehedi Hasan',   email:'mehedi@iu.ac.bd',    phone:'+880 154 567 8901', university:'IU',               department:'Education',        degree:'BSc CE',  country:'India',     focusProduct:'oGTa', projectType:'Teach',       motivation:'Teaching abroad is my dream.',                  status:'Interested',     assignedId:m[0]?.id||'', lastContact:past(8),  followup:past(2),    createdAt:past(20) },
    { id:genId(), name:'Nishat Tasnim',  email:'nishat@sust.edu',    phone:'+880 165 678 9012', university:'SUST',             department:'Environment',      degree:'MSc Env', country:'Malaysia',  focusProduct:'oGV',  projectType:'Sustain',     motivation:'Committed to environmental sustainability.',   status:'Approved',       assignedId:m[3]?.id||'', lastContact:past(2),  followup:future(10), createdAt:past(5) },
    { id:genId(), name:'Rakibul Islam',  email:'rakib@ruet.ac.bd',   phone:'+880 176 789 0123', university:'RUET',             department:'Mechanical Eng',   degree:'BSc ME',  country:'Brazil',    focusProduct:'oGTe', projectType:'Raise',       motivation:'Business + engineering crossover interests.',   status:'New Lead',       assignedId:'',           lastContact:'',       followup:future(1),  createdAt:past(1) },
    { id:genId(), name:'Tamanna Akter',  email:'tamanna@diu.edu.bd', phone:'+880 187 890 1234', university:'DIU',              department:'Medicine',         degree:'MBBS',    country:'Egypt',     focusProduct:'oGV',  projectType:'Heartbeat',   motivation:'Healthcare system comparison research.',        status:'Contacted',      assignedId:m[1]?.id||'', lastContact:past(3),  followup:past(1),    createdAt:past(8) },
    { id:genId(), name:'Arif Hossain',   email:'arif@bracu.ac.bd',   phone:'+880 198 901 2345', university:'BRAC University',  department:'Computer Science', degree:'BSc CS',  country:'Germany',   focusProduct:'oGTe', projectType:'Fingerprint', motivation:'Wants to work at European tech startups.',     status:'Realized',       assignedId:m[2]?.id||'', lastContact:past(30), followup:'',          createdAt:past(45) },
  ];
  save();
}

// ─── THEME ────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('ef_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeUI(saved);
}
function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ef_theme', next);
  updateThemeUI(next);
}
function updateThemeUI(theme) {
  const icon  = theme === 'dark' ? '☾' : '☀';
  const label = theme === 'dark' ? 'Dark' : 'Light';
  ['theme-icon','theme-icon-mobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = icon;
  });
  const lbl = document.getElementById('theme-label');
  if (lbl) lbl.textContent = label;
}

// ─── AUTH ─────────────────────────────────────────
function switchLoginRole(role) {
  loginRole = role;
  document.getElementById('tab-admin').classList.toggle('active', role === 'admin');
  document.getElementById('tab-user').classList.toggle('active',  role === 'user');
  document.getElementById('login-hint').innerHTML = role === 'admin'
    ? 'Admin: <strong>admin</strong> / <strong>admin123</strong>'
    : 'e.g. <strong>rafi</strong> / <strong>rafi123</strong>';
}

function handleLogin() {
  const u   = document.getElementById('login-user').value.trim();
  const p   = document.getElementById('login-pass').value.trim();
  const err = document.getElementById('login-error');

  if (loginRole === 'admin') {
    if (u === ADMIN_CREDS.username && p === ADMIN_CREDS.password) {
      currentUser = { id:'admin', name:'Admin', role:'admin', username:'admin' };
      sessionStorage.setItem('ef_user', JSON.stringify(currentUser));
      err.classList.add('hidden');
      showApp();
      return;
    }
  } else {
    // Load first to have members available
    load();
    const m = members.find(x => x.username === u && x.password === p);
    if (m) {
      currentUser = { id:m.id, name:m.name, role:'user', username:m.username };
      sessionStorage.setItem('ef_user', JSON.stringify(currentUser));
      err.classList.add('hidden');
      showApp();
      return;
    }
  }
  err.classList.remove('hidden');
}

function handleLogout() {
  sessionStorage.removeItem('ef_user');
  currentUser = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !document.getElementById('login-screen').classList.contains('hidden')) {
    handleLogin();
  }
});

// ─── SCREEN SHOW / HIDE ───────────────────────────
function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('signup-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  load();
  buildSidebar();
  updateSidebarUser();
  populateMemberDropdowns();
  populateCountryFilters();
  applyRoleVisibility();
  navigate(isAdmin() ? 'dashboard' : 'user-dashboard');
  setTimeout(checkFollowupReminders, 1400);
}
function showLogin() {
  document.getElementById('signup-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}
function showSignup() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('signup-screen').classList.remove('hidden');
}

// ─── ROLE HELPERS ─────────────────────────────────
function isAdmin() { return currentUser?.role === 'admin'; }

function applyRoleVisibility() {
  // EP list header actions
  const actEl = document.getElementById('ep-list-actions');
  if (actEl) {
    if (isAdmin()) {
      actEl.innerHTML = `
        <button class="btn-secondary" onclick="navigate('add-ep')">+ Add EP</button>
        <button class="btn-secondary" onclick="exportCSV()">↑ CSV</button>
        <button class="btn-secondary" onclick="document.getElementById('import-csv-file').click()">↓ Import CSV</button>
        <input type="file" id="import-csv-file" accept=".csv" class="hidden" onchange="importCSV(event)" />`;
        // <button class="btn-secondary" style="color:var(--red);border-color:rgba(255,90,90,0.3)" onclick="deleteAllEPs()">✕ Delete All EPs</button>
    } else {
      actEl.innerHTML = '';
    }
  }
  // Project hub add button
  const addPBtn = document.getElementById('add-project-btn');
  if (addPBtn) addPBtn.style.display = isAdmin() ? '' : 'none';
  // Assigned column
  document.querySelectorAll('.col-assigned').forEach(c => {
    c.style.display = isAdmin() ? '' : 'none';
  });
}

// ─── SIDEBAR ──────────────────────────────────────
function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  const adminGroups = [
    { label:'Main', items:[
      { icon:'◈', text:'Dashboard',        page:'dashboard' },
      { icon:'◉', text:'EP List',          page:'ep-list' },
      { icon:'◧', text:'Funnel Board',     page:'funnel' },
      { icon:'⊕', text:'Add EP',           page:'add-ep' },
    ]},
    { label:'Explore', items:[
      { icon:'◎', text:'Project Hub',      page:'projects' },
      { icon:'◷', text:'Follow-ups',       page:'followups' },
    ]},
    { label:'Admin', items:[
      { icon:'◈', text:'Member Analytics', page:'members' },
      { icon:'↑', text:'Export JSON',      action:'exportData' },
      { icon:'↓', text:'Import JSON',      action:'importDataClick' },
    ]},
  ];
  const userGroups = [
    { label:'Main', items:[
      { icon:'◈', text:'My Dashboard',  page:'user-dashboard' },
      { icon:'◉', text:'My EPs',        page:'ep-list' },
      { icon:'◎', text:'Project Hub',   page:'projects' },
      { icon:'◷', text:'Follow-ups',    page:'followups' },
    ]},
  ];

  const groups = isAdmin() ? adminGroups : userGroups;
  let html = '';
  let delay = 0;
  groups.forEach(g => {
    html += `<div class="nav-section-label">${g.label}</div>`;
    g.items.forEach(item => {
      delay += 50;
      if (item.page) {
        html += `<a class="nav-item" data-page="${item.page}" onclick="navigate('${item.page}')" style="animation-delay:${delay}ms">
          <span class="nav-icon">${item.icon}</span>${item.text}</a>`;
      } else {
        html += `<a class="nav-item" onclick="${item.action}()" style="animation-delay:${delay}ms">
          <span class="nav-icon">${item.icon}</span>${item.text}</a>`;
      }
    });
  });
  if (isAdmin()) {
    html += `<input type="file" id="import-json-file" accept=".json" class="hidden" onchange="importData(event)" />`;
  }
  nav.innerHTML = html;
}

function updateSidebarUser() {
  const name = currentUser?.name || 'User';
  const initials = name.split(' ').map(w=>w[0]).join('').substr(0,2).toUpperCase();
  const av = document.getElementById('sidebar-avatar');
  const un = document.getElementById('sidebar-username');
  const rl = document.getElementById('sidebar-role-label');
  if (av) av.textContent = initials;
  if (un) un.textContent = name;
  if (rl) rl.textContent = isAdmin() ? 'Administrator' : 'oGX Member';
}

// ─── NAVIGATION ───────────────────────────────────
const PAGE_CRUMBS = {
  'dashboard':'Dashboard', 'user-dashboard':'My Dashboard',
  'ep-list':'EP List', 'funnel':'Funnel Board', 'add-ep':'Add / Edit EP',
  'projects':'Project Hub', 'followups':'Follow-up Tracker', 'members':'Member Analytics'
};

function navigate(page) {
  prevPage = currentPage;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
  const el  = document.getElementById('page-' + page);
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (el)  el.classList.add('active');
  if (nav) nav.classList.add('active');
  currentPage = page;
  closeSidebar();
  const bc = document.getElementById('topbar-breadcrumb');
  if (bc) bc.textContent = PAGE_CRUMBS[page] || page;

  if      (page === 'dashboard')      renderDashboard();
  else if (page === 'user-dashboard') renderUserDashboard();
  else if (page === 'ep-list')        { renderEPList(); applyRoleVisibility(); }
  else if (page === 'funnel')         renderFunnelBoard();
  else if (page === 'add-ep')         buildEPForm(null);  // fresh form; edit uses editEP()
  else if (page === 'projects')       renderProjects();
  else if (page === 'followups')      renderFollowups();
  else if (page === 'members')        renderMemberAnalytics();
}

// ─── MOBILE SIDEBAR ───────────────────────────────
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebar-overlay');
  const h = document.getElementById('hamburger');
  const open = s.classList.toggle('open');
  o.classList.toggle('open', open);
  h.classList.toggle('open', open);
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
  document.getElementById('hamburger')?.classList.remove('open');
}

// ─── DROPDOWNS ────────────────────────────────────
function populateMemberDropdowns() {
  ['ep-assigned','filter-member'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const val = sel.value;
    sel.innerHTML = id === 'ep-assigned'
      ? '<option value="">Unassigned</option>'
      : '<option value="">All Members</option>';
    members.forEach(m => {
      const o = document.createElement('option');
      o.value = m.id; o.textContent = m.name;
      sel.appendChild(o);
    });
    if (val) sel.value = val;
  });
  const mf = document.getElementById('filter-member');
  if (mf) mf.style.display = isAdmin() ? '' : 'none';
}
function populateCountryFilters() {
  const countries = [...new Set(eps.map(e => e.country).filter(Boolean))].sort();
  ['filter-country','project-filter-country'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const val = sel.value;
    sel.innerHTML = '<option value="">All Countries</option>';
    countries.forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      sel.appendChild(o);
    });
    if (val) sel.value = val;
  });
}

// ─── VISIBLE EPS FOR CURRENT USER ─────────────────
function visibleEPs() {
  if (isAdmin()) return eps;
  return eps.filter(e => e.assignedId === currentUser.id);
}

// ─── DASHBOARDS ───────────────────────────────────
function renderDashboard() {
  const all = visibleEPs();
  const realized   = all.filter(e => e.status === 'Realized').length;
  const active     = all.filter(e => !['Realized','New Lead'].includes(e.status)).length;
  const unassigned = eps.filter(e => !e.assignedId).length;
  const overdue    = all.filter(e => e.followup && isOverdue(e.followup)).length;
  const conv       = all.length ? Math.round((realized/all.length)*100) : 0;
  renderStatsGrid('stats-grid', [
    { label:'Total EPs',    value:all.length,       sub:'in pipeline',       color:'var(--accent)' },
    { label:'Active',       value:active,           sub:'in progress',       color:'var(--yellow)' },
    { label:'Realized',     value:realized,         sub:`${conv}% conv.`,    color:'var(--green)'  },
    { label:'Overdue',      value:overdue,          sub:'need follow-up',    color:'var(--red)'    },
    { label:'Unassigned',   value:unassigned,       sub:'need a member',     color:'var(--orange)' },
    { label:'Members',      value:members.length,   sub:'oGX team',          color:'var(--s2)'     },
  ]);
  renderFunnelBars('funnel-bars', all);
  renderRecentActivity('recent-activity', all);
  renderOverdueList('overdue-list', all);
}
function renderUserDashboard() {
  const my = visibleEPs();
  const realized = my.filter(e => e.status === 'Realized').length;
  const active   = my.filter(e => !['Realized','New Lead'].includes(e.status)).length;
  const overdue  = my.filter(e => e.followup && isOverdue(e.followup)).length;
  const conv     = my.length ? Math.round((realized/my.length)*100) : 0;
  const sub = document.getElementById('user-dash-sub');
  if (sub) sub.textContent = `${my.length} EP${my.length!==1?'s':''} assigned to you`;
  renderStatsGrid('user-stats-grid', [
    { label:'Assigned EPs', value:my.length, sub:'your portfolio',  color:'var(--accent)' },
    { label:'Active',       value:active,    sub:'in progress',     color:'var(--yellow)' },
    { label:'Realized',     value:realized,  sub:`${conv}% conv.`,  color:'var(--green)'  },
    { label:'Overdue',      value:overdue,   sub:'need follow-up',  color:'var(--red)'    },
  ]);
  renderOverdueList('user-overdue-list', my);
  renderFunnelBars('user-funnel-bars', my);
}
function renderStatsGrid(id, stats) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = stats.map(s => `
    <div class="stat-card" style="--accent-color:${s.color}">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>`).join('');
}
function renderFunnelBars(id, arr) {
  const el = document.getElementById(id);
  if (!el) return;
  const counts = {}; STATUSES.forEach(s => counts[s] = 0);
  arr.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });
  const max = Math.max(...Object.values(counts), 1);
  el.innerHTML = STATUSES.map(s => `
    <div class="funnel-bar-row">
      <div class="funnel-bar-label">${s}</div>
      <div class="funnel-bar-track">
        <div class="funnel-bar-fill" style="width:${(counts[s]/max)*100}%;background:${STATUS_COLORS[s]}"></div>
      </div>
      <div class="funnel-bar-count">${counts[s]}</div>
    </div>`).join('');
}
function renderRecentActivity(id, arr) {
  const el = document.getElementById(id);
  if (!el) return;
  const recent = [...arr].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,5);
  if (!recent.length) { el.innerHTML='<div class="empty-state" style="padding:20px"><p>No EPs yet.</p></div>'; return; }
  el.innerHTML = recent.map(e => `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div>
        <div class="activity-text"><strong>${e.name}</strong> — ${e.status}</div>
        <div class="activity-time">${e.country||'—'} · ${e.focusProduct||''} · ${e.university||''}</div>
      </div>
    </div>`).join('');
}
function renderOverdueList(id, arr) {
  const el = document.getElementById(id);
  if (!el) return;
  const ov = arr.filter(e => e.followup && isOverdue(e.followup));
  if (!ov.length) { el.innerHTML='<p style="color:var(--text-muted);padding:8px 0;font-size:13px">✓ No overdue follow-ups. Great work!</p>'; return; }
  el.innerHTML = ov.map(e => {
    const m = members.find(x => x.id === e.assignedId);
    return `<div class="overdue-row">
      <div class="name">${e.name}</div>
      <div class="member">${m?m.name:'Unassigned'}</div>
      <div><span class="status-badge ${STATUS_CSS[e.status]}">${e.status}</span></div>
      <div class="date">⚠ ${e.followup}</div>
      <button class="btn-icon" onclick="openEPModal('${e.id}')">View</button>
    </div>`;
  }).join('');
}

// ─── MEMBER ANALYTICS ─────────────────────────────
function renderMemberAnalytics() {
  const el = document.getElementById('member-analytics-grid');
  if (!el) return;
  if (!members.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">◈</div><p>No members yet. Click "Manage Members" to add.</p></div>';
    return;
  }
  el.innerHTML = members.map((m, i) => {
    const myEPs      = eps.filter(e => e.assignedId === m.id);
    const contacted  = myEPs.filter(e => STATUSES.indexOf(e.status) >= 1).length;
    const followedUp = myEPs.filter(e => !!e.lastContact).length;
    const converted  = myEPs.filter(e => e.status === 'Realized').length;
    const remaining  = myEPs.filter(e => e.status !== 'Realized').length;
    const conv       = myEPs.length ? Math.round((converted/myEPs.length)*100) : 0;
    const initials   = m.name.split(' ').map(w=>w[0]).join('').substr(0,2).toUpperCase();
    return `<div class="member-card" style="animation-delay:${i*0.07}s">
      <div class="member-card-header">
        <div class="member-card-avatar">${initials}</div>
        <div>
          <div class="member-card-name">${m.name}</div>
          <div class="member-card-email">${m.email}</div>
        </div>
      </div>
      <div class="member-stat-row">
        <span class="member-stat-label">Total Assigned</span>
        <span class="member-stat-value highlight">${myEPs.length}</span>
      </div>
      <div class="member-stat-row">
        <span class="member-stat-label">Contacted</span>
        <span class="member-stat-value">${contacted}</span>
      </div>
      <div class="member-stat-row">
        <span class="member-stat-label">Followed-up</span>
        <span class="member-stat-value">${followedUp}</span>
      </div>
      <div class="member-stat-row">
        <span class="member-stat-label">Realized</span>
        <span class="member-stat-value" style="color:var(--green)">${converted}</span>
      </div>
      <div class="member-stat-row">
        <span class="member-stat-label">Remaining</span>
        <span class="member-stat-value">${remaining}</span>
      </div>
      <div class="member-conversion-bar">
        <div class="member-conversion-label">Conversion Rate — ${conv}%</div>
        <div class="member-conversion-track">
          <div class="member-conversion-fill" style="width:${conv}%"></div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
        <a class="btn-secondary" style="font-size:12px;padding:6px 12px;text-decoration:none" href="${buildMemberEmail(m)}">✉ Email Member</a>
      </div>
    </div>`;
  }).join('');
}
function buildMemberEmail(member) {
  const myEPs = eps.filter(e => e.assignedId === member.id);
  const list  = myEPs.slice(0,5).map(e => `- ${e.name} | ${e.focusProduct||'—'} | ${e.status}`).join('\n');
  const subject = encodeURIComponent(`oGX Pipeline Update — ${member.name}`);
  const body = encodeURIComponent(
    `Hi ${member.name},\n\nHere is your current EP pipeline summary:\n\n${list}\n\nTotal assigned: ${myEPs.length}\n\nPlease follow up with overdue EPs.\n\nExchangeFlow CRM`
  );
  return `mailto:${member.email}?subject=${subject}&body=${body}`;
}

// ─── EP LIST ──────────────────────────────────────
function renderEPList() {
  const query    = (document.getElementById('search-input')?.value||'').toLowerCase();
  const status   = document.getElementById('filter-status')?.value||'';
  const memberId = isAdmin() ? (document.getElementById('filter-member')?.value||'') : '';
  const product  = document.getElementById('filter-product')?.value||'';
  const country  = document.getElementById('filter-country')?.value||'';

  let pool = visibleEPs();
  let filtered = pool.filter(e => {
    if (status   && e.status !== status) return false;
    if (memberId && e.assignedId !== memberId) return false;
    if (product  && e.focusProduct !== product) return false;
    if (country  && e.country !== country) return false;
    if (query && !`${e.name} ${e.email} ${e.university} ${e.country} ${e.focusProduct} ${e.department}`.toLowerCase().includes(query)) return false;
    return true;
  });

  const countEl = document.getElementById('ep-count-label');
  if (countEl) countEl.textContent = `${filtered.length} participant${filtered.length!==1?'s':''}`;

  const tbody = document.getElementById('ep-table-body');
  const empty = document.getElementById('ep-empty');
  if (!filtered.length) {
    if (tbody) tbody.innerHTML='';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  tbody.innerHTML = filtered.map(e => {
    const m = members.find(x => x.id === e.assignedId);
    const fClass = dateClass(e.followup);
    const pc = PRODUCT_CSS[e.focusProduct]||'';
    return `<tr>
      <td><div class="ep-name-cell">${esc(e.name)}</div><div class="ep-email-cell">${esc(e.email)}</div></td>
      <td>${esc(e.university)||'—'}</td>
      <td>${e.focusProduct?`<span class="product-badge ${pc}">${e.focusProduct}</span>`:'—'}</td>
      <td>${esc(e.country)||'—'}</td>
      <td class="col-assigned">${m?`<span class="member-chip">${esc(m.name)}</span>`:'<span class="member-chip unassigned">Unassigned</span>'}</td>
      <td><span class="status-badge ${STATUS_CSS[e.status]}">${e.status}</span></td>
      <td><span class="${fClass}">${e.followup||'—'}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" onclick="openEPModal('${e.id}')" title="View">👁</button>
          <button class="btn-icon" onclick="editEP('${e.id}')" title="Edit">✏</button>
          ${isAdmin()?`<button class="btn-icon danger" onclick="confirmDelete('ep','${e.id}')" title="Delete">✕</button>`:''}
        </div>
      </td>
    </tr>`;
  }).join('');
  // Re-apply column visibility
  document.querySelectorAll('.col-assigned').forEach(c => c.style.display = isAdmin() ? '' : 'none');
}

// ─── EP FORM ──────────────────────────────────────
// FIX: buildEPForm is the single source of truth.
// editEP() calls navigate('add-ep') which triggers buildEPForm(null),
// then we call buildEPForm(ep) to overwrite with real data.
// But the cleaner way is: editEP sets a flag then navigate calls buildEPForm(pendingEP).

let _pendingEditEP = null; // Set before navigating to add-ep for editing

function buildEPForm(ep) {
  // If navigate called us but we have a pending edit, use that
  if (!ep && _pendingEditEP) {
    ep = _pendingEditEP;
    _pendingEditEP = null;
  }

  const isEdit = !!ep;
  document.getElementById('ep-form-title').textContent = isEdit ? 'Edit EP' : 'Add New EP';
  document.getElementById('ep-form-sub').textContent   = isEdit ? `Editing: ${ep.name}` : 'Fill in participant details';
  document.getElementById('ep-id').value = ep?.id || '';

  // Role badge
  const badge = document.getElementById('ep-form-role-badge');
  if (badge) {
    badge.className = `role-badge ${isAdmin() ? 'admin' : 'user'}`;
    badge.textContent = isAdmin() ? '⊕ Admin View — Full Access' : '⊙ Member View — Limited Fields';
    badge.classList.remove('hidden');
  }

  const adminSection = document.getElementById('ep-form-admin');
  const userSection  = document.getElementById('ep-form-user');

  if (isAdmin()) {
    adminSection.classList.remove('hidden');
    userSection.classList.add('hidden');
    // Rebuild member dropdown fresh (in case members changed)
    const asel = document.getElementById('ep-assigned');
    if (asel) {
      asel.innerHTML = '<option value="">Unassigned</option>';
      members.forEach(m => {
        const o = document.createElement('option');
        o.value = m.id; o.textContent = m.name;
        asel.appendChild(o);
      });
    }
    // Pre-fill all admin fields
    setVal('ep-name',          ep?.name || '');
    setVal('ep-email',         ep?.email || '');
    setVal('ep-phone',         ep?.phone || '');
    setVal('ep-university',    ep?.university || '');
    setVal('ep-department',    ep?.department || '');
    setVal('ep-degree',        ep?.degree || '');
    setVal('ep-country',       ep?.country || '');
    setVal('ep-focus-product', ep?.focusProduct || '');
    setVal('ep-project-type',  ep?.projectType || '');
    setVal('ep-assigned',      ep?.assignedId || '');
    setVal('ep-status',        ep?.status || 'New Lead');
    setVal('ep-last-contact',  ep?.lastContact || '');
    setVal('ep-followup',      ep?.followup || '');
  } else {
    // User — restricted fields
    adminSection.classList.add('hidden');
    userSection.classList.remove('hidden');
    setVal('ep-name-u',         ep?.name || '');
    setVal('ep-email-u',        ep?.email || '');
    setVal('ep-phone-u',        ep?.phone || '');
    setVal('ep-university-u',   ep?.university || '');
    setVal('ep-country-u',      ep?.country || '');
    setVal('ep-status-u',       ep?.status || 'New Lead');
    setVal('ep-last-contact-u', ep?.lastContact || '');
    setVal('ep-followup-u',     ep?.followup || '');
  }
  // Shared: motivation
  setVal('ep-motivation', ep?.motivation || '');
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val !== null && val !== undefined ? val : '';
}

// FIX: editEP now reliably fills the form
function editEP(id) {
  const ep = eps.find(e => e.id === id);
  if (!ep) return;
  if (!isAdmin() && ep.assignedId !== currentUser.id) {
    showToast('You can only edit your assigned EPs.', 'error'); return;
  }
  closeModal('ep-modal');
  _pendingEditEP = ep;
  // Navigate will call buildEPForm(null) which picks up _pendingEditEP
  prevPage = currentPage;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
  const el  = document.getElementById('page-add-ep');
  const nav = document.querySelector(`.nav-item[data-page="add-ep"]`);
  if (el)  el.classList.add('active');
  if (nav) nav.classList.add('active');
  currentPage = 'add-ep';
  closeSidebar();
  const bc = document.getElementById('topbar-breadcrumb');
  if (bc) bc.textContent = 'Edit EP';
  buildEPForm(null); // picks up _pendingEditEP
}

// FIX: saveEP reads correct field IDs per role
function saveEP() {
  const id = document.getElementById('ep-id')?.value || '';
  const existing = id ? eps.find(e => e.id === id) : null;

  if (isAdmin()) {
    const name  = (document.getElementById('ep-name')?.value || '').trim();
    const email = (document.getElementById('ep-email')?.value || '').trim();
    if (!name || !email) { showToast('Name and Email are required.', 'error'); return; }
    const assignedId   = document.getElementById('ep-assigned')?.value || '';
    const prevAssigned = existing?.assignedId || '';
    const data = {
      id: id || genId(),
      name, email,
      phone:        (document.getElementById('ep-phone')?.value || '').trim(),
      university:   (document.getElementById('ep-university')?.value || '').trim(),
      department:   (document.getElementById('ep-department')?.value || '').trim(),
      degree:       (document.getElementById('ep-degree')?.value || '').trim(),
      country:      document.getElementById('ep-country')?.value || '',
      focusProduct: document.getElementById('ep-focus-product')?.value || '',
      projectType:  document.getElementById('ep-project-type')?.value || '',
      assignedId,
      status:       document.getElementById('ep-status')?.value || 'New Lead',
      lastContact:  document.getElementById('ep-last-contact')?.value || '',
      followup:     document.getElementById('ep-followup')?.value || '',
      motivation:   (document.getElementById('ep-motivation')?.value || '').trim(),
      createdAt:    existing?.createdAt || today(),
    };
    if (id) { const i = eps.findIndex(e => e.id === id); if (i>-1) eps[i]=data; }
    else eps.push(data);
    save();
    if (assignedId && assignedId !== prevAssigned) {
      const m = members.find(x => x.id === assignedId);
      if (m) triggerAssignNotification(m, data);
    }
  } else {
    // User: update only allowed fields
    if (!existing) { showToast('EP not found.', 'error'); return; }
    if (existing.assignedId !== currentUser.id) { showToast('Access denied.', 'error'); return; }
    existing.name        = (document.getElementById('ep-name-u')?.value || '').trim() || existing.name;
    existing.email       = (document.getElementById('ep-email-u')?.value || '').trim() || existing.email;
    existing.phone       = (document.getElementById('ep-phone-u')?.value || '').trim();
    existing.university  = (document.getElementById('ep-university-u')?.value || '').trim();
    existing.country     = document.getElementById('ep-country-u')?.value || existing.country;
    existing.status      = document.getElementById('ep-status-u')?.value || existing.status;
    existing.lastContact = document.getElementById('ep-last-contact-u')?.value || '';
    existing.followup    = document.getElementById('ep-followup-u')?.value || '';
    existing.motivation  = (document.getElementById('ep-motivation')?.value || '').trim();
    save();
  }

  populateCountryFilters();
  populateMemberDropdowns();
  showToast(id ? 'EP updated successfully.' : 'EP added to pipeline!', 'success');
  navigate('ep-list');
}

// FIX: cancelEPForm navigates back correctly
function cancelEPForm() {
  _pendingEditEP = null;
  const back = (prevPage && prevPage !== 'add-ep') ? prevPage : 'ep-list';
  navigate(back);
}

function deleteEP(id) {
  eps = eps.filter(e => e.id !== id);
  save(); populateCountryFilters();
  closeModal('confirm-modal'); closeModal('ep-modal');
  showToast('EP deleted.', 'success');
  navigate(currentPage === 'funnel' ? 'funnel' : 'ep-list');
}

// ─── EP DETAIL MODAL ──────────────────────────────
function openEPModal(id) {
  const ep = eps.find(e => e.id === id);
  if (!ep) return;
  // Access control: users can only view assigned EPs
  if (!isAdmin() && ep.assignedId !== currentUser.id) {
    showToast('Access denied.', 'error'); return;
  }
  const m = members.find(x => x.id === ep.assignedId);
  const pc = PRODUCT_CSS[ep.focusProduct]||'';
  document.getElementById('modal-ep-name').textContent = ep.name;
  document.getElementById('modal-ep-body').innerHTML = `
    <div class="ep-detail-grid">
      ${det('Email', esc(ep.email))}
      ${det('Phone', esc(ep.phone))}
      ${det('University', esc(ep.university))}
      ${det('Department', esc(ep.department))}
      ${det('Degree', esc(ep.degree))}
      ${det('Country', esc(ep.country))}
      ${det('Focus Product', ep.focusProduct ? `<span class="product-badge ${pc}">${ep.focusProduct}</span>` : '—')}
      ${det('Project Type', esc(ep.projectType))}
      ${det('Assigned To', m ? esc(m.name) : 'Unassigned')}
      ${det('Status', `<span class="status-badge ${STATUS_CSS[ep.status]}">${ep.status}</span>`)}
      ${det('Last Contact', ep.lastContact||'—')}
      ${det('Next Follow-up', `<span class="${dateClass(ep.followup)}">${ep.followup||'—'}</span>`)}
    </div>
    ${ep.motivation ? `<div class="ep-detail-notes">${esc(ep.motivation)}</div>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
      <button class="btn-primary" onclick="editEP('${ep.id}')">✏ Edit</button>
      <button class="btn-secondary" onclick="moveStatusForward('${ep.id}')">→ Next Stage</button>
      <button class="btn-secondary" onclick="moveStatusBack('${ep.id}')">← Prev Stage</button>
      ${ep.email ? `<a class="btn-secondary" style="text-decoration:none" href="${buildMailto(ep,m)}">✉ Email EP</a>` : ''}
      ${isAdmin() ? `<button class="btn-icon danger" onclick="confirmDelete('ep','${ep.id}')">Delete</button>` : ''}
    </div>`;
  document.getElementById('ep-modal').classList.remove('hidden');
}
function det(label, val) {
  return `<div class="ep-detail-row"><label>${label}</label><span>${val||'—'}</span></div>`;
}
// FIX: Email template includes all required fields
function buildMailto(ep, member) {
  const subject = encodeURIComponent(`Exchange Update — ${ep.name}`);
  const body = encodeURIComponent([
    `Hi ${member?.name || 'Team'},`,
    '',
    'A new EP has been assigned to you. Here are the details:',
    '',
    `Name:          ${ep.name}`,
    `Email:         ${ep.email}`,
    `Phone:         ${ep.phone || 'N/A'}`,
    `University:    ${ep.university || 'N/A'}`,
    `Department:    ${ep.department || 'N/A'}`,
    `Focus Product: ${ep.focusProduct || 'N/A'}`,
    `Country:       ${ep.country || 'N/A'}`,
    `Status:        ${ep.status}`,
    `Follow-up Due: ${ep.followup || 'N/A'}`,
    '',
    'Please contact them within 24 hours.',
    '',
    'ExchangeFlow CRM'
  ].join('\n'));
  const to = member?.email || ep.email || '';
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

// ─── STATUS FLOW (BIDIRECTIONAL) ──────────────────
function moveStatusForward(id) {
  const ep = eps.find(e => e.id === id);
  if (!ep) return;
  const idx = STATUSES.indexOf(ep.status);
  if (idx < STATUSES.length - 1) {
    ep.status = STATUSES[idx + 1];
    save(); openEPModal(id);
    showToast(`Moved to "${ep.status}"`, 'success');
    if (currentPage === 'ep-list') renderEPList();
    else if (currentPage === 'funnel') renderFunnelBoard();
  } else { showToast('Already at final stage.', 'success'); }
}
function moveStatusBack(id) {
  const ep = eps.find(e => e.id === id);
  if (!ep) return;
  const idx = STATUSES.indexOf(ep.status);
  if (idx > 0) {
    ep.status = STATUSES[idx - 1];
    save(); openEPModal(id);
    showToast(`Moved back to "${ep.status}"`, 'success');
    if (currentPage === 'ep-list') renderEPList();
    else if (currentPage === 'funnel') renderFunnelBoard();
  } else { showToast('Already at first stage.', 'success'); }
}

// ─── FUNNEL BOARD ─────────────────────────────────
function renderFunnelBoard() {
  const board = document.getElementById('funnel-board');
  board.innerHTML = '';
  const pool = visibleEPs();
  STATUSES.forEach(status => {
    const col = document.createElement('div');
    col.className = 'funnel-col';
    const color = STATUS_COLORS[status];
    const stEPs = pool.filter(e => e.status === status);
    col.innerHTML = `
      <div class="funnel-col-header" style="border-color:${color}">
        <span class="funnel-col-title" style="color:${color}">${status}</span>
        <span class="funnel-col-count" style="color:${color}">${stEPs.length}</span>
      </div>
      <div class="funnel-cards funnel-drop-zone" id="drop-${status.replace(/\s/g,'-')}">
        ${stEPs.map(e => funnelCard(e)).join('')}
      </div>`;
    board.appendChild(col);
    const zone = col.querySelector('.funnel-drop-zone');
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault(); zone.classList.remove('drag-over');
      if (draggedEPId) {
        const ep = eps.find(x => x.id === draggedEPId);
        if (ep && ep.status !== status) {
          ep.status = status; save(); renderFunnelBoard();
          showToast(`${ep.name} → "${status}"`, 'success');
        }
        draggedEPId = null;
      }
    });
  });
}
function funnelCard(ep) {
  const prod = ep.focusProduct
    ? `<span class="product-badge ${PRODUCT_CSS[ep.focusProduct]||''}" style="display:inline-block;margin-top:5px">${ep.focusProduct}</span>` : '';
  return `<div class="funnel-card" draggable="true" data-id="${ep.id}"
    ondragstart="draggedEPId='${ep.id}';this.classList.add('dragging')"
    ondragend="this.classList.remove('dragging')"
    onclick="openEPModal('${ep.id}')">
    <div class="funnel-card-name">${esc(ep.name)}</div>
    <div class="funnel-card-uni">${esc(ep.university)||'No university'}</div>
    ${ep.country?`<span class="funnel-card-country">🌍 ${esc(ep.country)}</span>`:''}
    ${prod}
  </div>`;
}

// ─── PROJECT HUB ──────────────────────────────────
function renderProjects() {
  const query    = (document.getElementById('project-search')?.value||'').toLowerCase();
  const country  = document.getElementById('project-filter-country')?.value||'';
  const category = document.getElementById('project-filter-category')?.value||'';
  const allC     = [...new Set(projects.map(p=>p.country))].sort();
  const cSel     = document.getElementById('project-filter-country');
  if (cSel) {
    const cur = cSel.value;
    cSel.innerHTML = '<option value="">All Countries</option>' +
      allC.map(c=>`<option${c===cur?' selected':''}>${c}</option>`).join('');
  }
  const filtered = projects.filter(p => {
    if (country  && p.country !== country) return false;
    if (category && p.category !== category) return false;
    if (query && !`${p.name} ${p.country} ${p.description}`.toLowerCase().includes(query)) return false;
    return true;
  });
  const grid = document.getElementById('project-grid');
  if (!filtered.length) {
    grid.innerHTML='<div class="empty-state"><div class="empty-icon">◎</div><p>No projects found.</p></div>'; return;
  }
  grid.innerHTML = filtered.map(p => {
    const sc = p.status==='Open'?'open':p.status==='Closing Soon'?'closing':'closed';
    const cc = CATEGORY_COLORS[p.category]||'var(--accent)';
    return `<div class="project-card" style="--cat-color:${cc}">
      <div class="project-card-header">
        <div class="project-card-name">${esc(p.name)}</div>
        <span class="project-status ${sc}">${p.status}</span>
      </div>
      <div class="project-country">🌍 ${esc(p.country)}</div>
      <div class="project-desc">${esc(p.description)}</div>
      <span class="project-category">${p.category}</span>
      ${isAdmin() ? `<div class="project-actions">
        <button class="btn-icon" onclick="openProjectModal('${p.id}')">Edit</button>
        <button class="btn-icon danger" onclick="confirmDelete('project','${p.id}')">Delete</button>
      </div>` : ''}
    </div>`;
  }).join('');
}
function openProjectModal(id) {
  document.getElementById('project-modal-title').textContent = id ? 'Edit Project' : 'Add Project';
  ['project-id','proj-country','proj-name','proj-desc'].forEach(i => setVal(i,''));
  setVal('proj-category','Fingerprint'); setVal('proj-status','Open');
  if (id) {
    const p = projects.find(x=>x.id===id);
    if (p) { setVal('project-id',p.id); setVal('proj-country',p.country); setVal('proj-name',p.name); setVal('proj-category',p.category); setVal('proj-status',p.status); setVal('proj-desc',p.description); }
  }
  document.getElementById('project-modal').classList.remove('hidden');
}
function saveProject() {
  const country = document.getElementById('proj-country').value.trim();
  const name    = document.getElementById('proj-name').value.trim();
  if (!country||!name) { showToast('Country and Name required.','error'); return; }
  const id   = document.getElementById('project-id').value;
  const data = { id:id||genId(), country, name, category:document.getElementById('proj-category').value, status:document.getElementById('proj-status').value, description:document.getElementById('proj-desc').value.trim() };
  if (id) { const i=projects.findIndex(p=>p.id===id); if(i>-1) projects[i]=data; } else projects.push(data);
  save(); closeModal('project-modal'); renderProjects(); showToast('Project saved!','success');
}
function deleteProject(id) {
  projects = projects.filter(p=>p.id!==id);
  save(); closeModal('confirm-modal'); renderProjects(); showToast('Project deleted.','success');
}

// ─── FOLLOW-UPS ───────────────────────────────────
function renderFollowups() {
  const pool  = visibleEPs();
  const today = new Date(); today.setHours(0,0,0,0);
  const over  = pool.filter(e => e.followup && isOverdue(e.followup)).sort((a,b)=>a.followup.localeCompare(b.followup));
  const tod   = pool.filter(e => e.followup && isToday(e.followup));
  const upc   = pool.filter(e => {
    if (!e.followup) return false;
    const d = new Date(e.followup);
    return d > today && !isToday(e.followup);
  }).sort((a,b)=>a.followup.localeCompare(b.followup)).slice(0,15);
  document.getElementById('followup-sections').innerHTML = [
    followupSection('overdue','⚠ Overdue',over),
    followupSection('today','📅 Due Today',tod),
    followupSection('upcoming','📋 Upcoming',upc),
  ].join('');
}
function followupSection(type, title, list) {
  if (!list.length && type !== 'upcoming') return `<div><div class="followup-section-title ${type}">${title}</div><p style="color:var(--text-muted);font-size:13px;padding:4px">✓ All clear!</p></div>`;
  if (!list.length) return '';
  return `<div>
    <div class="followup-section-title ${type}">${title} <span style="font-size:11px;opacity:0.6">(${list.length})</span></div>
    ${list.map(e => {
      const m = members.find(x=>x.id===e.assignedId);
      return `<div class="followup-card ${type}" onclick="openEPModal('${e.id}')">
        <div class="followup-info">
          <div class="followup-name">${esc(e.name)}</div>
          <div class="followup-meta">${esc(e.university)||'—'} · ${m?esc(m.name):'Unassigned'} · <span class="status-badge ${STATUS_CSS[e.status]}" style="font-size:10px;padding:1px 6px">${e.status}</span></div>
        </div>
        <div class="followup-date ${type}">${e.followup}</div>
        <button class="btn-icon" onclick="event.stopPropagation();editEP('${e.id}')">Update</button>
      </div>`;
    }).join('')}
  </div>`;
}

// ─── MANAGE MEMBERS MODAL ─────────────────────────
function openMembersModal() {
  renderMembersList();
  document.getElementById('members-modal').classList.remove('hidden');
}
function renderMembersList() {
  const el = document.getElementById('members-list');
  if (!el) return;
  if (!members.length) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">No members yet.</p>';
    return;
  }
  el.innerHTML = members.map(m => {
    const init = m.name.split(' ').map(w=>w[0]).join('').substr(0,2).toUpperCase();
    return `<div class="member-row">
      <div class="user-avatar" style="width:28px;height:28px;font-size:10px;border-radius:6px">${init}</div>
      <div class="m-name">${esc(m.name)}</div>
      <div class="m-user">@${esc(m.username)}</div>
      <div class="m-email">${esc(m.email)}</div>
      <button class="btn-icon danger" onclick="deleteMember('${m.id}')">✕</button>
    </div>`;
  }).join('');
}
function addMember() {
  const name     = (document.getElementById('new-member-name')?.value||'').trim();
  const email    = (document.getElementById('new-member-email')?.value||'').trim();
  const username = (document.getElementById('new-member-username')?.value||'').trim();
  const password = (document.getElementById('new-member-password')?.value||'').trim();
  if (!name)     { showToast('Name is required.','error'); return; }
  if (!username) { showToast('Username is required.','error'); return; }
  if (!password) { showToast('Password is required.','error'); return; }
  if (members.find(m => m.username === username)) { showToast('Username already exists.','error'); return; }
  members.push({ id:genId(), name, email, username, password, role:'user' });
  save();
  ['new-member-name','new-member-email','new-member-username','new-member-password'].forEach(id => setVal(id,''));
  renderMembersList();
  populateMemberDropdowns();
  showToast('Member added!','success');
}
function deleteMember(id) {
  members = members.filter(m => m.id !== id);
  eps.forEach(e => { if (e.assignedId === id) e.assignedId = ''; });
  save(); renderMembersList(); populateMemberDropdowns();
  showToast('Member removed.','success');
}

// ─── NOTIFICATIONS ────────────────────────────────
function triggerAssignNotification(member, ep) {
  if (member.email) {
    const a = document.createElement('a');
    a.href = buildMailto(ep, member);
    a.click();
  }
  showToast(`📧 ${member.name} assigned to ${ep.name}`, 'success');
}

// ─── EP SIGNUP (PUBLIC) ───────────────────────────
function handleSignup() {
  const name  = (document.getElementById('signup-name')?.value||'').trim();
  const email = (document.getElementById('signup-email')?.value||'').trim();
  const mot   = (document.getElementById('signup-motivation')?.value||'').trim();
  if (!name || !email || !mot) { showToast('Please fill in required fields.','error'); return; }
  const fp = document.getElementById('signup-focus-product')?.value||'';
  if (!fp) { showToast('Please select a Focus Product.','error'); return; }
  const ep = {
    id:           genId(),
    name, email,
    phone:        (document.getElementById('signup-phone')?.value||'').trim(),
    university:   (document.getElementById('signup-university')?.value||'').trim(),
    department:   (document.getElementById('signup-department')?.value||'').trim(),
    degree:       (document.getElementById('signup-degree')?.value||'').trim(),
    country:      document.getElementById('signup-country')?.value||'',
    focusProduct: fp,
    projectType:  document.getElementById('signup-project-type')?.value||'',
    motivation:   mot,
    status:       'New Lead',
    assignedId:   '',
    lastContact:  '',
    followup:     '',
    createdAt:    today(),
  };
  load(); eps.push(ep); save();
  document.getElementById('signup-success').classList.remove('hidden');
  ['signup-name','signup-email','signup-phone','signup-university','signup-department','signup-degree','signup-motivation'].forEach(id => setVal(id,''));
  setVal('signup-country',''); setVal('signup-focus-product',''); setVal('signup-project-type','');
}

// ─── CSV EXPORT ───────────────────────────────────
// FIX: includes all required fields including department
function exportCSV() {
  const headers = ['Name','Email','Phone','University','Department','Degree','Country','Focus Product','Project Type','Status','Assigned To','Last Contact','Next Follow-up','Created At'];
  const rows = eps.map(e => {
    const m = members.find(x => x.id === e.assignedId);
    return [
      e.name, e.email, e.phone||'', e.university||'', e.department||'', e.degree||'',
      e.country||'', e.focusProduct||'', e.projectType||'', e.status,
      m?m.name:'', e.lastContact||'', e.followup||'', e.createdAt||''
    ].map(csvEsc).join(',');
  });
  const csv = [headers.map(csvEsc).join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `exchangeflow-eps-${today()}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${eps.length} EPs to CSV`, 'success');
}
function csvEsc(val) {
  const s = String(val||'');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}

// ─── CSV IMPORT ───────────────────────────────────
// FIX: accepts department; validates duplicates; shows summary
function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { showToast('CSV file is empty.','error'); return; }
    const headerRow = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase().replace(/[^a-z ]/g,''));
    const colIdx = h => {
      const aliases = {
        name:       ['name','full name'],
        email:      ['email','email address'],
        phone:      ['phone','phone number','mobile'],
        university: ['university','school','college','institution'],
        department: ['department','dept','faculty','course'],
        focusProduct:['focus product','product','focus'],
        status:     ['status'],
        assigned:   ['assigned to','assigned','member'],
      };
      for (const [key,alts] of Object.entries(aliases)) {
        if (alts.some(a => headerRow.indexOf(a) > -1)) {
          if (key === h) return headerRow.indexOf(aliases[key][0]) > -1
            ? headerRow.indexOf(aliases[key][0])
            : headerRow.findIndex(c => aliases[key].includes(c));
        }
      }
      return headerRow.indexOf(h);
    };
    const get = (cols, h) => {
      const aliases = {
        name:['name','full name'],email:['email','email address'],phone:['phone','phone number','mobile'],
        university:['university','school','college','institution'],department:['department','dept','faculty','course'],
        focusProduct:['focus product','product','focus'],status:['status'],assigned:['assigned to','assigned','member']
      };
      const idx = headerRow.findIndex(c => (aliases[h]||[h]).includes(c));
      return idx > -1 ? (cols[idx]||'').trim().replace(/^"|"$/g,'') : '';
    };

    let added=0, dupes=0, errors=0;
    const resultItems = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      const rawName  = get(cols,'name');
      const rawEmail = get(cols,'email');
      if (!rawName && !rawEmail) continue;
      const cleanEmail = rawEmail.toLowerCase();
      const cleanName  = rawName.trim();
      if (eps.find(e => e.email.toLowerCase() === cleanEmail)) {
        dupes++; resultItems.push({ type:'warning', msg:`Duplicate: ${cleanEmail}` }); continue;
      }
      if (!cleanEmail.includes('@')) {
        errors++; resultItems.push({ type:'error', msg:`Invalid email: ${cleanEmail}` }); continue;
      }
      const rawStatus    = get(cols,'status');
      const rawProduct   = get(cols,'focusProduct');
      const rawAssigned  = get(cols,'assigned');
      const matchedMember = rawAssigned ? members.find(m => m.name.toLowerCase().includes(rawAssigned.toLowerCase())) : null;
      eps.push({
        id:           genId(),
        name:         cleanName,
        email:        cleanEmail,
        phone:        get(cols,'phone'),
        university:   get(cols,'university'),
        department:   get(cols,'department'),
        focusProduct: ['oGV','oGTa','oGTe'].includes(rawProduct) ? rawProduct : '',
        status:       STATUSES.includes(rawStatus) ? rawStatus : 'New Lead',
        assignedId:   matchedMember?.id||'',
        degree:'', country:'', projectType:'', motivation:'',
        lastContact:'', followup:'',
        createdAt: today(),
      });
      added++;
      resultItems.push({ type:'success', msg:`Added: ${cleanName||cleanEmail}` });
    }
    save(); populateCountryFilters();
    const body = document.getElementById('csv-result-body');
    body.innerHTML = `
      <div style="display:flex;gap:24px;margin-bottom:16px;flex-wrap:wrap">
        <div style="text-align:center"><div style="font-size:28px;font-family:'Syne',sans-serif;font-weight:700;color:var(--green)">${added}</div><div style="font-size:11px;color:var(--text-muted)">Added</div></div>
        <div style="text-align:center"><div style="font-size:28px;font-family:'Syne',sans-serif;font-weight:700;color:var(--yellow)">${dupes}</div><div style="font-size:11px;color:var(--text-muted)">Duplicates</div></div>
        <div style="text-align:center"><div style="font-size:28px;font-family:'Syne',sans-serif;font-weight:700;color:var(--red)">${errors}</div><div style="font-size:11px;color:var(--text-muted)">Errors</div></div>
      </div>
      <div style="max-height:200px;overflow-y:auto">
        ${resultItems.slice(0,25).map(r=>`<div class="csv-result-item ${r.type}">${r.type==='success'?'✓':r.type==='warning'?'⚠':'✕'} ${esc(r.msg)}</div>`).join('')}
        ${resultItems.length>25?`<div style="font-size:12px;color:var(--text-muted);padding:6px">…and ${resultItems.length-25} more</div>`:''}
      </div>`;
    document.getElementById('csv-result-modal').classList.remove('hidden');
    if (currentPage === 'ep-list') renderEPList();
  };
  reader.readAsText(file);
  event.target.value = '';
}
function parseCSVRow(row) {
  const result=[];
  let cur='', inQ=false;
  for (let i=0;i<row.length;i++) {
    if (row[i]==='"') { inQ=!inQ; }
    else if (row[i]===',' && !inQ) { result.push(cur); cur=''; }
    else cur += row[i];
  }
  result.push(cur);
  return result;
}

// ─── JSON EXPORT / IMPORT ─────────────────────────
function exportData() {
  const data = { eps, projects, members, exportedAt:new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=`exchangeflow-backup-${today()}.json`; a.click();
  URL.revokeObjectURL(url);
  showToast('JSON exported!','success');
}
function importDataClick() { document.getElementById('import-json-file')?.click(); }
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.eps)      eps      = data.eps;
      if (data.projects) projects = data.projects;
      if (data.members)  members  = data.members;
      save(); populateMemberDropdowns(); populateCountryFilters();
      renderDashboard();
      showToast('Data imported!','success');
    } catch { showToast('Invalid JSON file.','error'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ─── CONFIRM DELETE ───────────────────────────────
function confirmDelete(type, id) {
  const item = type==='ep' ? eps.find(e=>e.id===id) : projects.find(p=>p.id===id);
  if (!item) return;
  document.getElementById('confirm-text').textContent = `Delete "${item.name}"? This cannot be undone.`;
  document.getElementById('confirm-action-btn').onclick = () => type==='ep' ? deleteEP(id) : deleteProject(id);
  document.getElementById('confirm-modal').classList.remove('hidden');
}

// ─── FOLLOW-UP REMINDERS ──────────────────────────
function checkFollowupReminders() {
  const pool = visibleEPs();
  const ov   = pool.filter(e => e.followup && isOverdue(e.followup));
  const tod  = pool.filter(e => e.followup && isToday(e.followup));
  if (ov.length)  showToast(`⚠ ${ov.length} overdue follow-up(s)!`, 'warning');
  else if (tod.length) showToast(`📅 ${tod.length} follow-up(s) due today`, 'success');
}

// ─── MODAL HELPERS ────────────────────────────────
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

// ─── TOAST ────────────────────────────────────────
let _toastTimer;
function showToast(msg, type='success') {
  const el = document.getElementById('toast');
  const icons = { success:'✓', error:'✕', warning:'⚠' };
  el.innerHTML = `<span>${icons[type]||'•'}</span><span>${esc(msg)}</span>`;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), 3800);
}

// ─── DATE HELPERS ─────────────────────────────────
function dateClass(d) {
  if (!d) return 'date-normal';
  const t = new Date(); t.setHours(0,0,0,0);
  const dt = new Date(d);
  if (dt < t) return 'date-overdue';
  if (dt.toDateString() === t.toDateString()) return 'date-today';
  return 'date-normal';
}
function isOverdue(d) {
  if (!d) return false;
  const t = new Date(); t.setHours(0,0,0,0);
  return new Date(d) < t;
}
function isToday(d) {
  return d && new Date(d).toDateString() === new Date().toDateString();
}
function today() {
  return new Date().toISOString().split('T')[0];
}

// ─── UTIL ─────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── INIT ─────────────────────────────────────────
(function init() {
  initTheme();
  const saved = sessionStorage.getItem('ef_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      showApp();
    } catch { sessionStorage.removeItem('ef_user'); }
  }
  // Show login if not authenticated
  if (!currentUser) {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    document.getElementById('signup-screen').classList.add('hidden');
  }
  // function deleteAllEPs() {
  //   if (!isAdmin()) return;
  //   if (!eps.length) { showToast('No EPs to delete.', 'warning'); return; }
  //   document.getElementById('confirm-text').textContent = `Delete ALL ${eps.length} EPs permanently? This cannot be undone.`;
  //   document.getElementById('confirm-action-btn').onclick = () => {
  //     eps = [];
  //     save();
  //     populateCountryFilters();
  //     closeModal('confirm-modal');
  //     renderEPList();
  //     showToast('All EPs deleted.', 'success');
  //   };
  //   document.getElementById('confirm-modal').classList.remove('hidden');
  // }
})();
