/* ═══════════════════════════════════════════
   AURA AI — Premium Chat Logic (v2.2)
   ═══════════════════════════════════════════ */

const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentChatId = null;
let isLoginMode = true;
let particlesAnimId = null;
let allChats = [];

/* ─────────── I18N ─────────── */
const TRANSLATIONS = {
  en: {
    newChat: 'New Conversation',
    placeholder: 'Message AURA AI...',
    searchChats: '🔍 Search chats...',
    login: 'Welcome back',
    signup: 'Create account',
    loginSub: 'Sign in to continue to AURA AI',
    signupSub: 'Start your journey with AURA AI',
    signIn: 'Sign In',
    signUp: 'Create Account'
  },
  ta: {
    newChat: 'புதிய உரையாடல்',
    placeholder: 'AURA AI க்கு செய்தி...',
    searchChats: '🔍 உரையாடல்களைத் தேடு...',
    login: 'மீண்டும் வருக',
    signup: 'கணக்கு உருவாக்கு',
    loginSub: 'தொடர உள்நுழையுங்கள்',
    signupSub: 'AURA AI உடன் தொடங்குங்கள்',
    signIn: 'உள்நுழை',
    signUp: 'கணக்கு உருவாக்கு'
  },
  hi: {
    newChat: 'नई बातचीत',
    placeholder: 'AURA AI को संदेश...',
    searchChats: '🔍 चैट खोजें...',
    login: 'वापसी पर स्वागत',
    signup: 'खाता बनाएं',
    loginSub: 'जारी रखने के लिए साइन इन करें',
    signupSub: 'AURA AI के साथ शुरू करें',
    signIn: 'साइन इन',
    signUp: 'खाता बनाएं'
  }
};
let currentLang = localStorage.getItem('lang') || 'en';
function t(key) { return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS.en[key] || key; }

/* ─────────── ELEMENTS ─────────── */
const $ = (id) => document.getElementById(id);

const messagesEl = $('messages');
const inputEl = $('user-input');
const sendBtn = $('send-btn');
const authModal = $('auth-modal');
const authTitle = $('auth-title');
const authSubtitle = $('auth-subtitle');
const authSubmit = $('auth-submit');
const authBtnText = $('auth-btn-text');
const switchAuthLink = $('switch-auth');
const switchText = $('switch-text');
const usernameEl = $('username');
const passwordEl = $('password');
const togglePassword = $('toggle-password');
const logoutBtn = $('logout-btn');
const userAvatar = $('user-avatar');
const userName = $('user-name');
const chatHistoryEl = $('chat-history');
const chatCount = $('chat-count');
const newChatBtn = $('new-chat');
const chatTitle = $('chat-title');
const voiceBtn = $('voice-btn');
const themeBtn = $('theme-btn');
const micInputBtn = $('mic-input-btn');
const attachBtn = $('attach-btn');
const shareBtn = $('share-btn');
const charCount = $('char-count');
const toastContainer = $('toast-container');
const userCard = $('user-card');
const userDropdown = $('user-dropdown');
const menuBtn = $('menu-btn');
const closeSidebar = $('close-sidebar');
const sidebar = document.querySelector('.sidebar');
const settingsBtn = $('settings-btn');
const settingsModal = $('settings-modal');
const favoritesModal = $('favorites-modal');
const themeModal = $('theme-modal');
const analyticsModal = $('analytics-modal');
const passwordModal = $('password-modal');
const paletteModal = $('palette-modal');
const paletteInput = $('palette-input');
const paletteList = $('palette-list');
const imageGenModal = $('image-gen-modal');
const lightbox = $('image-lightbox');
const lightboxImg = lightbox?.querySelector('img');

/* ─────────── INIT ─────────── */
initTheme();
initParticles();
if (!token) {
  setTimeout(() => authModal.classList.add('active'), 300);
} else {
  initUser();
}

/* ═══════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  const savedAccent = localStorage.getItem('theme-accent');
  if (savedAccent) {
    try {
      const { accent, accent2, accent3 } = JSON.parse(savedAccent);
      document.documentElement.style.setProperty('--accent', accent);
      document.documentElement.style.setProperty('--accent-2', accent2);
      document.documentElement.style.setProperty('--accent-3', accent3);
    } catch {}
  }
}

themeBtn.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  toast(`Switched to ${next} mode`, 'success');
});

/* ═══════════════════════════════════════════
   PARTICLES BACKGROUND
   ═══════════════════════════════════════════ */
