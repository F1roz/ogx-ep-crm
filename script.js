'use strict';
/* ══════════════════════════════════════════════════
   EXCHANGEFLOW CRM — script.js v4.0
   Supabase backend + edit members + user profile
   + delete all EPs + cookie remember-me
══════════════════════════════════════════════════ */

// ─── SUPABASE CONFIG ──────────────────────────────
const SUPA_URL = 'https://lqwmwbqtohynzlparnnu.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxd213YnF0b2h5bnpscGFybm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTM4MTAsImV4cCI6MjA5MzI2OTgxMH0.Rb3kZb8bnbKlwxx8iG5dyEtwPHjNDhq5SVpEkzOa6PQ';
const db = supabase.createClient(SUPA_URL, SUPA_KEY);

// ─── CONSTANTS ────────────────────────────────────
const ADMIN_CREDS = { username:'firoz', password:'firoz25.26', role:'MCVP', name:'Firoz Fahim' };
const STATUSES = ['New Lead','Contacted','Interested','Not Interested','Session Booked','Later','Applicant','Applied','Matched','Approved','Realized'];
const STATUS_COLORS = {
  'New Lead':'#6b7cff','Contacted':'#a78bfa','Interested':'#f472b6', 'Not Interested':'#FF0000',
  'Session Booked':'#fb923c','Later':'#98FB98','Applicant':'#fbbf24','Applied':'#34d399',
  'Matched':'#22d3ee','Approved':'#4f7cff','Realized':'#22d3a0'
};
const STATUS_CSS = {
  'New Lead':'status-new-lead','Contacted':'status-contacted','Interested':'status-interested','Not Interested': 'status-not-interest',
  'Session Booked':'status-session-booked','Later':'status-later','Applicant':'status-applicant','Applied':'status-applied',
  'Matched':'status-matched','Approved':'status-approved','Realized':'status-realized'
};
const PRODUCT_CSS = { oGV:'product-ogv', oGTa:'product-ogta', oGTe:'product-ogte' };
const CATEGORY_COLORS = {
  Fingerprint:'#4f7cff',Heartbeat:'#f472b6',Teach:'#22d3ee',
  Raise:'#fbbf24',Impact:'#34d399',Sustain:'#22d3a0'
};

// ─── STATE ────────────────────────────────────────
let eps      = [];
let projects = [];
let members  = [];
let currentUser  = null;
let draggedEPId  = null;
let currentPage  = 'dashboard';
let prevPage     = 'dashboard';
let loginRole    = 'admin';
let _pendingEditEP = null;
let _dbOnline    = false;

