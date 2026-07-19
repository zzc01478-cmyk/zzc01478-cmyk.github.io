const API_BASE = location.hostname === 'chenzhihong.online'
  ? 'api'
  : 'https://chenzhihong.online/tools/sim/api';
const ESIM_API = `${API_BASE}/esims`;
const ACCOUNT_API = `${API_BASE}/accounts`;
const VAULT_SALT = new TextEncoder().encode('ESIM_VAULT_SECURE_SALT');

let sims = [];
let accounts = [];
let filter = 'all';
let pendingDelete = null;
let vaultKey = null;
let toastTimer;
let resendTimer;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
})[char]);
const icons = () => window.lucide?.createIcons();

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: localStorage.getItem('esim_auth_token') || ''
  };
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    expireSession();
    throw new Error('登录已过期，请重新验证');
  }
  if (!response.ok) throw new Error(data.message || data.error || `请求失败 (${response.status})`);
  return data;
}

function showLogin() {
  $('#loginView').hidden = false;
  $('main').hidden = true;
  $('.mobile-nav').hidden = true;
  $('#authToggle').hidden = true;
  $('#otp').value = '';
  icons();
}

function showApp() {
  $('#loginView').hidden = true;
  $('main').hidden = false;
  $('.mobile-nav').hidden = false;
  $('#authToggle').hidden = false;
  icons();
  $('#main').focus();
}

function expireSession() {
  localStorage.removeItem('esim_auth_token');
  lockVault(false);
  showLogin();
}

async function sendAuthCode() {
  const button = $('#sendCodeButton');
  button.disabled = true;
  button.textContent = '正在发送...';
  try {
    await jsonRequest(`${API_BASE}/auth/send`, { method: 'POST' });
    let seconds = 60;
    button.textContent = `${seconds} 秒后可重发`;
    clearInterval(resendTimer);
    resendTimer = setInterval(() => {
      seconds -= 1;
      button.textContent = `${seconds} 秒后可重发`;
      if (seconds <= 0) {
        clearInterval(resendTimer);
        button.disabled = false;
        button.textContent = '向 Telegram 获取验证码';
      }
    }, 1000);
    toast('验证码已发送到 Telegram');
  } catch (error) {
    button.disabled = false;
    button.textContent = '向 Telegram 获取验证码';
    toast(error.message);
  }
}

async function verifyCode(event) {
  event.preventDefault();
  const code = $('#otp').value.trim();
  if (!/^[0-9]{6}$/.test(code)) return toast('请输入完整的 6 位数字验证码');

  const button = $('#loginButton');
  button.disabled = true;
  button.textContent = '正在验证...';
  try {
    const data = await jsonRequest(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    localStorage.setItem('esim_auth_token', data.token);
    await fetchSims();
    showApp();
    toast('验证成功');
  } catch (error) {
    toast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = '验证并进入';
  }
}

async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: authHeaders() });
  } finally {
    expireSession();
  }
}

function daysUntil(dateText) {
  if (!dateText) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(`${dateText}T00:00:00`) - today) / 86400000);
}

function countryCode(number) {
  const digits = String(number || '').replace(/\D/g, '');
  if (digits.startsWith('44')) return 'GB';
  if (digits.startsWith('49')) return 'DE';
  if (digits.startsWith('852')) return 'HK';
  if (digits.startsWith('63')) return 'PH';
  if (digits.startsWith('1')) return 'US';
  return 'SIM';
}

function maskNumber(value) {
  const text = String(value || '未登记号码');
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 6) return text;
  let seen = 0;
  return text.replace(/\d/g, digit => {
    seen += 1;
    return seen > digits.length - 4 ? digit : '•';
  });
}

function normalizeSim(sim) {
  const advance = Number(sim.notifyAdvance === '' || sim.notifyAdvance == null ? 15 : sim.notifyAdvance);
  const interval = Number(sim.notifyInterval === '' || sim.notifyInterval == null ? 1 : sim.notifyInterval);
  const maxTimes = Number(sim.notifyCount === '' || sim.notifyCount == null ? 0 : sim.notifyCount);
  const days = daysUntil(sim.expireDate);
  return {
    ...sim,
    code: countryCode(sim.number),
    days,
    status: days <= advance ? 'attention' : 'safe',
    platformsList: String(sim.platforms || '').split(/[,，\s]+/).map(item => item.trim()).filter(Boolean),
    advance,
    interval,
    maxTimes
  };
}

async function fetchSims() {
  try {
    sims = (await jsonRequest(ESIM_API, { headers: authHeaders() })).map(normalizeSim);
    renderSims();
    return true;
  } catch (error) {
    if (localStorage.getItem('esim_auth_token')) toast(error.message);
    return false;
  }
}