function initParticles() {
  const canvas = $('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const count = window.innerWidth < 768 ? 30 : 60;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      a: Math.random() * 0.5 + 0.2
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = isLight
        ? `rgba(99, 102, 241, ${p.a * 0.6})`
        : `rgba(168, 85, 247, ${p.a})`;
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          ctx.beginPath();
          ctx.strokeStyle = isLight
            ? `rgba(99, 102, 241, ${(1 - d / 120) * 0.08})`
            : `rgba(168, 85, 247, ${(1 - d / 120) * 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    particlesAnimId = requestAnimationFrame(draw);
  }
  draw();
}

/* ═══════════════════════════════════════════
   TOASTS & STATS
   ═══════════════════════════════════════════ */
function toast(msg, type = 'info', duration = 3500) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

function trackStat(key, value = 1) {
  const stats = JSON.parse(localStorage.getItem('aura-stats') || '{}');
  stats[key] = (stats[key] || 0) + value;
  stats.lastUpdate = new Date().toISOString();
  localStorage.setItem('aura-stats', JSON.stringify(stats));
}

function getStats() {
  return JSON.parse(localStorage.getItem('aura-stats') || '{}');
}

/* ═══════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════ */
switchAuthLink.addEventListener('click', (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? t('login') : t('signup');
  authSubtitle.textContent = isLoginMode ? t('loginSub') : t('signupSub');
  authBtnText.textContent = isLoginMode ? t('signIn') : t('signUp');
  switchText.textContent = isLoginMode ? "Don't have an account?" : 'Already have an account?';
  switchAuthLink.textContent = isLoginMode ? 'Create one' : 'Sign in';
});

togglePassword.addEventListener('click', () => {
  passwordEl.type = passwordEl.type === 'password' ? 'text' : 'password';
});

[usernameEl, passwordEl].forEach((el) => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') authSubmit.click();
  });
});

authSubmit.addEventListener('click', async () => {
  const username = usernameEl.value.trim();
  const password = passwordEl.value.trim();
  if (!username || !password) return toast('Please fill all fields', 'error');

  authBtnText.textContent = 'Please wait...';
  authSubmit.disabled = true;

  const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
  try {
    const res = await fetch(API_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    token = data.token;
    localStorage.setItem('token', token);
    localStorage.setItem('username', data.username);
    authModal.classList.remove('active');
    toast(`Welcome, ${data.username}!`, 'success');
    initUser();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    authBtnText.textContent = isLoginMode ? t('signIn') : t('signUp');
    authSubmit.disabled = false;
  }
});

function initUser() {
  const username = localStorage.getItem('username') || 'User';
  userName.textContent = username;
  userAvatar.textContent = username[0].toUpperCase();
  loadChats();
}

/* ═══════════════════════════════════════════
   USER MENU
   ═══════════════════════════════════════════ */
userCard.addEventListener('click', (e) => {
  if (e.target.closest('#user-menu-btn')) return;
  userDropdown.classList.toggle('open');
});

$('user-menu-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  userDropdown.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!userCard.contains(e.target)) userDropdown.classList.remove('open');
});

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  location.reload();
});

/* ═══════════════════════════════════════════
   SIDEBAR TOGGLE
   ═══════════════════════════════════════════ */
menuBtn.addEventListener('click', () => sidebar.classList.add('open'));
closeSidebar.addEventListener('click', () => sidebar.classList.remove('open'));

/* ═══════════════════════════════════════════
   CHAT INPUT
   ═══════════════════════════════════════════ */
inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + 'px';
  charCount.textContent = `${inputEl.value.length} / 4000`;

  const tokens = Math.ceil(inputEl.value.length / 4);
  const tokenEl = $('token-count');
  if (tokenEl) tokenEl.textContent = `~${tokens} tokens`;

  if (inputEl.value.length > 4000) {
    inputEl.value = inputEl.value.slice(0, 4000);
    toast('Message too long (max 4000 chars)', 'warning');
  }

  clearTimeout(window.draftTimer);
  window.draftTimer = setTimeout(() => {
    localStorage.setItem('aura-draft', inputEl.value);
  }, 500);
});

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

/* ═══════════════════════════════════════════
   SEND MESSAGE
   ═══════════════════════════════════════════ */
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  const welcome = $('welcome');
  if (welcome) welcome.remove();

  trackStat('messages');
  trackStat('timeSaved', 2);

  addMessage('user', text);
  inputEl.value = '';
  inputEl.style.height = 'auto';
  charCount.textContent = '0 / 4000';
  localStorage.removeItem('aura-draft');

  const tokenEl = $('token-count');
  if (tokenEl) tokenEl.textContent = '~0 tokens';
  sendBtn.disabled = true;

  const typingId = addTyping();
  const startTime = Date.now();

  try {
    const model = $('model-select')?.value || 'openai/gpt-oss-120b';
    const res = await fetch(API_URL + '/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        message: text,
        chatId: currentChatId,
        model: model
      })
    });

    const data = await res.json();
    removeTyping(typingId);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!res.ok) throw new Error(data.error);

    currentChatId = data.chatId;
    trackStat('replies');
    trackStat('tokens', Math.ceil(data.reply.length / 4));
    addMessage('ai', data.reply);

    const lastMsg = messagesEl.querySelector('.message.ai:last-child');
    if (lastMsg) {
      const actions = lastMsg.querySelector('.msg-actions');
      if (actions) {
        const timeBadge = document.createElement('span');
        timeBadge.style.cssText = 'font-size: 11px; color: var(--text-dimmer); font-family: monospace; margin-left: auto;';
        timeBadge.textContent = `⚡ ${elapsed}s`;
        actions.appendChild(timeBadge);
      }
    }

    loadChats();
  } catch (err) {
    removeTyping(typingId);
    const msg = err.message.includes('fetch')
      ? '⚠️ Backend offline. Start it with: cd backend && npm run dev'
      : '⚠️ ' + err.message;
    addMessage('ai', msg);
    toast(err.message, 'error');
  } finally {
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

/* ═══════════════════════════════════════════
   MESSAGE RENDERING
   ═══════════════════════════════════════════ */
function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const aiIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2 L20 20 L15 20 L12 12 L9 20 L4 20 Z" stroke-linejoin="round"/>
  </svg>`;

  let content;
  if (role === 'ai' && typeof marked !== 'undefined') {
    try {
      const rawHtml = marked.parse(text);
      content = DOMPurify.sanitize(rawHtml);
    } catch {
      content = escapeHtml(text);
    }
  } else {
    content = escapeHtml(text);
  }

  const attachmentsHtml = (role === 'user' && window.attachedFiles?.length)
    ? `<div class="message-attachments">${
        window.attachedFiles
          .filter(f => f.type?.startsWith('image/'))
          .map(f => `<img src="${API_URL.replace('/api', '')}${f.url}" alt="${f.name}" />`)
          .join('')
      }</div>`
    : '';

  div.innerHTML = `
    <div class="avatar">${role === 'user' ? '' : aiIcon}</div>
    <div class="bubble">${attachmentsHtml}${content}</div>
  `;

  if (role === 'user') {
    div.querySelector('.avatar').textContent =
      (localStorage.getItem('username') || 'U')[0].toUpperCase();
  }

  if (role === 'ai') {
    const bubble = div.querySelector('.bubble');
    const actions = document.createElement('div');
    actions.className = 'msg-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-msg-btn';
    copyBtn.innerHTML = '📋 Copy';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(text);
      copyBtn.innerHTML = '✅ Copied!';
      setTimeout(() => copyBtn.innerHTML = '📋 Copy', 2000);
    };
    actions.appendChild(copyBtn);

    const speakBtn = document.createElement('button');
    speakBtn.className = 'copy-msg-btn';
    speakBtn.innerHTML = '🔊 Speak';
    speakBtn.onclick = () => speakText(text);
    actions.appendChild(speakBtn);

    const regenBtn = document.createElement('button');
    regenBtn.className = 'copy-msg-btn';
    regenBtn.innerHTML = '🔄 Regenerate';
    regenBtn.onclick = () => regenerate();
    actions.appendChild(regenBtn);

    const favBtn = document.createElement('button');
    favBtn.className = 'copy-msg-btn';
    favBtn.innerHTML = '⭐ Favorite';
    favBtn.onclick = () => toggleFavorite(text, favBtn);
    actions.appendChild(favBtn);

    bubble.appendChild(actions);

    div.querySelectorAll('pre code').forEach((block) => {
      if (typeof hljs !== 'undefined') hljs.highlightElement(block);
    });

    // Attach lightbox to images
    div.querySelectorAll('img').forEach(img => {
      img.onclick = () => openLightbox(img.src);
    });
  }

  messagesEl.appendChild(div);
  scrollToBottom();

  if (role === 'ai' && localStorage.getItem('auto-speak') === 'true') {
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' code block ')
      .replace(/[#*_`>]/g, '')
      .trim();
    setTimeout(() => speakText(cleanText.substring(0, 500)), 200);
  }
}

function addTyping() {
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.className = 'message ai';
  div.id = id;
  div.innerHTML = `
    <div class="avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2 L20 20 L15 20 L12 12 L9 20 L4 20 Z" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="bubble typing"><span></span><span></span><span></span></div>
  `;
  messagesEl.appendChild(div);
  scrollToBottom();
  return id;
}

function removeTyping(id) { $(id)?.remove(); }
function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ═══════════════════════════════════════════
   TEXT TO SPEECH
   ═══════════════════════════════════════════ */
function speakText(text) {
  if (!('speechSynthesis' in window)) return toast('Speech not supported', 'error');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

/* ═══════════════════════════════════════════
   REGENERATE
   ═══════════════════════════════════════════ */
async function regenerate() {
  if (!currentChatId) return toast('Nothing to regenerate', 'warning');
  const aiMessages = messagesEl.querySelectorAll('.message.ai');
  if (aiMessages.length === 0) return;
  aiMessages[aiMessages.length - 1].remove();

  const userBubbles = messagesEl.querySelectorAll('.message.user .bubble');
  if (userBubbles.length === 0) return;
  const lastUserMsg = userBubbles[userBubbles.length - 1].textContent;

  inputEl.value = lastUserMsg;
  inputEl.dispatchEvent(new Event('input'));
  await sendMessage();
}

/* ═══════════════════════════════════════════
   FAVORITES
   ═══════════════════════════════════════════ */
function toggleFavorite(text, btn) {
  const favs = JSON.parse(localStorage.getItem('aura-favorites') || '[]');
  const exists = favs.findIndex(f => f.text === text);
  if (exists >= 0) {
    favs.splice(exists, 1);
    btn.innerHTML = '⭐ Favorite';
    toast('Removed from favorites', 'info');
  } else {
    favs.unshift({ text, savedAt: new Date().toISOString() });
    btn.innerHTML = '⭐ Favorited';
    toast('Saved to favorites!', 'success');
  }
  localStorage.setItem('aura-favorites', JSON.stringify(favs));
}

/* ═══════════════════════════════════════════
   AUTO SPEAK
   ═══════════════════════════════════════════ */
const autoSpeakBtn = $('auto-speak-btn');

function updateSpeakBtn() {
  if (!autoSpeakBtn) return;
  const on = localStorage.getItem('auto-speak') === 'true';
  autoSpeakBtn.textContent = on ? '🔊' : '🔈';
  autoSpeakBtn.style.color = on ? 'var(--accent)' : '';
}

autoSpeakBtn?.addEventListener('click', () => {
  const cur = localStorage.getItem('auto-speak') === 'true';
  localStorage.setItem('auto-speak', !cur);
  updateSpeakBtn();
  toast(!cur ? 'Auto-speak ON' : 'Auto-speak OFF', 'success');
});

updateSpeakBtn();

/* ═══════════════════════════════════════════
   CHAT HISTORY
   ═══════════════════════════════════════════ */
async function loadChats() {
  try {
    const res = await fetch(API_URL + '/chat/history', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    allChats = await res.json();
    renderChatHistory(allChats);
  } catch (e) {
    console.error(e);
  }
}

$('chat-search')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = q
    ? allChats.filter(c => (c.title || '').toLowerCase().includes(q))
    : allChats;
  renderChatHistory(filtered);
});

function renderChatHistory(chats) {
  chatHistoryEl.innerHTML = '';
  chatCount.textContent = chats.length;

  chats.forEach((chat) => {
    const div = document.createElement('div');
    div.className = 'chat-item' + (chat._id === currentChatId ? ' active' : '');
    div.innerHTML = `
      <svg class="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="chat-text">${escapeHtml(chat.title || 'New Chat')}</span>
      <button class="chat-delete-btn" title="Delete chat">🗑️</button>
    `;
    div.querySelector('.chat-text').onclick = () => loadChat(chat._id);
    div.querySelector('.chat-icon').onclick = () => loadChat(chat._id);
    div.querySelector('.chat-delete-btn').onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete "${chat.title}"?`)) return;
      try {
        const res = await fetch(`${API_URL}/chat/${chat._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Delete failed');
        if (chat._id === currentChatId) resetChat();
        loadChats();
        toast('Chat deleted', 'success');
      } catch (err) {
        toast('Delete failed: ' + err.message, 'error');
      }
    };
    chatHistoryEl.appendChild(div);
  });
}