// ─── COOKIE HELPERS ───────────────────────────────
function setCookie(name, value, days) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${exp};path=/;SameSite=Strict`;
}
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g,'\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}
function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// ─── DB STATUS ────────────────────────────────────
function setDbStatus(online) {
  _dbOnline = online;
  const el = document.getElementById('db-status');
  if (!el) return;
  el.className = `db-status ${online ? 'online' : 'offline'}`;
  el.title = online ? 'Connected to Supabase' : 'Using local cache';
  el.innerHTML = online ? '● Live' : '○ Offline';
}

// ─── SUPABASE: LOAD ALL DATA ──────────────────────
async function load() {
  showLoading(true);
  try {
    const [epsRes, projRes, membersRes] = await Promise.all([
      db.from('eps').select('*').order('created_at', { ascending: false }),
      db.from('projects').select('*').order('name'),
      db.from('members').select('*').order('name'),
    ]);
    if (epsRes.error)     throw epsRes.error;
    if (projRes.error)    throw projRes.error;
    if (membersRes.error) throw membersRes.error;

    eps      = (epsRes.data     || []).map(normalizeEP);
    projects = (projRes.data    || []).map(normalizeProject);
    members  = (membersRes.data || []).map(normalizeMember);

    // Seed if empty
    if (!projects.length) await seedProjects();
    if (!members.length)  await seedMembers();

    // Cache locally as fallback
    localStorage.setItem('ef_eps_cache',      JSON.stringify(eps));
    localStorage.setItem('ef_projects_cache', JSON.stringify(projects));
    localStorage.setItem('ef_members_cache',  JSON.stringify(members));
    setDbStatus(true);
  } catch(err) {
    console.warn('Supabase load failed, using cache:', err.message);
    eps      = JSON.parse(localStorage.getItem('ef_eps_cache')      || '[]');
    projects = JSON.parse(localStorage.getItem('ef_projects_cache') || '[]');
    members  = JSON.parse(localStorage.getItem('ef_members_cache')  || '[]');
    setDbStatus(false);
    if (!eps.length && !projects.length) {
      showToast('Could not connect to database. Run setup SQL first.', 'error');
    }
  }
  showLoading(false);
}

// Field name normalizers (Supabase snake_case → camelCase)
function normalizeEP(r) {
  return {
    id:           r.id,
    name:         r.name         || '',
    email:        r.email        || '',
    phone:        r.phone        || '',
    university:   r.university   || '',
    department:   r.department   || '',
    degree:       r.degree       || '',
    country:      r.country      || '',
    focusProduct: r.focus_product|| '',
    projectType:  r.project_type || '',
    assignedId:   r.assigned_id  || '',
    status:       r.status       || 'New Lead',
    lastContact:  r.last_contact || '',
    followup:     r.followup     || '',
    motivation:   r.motivation   || '',
    createdAt:    r.created_at   || today(),
  };
}
function normalizeProject(r) {
  return { id:r.id, country:r.country||'', name:r.name||'', category:r.category||'', description:r.description||'', status:r.status||'Open' };
}
function normalizeMember(r) {
  return {
    id:          r.id,
    name:        r.name         || '',
    email:       r.email        || '',
    username:    r.username     || '',
    password:    r.password     || '',
    designation: r.designation  || '',
    phone:       r.phone        || '',
    university:  r.university   || '',
    tl:          r.tl           || '',
    role:        r.role         || 'user',
  };
}

// ─── SUPABASE: SAVE EP ────────────────────────────
async function saveEPToDB(data) {
  const row = {
    id:            data.id,
    name:          data.name,
    email:         data.email,
    phone:         data.phone,
    university:    data.university,
    department:    data.department,
    degree:        data.degree,
    country:       data.country,
    focus_product: data.focusProduct,
    project_type:  data.projectType,
    assigned_id:   data.assignedId || null,
    status:        data.status,
    last_contact:  data.lastContact || null,
    followup:      data.followup || null,
    motivation:    data.motivation,
    created_at:    data.createdAt,
  };
  const { error } = await db.from('eps').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

async function deleteEPFromDB(id) {
  const { error } = await db.from('eps').delete().eq('id', id);
  if (error) throw error;
}

async function deleteAllEPsFromDB() {
  const { error } = await db.from('eps').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

// ─── SUPABASE: SAVE PROJECT ───────────────────────
async function saveProjectToDB(data) {
  const { error } = await db.from('projects').upsert({
    id:data.id, country:data.country, name:data.name,
    category:data.category, status:data.status, description:data.description
  }, { onConflict:'id' });
  if (error) throw error;
}
async function deleteProjectFromDB(id) {
  const { error } = await db.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ─── SUPABASE: SAVE MEMBER ────────────────────────
async function saveMemberToDB(data) {
  const { error } = await db.from('members').upsert({
    id:data.id, name:data.name, email:data.email, username:data.username,
    password:data.password, designation:data.designation||'', phone:data.phone||'',
    university:data.university||'', tl:data.tl||'', role:data.role||'user'
  }, { onConflict:'id' });
  if (error) throw error;
}
async function deleteMemberFromDB(id) {
  const { error } = await db.from('members').delete().eq('id', id);
  if (error) throw error;
}

// ─── SEED DATA ────────────────────────────────────
async function seedMembers() {
  const seeds = [
    { id:genId(), name:'Rafi Islam',    email:'rafi@ef.org',    username:'rafi',    password:'rafi123',    designation:'oGX Manager',  phone:'+880 171 000 0001', university:'Dhaka University', tl:'VP oGX',  role:'user' },
    { id:genId(), name:'Nadia Hossain', email:'nadia@ef.org',   username:'nadia',   password:'nadia123',   designation:'EP Manager',    phone:'+880 171 000 0002', university:'BUET',             tl:'VP oGX',  role:'user' },
    { id:genId(), name:'Tanvir Ahmed',  email:'tanvir@ef.org',  username:'tanvir',  password:'tanvir123',  designation:'Team Leader',   phone:'+880 171 000 0003', university:'NSU',               tl:'oGX TL',  role:'user' },
    { id:genId(), name:'Sadia Jahan',   email:'sadia@ef.org',   username:'sadia',   password:'sadia123',   designation:'oGX Executive', phone:'+880 171 000 0004', university:'SUST',              tl:'oGX TL',  role:'user' },
  ];
  for (const m of seeds) { try { await saveMemberToDB(m); } catch(e) { console.warn(e); } }
  members = seeds;
}
async function seedProjects() {
  const seeds = [
    { id:genId(), country:'Germany',   name:'Smart Cities Engineering',        category:'Fingerprint', description:'Work with Berlin tech firms on urban data infrastructure.',  status:'Open' },
    { id:genId(), country:'Turkey',    name:'Public Health Research',           category:'Heartbeat',   description:'Assist in Istanbul clinics on preventive health outreach.', status:'Open' },
    { id:genId(), country:'India',     name:'Rural Education Initiative',       category:'Teach',       description:'Teach STEM subjects in underserved communities in Pune.',    status:'Closing Soon' },
    { id:genId(), country:'Colombia',  name:'Social Innovation Lab',            category:'Impact',      description:'Co-create solutions for urban displacement in Medellín.',    status:'Open' },
    { id:genId(), country:'Malaysia',  name:'Sustainable Agriculture',          category:'Sustain',     description:'Implement eco-farming practices in Selangor rural zones.',   status:'Open' },
    { id:genId(), country:'Brazil',    name:'Business Development Accelerator', category:'Raise',       description:'Support São Paulo startups in scaling impact operations.',   status:'Closing Soon' },
    { id:genId(), country:'Egypt',     name:'Renewable Energy Engineering',     category:'Fingerprint', description:'Work on solar panel projects across Luxor.',                 status:'Open' },
    { id:genId(), country:'Indonesia', name:'Marine Conservation Program',      category:'Sustain',     description:'Protect coral reef ecosystems in the Lombok archipelago.',  status:'Open' },
  ];
  for (const p of seeds) { try { await saveProjectToDB(p); } catch(e) { console.warn(e); } }
  projects = seeds;
}

// ─── HELPERS ──────────────────────────────────────
function genId() { return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2,9); }
function today() { return new Date().toISOString().split('T')[0]; }
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showLoading(show) {
  document.getElementById('loading-overlay')?.classList.toggle('hidden', !show);
}

// ─── LOCAL CACHE (fallback) ───────────────────────
function cacheAll() {
  localStorage.setItem('ef_eps_cache',      JSON.stringify(eps));
  localStorage.setItem('ef_projects_cache', JSON.stringify(projects));
  localStorage.setItem('ef_members_cache',  JSON.stringify(members));
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
  const icon = theme === 'dark' ? '☾' : '☀';
  ['theme-icon','theme-icon-mobile'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = icon; });
  const lbl = document.getElementById('theme-label'); if(lbl) lbl.textContent = theme === 'dark' ? 'Dark' : 'Light';
}

// ─── AUTH ─────────────────────────────────────────
function switchLoginRole(role) {
  loginRole = role;
  document.getElementById('tab-admin').classList.toggle('active', role === 'admin');
  document.getElementById('tab-user').classList.toggle('active',  role === 'user');
  document.getElementById('login-hint').innerHTML = role === 'admin'
    ? 'Admin: <strong>---</strong> / <strong>---</strong>'
    : 'e.g. <strong>---</strong> / <strong>---</strong>';
}

async function handleLogin() {
  const u   = document.getElementById('login-user').value.trim();
  const p   = document.getElementById('login-pass').value.trim();
  const rem = document.getElementById('remember-me').checked;
  const err = document.getElementById('login-error');
  err.classList.add('hidden');

  if (loginRole === 'admin') {
    if (u === ADMIN_CREDS.username && p === ADMIN_CREDS.password) {
      currentUser = { id:'admin', name:'Admin', role:'admin', username:'admin' };
      _persistSession(currentUser, rem);
      await showApp();
      return;
    }
  } else {
    // Need members loaded to check credentials
    showLoading(true);
    try {
      const { data, error } = await db.from('members').select('*').eq('username', u).eq('password', p).single();
      showLoading(false);
      if (!error && data) {
        const m = normalizeMember(data);
        currentUser = { id:m.id, name:m.name, role:'user', username:m.username };
        _persistSession(currentUser, rem);
        await showApp();
        return;
      }
    } catch(e) {
      showLoading(false);
      // Fallback to cache
      const cached = JSON.parse(localStorage.getItem('ef_members_cache') || '[]');
      const m = cached.find(x => x.username === u && x.password === p);
      if (m) {
        currentUser = { id:m.id, name:m.name, role:'user', username:m.username };
        _persistSession(currentUser, rem);
        await showApp();
        return;
      }
    }
  }
  err.classList.remove('hidden');
}

function _persistSession(user, remember) {
  const val = JSON.stringify(user);
  sessionStorage.setItem('ef_user', val);
  if (remember) setCookie('ef_user', val, 30); // 30-day cookie
}

function handleLogout() {
  sessionStorage.removeItem('ef_user');
  deleteCookie('ef_user');
  currentUser = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !document.getElementById('login-screen').classList.contains('hidden')) handleLogin();
});

// ─── SHOW APP ─────────────────────────────────────
async function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('signup-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  await load();
  buildSidebar();
  updateSidebarUser();
  populateMemberDropdowns();
  populateCountryFilters();
  applyRoleVisibility();
  navigate(isAdmin() ? 'dashboard' : 'user-dashboard');
  setTimeout(checkFollowupReminders, 1500);
}
function showLogin() {
  document.getElementById('signup-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}
function showSignup() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('signup-screen').classList.remove('hidden');
}

// ─── ROLE ─────────────────────────────────────────
function isAdmin() { return currentUser?.role === 'admin'; }

function applyRoleVisibility() {
  const actEl = document.getElementById('ep-list-actions');
  if (actEl) {
    if (isAdmin()) {
      actEl.innerHTML = `
        <button class="btn-secondary" onclick="navigate('add-ep')">+ Add EP</button>
        <button class="btn-secondary" onclick="exportCSV()">↑ CSV</button>
        <button class="btn-secondary" onclick="document.getElementById('import-csv-file').click()">↓ Import CSV</button>
        <input type="file" id="import-csv-file" accept=".csv" class="hidden" onchange="importCSV(event)" />
        <button class="btn-secondary" style="color:var(--red);border-color:rgba(255,90,90,0.3)" onclick="deleteAllEPs()">✕ Delete All</button>`;
    } else { actEl.innerHTML = ''; }
  }
  const addPBtn = document.getElementById('add-project-btn');
  if (addPBtn) addPBtn.style.display = isAdmin() ? '' : 'none';
  document.querySelectorAll('.col-assigned').forEach(c => c.style.display = isAdmin() ? '' : 'none');
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
    { label:'Account', items:[
      { icon:'◉', text:'My Profile',    page:'profile' },
    ]},
  ];
  const groups = isAdmin() ? adminGroups : userGroups;
  let html = '', delay = 0;
  groups.forEach(g => {
    html += `<div class="nav-section-label">${g.label}</div>`;
    g.items.forEach(item => {
      delay += 50;
      if (item.page) {
        html += `<a class="nav-item" data-page="${item.page}" onclick="navigate('${item.page}')" style="animation-delay:${delay}ms"><span class="nav-icon">${item.icon}</span>${item.text}</a>`;
      } else {
        html += `<a class="nav-item" onclick="${item.action}()" style="animation-delay:${delay}ms"><span class="nav-icon">${item.icon}</span>${item.text}</a>`;
      }
    });
  });
  if (isAdmin()) html += `<input type="file" id="import-json-file" accept=".json" class="hidden" onchange="importData(event)" />`;
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
  if (rl) {
    if (isAdmin()) {
      rl.textContent = 'Administrator';
    } else {
      const m = members.find(x => x.id === currentUser.id);
      rl.textContent = m?.designation || 'oGX Member';
    }
  }
}

// ─── NAVIGATION ───────────────────────────────────
const PAGE_CRUMBS = {
  'dashboard':'Dashboard','user-dashboard':'My Dashboard','profile':'My Profile',
  'ep-list':'EP List','funnel':'Funnel Board','add-ep':'Add / Edit EP',
  'projects':'Project Hub','followups':'Follow-up Tracker','members':'Member Analytics'
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
  else if (page === 'profile')        renderUserProfile();
  else if (page === 'ep-list')        { renderEPList(); applyRoleVisibility(); }
  else if (page === 'funnel')         renderFunnelBoard();
  else if (page === 'add-ep')         buildEPForm(null);
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
    sel.innerHTML = id === 'ep-assigned' ? '<option value="">Unassigned</option>' : '<option value="">All Members</option>';
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
    countries.forEach(c => { const o = document.createElement('option'); o.value=c; o.textContent=c; sel.appendChild(o); });
    if (val) sel.value = val;
  });
}

// ─── VISIBLE EPS ──────────────────────────────────
function visibleEPs() {
  if (isAdmin()) return eps;
  return eps.filter(e => e.assignedId === currentUser.id);
}

// ─── USER PROFILE PAGE ────────────────────────────
function renderUserProfile() {
  const m = members.find(x => x.id === currentUser?.id);
  if (!m) {
    document.getElementById('profile-content').innerHTML = '<p style="color:var(--text-muted)">Profile not found.</p>';
    return;
  }
  const myEPs = eps.filter(e => e.assignedId === m.id);
  document.getElementById('profile-content').innerHTML = `
    <div class="profile-layout">
      <div class="profile-card">
        <div class="profile-avatar">${m.name.split(' ').map(w=>w[0]).join('').substr(0,2).toUpperCase()}</div>
        <div class="profile-name">${esc(m.name)}</div>
        <div class="profile-designation">${esc(m.designation||'oGX Member')}</div>
        <div class="profile-fields">
          ${profileField('Username', '@' + esc(m.username))}
          ${profileField('Email', esc(m.email)||'—')}
          ${profileField('Phone', esc(m.phone)||'—')}
          ${profileField('University', esc(m.university)||'—')}
          ${profileField('TL / VP', esc(m.tl)||'—')}
        </div>
        <div class="profile-cred-box">
          <div class="cred-label">Your Login Credentials</div>
          <div class="cred-row"><span>Username:</span><strong>${esc(m.username)}</strong></div>
          <div class="cred-row"><span>Password:</span>
            <span style="display:flex;align-items:center;gap:8px">
              <strong id="profile-pw-val" style="letter-spacing:0.1em">••••••••</strong>
              <button class="btn-icon" onclick="toggleProfilePw('${esc(m.password)}')" style="padding:2px 8px;font-size:11px">Show</button>
            </span>
          </div>
        </div>
      </div>
      <div class="profile-eps-panel">
        <div class="card-header" style="margin-bottom:16px"><h3>My Assigned EPs (${myEPs.length})</h3></div>
        ${myEPs.length === 0
          ? '<p style="color:var(--text-muted);font-size:13px">No EPs assigned to you yet.</p>'
          : myEPs.map(e => `
            <div class="profile-ep-row" onclick="openEPModal('${e.id}')">
              <div class="profile-ep-info">
                <div class="profile-ep-name">${esc(e.name)}</div>
                <div class="profile-ep-meta">${esc(e.university)||'—'} · ${esc(e.country)||'—'} · ${e.focusProduct ? `<span class="product-badge ${PRODUCT_CSS[e.focusProduct]||''}">${e.focusProduct}</span>` : '—'}</div>
              </div>
              <span class="status-badge ${STATUS_CSS[e.status]}">${e.status}</span>
            </div>`).join('')
        }
      </div>
    </div>`;
}
function profileField(label, val) {
  return `<div class="profile-field"><span class="profile-field-label">${label}</span><span class="profile-field-val">${val}</span></div>`;
}
function toggleProfilePw(pw) {
  const el = document.getElementById('profile-pw-val');
  if (!el) return;
  const showing = el.textContent !== '••••••••';
  el.textContent = showing ? '••••••••' : pw;
  el.nextElementSibling.textContent = showing ? 'Show' : 'Hide';
}

// ─── DASHBOARDS ───────────────────────────────────
function renderDashboard() {
  const all = visibleEPs();
  const realized = all.filter(e=>e.status==='Realized').length;
  const active   = all.filter(e=>!['Realized','New Lead'].includes(e.status)).length;
  const unassigned = eps.filter(e=>!e.assignedId).length;
  const overdue  = all.filter(e=>e.followup&&isOverdue(e.followup)).length;
  const conv     = all.length ? Math.round((realized/all.length)*100) : 0;
  renderStatsGrid('stats-grid', [
    { label:'Total EPs',   value:all.length,     sub:'in pipeline',    color:'var(--accent)' },
    { label:'Active',      value:active,          sub:'in progress',    color:'var(--yellow)' },
    { label:'Applied',  value:eps.filter(e=>e.status==='Applied').length,  sub:'awaiting match',  color:'var(--s6)' },
    { label:'Approved', value:eps.filter(e=>e.status==='Approved').length, sub:'ready to go',     color:'var(--s8)' },
    { label:'Realized',    value:realized,        sub:`${conv}% conv.`, color:'var(--green)'  },
    { label:'Overdue',     value:overdue,         sub:'need follow-up', color:'var(--red)'    },
    { label:'Unassigned',  value:unassigned,      sub:'need a member',  color:'var(--orange)' },
    { label:'Members',     value:members.length,  sub:'oGX team',       color:'var(--s2)'     },
  ]);
  renderFunnelBars('funnel-bars', all);
  renderRecentActivity('recent-activity', all);
  renderOverdueList('overdue-list', all);
}
function renderUserDashboard() {
  const my = visibleEPs();
  const realized = my.filter(e=>e.status==='Realized').length;
  const active   = my.filter(e=>!['Realized','New Lead'].includes(e.status)).length;
  const overdue  = my.filter(e=>e.followup&&isOverdue(e.followup)).length;
  const conv     = my.length ? Math.round((realized/my.length)*100) : 0;
  const sub = document.getElementById('user-dash-sub');
  if (sub) sub.textContent = `${my.length} EP${my.length!==1?'s':''} assigned to you`;
  renderStatsGrid('user-stats-grid', [
    { label:'Assigned EPs', value:my.length, sub:'your portfolio',  color:'var(--accent)' },
    { label:'Active',       value:active,    sub:'in progress',     color:'var(--yellow)' },
    { label:'Applied',  value:eps.filter(e=>e.status==='Applied').length,  sub:'awaiting match',  color:'var(--s6)' },
    { label:'Approved', value:eps.filter(e=>e.status==='Approved').length, sub:'ready to go',     color:'var(--s8)' },
    { label:'Realized',     value:realized,  sub:`${conv}% conv.`,  color:'var(--green)'  },
    { label:'Overdue',      value:overdue,   sub:'need follow-up',  color:'var(--red)'    },
  ]);
  renderOverdueList('user-overdue-list', my);
  renderFunnelBars('user-funnel-bars', my);
}
function renderStatsGrid(id, stats) {
  const el = document.getElementById(id); if (!el) return;
  el.innerHTML = stats.map(s => `
    <div class="stat-card" style="--accent-color:${s.color}">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>`).join('');
}
function renderFunnelBars(id, arr) {
  const el = document.getElementById(id); if (!el) return;
  const counts = {}; STATUSES.forEach(s=>counts[s]=0);
  arr.forEach(e=>{if(counts[e.status]!==undefined)counts[e.status]++;});
  const max = Math.max(...Object.values(counts), 1);
  el.innerHTML = STATUSES.map(s => `
    <div class="funnel-bar-row">
      <div class="funnel-bar-label">${s}</div>
      <div class="funnel-bar-track"><div class="funnel-bar-fill" style="width:${(counts[s]/max)*100}%;background:${STATUS_COLORS[s]}"></div></div>
      <div class="funnel-bar-count">${counts[s]}</div>
    </div>`).join('');
}
function renderRecentActivity(id, arr) {
  const el = document.getElementById(id); if (!el) return;
  const recent = [...arr].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,5);
  if (!recent.length) { el.innerHTML='<div class="empty-state" style="padding:20px"><p>No EPs yet.</p></div>'; return; }
  el.innerHTML = recent.map(e => `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div>
        <div class="activity-text"><strong>${esc(e.name)}</strong> — ${e.status}</div>
        <div class="activity-time">${esc(e.country)||'—'} · ${e.focusProduct||''} · ${esc(e.university)||''}</div>
      </div>
    </div>`).join('');
}
function renderOverdueList(id, arr) {
  const el = document.getElementById(id); if (!el) return;
  const ov = arr.filter(e=>e.followup&&isOverdue(e.followup));
  if (!ov.length) { el.innerHTML='<p style="color:var(--text-muted);padding:8px 0;font-size:13px">✓ No overdue follow-ups. Great work!</p>'; return; }
  el.innerHTML = ov.map(e => {
    const m = members.find(x=>x.id===e.assignedId);
    return `<div class="overdue-row">
      <div class="name">${esc(e.name)}</div>
      <div class="member">${m?esc(m.name):'Unassigned'}</div>
      <div><span class="status-badge ${STATUS_CSS[e.status]}">${e.status}</span></div>
      <div class="date">⚠ ${e.followup}</div>
      <button class="btn-icon" onclick="openEPModal('${e.id}')">View</button>
    </div>`;
  }).join('');
}

// ─── MEMBER ANALYTICS ─────────────────────────────
function renderMemberAnalytics() {
  const el = document.getElementById('member-analytics-grid'); if (!el) return;
  if (!members.length) { el.innerHTML='<div class="empty-state"><div class="empty-icon">◈</div><p>No members yet.</p></div>'; return; }
  el.innerHTML = members.map((m,i) => {
    const myEPs     = eps.filter(e=>e.assignedId===m.id);
    const contacted = myEPs.filter(e=>STATUSES.indexOf(e.status)>=1).length;
    const followed  = myEPs.filter(e=>!!e.lastContact).length;
    const converted = myEPs.filter(e=>e.status==='Realized').length;
    const remaining = myEPs.filter(e=>e.status!=='Realized').length;
    const conv      = myEPs.length ? Math.round((converted/myEPs.length)*100) : 0;
    const initials  = m.name.split(' ').map(w=>w[0]).join('').substr(0,2).toUpperCase();
    return `<div class="member-card" style="animation-delay:${i*0.07}s">
      <div class="member-card-header">
        <div class="member-card-avatar">${initials}</div>
        <div style="flex:1;min-width:0">
          <div class="member-card-name">${esc(m.name)}</div>
          <div class="member-card-email">${esc(m.designation||'oGX Member')}</div>
        </div>
        <button class="btn-icon" onclick="openEditMemberModal('${m.id}')" title="Edit member" style="flex-shrink:0">✏</button>
      </div>
      <div class="member-credentials">
        <span>@${esc(m.username)}</span>
        <span class="cred-pw-dot" title="Password stored">••••••••</span>
      </div>
      <div class="member-stat-row"><span class="member-stat-label">Total Assigned</span><span class="member-stat-value highlight">${myEPs.length}</span></div>
      <div class="member-stat-row"><span class="member-stat-label">Contacted</span><span class="member-stat-value">${contacted}</span></div>
      <div class="member-stat-row"><span class="member-stat-label">Followed-up</span><span class="member-stat-value">${followed}</span></div>
      <div class="member-stat-row"><span class="member-stat-label">Approved</span><span class="member-stat-value" style="color:var(--green)">${converted}</span></div>
      <div class="member-stat-row"><span class="member-stat-label">Remaining</span><span class="member-stat-value">${remaining}</span></div>
      <div class="member-conversion-bar">
        <div class="member-conversion-label">Conversion Rate — ${conv}%</div>
        <div class="member-conversion-track"><div class="member-conversion-fill" style="width:${conv}%"></div></div>
      </div>
      <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
        <a class="btn-secondary" style="font-size:12px;padding:6px 12px;text-decoration:none;flex:1;text-align:center" href="${buildMemberEmail(m)}">✉ Email</a>
        <button class="btn-icon danger" onclick="confirmDeleteMember('${m.id}')" title="Remove member" style="flex-shrink:0">✕</button>
      </div>
    </div>`;
  }).join('');
}
function buildMemberEmail(member) {
  const myEPs = eps.filter(e=>e.assignedId===member.id);
  const list  = myEPs.slice(0,5).map(e=>`- ${e.name} | ${e.focusProduct||'—'} | ${e.status}`).join('\n');
  const subject = encodeURIComponent(`oGX Pipeline Update — ${member.name}`);
  const body = encodeURIComponent(`Hi ${member.name},\n\nYour current EP pipeline:\n\n${list}\n\nTotal: ${myEPs.length}\n\nPlease follow up with overdue EPs.\n\nExchangeFlow CRM`);
  return `mailto:${member.email}?subject=${subject}&body=${body}`;
}

// ─── MANAGE MEMBERS MODAL ─────────────────────────
function openMembersModal() {
  renderMembersList();
  document.getElementById('members-modal').classList.remove('hidden');
}
function renderMembersList() {
  const el = document.getElementById('members-list'); if (!el) return;
  if (!members.length) { el.innerHTML='<p style="color:var(--text-muted);font-size:13px;padding:8px 0">No members yet.</p>'; return; }
  el.innerHTML = `
    <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;padding:0 0 8px;border-bottom:1px solid var(--border);margin-bottom:6px">
      Current Members
    </div>
    ${members.map(m => {
      const init = m.name.split(' ').map(w=>w[0]).join('').substr(0,2).toUpperCase();
      return `<div class="member-row">
        <div class="user-avatar" style="width:28px;height:28px;font-size:10px;border-radius:6px">${init}</div>
        <div style="flex:1;min-width:0">
          <div class="m-name">${esc(m.name)}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="m-user">@${esc(m.username)}</span>
            <span class="m-email">${esc(m.designation||'—')}</span>
          </div>
        </div>
        <button class="btn-icon" onclick="openEditMemberModal('${m.id}');closeModal('members-modal')" title="Edit">✏</button>
        <button class="btn-icon danger" onclick="confirmDeleteMember('${m.id}')">✕</button>
      </div>`;
    }).join('')}`;
}
async function addMember() {
  const name        = (document.getElementById('new-member-name')?.value||'').trim();
  const email       = (document.getElementById('new-member-email')?.value||'').trim();
  const username    = (document.getElementById('new-member-username')?.value||'').trim();
  const password    = (document.getElementById('new-member-password')?.value||'').trim();
  const designation = (document.getElementById('new-member-designation')?.value||'').trim();
  const phone       = (document.getElementById('new-member-phone')?.value||'').trim();
  const university  = (document.getElementById('new-member-university')?.value||'').trim();
  const tl          = (document.getElementById('new-member-tl')?.value||'').trim();
  if (!name)     { showToast('Name is required.','error'); return; }
  if (!username) { showToast('Username is required.','error'); return; }
  if (!password) { showToast('Password is required.','error'); return; }
  if (members.find(m=>m.username===username)) { showToast('Username already taken.','error'); return; }
  const m = { id:genId(), name, email, username, password, designation, phone, university, tl, role:'user' };
  try {
    await saveMemberToDB(m);
    members.push(m);
    cacheAll();
    ['new-member-name','new-member-email','new-member-username','new-member-password','new-member-designation','new-member-phone','new-member-university','new-member-tl'].forEach(id => setVal(id,''));
    renderMembersList();
    populateMemberDropdowns();
    renderMemberAnalytics();
    showToast(`Member "${name}" added!`,'success');
  } catch(e) { showToast('Failed to save member: ' + e.message, 'error'); }
}

// ─── EDIT MEMBER MODAL ────────────────────────────
function openEditMemberModal(id) {
  const m = members.find(x=>x.id===id);
  if (!m) return;
  setVal('edit-member-id',          m.id);
  setVal('edit-member-name',        m.name);
  setVal('edit-member-email',       m.email);
  setVal('edit-member-username',    m.username);
  setVal('edit-member-password',    m.password);
  setVal('edit-member-designation', m.designation||'');
  setVal('edit-member-phone',       m.phone||'');
  setVal('edit-member-university',  m.university||'');
  setVal('edit-member-tl',          m.tl||'');
  // Show current credentials clearly
  const cu = document.getElementById('cred-username'); if (cu) cu.textContent = m.username;
  const cp = document.getElementById('cred-password'); if (cp) cp.textContent = m.password;
  document.getElementById('edit-member-modal').classList.remove('hidden');
}
async function saveEditMember() {
  const id          = document.getElementById('edit-member-id')?.value||'';
  const name        = (document.getElementById('edit-member-name')?.value||'').trim();
  const email       = (document.getElementById('edit-member-email')?.value||'').trim();
  const username    = (document.getElementById('edit-member-username')?.value||'').trim();
  const password    = (document.getElementById('edit-member-password')?.value||'').trim();
  const designation = (document.getElementById('edit-member-designation')?.value||'').trim();
  const phone       = (document.getElementById('edit-member-phone')?.value||'').trim();
  const university  = (document.getElementById('edit-member-university')?.value||'').trim();
  const tl          = (document.getElementById('edit-member-tl')?.value||'').trim();
  if (!name || !username || !password) { showToast('Name, username and password are required.','error'); return; }
  // Check username unique (excluding self)
  if (members.find(m=>m.username===username && m.id!==id)) { showToast('Username already taken.','error'); return; }
  const existing = members.find(m=>m.id===id);
  if (!existing) return;
  const updated = { ...existing, name, email, username, password, designation, phone, university, tl };
  try {
    await saveMemberToDB(updated);
    const idx = members.findIndex(m=>m.id===id);
    if (idx>-1) members[idx] = updated;
    cacheAll();
    closeModal('edit-member-modal');
    populateMemberDropdowns();
    renderMemberAnalytics();
    updateSidebarUser();
    showToast(`Member "${name}" updated!`,'success');
  } catch(e) { showToast('Failed to update: ' + e.message,'error'); }
}
function confirmDeleteMember(id) {
  const m = members.find(x=>x.id===id);
  if (!m) return;
  document.getElementById('confirm-text').textContent = `Remove member "${m.name}"? Their EPs will become unassigned.`;
  document.getElementById('confirm-action-btn').onclick = () => deleteMember(id);
  document.getElementById('confirm-modal').classList.remove('hidden');
}
async function deleteMember(id) {
  try {
    await deleteMemberFromDB(id);
    members = members.filter(m=>m.id!==id);
    eps.forEach(e=>{ if(e.assignedId===id) e.assignedId=''; });
    // Update unassigned EPs in DB
    const unassigned = eps.filter(e=>e.assignedId==='');
    for (const ep of unassigned) { try { await saveEPToDB(ep); } catch{} }
    cacheAll();
    closeModal('confirm-modal');
    closeModal('members-modal');
    renderMembersList();
    populateMemberDropdowns();
    renderMemberAnalytics();
    showToast('Member removed.','success');
  } catch(e) { showToast('Failed to delete: '+e.message,'error'); }
}

// ─── EP LIST ──────────────────────────────────────
function renderEPList() {
  const query    = (document.getElementById('search-input')?.value||'').toLowerCase();
  const status   = document.getElementById('filter-status')?.value||'';
  const memberId = isAdmin() ? (document.getElementById('filter-member')?.value||'') : '';
  const product  = document.getElementById('filter-product')?.value||'';
  const country  = document.getElementById('filter-country')?.value||'';

  let filtered = visibleEPs().filter(e => {
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
  if (!filtered.length) { if(tbody)tbody.innerHTML=''; if(empty)empty.classList.remove('hidden'); return; }
  if (empty) empty.classList.add('hidden');
  tbody.innerHTML = filtered.map(e => {
    const m = members.find(x=>x.id===e.assignedId);
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
      <td><div class="row-actions">
        <button class="btn-icon" onclick="openEPModal('${e.id}')" title="View">👁</button>
        <button class="btn-icon" onclick="editEP('${e.id}')" title="Edit">✏</button>
        ${isAdmin()?`<button class="btn-icon danger" onclick="confirmDelete('ep','${e.id}')" title="Delete">✕</button>`:''}
      </div></td>
    </tr>`;
  }).join('');
  document.querySelectorAll('.col-assigned').forEach(c=>c.style.display=isAdmin()?'':'none');
}