function renderSummary() {
  const safe = sims.filter(sim => sim.status === 'safe').length;
  const attention = sims.length - safe;
  const nearest = [...sims].sort((a, b) => String(a.expireDate).localeCompare(String(b.expireDate)))[0];
  $('#totalCount').textContent = `${sims.length} 张`;
  $('#safeCount').textContent = `${safe} 张`;
  $('#attentionCount').textContent = `${attention} 张`;
  $('#nearestDate').textContent = nearest?.expireDate || '-';
  $('#nearestHint').textContent = nearest
    ? `${nearest.name} · ${nearest.days < 0 ? `已过期 ${Math.abs(nearest.days)} 天` : `${nearest.days} 天`}`
    : '暂无资产';
}

function renderSims() {
  const query = $('#searchInput').value.trim().toLowerCase();
  const visible = sims.filter(sim => {
    const matchesStatus = filter === 'all' || sim.status === filter;
    const haystack = [sim.name, sim.number, sim.remark, ...sim.platformsList].join(' ').toLowerCase();
    return matchesStatus && haystack.includes(query);
  });

  $('#simRows').innerHTML = visible.map(sim => `
    <article class="asset-row" data-id="${esc(sim.id)}">
      <div class="sim-name"><span class="country-mark">${sim.code}</span><div><strong>${esc(sim.name)}</strong><span>${esc(maskNumber(sim.number))}</span><div class="platforms">${sim.platformsList.map(item => `<span class="tag">${esc(item)}</span>`).join('')}</div></div></div>
      <div class="cell" data-label="状态"><span class="status ${sim.status === 'attention' ? 'attention' : ''}">${sim.status === 'attention' ? '需关注' : '安全'}</span><span>${sim.days < 0 ? `已过期 ${Math.abs(sim.days)} 天` : `${sim.days} 天后到期`}</span></div>
      <div class="cell" data-label="到期日"><strong>${esc(sim.expireDate)}</strong><span>提前 ${sim.advance} 天提醒</span></div>
      <div class="cell" data-label="提醒规则"><strong>每 ${sim.interval} 天</strong><span>${sim.maxTimes ? `最多 ${sim.maxTimes} 次` : '次数不限'}${sim.remark ? ` · ${esc(sim.remark)}` : ''}</span></div>
      <div class="row-actions">
        <button class="icon-btn" type="button" data-sim-action="renew" data-tooltip="一键续期" aria-label="为 ${esc(sim.name)} 一键续期"><i data-lucide="refresh-cw"></i></button>
        <button class="icon-btn" type="button" data-sim-action="edit" data-tooltip="编辑记录" aria-label="编辑 ${esc(sim.name)}"><i data-lucide="pencil"></i></button>
        <button class="icon-btn" type="button" data-sim-action="delete" data-tooltip="删除记录" aria-label="删除 ${esc(sim.name)}"><i data-lucide="trash-2"></i></button>
      </div>
    </article>`).join('');
  $('#emptyState').hidden = visible.length > 0;
  renderSummary();
  icons();
}

function openSimDialog(sim = null) {
  const form = $('#simForm');
  form.reset();
  $('#simDialogTitle').textContent = sim ? '编辑号码' : '添加号码';
  form.elements.id.value = sim?.id || '';
  form.elements.name.value = sim?.name || '';
  form.elements.number.value = sim?.number || '';
  form.elements.cycle.value = sim?.cycle || 365;
  form.elements.expiry.value = sim?.expireDate || '';
  form.elements.remindDays.value = sim?.advance ?? 15;
  form.elements.interval.value = sim?.interval || 1;
  form.elements.maxTimes.value = sim?.maxTimes || 0;
  form.elements.platforms.value = sim?.platforms || '';
  form.elements.notes.value = sim?.remark || '';
  $('#simDialog').showModal();
}

async function saveSim(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = String(data.get('id'));
  const payload = {
    name: String(data.get('name')).trim(),
    number: String(data.get('number')).trim(),
    cycle: Number(data.get('cycle')),
    expireDate: String(data.get('expiry')),
    notifyAdvance: Number(data.get('remindDays')),
    notifyInterval: Number(data.get('interval')),
    notifyCount: Number(data.get('maxTimes')),
    platforms: String(data.get('platforms')).trim(),
    remark: String(data.get('notes')).trim()
  };
  if (id) payload.id = id;
  try {
    await jsonRequest(ESIM_API, {
      method: id ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(payload)
    });
    $('#simDialog').close();
    await fetchSims();
    toast(id ? '号码记录已更新' : '号码已加入保号计划');
  } catch (error) {
    toast(error.message);
  }
}