async function loadChat(chatId) {
  const res = await fetch(`${API_URL}/chat/${chatId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const chat = await res.json();
  currentChatId = chat._id;
  chatTitle.textContent = chat.title;
  messagesEl.innerHTML = '';
  chat.messages.forEach((m) => addMessage(m.role, m.content));
  loadChats();
  if (window.innerWidth < 768) sidebar.classList.remove('open');
}

/* ═══════════════════════════════════════════
   NEW CHAT
   ═══════════════════════════════════════════ */
newChatBtn.addEventListener('click', resetChat);

function resetChat() {
  currentChatId = null;
  chatTitle.textContent = 'New Conversation';
  messagesEl.innerHTML = `
    <div class="welcome" id="welcome">
      <div class="welcome-glow"></div>
      <div class="welcome-logo">
        <svg viewBox="0 0 80 80" fill="none">
          <defs>
            <linearGradient id="welcomeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#6366f1"/>
              <stop offset="50%" stop-color="#a855f7"/>
              <stop offset="100%" stop-color="#ec4899"/>
            </linearGradient>
          </defs>
          <path d="M40 8 L68 64 L52 64 L40 36 L28 64 L12 64 Z" fill="url(#welcomeGrad2)"/>
          <circle cx="40" cy="52" r="5" fill="#fff"/>
        </svg>
      </div>
      <h1><span class="grad-text">Hello</span>, I'm AURA</h1>
      <p class="welcome-sub">Your premium intelligent assistant. Ask me anything.</p>
      <div class="suggestion-grid">
        <div class="suggestion-card" data-prompt="Explain quantum computing in simple terms">
          <div class="suggestion-icon">🧠</div>
          <div class="suggestion-text">Explain quantum computing in simple terms</div>
        </div>
        <div class="suggestion-card" data-prompt="Write a Python function to reverse a string">
          <div class="suggestion-icon">💻</div>
          <div class="suggestion-text">Write a Python function to reverse a string</div>
        </div>
        <div class="suggestion-card" data-prompt="Give me 5 creative ideas for a startup">
          <div class="suggestion-icon">💡</div>
          <div class="suggestion-text">Give me 5 creative ideas for a startup</div>
        </div>
        <div class="suggestion-card" data-prompt="Summarize the latest trends in AI">
          <div class="suggestion-icon">🚀</div>
          <div class="suggestion-text">Summarize the latest trends in AI</div>
        </div>
      </div>
    </div>
  `;
  attachSuggestionHandlers();
  loadChats();
  if (window.innerWidth < 768) sidebar.classList.remove('open');
}

/* ═══════════════════════════════════════════
   SUGGESTION CARDS
   ═══════════════════════════════════════════ */
function attachSuggestionHandlers() {
  document.querySelectorAll('.suggestion-card').forEach((card) => {
    card.addEventListener('click', () => {
      inputEl.value = card.dataset.prompt;
      inputEl.dispatchEvent(new Event('input'));
      sendMessage();
    });
  });
}
attachSuggestionHandlers();

/* ═══════════════════════════════════════════
   VOICE INPUT
   ═══════════════════════════════════════════ */
function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast('Voice not supported in this browser', 'error');
  const rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onstart = () => {
    voiceBtn.style.color = '#ef4444';
    micInputBtn.style.color = '#ef4444';
    toast('Listening... speak now', 'info', 2000);
  };
  rec.onresult = (e) => {
    inputEl.value = e.results[0][0].transcript;
    inputEl.dispatchEvent(new Event('input'));
  };
  rec.onerror = (e) => toast('Voice error: ' + e.error, 'error');
  rec.onend = () => {
    voiceBtn.style.color = '';
    micInputBtn.style.color = '';
  };
  rec.start();
}
voiceBtn.addEventListener('click', startVoice);
micInputBtn.addEventListener('click', startVoice);

/* ═══════════════════════════════════════════
   FILE UPLOAD
   ═══════════════════════════════════════════ */
const fileInput = $('file-input');
const filePreview = $('file-preview');
window.attachedFiles = [];

attachBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) return toast('File too large (max 10MB)', 'error');

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API_URL}/chat/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    window.attachedFiles.push(data);
    trackStat('files');
    renderFilePreview();
    toast('File attached', 'success');
  } catch (err) {
    toast('Upload failed: ' + err.message, 'error');
  }
  fileInput.value = '';
});

function renderFilePreview() {
  filePreview.innerHTML = '';
  window.attachedFiles.forEach((f, i) => {
    const chip = document.createElement('div');
    chip.className = 'file-chip';
    const isImg = f.type?.startsWith('image/');
    chip.innerHTML = `
      ${isImg ? `<img src="${API_URL.replace('/api', '')}${f.url}" />` : '📄'}
      <span class="file-name">${escapeHtml(f.name)}</span>
      <button class="file-remove" data-i="${i}">✕</button>
    `;
    chip.querySelector('.file-remove').onclick = () => {
      window.attachedFiles.splice(i, 1);
      renderFilePreview();
    };
    filePreview.appendChild(chip);
  });
}

/* ═══════════════════════════════════════════
   SHARE
   ═══════════════════════════════════════════ */
shareBtn.addEventListener('click', async () => {
  if (!currentChatId) return toast('No chat to share', 'warning');
  const url = `${location.origin}?chat=${currentChatId}`;
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied to clipboard', 'success');
  } catch {
    toast('Share: ' + url, 'info', 6000);
  }
});

/* ═══════════════════════════════════════════
   EXPORT CHAT
   ═══════════════════════════════════════════ */
$('export-btn')?.addEventListener('click', () => {
  if (!currentChatId) return toast('No chat to export', 'warning');
  const messages = messagesEl.querySelectorAll('.message');
  let text = `AURA AI — Chat Export\n`;
  text += `Date: ${new Date().toLocaleString()}\n`;
  text += `Chat ID: ${currentChatId}\n`;
  text += `${'='.repeat(50)}\n\n`;

  messages.forEach((msg) => {
    const role = msg.classList.contains('user') ? 'USER' : 'AURA';
    const content = msg.querySelector('.bubble')?.innerText || '';
    text += `[${role}]\n${content}\n\n`;
  });

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aura-chat-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Chat exported!', 'success');
});

/* ═══════════════════════════════════════════
   IMAGE GENERATION
   ═══════════════════════════════════════════ */

$('image-gen-btn')?.addEventListener('click', () => {
  $('image-prompt').value = '';
  $('image-style').value = '';
  imageGenModal.classList.add('active');
  setTimeout(() => $('image-prompt')?.focus(), 200);
});

$('cancel-image-gen')?.addEventListener('click', () => imageGenModal.classList.remove('active'));
imageGenModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => imageGenModal.classList.remove('active'));

document.querySelectorAll('[data-img-prompt]').forEach(card => {
  card.addEventListener('click', () => {
    $('image-prompt').value = card.dataset.imgPrompt;
    $('image-prompt').focus();
  });
});

$('generate-image-btn')?.addEventListener('click', async () => {
  const prompt = $('image-prompt').value.trim();
  const style = $('image-style').value;

  if (!prompt) return toast('Please enter a prompt', 'error');

  const btnText = $('generate-image-text');
  const btn = $('generate-image-btn');
  btnText.textContent = '⏳ Generating...';
  btn.disabled = true;

  try {
    const welcome = $('welcome');
    if (welcome) welcome.remove();

    addMessage('user', `🎨 Generate image: ${prompt}${style ? ` (${style} style)` : ''}`);

    const loadingId = 'img-loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai';
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = `
      <div class="avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2 L20 20 L15 20 L12 12 L9 20 L4 20 Z" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="bubble">
        <div class="image-loading">🎨 Creating your image...</div>
      </div>
    `;
    messagesEl.appendChild(loadingDiv);
    scrollToBottom();

    const res = await fetch(`${API_URL}/chat/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ prompt, style, chatId: currentChatId })
    });

    const data = await res.json();
    document.getElementById(loadingId)?.remove();

    if (!res.ok) throw new Error(data.error);

    currentChatId = data.chatId;
    addMessage('ai', `![Generated Image](${data.imageUrl})\n\n**Prompt:** ${prompt}${style ? `\n**Style:** ${style}` : ''}\n\n*Click image to open full size*`);

    const lastMsg = messagesEl.querySelector('.message.ai:last-child');
    const img = lastMsg?.querySelector('img');
    if (img) {
      img.onclick = () => openLightbox(data.imageUrl);

      const actions = lastMsg.querySelector('.msg-actions');
      if (actions) {
        const dlBtn = document.createElement('button');
        dlBtn.className = 'copy-msg-btn';
        dlBtn.innerHTML = '⬇️ Download';
        dlBtn.onclick = async () => {
          try {
            const imgRes = await fetch(data.imageUrl);
            const blob = await imgRes.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aura-image-${Date.now()}.jpg`;
            a.click();
            URL.revokeObjectURL(url);
            toast('Image downloaded!', 'success');
          } catch {
            toast('Download failed', 'error');
          }
        };
        actions.insertBefore(dlBtn, actions.firstChild);
      }
    }

    imageGenModal.classList.remove('active');
    loadChats();
    toast('Image generated! 🎨', 'success');
  } catch (err) {
    toast('Failed: ' + err.message, 'error');
  } finally {
    btnText.textContent = '🎨 Generate Image';
    btn.disabled = false;
  }
});

/* ═══════════════════════════════════════════
   IMAGE LIGHTBOX
   ═══════════════════════════════════════════ */
function openLightbox(url) {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = url;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightbox || !lightboxImg) return;
  lightbox.classList.remove('active');
  lightboxImg.src = '';
  document.body.style.overflow = '';
}

lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
lightbox?.querySelector('.image-lightbox-close')?.addEventListener('click', closeLightbox);

/* ═══════════════════════════════════════════
   THEME CUSTOMIZER
   ═══════════════════════════════════════════ */
$('theme-customizer-btn')?.addEventListener('click', () => themeModal.classList.add('active'));
themeModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => themeModal.classList.remove('active'));

document.querySelectorAll('.color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    const accent = swatch.dataset.accent;
    const accent2 = swatch.dataset.accent2;
    const accent3 = swatch.dataset.accent3;
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-2', accent2);
    document.documentElement.style.setProperty('--accent-3', accent3);
    localStorage.setItem('theme-accent', JSON.stringify({ accent, accent2, accent3 }));
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    toast('Theme updated!', 'success');
  });
});

$('reset-theme-btn')?.addEventListener('click', () => {
  localStorage.removeItem('theme-accent');
  document.documentElement.style.removeProperty('--accent');
  document.documentElement.style.removeProperty('--accent-2');
  document.documentElement.style.removeProperty('--accent-3');
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  toast('Theme reset', 'success');
});

/* ═══════════════════════════════════════════
   ANALYTICS
   ═══════════════════════════════════════════ */
$('analytics-btn')?.addEventListener('click', () => {
  const stats = getStats();
  const grid = $('analytics-grid');
  const items = [
    { label: 'Messages Sent', value: stats.messages || 0, icon: '💬' },
    { label: 'AI Replies', value: stats.replies || 0, icon: '🤖' },
    { label: 'Tokens Used', value: (stats.tokens || 0).toLocaleString(), icon: '🎯' },
    { label: 'Files Uploaded', value: stats.files || 0, icon: '📎' },
    { label: 'Time Saved (min)', value: stats.timeSaved || 0, icon: '⚡' },
    { label: 'Total Chats', value: allChats.length, icon: '📝' }
  ];
  grid.innerHTML = items.map(item => `
    <div class="analytics-card">
      <div style="font-size: 24px; margin-bottom: 8px;">${item.icon}</div>
      <div class="analytics-value">${item.value}</div>
      <div class="analytics-label">${item.label}</div>
    </div>
  `).join('');
  analyticsModal.classList.add('active');
});

analyticsModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => analyticsModal.classList.remove('active'));

$('reset-analytics-btn')?.addEventListener('click', () => {
  if (!confirm('Reset all analytics?')) return;
  localStorage.removeItem('aura-stats');
  toast('Analytics reset', 'success');
  analyticsModal.classList.remove('active');
});

/* ═══════════════════════════════════════════
   COMMAND PALETTE
   ═══════════════════════════════════════════ */
const COMMANDS = [
  { icon: '➕', name: 'New Chat', action: () => resetChat(), shortcut: 'Ctrl+K' },
  { icon: '🌙', name: 'Toggle Theme', action: () => themeBtn.click() },
  { icon: '🎨', name: 'Customize Theme', action: () => $('theme-customizer-btn').click() },
  { icon: '📊', name: 'View Analytics', action: () => $('analytics-btn').click() },
  { icon: '📥', name: 'Export Chat', action: () => $('export-btn').click() },
  { icon: '🖼️', name: 'Generate Image', action: () => $('image-gen-btn').click() },
  { icon: '🔊', name: 'Toggle Auto-Speak', action: () => $('auto-speak-btn').click() },
  { icon: '🔍', name: 'Search Chats', action: () => $('chat-search')?.focus() },
  { icon: '📎', name: 'Attach File', action: () => $('attach-btn').click() },
  { icon: '🗑️', name: 'Logout', action: () => logoutBtn.click() },
  { icon: '🌍', name: 'Change Language', action: () => $('lang-select')?.focus() }
];

let paletteIndex = 0;
let filteredCommands = [...COMMANDS];

function openPalette() {
  paletteModal.classList.add('active');
  paletteInput.value = '';
  paletteIndex = 0;
  renderPalette();
  setTimeout(() => paletteInput.focus(), 100);
}

function closePalette() { paletteModal.classList.remove('active'); }

function renderPalette() {
  const q = paletteInput.value.toLowerCase().trim();
  filteredCommands = q ? COMMANDS.filter(c => c.name.toLowerCase().includes(q)) : COMMANDS;
  paletteList.innerHTML = '';

  if (filteredCommands.length === 0) {
    paletteList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-dim);">No commands found</div>';
    return;
  }

  filteredCommands.forEach((cmd, i) => {
    const item = document.createElement('div');
    item.className = 'palette-item' + (i === paletteIndex ? ' active' : '');
    item.innerHTML = `
      <span class="cmd-icon">${cmd.icon}</span>
      <span>${cmd.name}</span>
      ${cmd.shortcut ? `<span class="cmd-shortcut">${cmd.shortcut}</span>` : ''}
    `;
    item.onclick = () => { closePalette(); cmd.action(); };
    paletteList.appendChild(item);
  });
}

paletteInput?.addEventListener('input', () => { paletteIndex = 0; renderPalette(); });
paletteInput?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    paletteIndex = Math.min(paletteIndex + 1, filteredCommands.length - 1);
    renderPalette();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    paletteIndex = Math.max(paletteIndex - 1, 0);
    renderPalette();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (filteredCommands[paletteIndex]) {
      closePalette();
      filteredCommands[paletteIndex].action();
    }
  }
});

paletteModal?.querySelector('.modal-backdrop')?.addEventListener('click', closePalette);

/* ═══════════════════════════════════════════
   LANGUAGE
   ═══════════════════════════════════════════ */
$('lang-select')?.addEventListener('change', (e) => {
  currentLang = e.target.value;
  localStorage.setItem('lang', currentLang);
  applyLanguage();
  toast(`Language: ${currentLang.toUpperCase()}`, 'success');
});

function applyLanguage() {
  if (inputEl) inputEl.placeholder = t('placeholder');
  const searchEl = $('chat-search');
  if (searchEl) searchEl.placeholder = t('searchChats');
  if (newChatBtn) newChatBtn.querySelector('span').textContent = t('newChat');
  if (authTitle) authTitle.textContent = isLoginMode ? t('login') : t('signup');
  if (authSubtitle) authSubtitle.textContent = isLoginMode ? t('loginSub') : t('signupSub');
  const langSel = $('lang-select');
  if (langSel) langSel.value = currentLang;
}

/* ═══════════════════════════════════════════
   PROMPT TEMPLATES
   ═══════════════════════════════════════════ */
document.querySelectorAll('.template-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    inputEl.value = btn.dataset.prompt + ' ';
    inputEl.focus();
    inputEl.dispatchEvent(new Event('input'));
    inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
  });
});

/* ═══════════════════════════════════════════
   DRAFT AUTO-SAVE
   ═══════════════════════════════════════════ */
window.addEventListener('load', () => {
  const draft = localStorage.getItem('aura-draft');
  if (draft && inputEl && !inputEl.value) {
    inputEl.value = draft;
    inputEl.dispatchEvent(new Event('input'));
    if (draft.length > 5) toast('📝 Draft restored', 'info', 2000);
  }
  applyLanguage();
});

/* ═══════════════════════════════════════════
   KEYBOARD SHORTCUTS (unified)
   ═══════════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    resetChat();
    toast('New chat created', 'success', 1500);
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
    e.preventDefault();
    openPalette();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key === '/') {
    e.preventDefault();
    inputEl.focus();
    return;
  }
  if (e.key === 'Escape') {
    if (token) authModal.classList.remove('active');
    userDropdown.classList.remove('open');
    sidebar.classList.remove('open');
    closePalette();
    closeLightbox();
    themeModal?.classList.remove('active');
    analyticsModal?.classList.remove('active');
    settingsModal?.classList.remove('active');
    favoritesModal?.classList.remove('active');
    passwordModal?.classList.remove('active');
    imageGenModal?.classList.remove('active');
  }
});

/* ═══════════════════════════════════════════
   CLOSE MODAL BACKDROP (Auth)
   ═══════════════════════════════════════════ */
authModal.querySelector('.modal-backdrop').addEventListener('click', () => {
  if (token) authModal.classList.remove('active');
});

/* ═══════════════════════════════════════════
   CLEANUP
   ═══════════════════════════════════════════ */
window.addEventListener('beforeunload', () => {
  if (particlesAnimId) cancelAnimationFrame(particlesAnimId);
});

setTimeout(() => {
  toast('💡 Press Ctrl+P for commands, Ctrl+K for new chat', 'info', 5000);
}, 1500);

/* ═══════════════════════════════════════════
   SETTINGS PANEL
   ═══════════════════════════════════════════ */
const DEFAULT_SETTINGS = {
  theme: 'dark',
  accent: { accent: '#6366f1', accent2: '#a855f7', accent3: '#ec4899' },
  fontSize: 'medium',
  density: 'comfortable',
  animations: true,
  particles: true,
  model: 'openai/gpt-oss-120b',
  temperature: 0.7,
  maxTokens: 1024,
  systemPrompt: 'You are AURA AI, a helpful, intelligent, and concise assistant.',
  autoSpeak: false,
  sounds: false,
  autoSave: true,
  sendEnter: true,
  showTime: true
};

function getSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('aura-settings') || '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings) {
  localStorage.setItem('aura-settings', JSON.stringify(settings));
}

function applySettings() {
  const s = getSettings();

  document.documentElement.setAttribute('data-theme', s.theme);
  if (themeBtn) themeBtn.textContent = s.theme === 'light' ? '☀️' : '🌙';

  if (s.accent) {
    document.documentElement.style.setProperty('--accent', s.accent.accent);
    document.documentElement.style.setProperty('--accent-2', s.accent.accent2);
    document.documentElement.style.setProperty('--accent-3', s.accent.accent3);
  }

  document.body.className = document.body.className.replace(/font-\w+/g, '').trim();
  document.body.classList.add(`font-${s.fontSize}`);

  document.body.className = document.body.className.replace(/density-\w+/g, '').trim();
  document.body.classList.add(`density-${s.density}`);

  document.body.classList.toggle('no-animations', !s.animations);
  document.body.classList.toggle('no-particles', !s.particles);

  localStorage.setItem('auto-speak', s.autoSpeak);
  updateSpeakBtn();
}

$('settings-btn')?.addEventListener('click', () => {
  userDropdown.classList.remove('open');
  loadSettingsUI();
  settingsModal.classList.add('active');
});

$('close-settings')?.addEventListener('click', () => settingsModal.classList.remove('active'));
settingsModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => settingsModal.classList.remove('active'));

document.querySelectorAll('.settings-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.settings-panel[data-panel="${tab.dataset.tab}"]`)?.classList.add('active');
  });
});

