'use strict';

// --- State & persistence ---
const state = {
  username: null,
  logs: [] // { text, minutes, ts }
};

const LS_KEY = 'habitfire_state_v1';

const loadState = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      state.username = parsed.username || null;
      state.logs = Array.isArray(parsed.logs) ? parsed.logs : [];
    }
  } catch (_) { /* ignore */ }
};

const saveState = () => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (_) { /* ignore */ }
};

// --- Elements ---
const loginScreen = document.getElementById('loginScreen');
const mainScreen  = document.getElementById('mainScreen');

const usernameInput = document.getElementById('username');
const startBtn      = document.getElementById('startBtn');

const hello         = document.getElementById('hello');
const flameBtn      = document.getElementById('flameBtn');
const countBadge    = document.getElementById('countBadge');

const overlay       = document.getElementById('overlay');
const modal         = document.getElementById('logModal');
const closeModalBtn = document.getElementById('closeModal');
const activityInput = document.getElementById('activityInput');
const durationSelect= document.getElementById('durationSelect');
const logBtn        = document.getElementById('logBtn');

const streakCountEl = document.getElementById('streakCount');

// --- Helpers ---
function setScreens(showMain) {
  if (showMain) {
    loginScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
  } else {
    mainScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  }
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function populateDurations() {
  const frag = document.createDocumentFragment();
  for (let mins = 10; mins <= 300; mins += 10) {
    const opt = document.createElement('option');
    opt.value = String(mins);
    opt.textContent = formatDuration(mins);
    frag.appendChild(opt);
  }
  durationSelect.appendChild(frag);
}

function updateBadge() {
  const n = state.logs.length;
  if (n > 0) {
    countBadge.textContent = String(n);
    countBadge.classList.add('show');
  } else {
    countBadge.textContent = '';
    countBadge.classList.remove('show');
  }
}

// Convert timestamp to local YYYY-MM-DD key
function toDateKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Count consecutive days ending today that have at least one log
function calcStreak() {
  if (state.logs.length === 0) return 0;
  const datesWithLogs = new Set(state.logs.map(l => toDateKey(l.ts)));
  let streak = 0;
  const cur = new Date();
  while (true) {
    const key = toDateKey(cur);
    if (datesWithLogs.has(key)) {
      streak += 1;
    } else {
      break;
    }
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

function updateStreak() {
  const value = calcStreak();
  streakCountEl.textContent = String(value);
}

function openModal() {
  overlay.classList.add('open');
  modal.classList.add('open');
  activityInput.value = '';
  durationSelect.value = '';
  logBtn.disabled = true;
  setTimeout(() => activityInput.focus(), 50);
}

function closeModal() {
  overlay.classList.remove('open');
  modal.classList.remove('open');
}

function checkForm() {
  const textOk = activityInput.value.trim().length > 0;
  const durOk  = !!durationSelect.value;
  logBtn.disabled = !(textOk && durOk);
}

function login(username) {
  state.username = username;
  saveState();
  hello.textContent = `Hi, ${state.username}!`;
  setScreens(true);
  updateBadge();
  updateStreak();
}

function handleLog() {
  const text = activityInput.value.trim();
  const mins = parseInt(durationSelect.value, 10);
  if (!text || !mins) return;
  state.logs.push({ text, minutes: mins, ts: Date.now() });
  saveState();
  updateBadge();
  updateStreak();
  closeModal();
}

// --- Events ---
usernameInput.addEventListener('input', () => {
  startBtn.disabled = usernameInput.value.trim().length === 0;
});

startBtn.addEventListener('click', () => {
  const value = usernameInput.value.trim();
  if (!value) return;
  login(value);
});

usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!startBtn.disabled) startBtn.click();
  }
});

flameBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});

activityInput.addEventListener('input', checkForm);
durationSelect.addEventListener('change', checkForm);
logBtn.addEventListener('click', handleLog);

// --- Init ---
populateDurations();
loadState();
if (state.username) {
  usernameInput.value = state.username;
  hello.textContent = `Hi, ${state.username}!`;
  setScreens(true);
  updateBadge();
  updateStreak();
} else {
  setScreens(false);
  setTimeout(() => usernameInput.focus(), 60);
}
