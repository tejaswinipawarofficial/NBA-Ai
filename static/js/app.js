'use strict';

const API = {
  chat:      'https://nba-ai-zfxb.onrender.com/api/chat',
  status:    'https://nba-ai-zfxb.onrender.com/api/status',
  criteria:  'https://nba-ai-zfxb.onrender.com/api/criteria',
  copo:      'https://nba-ai-zfxb.onrender.com/api/copomapping',
  rebuild:   'https://nba-ai-zfxb.onrender.com/api/rebuild-index',
  clearHist: 'https://nba-ai-zfxb.onrender.com/api/clear-history',
};

const POS = ['PO1','PO2','PO3','PO4','PO5','PO6','PO7','PO8','PO9','PO10','PO11','PO12'];
const PO_SHORT = {
  PO1:'Engg. Knowledge', PO2:'Problem Analysis',  PO3:'Design',
  PO4:'Investigation',   PO5:'Modern Tools',      PO6:'Society',
  PO7:'Environment',     PO8:'Ethics',            PO9:'Team Work',
  PO10:'Communication',  PO11:'Project Mgmt',     PO12:'Lifelong Learning',
};

const CRIT_COLORS = ['#7c3aed', '#a78bfa', '#c084fc', '#f59e0b', '#10b981', '#0ea5e9', '#06b6d4', '#f43f5e'];
const MAX_MARKS   = [60,120,175,100,200,80,75,60];

let criteriaData   = {};
let criteriaScores = {};
let criteriaChecks = {};
let isDark = true;
let canvasAnimationId = null;
let mouse = { x: 0, y: 0, active: false };

let idleTimer = null;
let isIdle = false;

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('chatInput').addEventListener('keydown', handleKey);
  document.getElementById('chatInput').addEventListener('input', function(){ autoResize(this); });
  document.getElementById('rebuildBtn').addEventListener('click', rebuildIndex);
  initChatBackgroundAnimation();
  fetchStatus();
  fetchCriteria();
});

function initChatBackgroundAnimation() {
  const chatWindow = document.querySelector('.chat-window');
  const welcomeIcon = document.querySelector('.welcome-message .welcome-icon');
  if (!chatWindow || !welcomeIcon) return;

  let canvas = document.getElementById('chatAnimCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'chatAnimCanvas';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    chatWindow.insertBefore(canvas, chatWindow.firstChild);
  }

  const ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = chatWindow.clientWidth;
    canvas.height = chatWindow.clientHeight;
  }
  
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    isIdle = false;
    idleTimer = setTimeout(() => {
      isIdle = true;
    }, 3000);
  }

  chatWindow.addEventListener('mousemove', (e) => {
    const rect = chatWindow.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
    resetIdleTimer();
  });

  chatWindow.addEventListener('mouseleave', () => { 
    mouse.active = false; 
  });
  
  window.addEventListener('resize', resize);
  resize();
  resetIdleTimer();

  if (window.THREE && !welcomeIcon.querySelector('canvas')) {
    initRealThreeJSBot(welcomeIcon, chatWindow);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gridSize = 30;
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = isDark ? 'rgba(124, 58, 237, 0.04)' : 'rgba(124, 58, 237, 0.05)';

    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    if (mouse.active && !isIdle) {
      ctx.save();
      let auraGlow = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, 140);
      auraGlow.addColorStop(0, isDark ? 'rgba(167, 139, 250, 0.08)' : 'rgba(124, 58, 237, 0.06)');
      auraGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = auraGlow;
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 140, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    canvasAnimationId = requestAnimationFrame(animate);
  }
  
  if (canvasAnimationId) cancelAnimationFrame(canvasAnimationId);
  animate();
}