function loadSettingsUI() {
  const s = getSettings();

  const themeSel = $('setting-theme');
  if (themeSel) themeSel.value = s.theme;

  const fontSel = $('setting-font-size');
  if (fontSel) fontSel.value = s.fontSize;

  const densSel = $('setting-density');
  if (densSel) densSel.value = s.density;

  const animChk = $('setting-animations');
  if (animChk) animChk.checked = s.animations;

  const partChk = $('setting-particles');
  if (partChk) partChk.checked = s.particles;

  document.querySelectorAll('.mini-swatch').forEach(sw => {
    sw.classList.toggle('active',
      sw.dataset.accent === s.accent?.accent &&
      sw.dataset.accent2 === s.accent?.accent2
    );
  });

  const modelSel = $('setting-model');
  if (modelSel) modelSel.value = s.model;

  const tempRange = $('setting-temperature');
  if (tempRange) {
    tempRange.value = s.temperature;
    $('temperature-value').textContent = s.temperature;
  }

  const tokRange = $('setting-max-tokens');
  if (tokRange) {
    tokRange.value = s.maxTokens;
    $('max-tokens-value').textContent = s.maxTokens;
  }

  const sysPrompt = $('setting-system-prompt');
  if (sysPrompt) sysPrompt.value = s.systemPrompt;

  const asChk = $('setting-auto-speak');
  if (asChk) asChk.checked = s.autoSpeak;

  const sndChk = $('setting-sounds');
  if (sndChk) sndChk.checked = s.sounds;

  const asvChk = $('setting-auto-save');
  if (asvChk) asvChk.checked = s.autoSave;

  const seChk = $('setting-send-enter');
  if (seChk) seChk.checked = s.sendEnter;

  const stChk = $('setting-show-time');
  if (stChk) stChk.checked = s.showTime;

  updateDataStats();

  const username = localStorage.getItem('username') || 'User';
  const accName = $('account-name');
  const accAvatar = $('account-avatar');
  if (accName) accName.textContent = username;
  if (accAvatar) accAvatar.textContent = username[0].toUpperCase();
}