// ─── EP FORM ──────────────────────────────────────
function buildEPForm(ep) {
  if (!ep && _pendingEditEP) { ep = _pendingEditEP; _pendingEditEP = null; }
  const isEdit = !!ep;
  document.getElementById('ep-form-title').textContent = isEdit ? 'Edit EP' : 'Add New EP';
  document.getElementById('ep-form-sub').textContent   = isEdit ? `Editing: ${ep.name}` : 'Fill in participant details';
  document.getElementById('ep-id').value = ep?.id || '';
  const badge = document.getElementById('ep-form-role-badge');
  if (badge) { badge.className=`role-badge ${isAdmin()?'admin':'user'}`; badge.textContent=isAdmin()?'⊕ Admin View':'⊙ Member View'; badge.classList.remove('hidden'); }
  const adminSec = document.getElementById('ep-form-admin');
  const userSec  = document.getElementById('ep-form-user');
  if (isAdmin()) {
    adminSec.classList.remove('hidden'); userSec.classList.add('hidden');
    const asel = document.getElementById('ep-assigned');
    if (asel) { asel.innerHTML='<option value="">Unassigned</option>'; members.forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.name;asel.appendChild(o);}); }
    setVal('ep-name',ep?.name||''); setVal('ep-email',ep?.email||''); setVal('ep-phone',ep?.phone||'');
    setVal('ep-university',ep?.university||''); setVal('ep-department',ep?.department||''); setVal('ep-degree',ep?.degree||'');
    setVal('ep-country',ep?.country||''); setVal('ep-focus-product',ep?.focusProduct||''); setVal('ep-project-type',ep?.projectType||'');
    setVal('ep-assigned',ep?.assignedId||''); setVal('ep-status',ep?.status||'New Lead');
    setVal('ep-last-contact',ep?.lastContact||''); setVal('ep-followup',ep?.followup||'');
  } else {
    adminSec.classList.add('hidden'); userSec.classList.remove('hidden');
    setVal('ep-name-u',ep?.name||''); setVal('ep-email-u',ep?.email||''); setVal('ep-phone-u',ep?.phone||'');
    setVal('ep-university-u',ep?.university||''); setVal('ep-country-u',ep?.country||'');
    setVal('ep-status-u',ep?.status||'New Lead');
    setVal('ep-last-contact-u',ep?.lastContact||''); setVal('ep-followup-u',ep?.followup||'');
  }
  setVal('ep-motivation', ep?.motivation||'');
}
function setVal(id, val) { const el=document.getElementById(id); if(el) el.value=(val!==null&&val!==undefined)?val:''; }

