/**
 * AIUNITES SSO — Shared Single Sign-On for the AIUNITES Network
 * Drop this script into any AIUNITES site. Because all sites live on
 * aiunites.github.io, they share localStorage automatically.
 *
 * Features:
 *   - Auth bar below the webring bar with sign-in / profile controls
 *   - Lightweight modal login (name + email, demo-grade)
 *   - Cross-site "Signing you in…" animation on arrival
 *   - Logout everywhere with one click
 */

(function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────── */
  const SSO_KEY   = 'aiunites_sso_user';
  const VISIT_KEY = 'aiunites_sso_last_login_site';
  const CURRENT_SITE = document.title.split(' - ')[0].split(' | ')[0].trim();

  /* ── helpers ───────────────────────────────────────────────── */
  function getUser () {
    try { return JSON.parse(localStorage.getItem(SSO_KEY)); }
    catch { return null; }
  }
  function setUser (u) { localStorage.setItem(SSO_KEY, JSON.stringify(u)); }
  function clearUser () { localStorage.removeItem(SSO_KEY); localStorage.removeItem(VISIT_KEY); }

  /* ── inject CSS ────────────────────────────────────────────── */
  const css = document.createElement('style');
  css.textContent = `
/* ---- SSO Auth Bar ---- */
.aiunites-auth-bar{position:fixed;top:36px;left:0;right:0;z-index:9999;
  background:linear-gradient(90deg,#0d1117,#161b22);border-bottom:1px solid rgba(99,102,241,.18);
  padding:6px 0;font-size:12px;font-family:'Inter',system-ui,sans-serif;transition:all .3s}
.aiunites-auth-inner{max-width:1400px;margin:0 auto;padding:0 20px;
  display:flex;align-items:center;justify-content:space-between}
.aiunites-auth-left{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.55)}
.aiunites-auth-left svg{width:14px;height:14px;opacity:.5}
.aiunites-auth-right{display:flex;align-items:center;gap:10px}

.sso-btn{background:rgba(99,102,241,.15);color:#a5b4fc;border:1px solid rgba(99,102,241,.3);
  border-radius:6px;padding:4px 12px;font-size:11px;cursor:pointer;transition:all .2s;font-family:inherit}
.sso-btn:hover{background:rgba(99,102,241,.3);color:#c7d2fe}
.sso-btn-primary{background:rgba(99,102,241,.8);color:#fff;border-color:transparent}
.sso-btn-primary:hover{background:rgba(99,102,241,1)}

.sso-user-badge{display:flex;align-items:center;gap:6px;color:#a5b4fc;font-size:11px;font-weight:500}
.sso-avatar{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);
  display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700}
.sso-site-list{color:rgba(255,255,255,.35);font-size:10px}

/* ---- SSO Toast ---- */
.sso-toast{position:fixed;top:80px;left:50%;transform:translateX(-50%) translateY(-20px);
  background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:10px 24px;
  border-radius:10px;font-size:13px;font-weight:500;z-index:99999;opacity:0;
  transition:all .4s ease;pointer-events:none;box-shadow:0 8px 32px rgba(99,102,241,.4);
  font-family:'Inter',system-ui,sans-serif}
.sso-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* ---- SSO Modal ---- */
.sso-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99998;
  display:flex;align-items:center;justify-content:center;opacity:0;
  transition:opacity .3s;pointer-events:none;font-family:'Inter',system-ui,sans-serif}
.sso-overlay.open{opacity:1;pointer-events:auto}
.sso-modal{background:#1a1a2e;border:1px solid rgba(99,102,241,.3);border-radius:16px;
  padding:32px;width:380px;max-width:90vw;transform:scale(.9);transition:transform .3s}
.sso-overlay.open .sso-modal{transform:scale(1)}
.sso-modal h2{color:#fff;margin:0 0 4px;font-size:20px;font-weight:700}
.sso-modal p{color:rgba(255,255,255,.5);margin:0 0 20px;font-size:13px}
.sso-modal label{display:block;color:rgba(255,255,255,.7);font-size:12px;margin-bottom:4px;font-weight:500}
.sso-modal input{width:100%;padding:10px 12px;background:#0d1117;border:1px solid rgba(99,102,241,.25);
  border-radius:8px;color:#fff;font-size:14px;margin-bottom:14px;outline:none;
  transition:border-color .2s;box-sizing:border-box;font-family:inherit}
.sso-modal input:focus{border-color:#6366f1}
.sso-modal .sso-submit{width:100%;padding:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
  color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;
  transition:opacity .2s;font-family:inherit}
.sso-modal .sso-submit:hover{opacity:.9}
.sso-modal .sso-close{position:absolute;top:12px;right:16px;background:none;border:none;
  color:rgba(255,255,255,.4);font-size:20px;cursor:pointer}
.sso-modal .sso-network{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px}
.sso-modal .sso-network span{background:rgba(99,102,241,.1);color:rgba(255,255,255,.5);
  padding:2px 8px;border-radius:4px;font-size:10px}

/* body offset for the auth bar */
body{padding-top:68px!important}
.nav{top:68px!important}
  `;
  document.body.appendChild(css);

  /* ── auth bar ──────────────────────────────────────────────── */
  const bar = document.createElement('div');
  bar.className = 'aiunites-auth-bar';
  bar.innerHTML = `<div class="aiunites-auth-inner">
    <div class="aiunites-auth-left">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      <span class="sso-status">AIUNITES Single Sign-On</span>
    </div>
    <div class="aiunites-auth-right"></div>
  </div>`;
  document.body.prepend(bar);

  const rightSlot = bar.querySelector('.aiunites-auth-right');
  const statusEl  = bar.querySelector('.sso-status');

  /* ── toast ──────────────────────────────────────────────────── */
  const toast = document.createElement('div');
  toast.className = 'sso-toast';
  document.body.appendChild(toast);

  function showToast (msg, duration) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration || 2500);
  }

  /* ── modal ─────────────────────────────────────────────────── */
  const overlay = document.createElement('div');
  overlay.className = 'sso-overlay';
  overlay.innerHTML = `
    <div class="sso-modal" style="position:relative">
      <button class="sso-close">&times;</button>
      <h2>Sign in to AIUNITES</h2>
      <p>One account across the entire network</p>
      <div class="sso-network">
        <span>BizStry</span><span>AI YHWH</span><span>UptownIT</span>
        <span>+ 14 more sites</span>
      </div>
      <form id="sso-login-form">
        <label>Display Name</label>
        <input type="text" id="sso-name" placeholder="e.g. Tom" required>
        <label>Email</label>
        <input type="email" id="sso-email" placeholder="you@example.com" required>
        <button type="submit" class="sso-submit">Sign In →</button>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('.sso-close').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

  overlay.querySelector('#sso-login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const name  = document.getElementById('sso-name').value.trim();
    const email = document.getElementById('sso-email').value.trim();
    if (!name || !email) return;

    const user = { name, email, initials: name.slice(0, 2).toUpperCase(), loginSite: CURRENT_SITE, loginTime: Date.now() };
    setUser(user);
    localStorage.setItem(VISIT_KEY, CURRENT_SITE);
    overlay.classList.remove('open');
    renderLoggedIn(user);
    showToast('Signed in! Navigate to any AIUNITES site — you\'re already logged in.');
  });

  /* ── render states ─────────────────────────────────────────── */
  function renderLoggedOut () {
    statusEl.textContent = 'AIUNITES Single Sign-On';
    rightSlot.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'sso-btn sso-btn-primary';
    btn.textContent = 'Sign In';
    btn.addEventListener('click', () => overlay.classList.add('open'));
    rightSlot.appendChild(btn);
  }

  function renderLoggedIn (user) {
    statusEl.textContent = 'Signed in across AIUNITES network';
    rightSlot.innerHTML = `
      <span class="sso-site-list">Active on: BizStry · AI YHWH · UptownIT</span>
      <span class="sso-user-badge">
        <span class="sso-avatar">${user.initials}</span>
        ${user.name}
      </span>`;
    const btn = document.createElement('button');
    btn.className = 'sso-btn';
    btn.textContent = 'Sign Out';
    btn.addEventListener('click', () => {
      clearUser();
      renderLoggedOut();
      showToast('Signed out from all AIUNITES sites');
    });
    rightSlot.appendChild(btn);
  }

  /* ── init ───────────────────────────────────────────────────── */
  const user = getUser();
  if (user) {
    const lastSite = localStorage.getItem(VISIT_KEY);
    if (lastSite && lastSite !== CURRENT_SITE) {
      // Arriving from a different site — show the SSO magic
      showToast('✓ Signed in via AIUNITES SSO — welcome to ' + CURRENT_SITE + '!', 3000);
    }
    localStorage.setItem(VISIT_KEY, CURRENT_SITE);
    renderLoggedIn(user);
  } else {
    renderLoggedOut();
  }

})();