function updateDataStats() {
  const totalChats = $('data-total-chats');
  if (totalChats) totalChats.textContent = allChats.length;

  const favs = JSON.parse(localStorage.getItem('aura-favorites') || '[]');
  const favCount = $('data-favorites-count');
  if (favCount) favCount.textContent = favs.length;

  let bytes = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      bytes += (localStorage[key] || '').length + key.length;
    }
  }
  const kb = (bytes / 1024).toFixed(2);
  const storageEl = $('data-storage');
  if (storageEl) storageEl.textContent = `${kb} KB`;
}

/* ─────── APPEARANCE HANDLERS ─────── */
$('setting-theme')?.addEventListener('change', (e) => {
  const s = getSettings();
  s.theme = e.target.value;
  saveSettings(s);
  applySettings();
  toast(`Theme: ${s.theme}`, 'success');
});

$('setting-font-size')?.addEventListener('change', (e) => {
  const s = getSettings();
  s.fontSize = e.target.value;
  saveSettings(s);
  applySettings();
  toast(`Font: ${s.fontSize}`, 'success');
});

$('setting-density')?.addEventListener('change', (e) => {
  const s = getSettings();
  s.density = e.target.value;
  saveSettings(s);
  applySettings();
  toast(`Density: ${s.density}`, 'success');
});