function editEP(id) {
  const ep = eps.find(e=>e.id===id);
  if (!ep) return;
  if (!isAdmin() && ep.assignedId !== currentUser.id) { showToast('You can only edit your assigned EPs.','error'); return; }
  closeModal('ep-modal');
  _pendingEditEP = ep;
  prevPage = currentPage;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));
  const el = document.getElementById('page-add-ep');
  const nav = document.querySelector(`.nav-item[data-page="add-ep"]`);
  if (el) el.classList.add('active');
  if (nav) nav.classList.add('active');
  currentPage = 'add-ep';
  closeSidebar();
  const bc = document.getElementById('topbar-breadcrumb'); if(bc) bc.textContent='Edit EP';
  buildEPForm(null);
}

async function saveEP() {
  const id = document.getElementById('ep-id')?.value||'';
  const existing = id ? eps.find(e=>e.id===id) : null;
  let data;
  if (isAdmin()) {
    const name  = (document.getElementById('ep-name')?.value||'').trim();
    const email = (document.getElementById('ep-email')?.value||'').trim();
    if (!name||!email) { showToast('Name and Email are required.','error'); return; }
    data = {
      id:id||genId(), name, email,
      phone:       (document.getElementById('ep-phone')?.value||'').trim(),
      university:  (document.getElementById('ep-university')?.value||'').trim(),
      department:  (document.getElementById('ep-department')?.value||'').trim(),
      degree:      (document.getElementById('ep-degree')?.value||'').trim(),
      country:     document.getElementById('ep-country')?.value||'',
      focusProduct:document.getElementById('ep-focus-product')?.value||'',
      projectType: document.getElementById('ep-project-type')?.value||'',
      assignedId:  document.getElementById('ep-assigned')?.value||'',
      status:      document.getElementById('ep-status')?.value||'New Lead',
      lastContact: document.getElementById('ep-last-contact')?.value||'',
      followup:    document.getElementById('ep-followup')?.value||'',
      motivation:  (document.getElementById('ep-motivation')?.value||'').trim(),
      createdAt:   existing?.createdAt||today(),
    };
  } else {
    if (!existing) { showToast('EP not found.','error'); return; }
    if (existing.assignedId !== currentUser.id) { showToast('Access denied.','error'); return; }
    data = {
      ...existing,
      name:        (document.getElementById('ep-name-u')?.value||'').trim()||existing.name,
      email:       (document.getElementById('ep-email-u')?.value||'').trim()||existing.email,
      phone:       (document.getElementById('ep-phone-u')?.value||'').trim(),
      university:  (document.getElementById('ep-university-u')?.value||'').trim(),
      country:     document.getElementById('ep-country-u')?.value||existing.country,
      status:      document.getElementById('ep-status-u')?.value||existing.status,
      lastContact: document.getElementById('ep-last-contact-u')?.value||'',
      followup:    document.getElementById('ep-followup-u')?.value||'',
      motivation:  (document.getElementById('ep-motivation')?.value||'').trim(),
    };
  }
  try {
    showLoading(true);
    await saveEPToDB(data);
    showLoading(false);
    if (id) { const i=eps.findIndex(e=>e.id===id); if(i>-1) eps[i]=data; }
    else eps.unshift(data);
    cacheAll();
    if (isAdmin() && data.assignedId && data.assignedId !== existing?.assignedId) {
      const m = members.find(x=>x.id===data.assignedId);
      if (m) triggerAssignNotification(m, data);
    }
    populateCountryFilters(); populateMemberDropdowns();
    showToast(id?'EP updated!':'EP added to pipeline!','success');
    navigate('ep-list');
  } catch(e) { showLoading(false); showToast('Save failed: '+e.message,'error'); }
}

