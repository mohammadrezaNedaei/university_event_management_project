(() => {
  'use strict';

  const KEYS = {
    users: 'ev_users',
    session: 'ev_session',
    userData: 'ev_user_data'
  };

  const EVENTS = [
    {
      id: 'e1',
      badge: 'A',
      eventName: 'event 1',
      professor: 'professor 1',
      title: 'عنوان رویداد ۱',
      subtitle: 'موضوع: معرفی',
      desc: 'یک توضیح کوتاه درباره رویداد ۱. این متن نمونه است و می‌توانید بعداً آن را تغییر دهید.'
    },
    {
      id: 'e2',
      badge: 'B',
      eventName: 'event 2',
      professor: 'professor 2',
      title: 'عنوان رویداد ۲',
      subtitle: 'موضوع: کارگاه',
      desc: 'یک توضیح کوتاه درباره رویداد ۲. این متن نمونه است و می‌توانید بعداً آن را تغییر دهید.'
    },
    {
      id: 'e3',
      badge: 'C',
      eventName: 'event 3',
      professor: 'professor 3',
      title: 'عنوان رویداد ۳',
      subtitle: 'موضوع: تجربه',
      desc: 'یک توضیح کوتاه درباره رویداد ۳. این متن نمونه است و می‌توانید بعداً آن را تغییر دهید.'
    }
  ];

  // -----------------------------
  // Utilities
  // -----------------------------

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  }

  function getQueryParam(key) {
    const url = new URL(window.location.href);
    return url.searchParams.get(key);
  }

  function setQueryParam(url, key, value) {
    const u = new URL(url, window.location.origin);
    u.searchParams.set(key, value);
    return u.toString();
  }

  // -----------------------------
  // Storage
  // -----------------------------

  function loadUsers() {
    return safeJsonParse(localStorage.getItem(KEYS.users) || '[]', []);
  }

  function saveUsers(users) {
    localStorage.setItem(KEYS.users, JSON.stringify(users));
  }

  function loadSession() {
    return safeJsonParse(localStorage.getItem(KEYS.session) || 'null', null);
  }

  function saveSession(session) {
    localStorage.setItem(KEYS.session, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(KEYS.session);
  }

  function loadUserData() {
    return safeJsonParse(localStorage.getItem(KEYS.userData) || '{}', {});
  }

  function saveUserData(allData) {
    localStorage.setItem(KEYS.userData, JSON.stringify(allData));
  }

  function getOrCreateUserData(userId) {
    const all = loadUserData();
    all[userId] ??= { saved: [], joined: [], comments: {} };
    saveUserData(all);
    return all[userId];
  }

  function updateUserData(userId, patchFn) {
    const all = loadUserData();
    const cur = all[userId] ?? { saved: [], joined: [], comments: {} };
    const next = patchFn(structuredClone(cur));
    all[userId] = next;
    saveUserData(all);
    return next;
  }

  function currentUser() {
    const sess = loadSession();
    if (!sess?.userId) return null;
    const users = loadUsers();
    return users.find(u => u.id === sess.userId) || null;
  }

  // -----------------------------
  // UI helpers (toast + ripple)
  // -----------------------------

  function ensureToastStack() {
    let stack = $('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }

  function toast(message, kind = 'good') {
    const stack = ensureToastStack();
    const el = document.createElement('div');
    el.className = `toast ${kind === 'bad' ? 'bad' : 'good'}`;
    el.textContent = message;
    stack.appendChild(el);

    const ttl = 2600;
    window.setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'opacity 180ms ease, transform 180ms ease';
      window.setTimeout(() => el.remove(), 220);
    }, ttl);
  }

  function attachRipples(root = document) {
    const btns = $$('button, .btn, .btn-primary, .btn-ghost, .submit, .nav-btn', root)
      .filter(el => el instanceof HTMLElement);

    for (const el of btns) {
      // avoid binding twice
      if (el.dataset && el.dataset.rippleBound === '1') continue;
      if (el.dataset) el.dataset.rippleBound = '1';

      el.classList.add('ripple-surface');

      el.addEventListener('click', (e) => {
        if (el.hasAttribute('disabled')) return;
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.3;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;

        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        el.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    }
  }

  // -----------------------------
  // Rendering
  // -----------------------------

  function renderHomeEventCard(ev, user) {
    const state = user ? getOrCreateUserData(user.id) : { saved: [], joined: [] };
    const saved = state.saved.includes(ev.id);
    const joined = state.joined.includes(ev.id);

    return `
      <article class="card fade-in" aria-labelledby="${ev.id}">
        <div class="frame">
          <div class="card-head">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar">${ev.badge}</div>
              <div class="meta">
                <div class="title">${ev.eventName}</div>
                <div class="subtitle">${ev.professor}</div>
              </div>
            </div>
            <div class="dots" aria-hidden>⋮</div>
          </div>

          <div class="hero" aria-hidden>
            <svg class="shapes" width="160" height="80" viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
              <g fill="#bdb6c3">
                <ellipse cx="80" cy="30" rx="28" ry="12" />
                <rect x="110" y="35" width="24" height="24" rx="4"/>
                <path d="M30 50 l10 -10 l10 10 l-10 6 z"/>
              </g>
            </svg>
          </div>

          <div class="card-body">
            <div class="text">
              <h3 id="${ev.id}">${ev.title}</h3>
              <p class="sub">${ev.subtitle}</p>
              <p class="desc">${ev.desc}</p>
            </div>

            <div style="display:flex;justify-content:flex-end;align-items:center;gap:10px">
              <button class="btn ghost" data-action="save" data-event-id="${ev.id}">${saved ? 'ذخیره شد' : 'ذخیره'}</button>
              <button class="btn" data-action="join" data-event-id="${ev.id}">${joined ? 'ثبت شد' : 'شرکت'}</button>
            </div>
          </div>

        </div>
      </article>
    `;
  }

  function renderMyEventCard(ev, commentText = '') {
    const hasComment = Boolean(commentText && commentText.trim());

    return `
      <article class="card fade-in" aria-labelledby="m-${ev.id}">
        <div class="card-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="avatar">${ev.badge}</div>
            <div class="meta">
              <div class="title">${ev.eventName}</div>
              <div class="subtitle">${ev.professor}</div>
            </div>
          </div>
          <div style="opacity:.6" aria-hidden>⋮</div>
        </div>

        <div class="hero" aria-hidden>
          <svg width="220" height="110" viewBox="0 0 220 110" xmlns="http://www.w3.org/2000/svg"><g fill="#cfc4ce"><ellipse cx="110" cy="45" rx="40" ry="18"/><rect x="150" y="55" width="36" height="36" rx="6"/><path d="M40 80 l16 -16 l16 16 l-16 10 z"/></g></svg>
        </div>

        <div class="card-body">
          <div>
            <h3 id="m-${ev.id}">${ev.title}</h3>
            <p class="subtitle">${ev.subtitle}</p>
            <p class="desc">${ev.desc}</p>
            ${hasComment ? `<p style="margin:12px 0 0 0;font-weight:700">نظر شما: <span style="font-weight:500">${escapeHtml(commentText)}</span></p>` : ''}
          </div>

          <div class="card-foot">
            <button class="btn-ghost" data-action="remove" data-event-id="${ev.id}">حذف</button>
            <button class="btn-primary" data-action="comment" data-event-id="${ev.id}">${hasComment ? 'ویرایش نظر' : 'نظر'}</button>
          </div>
        </div>
      </article>
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // -----------------------------
  // Page: Home
  // -----------------------------

  function initHomePage() {
    const user = currentUser();

    // Auth link in header
    const auth = $('#nav-auth');
    if (auth) {
      if (user) {
        auth.textContent = 'حساب من';
        auth.setAttribute('href', './my_page.html');
      } else {
        auth.textContent = 'ورود';
        auth.setAttribute('href', './log_in_page.html');
      }
    }

    const eventsWrap = $('#events');
    if (!eventsWrap) return;

    eventsWrap.innerHTML = EVENTS.map(ev => renderHomeEventCard(ev, user)).join('');
    attachRipples(eventsWrap);

    eventsWrap.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest('button');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const eventId = btn.getAttribute('data-event-id');
      if (!action || !eventId) return;

      const ev = EVENTS.find(x => x.id === eventId);
      if (!ev) return;

      const u = currentUser();
      if (!u) {
        // redirect to login and come back
        const next = `${window.location.pathname.split('/').pop() || 'home_page.html'}?focus=${encodeURIComponent(eventId)}`;
        window.location.href = `./log_in_page.html?next=${encodeURIComponent(next)}`;
        return;
      }

      if (action === 'save') {
        const nextState = updateUserData(u.id, (d) => {
          const has = d.saved.includes(eventId);
          d.saved = has ? d.saved.filter(id => id !== eventId) : [...d.saved, eventId];
          return d;
        });

        const saved = nextState.saved.includes(eventId);
        btn.textContent = saved ? 'ذخیره شد' : 'ذخیره';
        toast(saved ? 'به لیست ذخیره‌ها اضافه شد.' : 'از لیست ذخیره‌ها حذف شد.', 'good');
      }

      if (action === 'join') {
        const nextState = updateUserData(u.id, (d) => {
          const has = d.joined.includes(eventId);
          d.joined = has ? d.joined : [...d.joined, eventId];
          // when joined, also keep as saved (optional)
          if (!d.saved.includes(eventId)) d.saved.push(eventId);
          return d;
        });

        const joined = nextState.joined.includes(eventId);
        btn.textContent = joined ? 'ثبت شد' : 'شرکت';
        toast('ثبت‌نام شما در رویداد انجام شد.', 'good');
      }
    });

    // Focus an event after coming back from login
    const focusId = getQueryParam('focus');
    if (focusId) {
      const heading = document.getElementById(focusId);
      if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
        heading.style.outline = '3px solid rgba(255,138,0,.55)';
        heading.style.outlineOffset = '6px';
        setTimeout(() => {
          heading.style.outline = 'none';
        }, 1200);
      }
    }
  }

  // -----------------------------
  // Page: Login
  // -----------------------------

  function initLoginPage() {
    const form = $('form[data-form="login"]');
    if (!form) return;

    const alertBox = $('#form-alert');
    const next = getQueryParam('next');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const phone = String(form.phone?.value || '').trim();
      const password = String(form.password?.value || '');

      if (!phone || !password) {
        showFormAlert(alertBox, 'لطفاً شماره تلفن و رمز عبور را وارد کنید.', 'error');
        return;
      }

      const users = loadUsers();
      const found = users.find(u => u.phone === phone && u.password === password);
      if (!found) {
        showFormAlert(alertBox, 'اطلاعات ورود اشتباه است. اگر حساب ندارید، ثبت نام کنید.', 'error');
        return;
      }

      saveSession({ userId: found.id });
      showFormAlert(alertBox, 'ورود موفق بود ✅', 'success');

      const redirectTo = next ? decodeURIComponent(next) : './my_page.html';
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 450);
    });

    attachRipples(document);
  }

  // -----------------------------
  // Page: Register
  // -----------------------------

  function initRegisterPage() {
    const form = $('form[data-form="register"]');
    if (!form) return;

    const alertBox = $('#form-alert');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const fullName = String(form.fullName?.value || '').trim();
      const phone = String(form.phone?.value || '').trim();
      const password = String(form.password?.value || '');
      const password2 = String(form.password2?.value || '');

      if (!fullName || !phone || !password || !password2) {
        showFormAlert(alertBox, 'لطفاً همه فیلدها را کامل کنید.', 'error');
        return;
      }

      if (password !== password2) {
        showFormAlert(alertBox, 'رمز عبور و تکرار آن یکسان نیست.', 'error');
        return;
      }

      const users = loadUsers();
      if (users.some(u => u.phone === phone)) {
        showFormAlert(alertBox, 'این شماره تلفن قبلاً ثبت شده است. وارد شوید.', 'error');
        return;
      }

      const newUser = {
        id: `u_${Math.random().toString(16).slice(2)}_${Date.now()}`,
        fullName,
        phone,
        password // Demo only
      };

      users.push(newUser);
      saveUsers(users);
      saveSession({ userId: newUser.id });
      getOrCreateUserData(newUser.id);

      showFormAlert(alertBox, 'ثبت نام موفق بود ✅', 'success');
      setTimeout(() => {
        window.location.href = './my_page.html';
      }, 450);
    });

    attachRipples(document);
  }

  // -----------------------------
  // Page: My Page
  // -----------------------------

  function initMyPage() {
    const user = currentUser();
    if (!user) {
      // keep next
      window.location.href = `./log_in_page.html?next=${encodeURIComponent('./my_page.html')}`;
      return;
    }

    const nameEl = $('#user-name');
    if (nameEl) nameEl.textContent = user.fullName;

    attachRipples(document);

    const logoutBtn = $('#logout');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        clearSession();
        toast('خروج انجام شد.', 'good');
        setTimeout(() => {
          window.location.href = './home_page.html';
        }, 350);
      };
    }

    const wrap = $('#my-events');
    if (!wrap) return;

    const state = getOrCreateUserData(user.id);
    const joinedEvents = EVENTS.filter(ev => state.joined.includes(ev.id));

    if (joinedEvents.length === 0) {
      wrap.innerHTML = `
        <div style="width:100%;background:rgba(7,43,54,.10);border:2px dashed rgba(7,43,54,.25);border-radius:18px;padding:18px;direction:rtl">
          هنوز در هیچ رویدادی ثبت‌نام نکرده‌اید.
          <a href="./home_page.html" style="font-weight:800; margin-right:10px; color:inherit;">رفتن به صفحه اصلی</a>
        </div>
      `;
      return;
    }

    wrap.innerHTML = joinedEvents
      .map(ev => renderMyEventCard(ev, state.comments?.[ev.id] || ''))
      .join('');

    attachRipples(wrap);

    wrap.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest('button');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const eventId = btn.getAttribute('data-event-id');
      if (!action || !eventId) return;

      if (action === 'remove') {
        updateUserData(user.id, (d) => {
          d.joined = d.joined.filter(id => id !== eventId);
          return d;
        });
        toast('رویداد حذف شد.', 'good');
        initMyPage();
      }

      if (action === 'comment') {
        const current = getOrCreateUserData(user.id).comments?.[eventId] || '';
        const text = prompt('نظر شما درباره این رویداد:', current);
        if (text === null) return;

        updateUserData(user.id, (d) => {
          d.comments ??= {};
          d.comments[eventId] = text.trim();
          return d;
        });
        toast('نظر شما ذخیره شد.', 'good');
        initMyPage();
      }
    });
  }

  function showFormAlert(el, message, type) {
    if (!el) return;
    el.classList.remove('hidden', 'error', 'success');
    el.classList.add('alert', type === 'success' ? 'success' : 'error');
    el.textContent = message;
  }

  // -----------------------------
  // Boot
  // -----------------------------

  document.addEventListener('DOMContentLoaded', () => {
    // seed a demo user so you can login right away
    const users = loadUsers();
    if (users.length === 0) {
      const demo = { id: 'u_demo', fullName: 'کاربر نمونه', phone: '09120000000', password: '1234' };
      saveUsers([demo]);
      getOrCreateUserData(demo.id);
    }

    const page = document.body?.dataset?.page || '';

    if (page === 'home') initHomePage();
    if (page === 'login') initLoginPage();
    if (page === 'register') initRegisterPage();
    if (page === 'my') initMyPage();

    // Fallback: still attach ripples if page attr missing
    attachRipples(document);
  });
})();