$('setting-animations')?.addEventListener('change', (e) => {
  const s = getSettings();
  s.animations = e.target.checked;
  saveSettings(s);
  applySettings();
});

$('setting-particles')?.addEventListener('change', (e) => {
  const s = getSettings();
  s.particles = e.target.checked;
  saveSettings(s);
  applySettings();
});

document.querySelectorAll('.mini-swatch').forEach(sw => {
  sw.addEventListener('click', () => {
    const s = getSettings();
    s.accent = {
      accent: sw.dataset.accent,
      accent2: sw.dataset.accent2,
      accent3: sw.dataset.accent3
    };
    saveSettings(s);
    applySettings();
    document.querySelectorAll('.mini-swatch').forEach(x => x.classList.remove('active'));
    sw.classList.add('active');
    toast('Accent updated!', 'success');
  });
});

/* ─────── AI HANDLERS ─────── */
$('setting-model')?.addEventListener('change', (e) => {
  const s = getSettings();
  s.model = e.target.value;
  saveSettings(s);
  const modelSel = $('model-select');
  if (modelSel) modelSel.value = s.model;
  toast(`Model: ${s.model}`, 'success');
});

$('setting-temperature')?.addEventListener('input', (e) => {
  $('temperature-value').textContent = e.target.value;
  const s = getSettings();
  s.temperature = parseFloat(e.target.value);
  saveSettings(s);
});