function cancelEPForm() { _pendingEditEP=null; navigate((prevPage&&prevPage!=='add-ep')?prevPage:'ep-list'); }

async function deleteEP(id) {
  try {
    showLoading(true);
    await deleteEPFromDB(id);
    showLoading(false);
    eps = eps.filter(e=>e.id!==id);
    cacheAll(); populateCountryFilters();
    closeModal('confirm-modal'); closeModal('ep-modal');
    showToast('EP deleted.','success');
    navigate(currentPage==='funnel'?'funnel':'ep-list');
  } catch(e) { showLoading(false); showToast('Delete failed: '+e.message,'error'); }
}

// ─── DELETE ALL EPs ───────────────────────────────
function deleteAllEPs() {
  if (!isAdmin()) return;
  if (!eps.length) { showToast('No EPs to delete.','warning'); return; }
  document.getElementById('confirm-text').textContent = `Delete ALL ${eps.length} EPs permanently? This cannot be undone.`;
  document.getElementById('confirm-action-btn').onclick = async () => {
    try {
      showLoading(true);
      await deleteAllEPsFromDB();
      showLoading(false);
      eps = [];
      cacheAll(); populateCountryFilters();
      closeModal('confirm-modal');
      renderEPList();
      renderDashboard();
      showToast('All EPs deleted.','success');
    } catch(e) { showLoading(false); showToast('Failed: '+e.message,'error'); }
  };
  document.getElementById('confirm-modal').classList.remove('hidden');
}