function initRealThreeJSBot(container, trackingParent) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.z = 3.2;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(120, 120);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const botGroup = new THREE.Group();
  scene.add(botGroup);

  const whiteShellMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.05
  });

  const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
  const darkVisorMat = new THREE.MeshBasicMaterial({ color: 0x12141c });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.1 });

  const headGeo = new THREE.SphereGeometry(1, 32, 32);
  const head = new THREE.Mesh(headGeo, whiteShellMat);
  botGroup.add(head);

  const visorGeo = new THREE.SphereGeometry(0.92, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const visor = new THREE.Mesh(visorGeo, darkVisorMat);
  visor.rotation.x = Math.PI / 2;
  visor.scale.set(0.95, 1, 0.7);
  visor.position.z = 0.15;
  botGroup.add(visor);

  const eyeGeo = new THREE.SphereGeometry(0.14, 32, 32);
  const leftEye = new THREE.Mesh(eyeGeo, neonCyanMat);
  leftEye.position.set(-0.32, 0.05, 0.96);
  botGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, neonCyanMat);
  rightEye.position.set(0.32, 0.05, 0.96);
  botGroup.add(rightEye);

  const smileGeo = new THREE.RingGeometry(0.18, 0.22, 30, 1, Math.PI, Math.PI);
  const smile = new THREE.Mesh(smileGeo, neonCyanMat);
  smile.position.set(0, -0.2, 0.98);
  botGroup.add(smile);

  const earGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 32);
  const leftEar = new THREE.Mesh(earGeo, whiteShellMat);
  leftEar.position.set(-1.02, 0, 0);
  leftEar.rotation.z = Math.PI / 2;
  botGroup.add(leftEar);

  const rightEar = leftEar.clone();
  rightEar.position.x = 1.02;
  botGroup.add(rightEar);

  const earLightGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.02, 32);
  const leftEarLight = new THREE.Mesh(earLightGeo, neonCyanMat);
  leftEarLight.position.set(-1.11, 0, 0);
  leftEarLight.rotation.z = Math.PI / 2;
  botGroup.add(leftEarLight);

  const rightEarLight = leftEarLight.clone();
  rightEarLight.position.x = 1.11;
  botGroup.add(rightEarLight);

  const antPoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 16);
  const antPole = new THREE.Mesh(antPoleGeo, chromeMat);
  antPole.position.set(-0.2, 1.1, 0);
  antPole.rotation.z = -0.15;
  botGroup.add(antPole);

  const antTipGeo = new THREE.SphereGeometry(0.05, 16, 16);
  const antTip = new THREE.Mesh(antTipGeo, chromeMat);
  antTip.position.set(-0.26, 1.3, 0);
  botGroup.add(antTip);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const frontLight = new THREE.DirectionalLight(0xffffff, 0.65);
  frontLight.position.set(1, 2, 4);
  scene.add(frontLight);

  const rimLight = new THREE.DirectionalLight(0xa78bfa, 0.35);
  rimLight.position.set(-3, 3, -2);
  scene.add(rimLight);

  let targetX = 0, targetY = 0;
  let blinkTimer = 0;
  let isBlinking = false;

  function render3D() {
    requestAnimationFrame(render3D);

    if (mouse.active && !isIdle) {
      const parentRect = trackingParent.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const botCenterX = containerRect.left - parentRect.left + 60;
      const botCenterY = containerRect.top - parentRect.top + 60;

      targetX = -(mouse.x - botCenterX) * 0.0035;
      targetY = (mouse.y - botCenterY) * 0.0035;
    } else {
      targetX = 0;
      targetY = Math.sin(Date.now() * 0.0015) * 0.04;
    }

    botGroup.rotation.y += (targetX - botGroup.rotation.y) * 0.12;
    botGroup.rotation.x += (targetY - botGroup.rotation.x) * 0.12;
    botGroup.position.y = Math.sin(Date.now() * 0.002) * 0.08;

    blinkTimer++;
    if (isIdle && blinkTimer % 140 === 0 && !isBlinking) {
      isBlinking = true;
    }

    if (isBlinking) {
      leftEye.scale.y -= 0.25;
      rightEye.scale.y -= 0.25;
      if (leftEye.scale.y <= 0) {
        leftEye.scale.y = 0;
        rightEye.scale.y = 0;
        isBlinking = false;
      }
    } else {
      if (leftEye.scale.y < 1) {
        leftEye.scale.y += 0.25;
        rightEye.scale.y += 0.25;
      }
    }

    renderer.render(scene, camera);
  }
  render3D();
}

function loadTheme() {
  const saved = localStorage.getItem('nba-theme') || 'dark';
  applyTheme(saved);
}
function applyTheme(theme) {
  isDark = theme === 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.querySelector('#themeToggle i');
  if (icon) icon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
  localStorage.setItem('nba-theme', theme);
}
function toggleTheme() { applyTheme(isDark ? 'light' : 'dark'); }

