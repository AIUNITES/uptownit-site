/**
 * AIUNITES SSO — Shared Single Sign-On for the AIUNITES Network
 * Drop this script into any AIUNITES site. Because all sites live on
 * aiunites.github.io, they share localStorage automatically.
 *
 * Features:
 *   - Auth bar below the webring bar with sign-in / profile controls
 *   - Slide-in login panel (no modal overlay)
 *   - Slide-in account panel with editable profile, sites visited
 *   - Cross-site "Signing you in…" toast on arrival
 *   - Logout everywhere with one click
 */

(function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────── */
  const SSO_KEY      = 'aiunites_sso_user';
  const VISIT_KEY    = 'aiunites_sso_last_login_site';
  const SITES_KEY    = 'aiunites_sso_sites_visited';
  const CURRENT_SITE = document.title.split(' - ')[0].split(' | ')[0].trim();

  /* ── helpers ───────────────────────────────────────────────── */
  function getUser () {
    try { return JSON.parse(localStorage.getItem(SSO_KEY)); }
    catch { return null; }
  }
  function setUser (u) { localStorage.setItem(SSO_KEY, JSON.stringify(u)); }
  function clearUser () {
    localStorage.removeItem(SSO_KEY);
    localStorage.removeItem(VISIT_KEY);
    localStorage.removeItem(SITES_KEY);
  }
  function trackSiteVisit () {
    try {
      const visited = JSON.parse(localStorage.getItem(SITES_KEY) || '[]');
      if (!visited.includes(CURRENT_SITE)) visited.push(CURRENT_SITE);
      localStorage.setItem(SITES_KEY, JSON.stringify(visited));
      return visited;
    } catch { return [CURRENT_SITE]; }
  }
  function getVisitedSites () {
    try { return JSON.parse(localStorage.getItem(SITES_KEY) || '[]'); }
    catch { return []; }
  }
  function formatDate (ts) {
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /* ── inject CSS ────────────────────────────────────────────── */
  const css = document.createElement('style');
  css.textContent = `
/* ---- SSO Auth Bar ---- */
.aiunites-auth-bar{position:fixed;top:36px;left:0;right:0;z-index:9999;
  background:linear-gradient(90deg,#0d1117,#161b22);border-bottom:1px solid rgba(99,102,241,.18);
  padding:6px 0;font-size:12px;font-family:'Inter',system-ui,sans-serif}
.aiunites-auth-inner{max-width:1400px;margin:0 auto;padding:0 20px;
  display:flex;align-items:center;justify-content:space-between}
.aiunites-auth-left{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.55)}
.aiunites-auth-left svg{width:14px;height:14px;opacity:.5}
.aiunites-auth-right{display:flex;align-items:center;gap:8px}

.sso-btn{background:rgba(99,102,241,.15);color:#a5b4fc;border:1px solid rgba(99,102,241,.3);
  border-radius:6px;padding:4px 12px;font-size:11px;cursor:pointer;transition:all .2s;font-family:inherit}
.sso-btn:hover{background:rgba(99,102,241,.3);color:#c7d2fe}
.sso-btn-primary{background:rgba(99,102,241,.8);color:#fff;border-color:transparent}
.sso-btn-primary:hover{background:#6366f1}

.sso-user-badge{display:flex;align-items:center;gap:6px;color:#a5b4fc;font-size:11px;font-weight:500;
  cursor:pointer;padding:3px 8px;border-radius:6px;transition:background .2s;user-select:none}
.sso-user-badge:hover{background:rgba(99,102,241,.2)}
.sso-avatar{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);
  display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0}

/* ---- SSO Toast ---- */
.sso-toast{position:fixed;top:80px;left:50%;transform:translateX(-50%) translateY(-10px);
  background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:10px 24px;
  border-radius:10px;font-size:13px;font-weight:500;z-index:99999;opacity:0;
  transition:all .35s ease;pointer-events:none;box-shadow:0 8px 32px rgba(99,102,241,.4);
  font-family:'Inter',system-ui,sans-serif;white-space:nowrap}
.sso-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* ---- Shared slide panel ---- */
.sso-panel{position:fixed;top:0;right:0;width:300px;max-width:92vw;height:100vh;
  background:#0d1117;border-left:1px solid rgba(99,102,241,.22);z-index:99998;
  display:flex;flex-direction:column;transform:translateX(100%);
  transition:transform .32s cubic-bezier(.4,0,.2,1);
  font-family:'Inter',system-ui,sans-serif;overflow:hidden}
.sso-panel.open{transform:translateX(0)}

.sso-panel-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:99997;
  opacity:0;pointer-events:none;transition:opacity .32s}
.sso-panel-backdrop.open{opacity:1;pointer-events:auto}

.sso-panel-header{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.07);
  display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.sso-panel-header h3{color:#fff;font-size:13px;font-weight:600;margin:0;letter-spacing:.01em}
.sso-panel-close{background:none;border:none;color:rgba(255,255,255,.35);font-size:20px;
  cursor:pointer;line-height:1;padding:0;transition:color .2s;font-family:inherit}
.sso-panel-close:hover{color:#fff}

.sso-panel-body{flex:1;overflow-y:auto;padding:22px 20px;scrollbar-width:thin;
  scrollbar-color:rgba(99,102,241,.3) transparent}

/* ---- Login panel ---- */
.sso-login-logo{text-align:center;margin-bottom:22px}
.sso-login-logo-mark{width:52px;height:52px;border-radius:14px;
  background:linear-gradient(135deg,#6366f1,#a855f7);
  display:flex;align-items:center;justify-content:center;margin:0 auto 12px;
  font-size:22px;font-weight:700;color:#fff}
.sso-login-title{color:#fff;font-size:17px;font-weight:700;margin-bottom:4px}
.sso-login-sub{color:rgba(255,255,255,.4);font-size:12px}

.sso-login-network{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:20px}
.sso-login-network span{background:rgba(99,102,241,.1);color:rgba(255,255,255,.45);
  border:1px solid rgba(99,102,241,.18);border-radius:5px;padding:2px 7px;font-size:10px}

.sso-field{margin-bottom:12px}
.sso-field label{display:block;color:rgba(255,255,255,.45);font-size:10px;font-weight:600;
  text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}
.sso-field input{width:100%;padding:10px 12px;background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:14px;
  outline:none;transition:border-color .2s;box-sizing:border-box;font-family:inherit}
.sso-field input:focus{border-color:#6366f1;background:rgba(99,102,241,.08)}
.sso-field input::placeholder{color:rgba(255,255,255,.2)}

.sso-submit{width:100%;padding:11px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
  color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;
  transition:opacity .2s;font-family:inherit;margin-top:4px}
.sso-submit:hover{opacity:.88}

.sso-login-note{color:rgba(255,255,255,.25);font-size:11px;text-align:center;margin-top:14px;line-height:1.5}

/* ---- Account panel ---- */
.sso-acct-avatar-section{text-align:center;padding:4px 0 24px}
.sso-acct-avatar-lg{width:68px;height:68px;border-radius:50%;
  background:linear-gradient(135deg,#6366f1,#a855f7);
  display:flex;align-items:center;justify-content:center;
  color:#fff;font-size:24px;font-weight:700;margin:0 auto 12px}
.sso-acct-name{color:#fff;font-size:17px;font-weight:600;margin-bottom:3px}
.sso-acct-email{color:rgba(255,255,255,.4);font-size:12px}
.sso-acct-since{color:rgba(255,255,255,.25);font-size:11px;margin-top:5px}

.sso-section{margin-bottom:22px}
.sso-section-label{color:rgba(255,255,255,.3);font-size:10px;font-weight:600;
  text-transform:uppercase;letter-spacing:.08em;margin-bottom:9px}

.sso-edit-field{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  border-radius:9px;padding:11px 13px;margin-bottom:7px}
.sso-edit-field label{display:block;color:rgba(255,255,255,.35);font-size:10px;
  font-weight:500;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em}
.sso-edit-field input{background:none;border:none;outline:none;color:#fff;
  font-size:13px;width:100%;font-family:inherit}
.sso-edit-field input:focus{color:#c7d2fe}
.sso-edit-field input::placeholder{color:rgba(255,255,255,.18)}

.sso-save-btn{width:100%;padding:9px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
  color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;
  transition:opacity .2s;font-family:inherit;margin-top:3px}
.sso-save-btn:hover{opacity:.85}
.sso-saved-msg{color:#10b981;font-size:11px;text-align:center;margin-top:5px;min-height:14px}

.sso-sites{display:flex;flex-wrap:wrap;gap:5px}
.sso-site-tag{background:rgba(99,102,241,.1);color:#a5b4fc;
  border:1px solid rgba(99,102,241,.18);border-radius:5px;padding:3px 8px;font-size:11px}
.sso-site-tag.current{background:rgba(99,102,241,.22);border-color:rgba(99,102,241,.45);
  font-weight:600}

.sso-net-status{display:flex;align-items:center;gap:8px;
  background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.18);
  border-radius:8px;padding:10px 12px}
.sso-net-dot{width:7px;height:7px;border-radius:50%;background:#10b981;
  box-shadow:0 0 5px #10b981;flex-shrink:0}
.sso-net-text{color:rgba(255,255,255,.55);font-size:12px}

.sso-panel-footer{padding:14px 20px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0}
.sso-signout-btn{width:100%;padding:9px;background:rgba(239,68,68,.08);
  color:#f87171;border:1px solid rgba(239,68,68,.22);border-radius:8px;
  font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
.sso-signout-btn:hover{background:rgba(239,68,68,.18);border-color:rgba(239,68,68,.45)}

/* body offset */
body{padding-top:68px!important}
.nav{top:68px!important}
  `;
  document.body.appendChild(css);

  /* ── auth bar ──────────────────────────────────────────────── */
  const bar = document.createElement('div');
  bar.className = 'aiunites-auth-bar';
  bar.innerHTML = `<div class="aiunites-auth-inner">
    <div class="aiunites-auth-left">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
      <span class="sso-status">AIUNITES Single Sign-On</span>
    </div>
    <div class="aiunites-auth-right"></div>
  </div>`;
  document.body.prepend(bar);

  const rightSlot = bar.querySelector('.aiunites-auth-right');
  const statusEl  = bar.querySelector('.sso-status');

  /* ── toast ─────────────────────────────────────────────────── */
  const toast = document.createElement('div');
  toast.className = 'sso-toast';
  document.body.appendChild(toast);

  function showToast (msg, duration) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration || 2500);
  }

  /* ── shared panel shell ─────────────────────────────────────── */
  const backdrop = document.createElement('div');
  backdrop.className = 'sso-panel-backdrop';
  document.body.appendChild(backdrop);

  const panel = document.createElement('div');
  panel.className = 'sso-panel';
  document.body.appendChild(panel);

  function openPanel (html, onMount) {
    panel.innerHTML = `
      <div class="sso-panel-header">
        <h3>${html.title}</h3>
        <button class="sso-panel-close">&times;</button>
      </div>
      <div class="sso-panel-body">${html.body}</div>
      ${html.footer ? `<div class="sso-panel-footer">${html.footer}</div>` : ''}`;
    panel.querySelector('.sso-panel-close').addEventListener('click', closePanel);
    backdrop.classList.add('open');
    panel.classList.add('open');
    if (onMount) onMount(panel);
  }

  function closePanel () {
    backdrop.classList.remove('open');
    panel.classList.remove('open');
  }

  backdrop.addEventListener('click', closePanel);

  /* ── login panel ────────────────────────────────────────────── */
  function openLoginPanel () {
    openPanel({
      title: 'Sign in to AIUNITES',
      body: `
        <div class="sso-login-logo">
          <div class="sso-login-logo-mark">◆</div>
          <div class="sso-login-title">One account, every site</div>
          <div class="sso-login-sub">Sign in once, stay signed in across the network</div>
        </div>
        <div class="sso-login-network">
          <span>BizStry</span><span>AI YHWH</span><span>UptownIT</span><span>+ 14 more</span>
        </div>
        <div class="sso-field">
          <label>Display Name</label>
          <input type="text" id="sso-name-input" placeholder="e.g. Tom" autocomplete="name">
        </div>
        <div class="sso-field">
          <label>Email</label>
          <input type="email" id="sso-email-input" placeholder="you@example.com" autocomplete="email">
        </div>
        <button class="sso-submit" id="sso-submit-btn">Sign In →</button>
        <p class="sso-login-note">No password needed. Your info is stored locally<br>and shared across AIUNITES sites.</p>`
    }, (p) => {
      p.querySelector('#sso-submit-btn').addEventListener('click', function () {
        const name  = p.querySelector('#sso-name-input').value.trim();
        const email = p.querySelector('#sso-email-input').value.trim();
        if (!name || !email) {
          showToast('Please enter your name and email.');
          return;
        }
        const user = {
          name, email,
          initials: name.slice(0, 2).toUpperCase(),
          loginSite: CURRENT_SITE,
          loginTime: Date.now()
        };
        setUser(user);
        localStorage.setItem(VISIT_KEY, CURRENT_SITE);
        trackSiteVisit();
        closePanel();
        renderLoggedIn(user);
        showToast('Welcome! You\'re signed in across the AIUNITES network.');
      });
      // Allow Enter key
      p.querySelector('#sso-email-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') p.querySelector('#sso-submit-btn').click();
      });
    });
  }

  /* ── account panel ──────────────────────────────────────────── */
  function openAccountPanel (user) {
    const visited  = getVisitedSites();
    const siteTags = (visited.length ? visited : [CURRENT_SITE])
      .map(s => `<span class="sso-site-tag${s === CURRENT_SITE ? ' current' : ''}">${s}</span>`)
      .join('');

    openPanel({
      title: 'My Account',
      body: `
        <div class="sso-acct-avatar-section">
          <div class="sso-acct-avatar-lg" id="sso-avatar-lg">${user.initials}</div>
          <div class="sso-acct-name" id="sso-acct-name">${user.name}</div>
          <div class="sso-acct-email" id="sso-acct-email">${user.email}</div>
          <div class="sso-acct-since">Member since ${formatDate(user.loginTime)}</div>
        </div>

        <div class="sso-section">
          <div class="sso-section-label">Edit Profile</div>
          <div class="sso-edit-field">
            <label>Display Name</label>
            <input type="text" id="sso-edit-name" value="${user.name}" placeholder="Your name">
          </div>
          <div class="sso-edit-field">
            <label>Email</label>
            <input type="email" id="sso-edit-email" value="${user.email}" placeholder="your@email.com">
          </div>
          <button class="sso-save-btn" id="sso-save-btn">Save Changes</button>
          <div class="sso-saved-msg" id="sso-saved-msg"></div>
        </div>

        <div class="sso-section">
          <div class="sso-section-label">Sites Visited</div>
          <div class="sso-sites">${siteTags}</div>
        </div>

        <div class="sso-section">
          <div class="sso-section-label">Network Status</div>
          <div class="sso-net-status">
            <div class="sso-net-dot"></div>
            <span class="sso-net-text">Active across AIUNITES network</span>
          </div>
        </div>`,
      footer: `<button class="sso-signout-btn" id="sso-signout-btn">Sign Out of All Sites</button>`
    }, (p) => {
      p.querySelector('#sso-save-btn').addEventListener('click', function () {
        const newName  = p.querySelector('#sso-edit-name').value.trim();
        const newEmail = p.querySelector('#sso-edit-email').value.trim();
        if (!newName || !newEmail) return;
        const updated = { ...user, name: newName, email: newEmail, initials: newName.slice(0, 2).toUpperCase() };
        setUser(updated);
        p.querySelector('#sso-avatar-lg').textContent  = updated.initials;
        p.querySelector('#sso-acct-name').textContent  = updated.name;
        p.querySelector('#sso-acct-email').textContent = updated.email;
        renderLoggedIn(updated);
        const msg = p.querySelector('#sso-saved-msg');
        msg.textContent = '✓ Saved!';
        setTimeout(() => { msg.textContent = ''; }, 2000);
        user.name  = updated.name;
        user.email = updated.email;
        user.initials = updated.initials;
      });

      p.querySelector('#sso-signout-btn').addEventListener('click', function () {
        clearUser();
        closePanel();
        renderLoggedOut();
        showToast('Signed out from all AIUNITES sites');
      });
    });
  }

  /* ── render states ──────────────────────────────────────────── */
  function renderLoggedOut () {
    statusEl.textContent = 'AIUNITES Single Sign-On';
    rightSlot.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'sso-btn sso-btn-primary';
    btn.textContent = 'Sign In';
    btn.addEventListener('click', openLoginPanel);
    rightSlot.appendChild(btn);
  }

  function renderLoggedIn (user) {
    statusEl.textContent = 'Signed in · AIUNITES network';
    rightSlot.innerHTML = '';

    const badge = document.createElement('span');
    badge.className = 'sso-user-badge';
    badge.title = 'Open account panel';
    badge.innerHTML = `<span class="sso-avatar">${user.initials}</span>${user.name} ▾`;
    badge.addEventListener('click', () => openAccountPanel(user));
    rightSlot.appendChild(badge);

    const out = document.createElement('button');
    out.className = 'sso-btn';
    out.textContent = 'Sign Out';
    out.addEventListener('click', () => {
      clearUser();
      renderLoggedOut();
      showToast('Signed out from all AIUNITES sites');
    });
    rightSlot.appendChild(out);
  }

  /* ── init ───────────────────────────────────────────────────── */
  const user = getUser();
  if (user) {
    const lastSite = localStorage.getItem(VISIT_KEY);
    if (lastSite && lastSite !== CURRENT_SITE) {
      showToast('✓ Signed in via AIUNITES SSO — welcome to ' + CURRENT_SITE + '!', 3000);
    }
    localStorage.setItem(VISIT_KEY, CURRENT_SITE);
    trackSiteVisit();
    renderLoggedIn(user);
  } else {
    renderLoggedOut();
  }

})();