async function renewSim(sim) {
  if (!sim.cycle) return toast('请先为这张卡设置保号周期');
  if (!window.confirm(`确认已完成“${sim.name}”的保号操作？到期日将从今天起顺延 ${sim.cycle} 天。`)) return;
  const next = new Date();
  next.setDate(next.getDate() + Number(sim.cycle));
  try {
    await jsonRequest(ESIM_API, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ id: sim.id, expireDate: next.toISOString().slice(0, 10) })
    });
    await fetchSims();
    toast(`${sim.name} 已顺延续期`);
  } catch (error) {
    toast(error.message);
  }
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(value) {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

async function deriveVaultKey(password) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: VAULT_SALT, iterations: 100000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptString(value) {
  if (!value) return '';
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, vaultKey, new TextEncoder().encode(value));
  return `AES-GCM:${bufferToBase64(iv)}:${bufferToBase64(cipher)}`;
}

async function decryptString(value) {
  if (!value || !value.startsWith('AES-GCM:')) return value || '';
  const [, iv, cipher] = value.split(':');
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuffer(iv) },
    vaultKey,
    base64ToBuffer(cipher)
  );
  return new TextDecoder().decode(plain);
}

async function unlockVault() {
  const password = $('#vaultPassword').value;
  if (!password) return toast('请输入保险库主密码');
  try {
    vaultKey = await deriveVaultKey(password);
    const nextAccounts = await jsonRequest(ACCOUNT_API, { headers: authHeaders() });
    const encrypted = nextAccounts.find(account => account.password?.startsWith('AES-GCM:'));
    if (encrypted) await decryptString(encrypted.password);
    accounts = nextAccounts;
    $('#vaultPassword').value = '';
    $('#lockedPanel').hidden = true;
    $('#accountList').hidden = false;
    $('#lockAccounts').hidden = false;
    $('#addAccount').hidden = false;
    $('#accountHeading').textContent = '账号库已解锁';
    renderAccounts();
    toast('账号库已解锁');
  } catch (error) {
    vaultKey = null;
    toast(error.name === 'OperationError' ? '主密码不正确' : error.message);
  }
}

function lockVault(notify = true) {
  vaultKey = null;
  accounts = [];
  $('#lockedPanel').hidden = false;
  $('#accountList').hidden = true;
  $('#accountList').replaceChildren();
  $('#lockAccounts').hidden = true;
  $('#addAccount').hidden = true;
  $('#accountHeading').textContent = '账号库已锁定';
  if (notify) toast('账号库已锁定，密钥已从内存清除');
}

function renderAccounts() {
  $('#accountList').innerHTML = accounts.map(account => `
    <div class="account-row" data-id="${esc(account.id)}">
      <strong>${esc(account.region)}</strong>
      <span>${esc(account.account)}</span>
      <span data-password-id="${esc(account.id)}">${account.password ? '••••••••' : '未保存密码'}</span>
      <div class="row-actions">
        <button class="icon-btn" type="button" data-account-action="copy-account" data-tooltip="复制账号" aria-label="复制 ${esc(account.region)} 账号"><i data-lucide="copy"></i></button>
        ${account.password ? `<button class="icon-btn" type="button" data-account-action="toggle-password" data-tooltip="显示或隐藏密码" aria-label="显示或隐藏 ${esc(account.region)} 密码"><i data-lucide="eye"></i></button>` : ''}
        <button class="icon-btn" type="button" data-account-action="edit" data-tooltip="编辑账号" aria-label="编辑 ${esc(account.region)}"><i data-lucide="pencil"></i></button>
        <button class="icon-btn" type="button" data-account-action="delete" data-tooltip="删除账号" aria-label="删除 ${esc(account.region)}"><i data-lucide="trash-2"></i></button>
      </div>
    </div>`).join('') || '<div class="empty-state"><h3>账号库为空</h3><p>添加需要和号码一起维护的重要账号。</p></div>';
  icons();
}

async function copyText(value, label) {
  try {
    await navigator.clipboard.writeText(value);
    toast(`${label}已复制`);
  } catch {
    toast('复制失败，请手动选择');
  }
}

async function toggleAccountPassword(account) {
  const el = $(`[data-password-id="${CSS.escape(String(account.id))}"]`);
  if (el.textContent !== '••••••••') {
    el.textContent = '••••••••';
    return;
  }
  try {
    el.textContent = await decryptString(account.password);
  } catch {
    toast('主密码不正确，无法解密');
  }
}

async function openAccountDialog(account = null) {
  const form = $('#accountForm');
  form.reset();
  $('#accountDialogTitle').textContent = account ? '编辑账号' : '新增账号';
  form.elements.id.value = account?.id || '';
  form.elements.region.value = account?.region || '';
  form.elements.account.value = account?.account || '';
  form.elements.remark.value = account?.remark || '';
  if (account?.password) {
    try {
      form.elements.password.value = await decryptString(account.password);
    } catch {
      return toast('主密码不正确，无法编辑');
    }
  }
  $('#accountDialog').showModal();
}