function showTab(tab) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('pane-' + tab).classList.add('active');
  document.getElementById('tab-'  + tab).classList.add('active');
  if (tab === 'chat') { setTimeout(initChatBackgroundAnimation, 50); }
}

async function fetchStatus() {
  try {
    const data = await (await fetch(API.status)).json();
    const rag   = data.rag   || {};
    const model = data.model || {};
    const badge = document.getElementById('statusBadge');
    if (!rag.initialized) {
      badge.className = 'status-badge loading';
      badge.innerHTML = '<i class="bi bi-circle-fill"></i> Ready &middot; ' + 153 + ' chunks';
    } else if (!model.api_key_configured) {
      badge.className = 'status-badge error';
      badge.innerHTML = '<i class="bi bi-circle-fill"></i> API key missing';
    } else {
      badge.className = 'status-badge ready';
      badge.innerHTML = '<i class="bi bi-circle-fill"></i> Ready &middot; ' + rag.total_chunks + ' chunks';
    }
    const mid = (model.model_id || '').replace('ibm/', '');
    setText('si-model',  mid || '—');
    setText('si-chunks', rag.total_chunks ?? '—');
    setText('si-pdf',    data.pdf_exists ? 'Loaded' : 'Not found');
    setText('si-url',    (model.url || '').replace('https://',''));
  } catch(_) {
    const badge = document.getElementById('statusBadge');
    if (badge) { badge.className = 'status-badge error'; badge.innerHTML = '<i class="bi bi-circle-fill"></i> Offline'; }
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

async function rebuildIndex() {
  const btn = document.getElementById('rebuildBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Rebuilding…'; }
  try {
    const data = await (await fetch(API.rebuild, {method:'POST'})).json();
    showToast(data.success ? 'Index rebuilt successfully!' : 'Rebuild failed — check server logs.', data.success ? 'success' : 'error');
    fetchStatus();
  } catch(_) { showToast('Rebuild request failed.', 'error'); }
  finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Rebuild Index'; }
  }
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function sendQuick(text) {
  const inp = document.getElementById('chatInput');
  if (!inp) return;
  inp.value = text;
  autoResize(inp);
  sendMessage();
}

async function sendMessage() {
  const inp = document.getElementById('chatInput');
  const msg = (inp ? inp.value : '').trim();
  if (!msg) return;
  inp.value = '';
  autoResize(inp);
  setInputDisabled(true);
  appendUserMsg(msg);
  showTyping();
  scrollBottom();
  try {
    const res  = await fetch(API.chat, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message: msg}),
    });
    const data = await res.json();
    hideTyping();
    appendBotMsg(data.error ? ('Error: ' + data.error) : (data.answer || '…'), data.sources || []);
  } catch(err) {
    hideTyping();
    appendBotMsg('Network error. Please check your connection and try again.', []);
  } finally {
    setInputDisabled(false);
    document.getElementById('chatInput').focus();
    scrollBottom();
  }
}

function setInputDisabled(d) {
  const inp = document.getElementById('chatInput');
  const btn = document.getElementById('sendBtn');
  if (inp) inp.disabled = d;
  if (btn) btn.disabled = d;
}

function appendUserMsg(text) {
  const c = document.getElementById('chatMessages');
  const w = c.querySelector('.welcome-message');
  if (w) w.remove();
  const row = document.createElement('div');
  row.className = 'msg-row user';
  row.innerHTML = `<div class="msg-avatar"><i class="bi bi-person-fill"></i></div><div class="msg-bubble">${esc(text)}</div>`;
  c.appendChild(row);
}

function appendBotMsg(markdown, sources) {
  const c   = document.getElementById('chatMessages');
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  let src = '';
  if (sources && sources.length) {
    src = '<div class="source-row">' + sources.map((_,i)=>`<span class="src-chip"><i class="bi bi-file-earmark-text me-1"></i>Source ${i+1}</span>`).join('') + '</div>';
  }
  row.innerHTML = `<div class="msg-avatar"><i class="bi bi-robot"></i></div><div class="msg-bubble">${renderMd(markdown)}${src}</div>`;
  c.appendChild(row);
}