$('setting-max-tokens')?.addEventListener('input', (e) => {
  $('max-tokens-value').textContent = e.target.value;
  const s = getSettings();
  s.maxTokens = parseInt(e.target.value);
  saveSettings(s);
});

$('setting-system-prompt')?.addEventListener('input', (e) => {
  const s = getSettings();
  s.systemPrompt = e.target.value;
  saveSettings(s);
});

/* ─────── BEHAVIOR HANDLERS ─────── */
$('setting-auto-speak')?.addEventListener('change', (e) => {
  const s = getSettings();
  s.autoSpeak = e.target.checked;
  saveSettings(s);
  localStorage.setItem('auto-speak', e.target.checked);
  updateSpeakBtn();
  toast(e.target.checked ? 'Auto-speak ON' : 'Auto-speak OFF', 'success');
});

$('setting-sounds')?.addEventListener('change', (e) => {
  const s = getSettings();
  s.sounds = e.target.checked;
  saveSettings(s);
});

$('setting-auto-save')?.addEventListener('change', (e) => {
  const s = getSettings();
  s.autoSave = e.target.checked;
  saveSettings(s);
});

$('setting-send-enter')?.addEventListener('change', (e) => {
  const s = getSettings();
  s.sendEnter = e.target.checked;
  saveSettings(s);
});

$('setting-show-time')?.addEventListener('change', (e) => {
  const s = getSettings();
  s.showTime = e.target.checked;
  saveSettings(s);
});

/* ─────── DATA HANDLERS ─────── */
$('data-export')?.addEventListener('click', () => {
  const data = {
    settings: getSettings(),
    favorites: JSON.parse(localStorage.getItem('aura-favorites') || '[]'),
    stats: JSON.parse(localStorage.getItem('aura-stats') || '{}'),
    exportedAt: new Date().toISOString(),
    version: '2.0.0'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aura-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Data exported!', 'success');
});

$('data-import')?.addEventListener('click', () => {
  $('data-import-input')?.click();
});

$('data-import-input')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.settings) saveSettings(data.settings);
      if (data.favorites) localStorage.setItem('aura-favorites', JSON.stringify(data.favorites));
      if (data.stats) localStorage.setItem('aura-stats', JSON.stringify(data.stats));
      applySettings();
      loadSettingsUI();
      toast('Data imported!', 'success');
    } catch {
      toast('Invalid file', 'error');
    }
  };
  reader.readAsText(file);
});

$('data-clear-draft')?.addEventListener('click', () => {
  localStorage.removeItem('aura-draft');
  inputEl.value = '';
  inputEl.dispatchEvent(new Event('input'));
  toast('Draft cleared', 'success');
});

$('data-clear-all')?.addEventListener('click', () => {
  if (!confirm('Clear all local data (settings, drafts, stats)?')) return;
  const keepToken = localStorage.getItem('token');
  const keepUsername = localStorage.getItem('username');
  localStorage.clear();
  if (keepToken) localStorage.setItem('token', keepToken);
  if (keepUsername) localStorage.setItem('username', keepUsername);
  applySettings();
  loadSettingsUI();
  toast('All local data cleared', 'success');
});