// ─── EP DETAIL MODAL ──────────────────────────────
function openEPModal(id) {
  const ep = eps.find(e=>e.id===id);
  if (!ep) return;
  if (!isAdmin() && ep.assignedId !== currentUser.id) { showToast('Access denied.','error'); return; }
  const m = members.find(x=>x.id===ep.assignedId);
  const pc = PRODUCT_CSS[ep.focusProduct]||'';
  document.getElementById('modal-ep-name').textContent = ep.name;
  document.getElementById('modal-ep-body').innerHTML = `
    <div class="ep-detail-grid">
      ${det('Email',esc(ep.email))} ${det('Phone',esc(ep.phone))} ${det('University',esc(ep.university))}
      ${det('Department',esc(ep.department))} ${det('Degree',esc(ep.degree))} ${det('Country',esc(ep.country))}
      ${det('Focus Product',ep.focusProduct?`<span class="product-badge ${pc}">${ep.focusProduct}</span>`:'—')}
      ${det('Project Type',esc(ep.projectType))} ${det('Assigned To',m?esc(m.name):'Unassigned')}
      ${det('Status',`<span class="status-badge ${STATUS_CSS[ep.status]}">${ep.status}</span>`)}
      ${det('Last Contact',ep.lastContact||'—')} ${det('Next Follow-up',`<span class="${dateClass(ep.followup)}">${ep.followup||'—'}</span>`)}
    </div>
    ${ep.motivation?`<div class="ep-detail-notes">${esc(ep.motivation)}</div>`:''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
      <button class="btn-primary" onclick="editEP('${ep.id}')">✏ Edit</button>
      <button class="btn-secondary" onclick="moveStatusForward('${ep.id}')">→ Next Stage</button>
      <button class="btn-secondary" onclick="moveStatusBack('${ep.id}')">← Prev Stage</button>
      ${ep.email?`<a class="btn-secondary" style="text-decoration:none" href="${buildMailto(ep,m)}" target="_blank" >✉ Email EP</a>`:''}
      ${isAdmin()?`<button class="btn-icon danger" onclick="confirmDelete('ep','${ep.id}')">Delete</button>`:''}
    </div>`;
  document.getElementById('ep-modal').classList.remove('hidden');
}
function det(label, val) { return `<div class="ep-detail-row"><label>${label}</label><span>${val||'—'}</span></div>`; }
function buildMailto(ep, member) {
  const to      = encodeURIComponent(member?.email || ep.email || '');
  const subject = encodeURIComponent(`Exchange Update — ${ep.name}`);
  const body    = encodeURIComponent([
    // `Hi ${member?.name || 'Team'},`, '',
    `Hi ${ep.name},`, '',

    'Exchange Participant Details:', '',
    `Name:          ${ep.name}`,
    `Email:         ${ep.email}`,
    `Phone:         ${ep.phone || 'N/A'}`,
    `University:    ${ep.university || 'N/A'}`, '',

    `Your login credentials for the AIESEC platform are as follows:`, '',

    `Website: https://www.aiesec.org`,
    `Password: 1234@Aiesec`, '',

    `Start your global experience today—reach out to AIESEC in Bangladesh to explore available exchange opportunities`, '',
    // `Department:    ${ep.department || 'N/A'}`,
    // `Focus Product: ${ep.focusProduct || 'N/A'}`,
    // `Country:       ${ep.country || 'N/A'}`,
    // `Status:        ${ep.status}`,
    // `Follow-up:     ${ep.followup || 'N/A'}`,
    // '', 'Please contact within 24 hours.', '', 'AIESEC in Bangladesh'
  ].join('\n'));
  return `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`;
}

// ─── STATUS (BIDIRECTIONAL) ───────────────────────
async function moveStatusForward(id) {
  const ep=eps.find(e=>e.id===id); if(!ep) return;
  const idx=STATUSES.indexOf(ep.status);
  if (idx<STATUSES.length-1) { ep.status=STATUSES[idx+1]; await _updateStatus(ep); openEPModal(id); showToast(`Moved to "${ep.status}"`, 'success'); }
  else showToast('Already at final stage.','success');
}
async function moveStatusBack(id) {
  const ep=eps.find(e=>e.id===id); if(!ep) return;
  const idx=STATUSES.indexOf(ep.status);
  if (idx>0) { ep.status=STATUSES[idx-1]; await _updateStatus(ep); openEPModal(id); showToast(`Moved back to "${ep.status}"`, 'success'); }
  else showToast('Already at first stage.','success');
}
async function _updateStatus(ep) {
  try { await saveEPToDB(ep); cacheAll(); if(currentPage==='ep-list') renderEPList(); else if(currentPage==='funnel') renderFunnelBoard(); }
  catch(e) { showToast('Status update failed: '+e.message,'error'); }
}

// ─── FUNNEL BOARD ─────────────────────────────────
function renderFunnelBoard() {
  const board = document.getElementById('funnel-board'); board.innerHTML='';
  const pool = visibleEPs();
  STATUSES.forEach(status => {
    const col = document.createElement('div'); col.className='funnel-col';
    const color=STATUS_COLORS[status]; const stEPs=pool.filter(e=>e.status===status);
    col.innerHTML=`
      <div class="funnel-col-header" style="border-color:${color}">
        <span class="funnel-col-title" style="color:${color}">${status}</span>
        <span class="funnel-col-count" style="color:${color}">${stEPs.length}</span>
      </div>
      <div class="funnel-cards funnel-drop-zone" id="drop-${status.replace(/\s/g,'-')}">
        ${stEPs.map(e=>funnelCard(e)).join('')}
      </div>`;
    board.appendChild(col);
    const zone=col.querySelector('.funnel-drop-zone');
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
    zone.addEventListener('drop',async e=>{
      e.preventDefault(); zone.classList.remove('drag-over');
      if (draggedEPId) {
        const ep=eps.find(x=>x.id===draggedEPId);
        if (ep&&ep.status!==status) { ep.status=status; await _updateStatus(ep); renderFunnelBoard(); showToast(`${ep.name} → "${status}"`, 'success'); }
        draggedEPId=null;
      }
    });
  });
}
function funnelCard(ep) {
  const prod=ep.focusProduct?`<span class="product-badge ${PRODUCT_CSS[ep.focusProduct]||''}" style="display:inline-block;margin-top:5px">${ep.focusProduct}</span>`:'';
  return `<div class="funnel-card" draggable="true" data-id="${ep.id}"
    ondragstart="draggedEPId='${ep.id}';this.classList.add('dragging')"
    ondragend="this.classList.remove('dragging')"
    onclick="openEPModal('${ep.id}')">
    <div class="funnel-card-name">${esc(ep.name)}</div>
    <div class="funnel-card-uni">${esc(ep.university)||'No university'}</div>
    ${ep.country?`<span class="funnel-card-country">🌍 ${esc(ep.country)}</span>`:''}${prod}
  </div>`;
}

// ─── PROJECTS ─────────────────────────────────────
function renderProjects() {
  const query=((document.getElementById('project-search')?.value||'')).toLowerCase();
  const country=document.getElementById('project-filter-country')?.value||'';
  const category=document.getElementById('project-filter-category')?.value||'';
  const allC=[...new Set(projects.map(p=>p.country))].sort();
  const cSel=document.getElementById('project-filter-country');
  if(cSel){const cur=cSel.value;cSel.innerHTML='<option value="">All Countries</option>'+allC.map(c=>`<option${c===cur?' selected':''}>${c}</option>`).join('');}
  const filtered=projects.filter(p=>{
    if(country&&p.country!==country)return false;
    if(category&&p.category!==category)return false;
    if(query&&!`${p.name} ${p.country} ${p.description}`.toLowerCase().includes(query))return false;
    return true;
  });
  const grid=document.getElementById('project-grid');
  if(!filtered.length){grid.innerHTML='<div class="empty-state"><div class="empty-icon">◎</div><p>No projects found.</p></div>';return;}
  grid.innerHTML=filtered.map(p=>{
    const sc=p.status==='Open'?'open':p.status==='Closing Soon'?'closing':'closed';
    const cc=CATEGORY_COLORS[p.category]||'var(--accent)';
    return `<div class="project-card" style="--cat-color:${cc}">
      <div class="project-card-header"><div class="project-card-name">${esc(p.name)}</div><span class="project-status ${sc}">${p.status}</span></div>
      <div class="project-country">🌍 ${esc(p.country)}</div>
      <div class="project-desc">${esc(p.description)}</div>
      <span class="project-category">${p.category}</span>
      ${isAdmin()?`<div class="project-actions"><button class="btn-icon" onclick="openProjectModal('${p.id}')">Edit</button><button class="btn-icon danger" onclick="confirmDelete('project','${p.id}')">Delete</button></div>`:''}
    </div>`;
  }).join('');
}
function openProjectModal(id) {
  document.getElementById('project-modal-title').textContent=id?'Edit Project':'Add Project';
  ['project-id','proj-country','proj-name','proj-desc'].forEach(i=>setVal(i,''));
  setVal('proj-category','Fingerprint');setVal('proj-status','Open');
  if(id){const p=projects.find(x=>x.id===id);if(p){setVal('project-id',p.id);setVal('proj-country',p.country);setVal('proj-name',p.name);setVal('proj-category',p.category);setVal('proj-status',p.status);setVal('proj-desc',p.description);}}
  document.getElementById('project-modal').classList.remove('hidden');
}
async function saveProject() {
  const country=document.getElementById('proj-country').value.trim();
  const name=document.getElementById('proj-name').value.trim();
  if(!country||!name){showToast('Country and Name required.','error');return;}
  const id=document.getElementById('project-id').value;
  const data={id:id||genId(),country,name,category:document.getElementById('proj-category').value,status:document.getElementById('proj-status').value,description:document.getElementById('proj-desc').value.trim()};
  try{await saveProjectToDB(data);if(id){const i=projects.findIndex(p=>p.id===id);if(i>-1)projects[i]=data;}else projects.push(data);cacheAll();closeModal('project-modal');renderProjects();showToast('Project saved!','success');}
  catch(e){showToast('Save failed: '+e.message,'error');}
}
async function deleteProject(id) {
  try{await deleteProjectFromDB(id);projects=projects.filter(p=>p.id!==id);cacheAll();closeModal('confirm-modal');renderProjects();showToast('Project deleted.','success');}
  catch(e){showToast('Delete failed: '+e.message,'error');}
}