async function saveAccount(event) {
  event.preventDefault();
  if (!vaultKey) return toast('请先解锁账号库');
  const data = new FormData(event.currentTarget);
  const id = String(data.get('id'));
  const payload = {
    region: String(data.get('region')).trim(),
    account: String(data.get('account')).trim(),
    password: await encryptString(String(data.get('password'))),
    remark: String(data.get('remark')).trim()
  };
  if (id) payload.id = id;
  try {
    await jsonRequest(ACCOUNT_API, {
      method: id ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(payload)
    });
    $('#accountDialog').close();
    accounts = await jsonRequest(ACCOUNT_API, { headers: authHeaders() });
    renderAccounts();
    toast(id ? '账号已更新' : '账号已加密保存');
  } catch (error) {
    toast(error.message);
  }
}

function askDelete(kind, item) {
  pendingDelete = { kind, id: item.id, name: item.name || item.region };
  $('#deleteCopy').textContent = `删除“${pendingDelete.name}”后无法恢复。`;
  $('#deleteDialog').showModal();
}

async function confirmDelete(event) {
  event.preventDefault();
  if (!pendingDelete) return;
  const isSim = pendingDelete.kind === 'sim';
  try {
    await jsonRequest(isSim ? ESIM_API : ACCOUNT_API, {
      method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ id: pendingDelete.id })
    });
    $('#deleteDialog').close();
    if (isSim) await fetchSims();
    else {
      accounts = await jsonRequest(ACCOUNT_API, { headers: authHeaders() });
      renderAccounts();
    }
    toast(`${pendingDelete.name} 已删除`);
  } catch (error) {
    toast(error.message);
  } finally {
    pendingDelete = null;
  }
}

function setTab(tab) {
  const isSim = tab === 'sim';
  $('#simPanel').hidden = !isSim;
  $('#accountPanel').hidden = isSim;
  $('#simTab').setAttribute('aria-selected', String(isSim));
  $('#accountTab').setAttribute('aria-selected', String(!isSim));
  $$('[data-mobile-tab]').forEach(button => {
    if (button.dataset.mobileTab === tab) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

$('#otp').addEventListener('input', event => {
  event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, '').slice(0, 6);
});
$('#loginForm').addEventListener('submit', verifyCode);
$('#sendCodeButton').addEventListener('click', sendAuthCode);
$('#authToggle').addEventListener('click', logout);
$('#simTab').addEventListener('click', () => setTab('sim'));
$('#accountTab').addEventListener('click', () => setTab('account'));
$$('[data-mobile-tab]').forEach(button => button.addEventListener('click', () => setTab(button.dataset.mobileTab)));
$('#searchInput').addEventListener('input', renderSims);
$$('.filter-btn').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  $$('.filter-btn').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  renderSims();
}));
$('#clearFilter').addEventListener('click', () => {
  filter = 'all';
  $('#searchInput').value = '';
  $$('.filter-btn').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.filter === 'all')));
  renderSims();
});
$('#addSim').addEventListener('click', () => openSimDialog());
$('#simForm').addEventListener('submit', saveSim);
$('#simRows').addEventListener('click', event => {
  const button = event.target.closest('[data-sim-action]');
  if (!button) return;
  const sim = sims.find(item => String(item.id) === button.closest('[data-id]').dataset.id);
  if (button.dataset.simAction === 'renew') renewSim(sim);
  if (button.dataset.simAction === 'edit') openSimDialog(sim);
  if (button.dataset.simAction === 'delete') askDelete('sim', sim);
});
$('#unlockAccounts').addEventListener('click', unlockVault);
$('#lockAccounts').addEventListener('click', () => lockVault());
$('#addAccount').addEventListener('click', () => openAccountDialog());
$('#accountForm').addEventListener('submit', saveAccount);
$('#accountList').addEventListener('click', async event => {
  const button = event.target.closest('[data-account-action]');
  if (!button) return;
  const account = accounts.find(item => String(item.id) === button.closest('[data-id]').dataset.id);
  if (button.dataset.accountAction === 'copy-account') copyText(account.account, '账号');
  if (button.dataset.accountAction === 'toggle-password') toggleAccountPassword(account);
  if (button.dataset.accountAction === 'edit') openAccountDialog(account);
  if (button.dataset.accountAction === 'delete') askDelete('account', account);
});
$('#confirmDelete').addEventListener('click', confirmDelete);
$$('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
}));

async function init() {
  icons();
  if (!localStorage.getItem('esim_auth_token')) return showLogin();
  if (await fetchSims()) showApp();
}

init();