$('data-delete-chats')?.addEventListener('click', async () => {
  if (!confirm('Delete ALL chats permanently? This cannot be undone!')) return;
  try {
    for (const chat of allChats) {
      await fetch(`${API_URL}/chat/${chat._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    resetChat();
    loadChats();
    updateDataStats();
    toast('All chats deleted', 'success');
  } catch (err) {
    toast('Failed: ' + err.message, 'error');
  }
});

/* ─────── ACCOUNT HANDLERS ─────── */
$('account-change-username')?.addEventListener('click', () => {
  const cur = localStorage.getItem('username') || '';
  const newName = prompt('Enter new username:', cur);
  if (!newName || newName === cur) return;
  if (newName.length < 3) return toast('Min 3 characters', 'error');
  localStorage.setItem('username', newName);
  userName.textContent = newName;
  userAvatar.textContent = newName[0].toUpperCase();
  loadSettingsUI();
  toast('Username updated (locally)', 'success');
});

$('account-change-password')?.addEventListener('click', () => {
  $('old-password').value = '';
  $('new-password').value = '';
  $('confirm-password').value = '';
  updatePasswordStrength('');
  passwordModal.classList.add('active');
});

$('account-logout')?.addEventListener('click', () => logoutBtn.click());

$('account-delete')?.addEventListener('click', async () => {
  if (!confirm('⚠️ PERMANENTLY delete your account and ALL chats?')) return;
  if (!confirm('This CANNOT be undone. Are you absolutely sure?')) return;

  const username = localStorage.getItem('username');
  const password = prompt('Enter your password to confirm deletion:');
  if (!password) return toast('Deletion cancelled', 'info');

  try {
    const res = await fetch(`${API_URL}/auth/delete-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    toast('Account deleted', 'success');
    localStorage.clear();
    setTimeout(() => location.reload(), 1500);
  } catch (err) {
    toast('Delete failed: ' + err.message, 'error');
  }
});

/* ─────── FAVORITES MODAL ─────── */
$('favorites-btn')?.addEventListener('click', () => {
  userDropdown.classList.remove('open');
  renderFavorites();
  favoritesModal.classList.add('active');
});

$('close-favorites')?.addEventListener('click', () => favoritesModal.classList.remove('active'));
favoritesModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => favoritesModal.classList.remove('active'));

function renderFavorites() {
  const favs = JSON.parse(localStorage.getItem('aura-favorites') || '[]');
  const list = $('favorites-list');
  if (!list) return;

  if (favs.length === 0) {
    list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-dim);">No favorites yet. Click ⭐ on any AI reply!</div>';
    return;
  }

  list.innerHTML = favs.map((f, i) => `
    <div class="favorite-item">
      <div>${escapeHtml(f.text.substring(0, 300))}${f.text.length > 300 ? '...' : ''}</div>
      <span class="favorite-date">${new Date(f.savedAt).toLocaleString()}</span>
      <div class="favorite-actions">
        <button class="copy-msg-btn" data-copy="${i}">📋 Copy</button>
        <button class="copy-msg-btn" data-remove="${i}">🗑️ Remove</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-copy]').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.copy);
      navigator.clipboard.writeText(favs[idx].text);
      toast('Copied!', 'success');
    };
  });

  list.querySelectorAll('[data-remove]').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.remove);
      const arr = JSON.parse(localStorage.getItem('aura-favorites') || '[]');
      arr.splice(idx, 1);
      localStorage.setItem('aura-favorites', JSON.stringify(arr));
      renderFavorites();
      toast('Removed from favorites', 'success');
    };
  });
}

/* ═══════════════════════════════════════════
   PASSWORD CHANGE LOGIC
   ═══════════════════════════════════════════ */

$('cancel-password')?.addEventListener('click', () => passwordModal.classList.remove('active'));
passwordModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => passwordModal.classList.remove('active'));

function checkPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 1) return { level: 'weak', score: 1 };
  if (score <= 3) return { level: 'medium', score: 2 };
  return { level: 'strong', score: 3 };
}

function updatePasswordStrength(pwd) {
  const wrap = $('password-strength');
  if (!wrap) return;

  if (!pwd) {
    wrap.innerHTML = '';
    return;
  }

  const { level, score } = checkPasswordStrength(pwd);
  const labels = { weak: 'Weak', medium: 'Medium', strong: 'Strong' };

  wrap.innerHTML = `
    <div class="password-strength-bar ${score >= 1 ? 'active-' + level : ''}"></div>
    <div class="password-strength-bar ${score >= 2 ? 'active-' + level : ''}"></div>
    <div class="password-strength-bar ${score >= 3 ? 'active-' + level : ''}"></div>
    <span class="password-strength-text ${level}">${labels[level]}</span>
  `;
}

$('new-password')?.addEventListener('input', (e) => {
  updatePasswordStrength(e.target.value);
});

$('submit-password-change')?.addEventListener('click', async () => {
  const username = localStorage.getItem('username');
  const oldPassword = $('old-password').value.trim();
  const newPassword = $('new-password').value.trim();
  const confirmPassword = $('confirm-password').value.trim();

  if (!username) return toast('Not logged in', 'error');
  if (!oldPassword || !newPassword || !confirmPassword) return toast('Please fill all fields', 'error');
  if (newPassword.length < 6) return toast('New password must be 6+ characters', 'error');
  if (newPassword !== confirmPassword) return toast('New passwords do not match', 'error');
  if (oldPassword === newPassword) return toast('New password must be different', 'error');

  const btnText = $('password-btn-text');
  const btn = $('submit-password-change');
  btnText.textContent = 'Updating...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, oldPassword, newPassword })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    passwordModal.classList.remove('active');
    toast('✅ Password updated successfully!', 'success', 5000);

    $('old-password').value = '';
    $('new-password').value = '';
    $('confirm-password').value = '';
    updatePasswordStrength('');
  } catch (err) {
    toast(err.message, 'error', 5000);
  } finally {
    btnText.textContent = 'Update Password';
    btn.disabled = false;
  }
});

['old-password', 'new-password', 'confirm-password'].forEach(id => {
  $(id)?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('submit-password-change').click();
  });
});

/* ═══════════════════════════════════════════
   FILE UPLOAD — BULLETPROOF VERSION v3
   Replaces any previous upload code
   ═══════════════════════════════════════════ */

(function initFileUpload() {
  console.log('🔧 File upload: Initializing...');

  // Wait for DOM to be ready
  function whenReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  whenReady(() => {
    const attachBtn = document.getElementById('attach-btn');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');

    console.log('🔧 attachBtn:', attachBtn);
    console.log('🔧 fileInput:', fileInput);
    console.log('🔧 filePreview:', filePreview);

    if (!attachBtn) {
      console.error('❌ attach-btn not found in HTML!');
      return;
    }
    if (!fileInput) {
      console.error('❌ file-input not found in HTML!');
      return;
    }

    // Initialize global attachedFiles if not present
    if (!window.attachedFiles) window.attachedFiles = [];

    // ───── CLICK HANDLER (bulletproof) ─────
    // Remove any old listeners by cloning the button
    const newAttachBtn = attachBtn.cloneNode(true);
    attachBtn.parentNode.replaceChild(newAttachBtn, attachBtn);

    newAttachBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('📎 Attach button clicked!');
      fileInput.click();
    });

    console.log('✅ Attach button click handler attached');

    // ───── FILE SELECTION HANDLER ─────
    // Replace input to remove any old listeners
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);

    newFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      console.log('📄 File selected:', file.name, file.size, 'bytes');

      if (file.size > 10 * 1024 * 1024) {
        if (typeof toast === 'function') toast('File too large (max 10MB)', 'error');
        else alert('File too large (max 10MB)');
        newFileInput.value = '';
        return;
      }

      // Show "uploading" toast
      if (typeof toast === 'function') toast('Uploading ' + file.name + '...', 'info', 2000);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (typeof toast === 'function') toast('Not logged in', 'error');
          return;
        }

        const res = await fetch('http://localhost:5000/api/chat/upload', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
          body: formData
        });

        console.log('📡 Upload response status:', res.status);

        const data = await res.json();
        console.log('📡 Upload response:', data);

        if (!res.ok) throw new Error(data.error || 'Upload failed');

        window.attachedFiles.push(data);
        console.log('✅ File added to attachedFiles:', data);

        // Render preview
        renderPreview();

        if (typeof toast === 'function') toast('File attached ✅', 'success');
      } catch (err) {
        console.error('❌ Upload error:', err);
        if (typeof toast === 'function') toast('Upload failed: ' + err.message, 'error');
        else alert('Upload failed: ' + err.message);
      }

      newFileInput.value = '';
    });

    console.log('✅ File input change handler attached');

    // ───── PREVIEW RENDERER ─────
    function renderPreview() {
      if (!filePreview) {
        console.warn('⚠️ file-preview element missing');
        return;
      }

      filePreview.innerHTML = '';

      window.attachedFiles.forEach((f, i) => {
        const chip = document.createElement('div');
        chip.className = 'file-chip';
        chip.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 12px;
          color: var(--text, #f0f0f5);
          margin: 4px;
        `;

        const isImg = f.type && f.type.startsWith('image/');
        const imgUrl = 'http://localhost:5000' + f.url;

        chip.innerHTML = `
          ${isImg ? `<img src="${imgUrl}" style="width:32px;height:32px;border-radius:6px;object-fit:cover;" />` : '<span style="font-size:20px;">📄</span>'}
          <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${f.name}</span>
          <button class="file-remove" style="background:transparent;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:0 4px;">✕</button>
        `;

        chip.querySelector('.file-remove').onclick = (e) => {
          e.stopPropagation();
          window.attachedFiles.splice(i, 1);
          renderPreview();
          console.log('🗑️ File removed');
        };

        filePreview.appendChild(chip);
      });

      console.log('🎨 Preview rendered. Total files:', window.attachedFiles.length);
    }

    // Expose for other code
    window.renderFilePreview = renderPreview;
    window.renderFilePreview = renderPreview;

    console.log('✅ File upload initialized successfully!');
  });
})();

/* ═══════════════════════════════════════════
   APPLY SETTINGS ON LOAD
   ═══════════════════════════════════════════ */
applySettings();