// ─── FOLLOW-UPS ───────────────────────────────────
function renderFollowups() {
  const pool=visibleEPs();const today=new Date();today.setHours(0,0,0,0);
  const over=pool.filter(e=>e.followup&&isOverdue(e.followup)).sort((a,b)=>a.followup.localeCompare(b.followup));
  const tod=pool.filter(e=>e.followup&&isToday(e.followup));
  const upc=pool.filter(e=>{if(!e.followup)return false;const d=new Date(e.followup);return d>today&&!isToday(e.followup);}).sort((a,b)=>a.followup.localeCompare(b.followup)).slice(0,15);
  document.getElementById('followup-sections').innerHTML=[followupSection('overdue','⚠ Overdue',over),followupSection('today','📅 Due Today',tod),followupSection('upcoming','📋 Upcoming',upc)].join('');
}
function followupSection(type,title,list) {
  if(!list.length&&type!=='upcoming')return`<div><div class="followup-section-title ${type}">${title}</div><p style="color:var(--text-muted);font-size:13px;padding:4px">✓ All clear!</p></div>`;
  if(!list.length)return'';
  return`<div><div class="followup-section-title ${type}">${title} <span style="font-size:11px;opacity:0.6">(${list.length})</span></div>
    ${list.map(e=>{const m=members.find(x=>x.id===e.assignedId);return`<div class="followup-card ${type}" onclick="openEPModal('${e.id}')">
      <div class="followup-info"><div class="followup-name">${esc(e.name)}</div><div class="followup-meta">${esc(e.university)||'—'} · ${m?esc(m.name):'Unassigned'} · <span class="status-badge ${STATUS_CSS[e.status]}" style="font-size:10px;padding:1px 6px">${e.status}</span></div></div>
      <div class="followup-date ${type}">${e.followup}</div>
      <button class="btn-icon" onclick="event.stopPropagation();editEP('${e.id}')">Update</button>
    </div>`;}).join('')}
  </div>`;
}

// ─── NOTIFICATIONS ────────────────────────────────
function triggerAssignNotification(member, ep) {
  if (member.email) {
    window.open(buildMailto(ep, member), '_blank');
  }
  showToast(`📧 ${member.name} assigned to ${ep.name}`, 'success');
}

// ─── EP SIGNUP ────────────────────────────────────
async function handleSignup() {
  const name=(document.getElementById('signup-name')?.value||'').trim();
  const email=(document.getElementById('signup-email')?.value||'').trim();
  const mot=(document.getElementById('signup-motivation')?.value||'').trim();
  const fp=document.getElementById('signup-focus-product')?.value||'';
  if(!name||!email||!mot){showToast('Please fill in required fields.','error');return;}
  if(!fp){showToast('Please select a Focus Product.','error');return;}
  const ep={
    id:genId(),name,email,
    phone:(document.getElementById('signup-phone')?.value||'').trim(),
    university:(document.getElementById('signup-university')?.value||'').trim(),
    department:(document.getElementById('signup-department')?.value||'').trim(),
    degree:(document.getElementById('signup-degree')?.value||'').trim(),
    country:document.getElementById('signup-country')?.value||'',
    focusProduct:fp,
    projectType:document.getElementById('signup-project-type')?.value||'',
    motivation:mot,status:'New Lead',assignedId:'',lastContact:'',followup:'',createdAt:today(),
  };
  try {
    await saveEPToDB(ep);
    eps.unshift(ep); cacheAll();
    document.getElementById('signup-success').classList.remove('hidden');
    ['signup-name','signup-email','signup-phone','signup-university','signup-department','signup-degree','signup-motivation'].forEach(id=>setVal(id,''));
    setVal('signup-country','');setVal('signup-focus-product','');setVal('signup-project-type','');
  } catch(e) { showToast('Submission failed. Please try again.','error'); }
}