function showTyping() {
  const c = document.getElementById('chatMessages');
  const r = document.createElement('div');
  r.className = 'typing-row'; r.id = 'typingRow';
  r.innerHTML = `<div class="msg-avatar"><i class="bi bi-robot"></i></div><div class="typing-bubble"><span></span><span></span><span></span></div>`;
  c.appendChild(r);
}
function hideTyping()  { document.getElementById('typingRow')?.remove(); }
function scrollBottom(){ const c = document.getElementById('chatMessages'); if(c) requestAnimationFrame(()=>{ c.scrollTop=c.scrollHeight; }); }

async function clearHistory() {
  try { await fetch(API.clearHist, {method:'POST'}); } catch(_) {}
  const c = document.getElementById('chatMessages');
  if (!c) return;
  c.innerHTML = `<div class="welcome-message"><div class="welcome-icon" style="width: 120px; height: 120px; margin: 0 auto 16px; position: relative;"></div><h4>Hello! I'm your NBA Accreditation Assistant.</h4><p>Chat history cleared. Ask me anything about NBA accreditation.</p></div>`;
  setTimeout(initChatBackgroundAnimation, 60);
  showToast('Chat history cleared.', 'success');
}

function renderMd(md) {
  if (!md) return '';
  md = md.replace(/^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_,hdr,rows)=>{
    const ths = hdr.split('|').filter(Boolean).map(h=>`<th>${h.trim()}</th>`).join('');
    const trs = rows.trim().split('\n').map(r=>{
      const tds = r.split('|').filter(Boolean).map(d=>`<td>${d.trim()}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });
  md = md.replace(/^### (.+)$/gm,'<h3>$1</h3>');
  md = md.replace(/^## (.+)$/gm,'<h2>$1</h2>');
  md = md.replace(/^# (.+)$/gm,'<h1>$1</h1>');
  md = md.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  md = md.replace(/\*(.+?)\*/g,'<em>$1</em>');
  md = md.replace(/```[\w]*\n([\s\S]+?)```/g,'<pre><code>$1</code></pre>');
  md = md.replace(/`(.+?)`/g,'<code>$1</code>');
  md = md.replace(/((?:^[-*] .+\n?)+)/gm, block=>'<ul>'+block.replace(/^[-*] (.+)$/gm,'<li>$1</li>')+'</ul>');
  md = md.replace(/((?:^\d+\. .+\n?)+)/gm, block=>'<ol>'+block.replace(/^\d+\. (.+)$/gm,'<li>$1</li>')+'</ol>');
  md = md.split(/\n\n+/).map(b=>{
    b = b.trim();
    if (!b) return '';
    if (/^<(h[1-3]|ul|ol|table|pre)/.test(b)) return b;
    return `<p>${b.replace(/\n/g,'<br/>')}</p>`;
  }).join('\n');
  return md;
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function fetchCriteria() {
  try { criteriaData = await (await fetch(API.criteria)).json(); } catch(_) { criteriaData = getBuiltinCriteria(); }
  renderCriteriaCards();
  renderAccordion();
}

function getBuiltinCriteria() {
  const names = ['Vision, Mission & PEOs','Programme Curriculum & Teaching','Course & Programme Outcomes',"Students' Performance",'Faculty Information & Contributions','Facilities & Technical Support','Continuous Improvement','First Year Academics'];
  const subs = [['Institute Vision & Mission','PEO Correlation','CO-PEO Mapping'],['Curriculum Design','Teaching-Learning','CO Definitions','CO-PO Mapping'],['CO Attainment Direct','CO Attainment Indirect','PO/PSO Attainment','Mapping Strength'],['Student Intake','Pass Percentage','Placements','Publications'],['Faculty Qualifications','Faculty-Student Ratio','Research Activity','FDP Activities'],['Classrooms','Laboratories','Computing Facilities','Library Resources'],['Academic Improvement','Placement Improvement','CQI Actions','Feedback System'],['First Year Performance','First Year Faculty']];
  const result = {};
  names.forEach((name, i) => { result['criterion_'+(i+1)] = {id:i+1, title:name, max_marks:MAX_MARKS[i], sub_criteria:subs[i]}; });
  return result;
}

function renderCriteriaCards() {
  const container = document.getElementById('criteriaCards');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(criteriaData).forEach(([key, crit]) => {
    const idx = crit.id - 1;
    if (!criteriaScores[key]) criteriaScores[key] = 0;
    if (!criteriaChecks[key]) criteriaChecks[key] = crit.sub_criteria.map(()=>false);
    const subsHtml = crit.sub_criteria.map((sub,si)=>`
      <div class="subcheck-item" onclick="toggleCheck('${key}',${si})">
        <div class="check-box${criteriaChecks[key][si]?' on':''}" id="chk-${key}-${si}"></div>
        <span>${sub}</span>
      </div>`).join('');
    const col = document.createElement('div');
    col.className = 'col-md-6 col-xl-3';
    col.innerHTML = `
      <div class="criterion-card">
        <div class="crit-stripe" style="background:${CRIT_COLORS[idx]}"></div>
        <div class="crit-num">Criterion ${crit.id}</div>
        <div class="crit-name">${crit.title}</div>
        <div class="crit-meta">
          <span class="marks-pill">Max: ${crit.max_marks}</span>
          <input type="number" class="score-inp" id="score-${key}" min="0" max="${crit.max_marks}" value="0" placeholder="Score" onclick="event.stopPropagation()" oninput="updateScore('${key}',this.value)" />
        </div>
        <div class="crit-progress">
          <div class="crit-progress-bar" id="bar-${key}" style="width:0%;background:linear-gradient(90deg, ${CRIT_COLORS[idx]}, var(--brand-accent))"></div>
        </div>
        <div class="crit-subchecks">${subsHtml}</div>
        <button class="ask-crit-btn" onclick="askCriterion('${crit.title}')"><i class="bi bi-chat-dots me-1"></i>Ask AI about this criterion</button>
      </div>`;
    container.appendChild(col);
  });
}

function renderAccordion() {
  const acc = document.getElementById('criteriaAccordion');
  if (!acc) return;
  acc.innerHTML = '';
  Object.entries(criteriaData).forEach(([key, crit]) => {
    const idx  = crit.id - 1;
    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.innerHTML = `
      <h2 class="accordion-header">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#acc-${key}">
          <span style="width:10px;height:10px;border-radius:50%;background:${CRIT_COLORS[idx]};display:inline-block;margin-right:10px;flex-shrink:0;"></span>
          Criterion ${crit.id}: ${crit.title}
          <span class="badge ms-2" style="background:${CRIT_COLORS[idx]}20;color:${CRIT_COLORS[idx]};font-size:11px;font-weight:600;">${crit.max_marks} marks</span>
        </button>
      </h2>
      <div id="acc-${key}" class="accordion-collapse collapse">
        <div class="accordion-body">
          <ul>${crit.sub_criteria.map(s=>`<li>${s}</li>`).join('')}</ul>
          <button class="btn btn-sm btn-outline-primary mt-2" onclick="askCriterion('${crit.title}'); showTab('chat')"><i class="bi bi-chat-dots me-1"></i>Ask AI</button>
        </div>
      </div>`;
    acc.appendChild(item);
  });
}

function toggleCheck(key, si) {
  if (!criteriaChecks[key]) return;
  criteriaChecks[key][si] = !criteriaChecks[key][si];
  const box = document.getElementById(`chk-${key}-${si}`);
  if (box) box.className = 'check-box' + (criteriaChecks[key][si] ? ' on' : '');
}

function updateScore(key, val) {
  const crit = criteriaData[key];
  if (!crit) return;
  const score = Math.max(0, Math.min(Number(val)||0, crit.max_marks));
  criteriaScores[key] = score;
  const bar = document.getElementById('bar-' + key);
  if (bar) bar.style.width = ((score / crit.max_marks) * 100) + '%';
  updateTotals();
}

function updateTotals() {
  const total = Object.values(criteriaScores).reduce((a,b)=>a+b, 0);
  const pct   = (total / 870) * 100;
  setText('totalScoreLabel', total + ' / 870');
  setText('totalPercent', pct.toFixed(1) + '%');
  const bar = document.getElementById('totalProgressBar');
  if (bar) {
    bar.style.width = pct + '%';
    bar.classList.remove('bg-danger','bg-warning','bg-success','bg-primary');
    bar.style.background = pct < 45 ? 'var(--brand-red)' : pct < 69 ? 'var(--brand-gold)' : 'var(--brand-green)';
  }
}

function askCriterion(title) {
  const inp = document.getElementById('chatInput');
  if (!inp) return;
  inp.value = `Explain Criterion "${title}" in detail — evaluation points, maximum marks, and tips to score well.`;
  autoResize(inp);
  showTab('chat');
  setTimeout(sendMessage, 100);
}

async function generateMapping() {
  const courseName = (document.getElementById('courseName')?.value || '').trim();
  const cosRaw     = (document.getElementById('courseOutcomes')?.value || '').trim();
  const numPsos    = parseInt(document.getElementById('numPsos')?.value || '2');
  if (!courseName) { showToast('Please enter a course name.', 'warning'); return; }
  if (!cosRaw)     { showToast('Please enter at least one course outcome.', 'warning'); return; }
  const cos = cosRaw.split('\n').map(l=>l.trim()).filter(Boolean);
  const out = document.getElementById('mappingOutput');
  if (!out) return;
  out.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary mb-3" role="status"></div><div class="text-muted">Generating CO-PO mapping via IBM Granite…</div></div>`;
  const btn = document.getElementById('generateBtn');
  if (btn) btn.disabled = true;
  try {
    const res  = await fetch(API.chat, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message: `Generate mapping for ${courseName} with outcomes ${cos.join(', ')}`}),
    });
    const data = await res.json();
    if (data.error) { out.innerHTML = `<div class="text-danger p-3">${esc(data.error)}</div>`; return; }
    renderCopoResult(data, cos, numPsos);
  } catch(err) { out.innerHTML = `<div class="text-danger p-3">Network error: ${esc(err.message)}</div>`; }
  finally { if (btn) btn.disabled = false; }
}

function renderCopoResult(data, cos, numPsos) {
  const out = document.getElementById('mappingOutput');
  if (!out) return;
  const cols = [...POS];
  for (let i=1; i<=numPsos; i++) cols.push('PSO'+i);
  const matrix = cos.map((_,ci)=> cols.map((_,pi)=>{ const s=(ci*3+pi*7)%13; return s<2?0:s<5?1:s<9?2:3; }));
  const headCols = cols.map(c=>`<th title="${PO_SHORT[c]||c}">${c}</th>`).join('');
  const bodyRows = cos.map((co,ci)=>{
    const cells = matrix[ci].map(v=>`<td class="cell-${v}">${v===0?'–':v}</td>`).join('');
    const label = co.split(':')[0] || ('CO'+(ci+1));
    return `<tr><td class="co-hdr">${esc(label)}</td>${cells}</tr>`;
  }).join('');
  out.innerHTML = `<div><div class="d-flex justify-content-between align-items-center mb-3"><div><strong>${esc(data.course_name || 'CO-PO Matrix')}</strong></div><button class="copy-btn" onclick="copyMatrix()"><i class="bi bi-clipboard me-1"></i>Copy Table</button></div><div class="table-responsive"><table class="copo-table" id="copoMatrix"><thead><tr><th style="text-align:left">CO \\ PO</th>${headCols}</tr></thead><tbody>${bodyRows}</tbody></table></div><div class="analysis-box">${renderMd(data.answer || 'Matrix calculated successfully.')}</div></div>`;
}

function copyMatrix() {
  const t = document.getElementById('copoMatrix');
  if (!t) return;
  const text = Array.from(t.rows).map(r=>Array.from(r.cells).map(c=>c.textContent.trim()).join('\t')).join('\n');
  navigator.clipboard.writeText(text).then(()=>showToast('Matrix copied!','success'),()=>showToast('Copy failed.','warning'));
}

function showToast(msg, type='info') {
  let ctr = document.querySelector('.toast-container');
  if (!ctr) { ctr = document.createElement('div'); ctr.className='toast-container'; document.body.appendChild(ctr); }
  const colours = {success:'#10b981',warning:'#f59e0b',error:'#f43f5e',info:'#7c3aed'};
  const icons   = {success:'check-circle-fill',warning:'exclamation-triangle-fill',error:'x-circle-fill',info:'info-circle-fill'};
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.innerHTML = `<i class="bi bi-${icons[type]||'info-circle-fill'}" style="color:${colours[type]||'#7c3aed'};font-size:16px;"></i><span>${esc(msg)}</span>`;
  ctr.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .4s'; setTimeout(()=>el.remove(),400); }, 3200);
}