// ─── CSV EXPORT ───────────────────────────────────
function exportCSV() {
  const headers=['Name','Email','Phone','University','Department','Degree','Country','Focus Product','Project Type','Status','Assigned To','Last Contact','Next Follow-up','Created At'];
  const rows=eps.map(e=>{
    const m=members.find(x=>x.id===e.assignedId);
    return[e.name,e.email,e.phone||'',e.university||'',e.department||'',e.degree||'',e.country||'',e.focusProduct||'',e.projectType||'',e.status,m?m.name:'',e.lastContact||'',e.followup||'',e.createdAt||''].map(csvEsc).join(',');
  });
  const csv=[headers.map(csvEsc).join(','),...rows].join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`exchangeflow-eps-${today()}.csv`;a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${eps.length} EPs`,'success');
}
function csvEsc(val){const s=String(val||'');return/[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}

// ─── CSV IMPORT ───────────────────────────────────
async function importCSV(event) {
  const file=event.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=async e=>{
    const lines=e.target.result.split(/\r?\n/).filter(l=>l.trim());
    if(lines.length<2){showToast('CSV file is empty.','error');return;}
    const headerRow=parseCSVRow(lines[0]).map(h=>h.trim().toLowerCase().replace(/[^a-z ]/g,''));
    const get=(cols,aliases)=>{const idx=headerRow.findIndex(c=>aliases.includes(c));return idx>-1?(cols[idx]||'').trim().replace(/^"|"$/g,''):''};
    let added=0,dupes=0,errors=0;const resultItems=[];const toInsert=[];
    for(let i=1;i<lines.length;i++){
      const cols=parseCSVRow(lines[i]);
      const rawName=get(cols,['name','full name']);
      const rawEmail=get(cols,['email','email address']);
      if(!rawName&&!rawEmail)continue;
      const cleanEmail=rawEmail.toLowerCase();
      const cleanName=rawName.trim();
      if(eps.find(e=>e.email.toLowerCase()===cleanEmail)){dupes++;resultItems.push({type:'warning',msg:`Duplicate: ${cleanEmail}`});continue;}
      if(!cleanEmail.includes('@')){errors++;resultItems.push({type:'error',msg:`Invalid email: ${cleanEmail}`});continue;}
      const rawStatus=get(cols,['status']);
      const rawProduct=get(cols,['focus product','product','focus']);
      const rawAssigned=get(cols,['assigned to','assigned','member']);
      const matchedMember=rawAssigned?members.find(m=>m.name.toLowerCase().includes(rawAssigned.toLowerCase())):null;
      const ep={
        id:genId(),name:cleanName,email:cleanEmail,
        phone:get(cols,['phone','phone number','mobile']),
        university:get(cols,['university','school','college']),
        department:get(cols,['department','dept','faculty']),
        focusProduct:['oGV','oGTa','oGTe'].includes(rawProduct)?rawProduct:'',
        status:STATUSES.includes(rawStatus)?rawStatus:'New Lead',
        assignedId:matchedMember?.id||'',
        degree:'',country:'',projectType:'',motivation:'',lastContact:'',followup:'',createdAt:today(),
      };
      toInsert.push(ep);added++;resultItems.push({type:'success',msg:`Added: ${cleanName||cleanEmail}`});
    }
    // Batch insert to Supabase
    if(toInsert.length){
      try{
        showLoading(true);
        for(const ep of toInsert){await saveEPToDB(ep);eps.unshift(ep);}
        showLoading(false);cacheAll();populateCountryFilters();
      }catch(e){showLoading(false);showToast('Import partially failed: '+e.message,'error');}
    }
    const body=document.getElementById('csv-result-body');
    body.innerHTML=`<div style="display:flex;gap:24px;margin-bottom:16px;flex-wrap:wrap">
      <div style="text-align:center"><div style="font-size:28px;font-family:'Syne',sans-serif;font-weight:700;color:var(--green)">${added}</div><div style="font-size:11px;color:var(--text-muted)">Added</div></div>
      <div style="text-align:center"><div style="font-size:28px;font-family:'Syne',sans-serif;font-weight:700;color:var(--yellow)">${dupes}</div><div style="font-size:11px;color:var(--text-muted)">Duplicates</div></div>
      <div style="text-align:center"><div style="font-size:28px;font-family:'Syne',sans-serif;font-weight:700;color:var(--red)">${errors}</div><div style="font-size:11px;color:var(--text-muted)">Errors</div></div>
    </div>
    <div style="max-height:200px;overflow-y:auto">${resultItems.slice(0,25).map(r=>`<div class="csv-result-item ${r.type}">${r.type==='success'?'✓':r.type==='warning'?'⚠':'✕'} ${esc(r.msg)}</div>`).join('')}${resultItems.length>25?`<div style="font-size:12px;color:var(--text-muted);padding:6px">…and ${resultItems.length-25} more</div>`:''}</div>`;
    document.getElementById('csv-result-modal').classList.remove('hidden');
    if(currentPage==='ep-list')renderEPList();
  };
  reader.readAsText(file);
  event.target.value='';
}
function parseCSVRow(row){const result=[];let cur='',inQ=false;for(let i=0;i<row.length;i++){if(row[i]==='"'){inQ=!inQ;}else if(row[i]===','&&!inQ){result.push(cur);cur='';}else cur+=row[i];}result.push(cur);return result;}

// ─── JSON EXPORT / IMPORT ─────────────────────────
function exportData(){
  const data={eps,projects,members,exportedAt:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=`exchangeflow-backup-${today()}.json`;a.click();URL.revokeObjectURL(url);
  showToast('JSON exported!','success');
}
function importDataClick(){document.getElementById('import-json-file')?.click();}
async function importData(event){
  const file=event.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      const data=JSON.parse(e.target.result);
      showLoading(true);
      if(data.eps)for(const ep of data.eps){try{await saveEPToDB(ep);}catch{}}
      if(data.projects)for(const p of data.projects){try{await saveProjectToDB(p);}catch{}}
      if(data.members)for(const m of data.members){try{await saveMemberToDB(m);}catch{}}
      await load();showLoading(false);
      populateMemberDropdowns();populateCountryFilters();renderDashboard();
      showToast('Data imported!','success');
    }catch(e){showLoading(false);showToast('Invalid JSON file.','error');}
  };
  reader.readAsText(file);event.target.value='';
}

// ─── CONFIRM DELETE ───────────────────────────────
function confirmDelete(type,id){
  const item=type==='ep'?eps.find(e=>e.id===id):projects.find(p=>p.id===id);if(!item)return;
  document.getElementById('confirm-text').textContent=`Delete "${item.name}"? This cannot be undone.`;
  document.getElementById('confirm-action-btn').onclick=()=>type==='ep'?deleteEP(id):deleteProject(id);
  document.getElementById('confirm-modal').classList.remove('hidden');
}

// ─── FOLLOW-UP REMINDERS ──────────────────────────
function checkFollowupReminders(){
  const pool=visibleEPs();
  const ov=pool.filter(e=>e.followup&&isOverdue(e.followup));
  const tod=pool.filter(e=>e.followup&&isToday(e.followup));
  if(ov.length)showToast(`⚠ ${ov.length} overdue follow-up(s)!`,'warning');
  else if(tod.length)showToast(`📅 ${tod.length} follow-up(s) due today`,'success');
}

// ─── MODAL HELPERS ────────────────────────────────
function closeModal(id){document.getElementById(id)?.classList.add('hidden');}

// ─── TOAST ────────────────────────────────────────
let _toastTimer;
function showToast(msg,type='success'){
  const el=document.getElementById('toast');
  const icons={success:'✓',error:'✕',warning:'⚠'};
  el.innerHTML=`<span>${icons[type]||'•'}</span><span>${esc(msg)}</span>`;
  el.className=`toast ${type}`;el.classList.remove('hidden');
  clearTimeout(_toastTimer);_toastTimer=setTimeout(()=>el.classList.add('hidden'),3800);
}

// ─── DATE HELPERS ─────────────────────────────────
function dateClass(d){if(!d)return'date-normal';const t=new Date();t.setHours(0,0,0,0);const dt=new Date(d);if(dt<t)return'date-overdue';if(dt.toDateString()===t.toDateString())return'date-today';return'date-normal';}
function isOverdue(d){if(!d)return false;const t=new Date();t.setHours(0,0,0,0);return new Date(d)<t;}
function isToday(d){return d&&new Date(d).toDateString()===new Date().toDateString();}

// ─── CSV IMPORT MEMBERS ───────────────────────────
async function importMembersCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { showToast('CSV file is empty.', 'error'); return; }

    const headerRow = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase().replace(/[^a-z ]/g, ''));
    const get = (cols, aliases) => {
      const idx = headerRow.findIndex(c => aliases.includes(c));
      return idx > -1 ? (cols[idx] || '').trim().replace(/^"|"$/g, '') : '';
    };

    let added = 0, dupes = 0, errors = 0;
    const resultItems = [];
    const toInsert = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      const name     = get(cols, ['name', 'full name']);
      const username = get(cols, ['username', 'user', 'user name']);
      const password = get(cols, ['password', 'pass']);
      const email    = get(cols, ['email', 'email address']);

      if (!name && !username) continue;

      if (!username) {
        errors++;
        resultItems.push({ type: 'error', msg: `Missing username: ${name}` });
        continue;
      }
      if (!password) {
        errors++;
        resultItems.push({ type: 'error', msg: `Missing password: ${name}` });
        continue;
      }
      if (members.find(m => m.username === username)) {
        dupes++;
        resultItems.push({ type: 'warning', msg: `Duplicate username: ${username}` });
        continue;
      }

      const m = {
        id:          genId(),
        name:        name || username,
        email:       email || '',
        username,
        password,
        designation: get(cols, ['designation', 'role', 'title', 'position']),
        phone:       get(cols, ['phone', 'phone number', 'mobile']),
        university:  get(cols, ['university', 'school', 'college']),
        tl:          get(cols, ['tl', 'vp', 'tl vp', 'team lead', 'supervisor']),
        role:        'user',
      };

      toInsert.push(m);
      added++;
      resultItems.push({ type: 'success', msg: `Added: ${name} (@${username})` });
    }

    if (toInsert.length) {
      try {
        showLoading(true);
        for (const m of toInsert) {
          await saveMemberToDB(m);
          members.push(m);
        }
        showLoading(false);
        cacheAll();
        populateMemberDropdowns();
        renderMemberAnalytics();
        renderMembersList();
      } catch (err) {
        showLoading(false);
        showToast('Import partially failed: ' + err.message, 'error');
      }
    }

    // Show result modal
    const body = document.getElementById('csv-result-body');
    body.innerHTML = `
      <div style="display:flex;gap:24px;margin-bottom:16px;flex-wrap:wrap">
        <div style="text-align:center"><div style="font-size:28px;font-family:'Syne',sans-serif;font-weight:700;color:var(--green)">${added}</div><div style="font-size:11px;color:var(--text-muted)">Added</div></div>
        <div style="text-align:center"><div style="font-size:28px;font-family:'Syne',sans-serif;font-weight:700;color:var(--yellow)">${dupes}</div><div style="font-size:11px;color:var(--text-muted)">Duplicates</div></div>
        <div style="text-align:center"><div style="font-size:28px;font-family:'Syne',sans-serif;font-weight:700;color:var(--red)">${errors}</div><div style="font-size:11px;color:var(--text-muted)">Errors</div></div>
      </div>
      <div style="max-height:200px;overflow-y:auto">
        ${resultItems.slice(0, 25).map(r => `<div class="csv-result-item ${r.type}">${r.type === 'success' ? '✓' : r.type === 'warning' ? '⚠' : '✕'} ${esc(r.msg)}</div>`).join('')}
        ${resultItems.length > 25 ? `<div style="font-size:12px;color:var(--text-muted);padding:6px">…and ${resultItems.length - 25} more</div>` : ''}
      </div>`;
    document.getElementById('csv-result-modal').classList.remove('hidden');
  };
  reader.readAsText(file);
  event.target.value = '';
}
// ─── INIT ─────────────────────────────────────────
(function init(){
  initTheme();
  // Check cookie first (remember me), then sessionStorage
  const cookieUser = getCookie('ef_user');
  const sessionUser = sessionStorage.getItem('ef_user');
  const savedUser = cookieUser || sessionUser;
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      // Re-sync session from cookie
      if (cookieUser) sessionStorage.setItem('ef_user', cookieUser);
      showApp();
      return;
    } catch { deleteCookie('ef_user'); sessionStorage.removeItem('ef_user'); }
  }
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('signup-screen').classList.add('hidden');
})();


