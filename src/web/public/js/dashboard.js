let currentGuildId = null;

document.addEventListener('DOMContentLoaded', function() {
  loadStats();
  loadModules();
});

function showModule(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');
  event.currentTarget.classList.add('active');

  // Load specific module data
  if (name === 'moderation') loadWarns();
}

function loadStats() {
  fetch('/api/stats')
    .then(r => r.json())
    .then(data => {
      document.getElementById('serverCount').textContent = data.servers || '-';
      document.getElementById('welcomeCount').textContent = data.welcomeEnabled || '-';
      document.getElementById('ticketCount').textContent = data.openTickets || '-';
      document.getElementById('warnCount').textContent = data.totalWarns || '-';
    })
    .catch(() => {});
}

function loadModules() {
  if (!currentGuildId) return;
  fetch('/api/guild/' + currentGuildId)
    .then(r => r.json())
    .then(settings => {
      if (!settings || !settings.guild_id) return;
      for (const [key, value] of Object.entries(settings)) {
        const el = document.getElementById(key);
        if (!el) continue;
        if (el.type === 'checkbox') el.checked = value == 1 || value === '1' || value === true;
        else el.value = value || '';
      }
    })
    .catch(() => {});
}

function updateSetting(key, value) {
  if (!currentGuildId) {
    const id = prompt('Server ID eingeben (zu finden in Discord via Server-Einstellungen > Widget):');
    if (!id) return;
    currentGuildId = id;
    loadModules();
  }

  fetch('/api/guild/' + currentGuildId + '/setting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) showToast('✅ Gespeichert');
  })
  .catch(() => showToast('❌ Fehler'));
}

function loadWarns() {
  const el = document.getElementById('warnsList');
  if (!el || !currentGuildId) return;
  el.innerHTML = '<p style="color:rgba(255,255,255,0.5);">Lade...</p>';

  fetch('/api/guild/' + currentGuildId + '/warns')
    .then(r => r.json())
    .then(data => {
      if (!data.length) {
        el.innerHTML = '<p style="color:rgba(255,255,255,0.5);">Keine Verwarnungen.</p>';
        return;
      }
      let html = '<table class="table"><thead><tr><th>Benutzer</th><th>Moderator</th><th>Grund</th><th>Datum</th></tr></thead><tbody>';
      data.slice(0, 20).forEach(w => {
        html += `<tr><td><code>${w.user_id}</code></td><td><code>${w.moderator_id}</code></td><td>${w.reason || '-'}</td><td>${new Date(w.warned_at).toLocaleDateString('de-DE')}</td></tr>`;
      });
      html += '</tbody></table>';
      el.innerHTML = html;
    })
    .catch(() => { el.innerHTML = '<p style="color:rgba(255,255,255,0.5);">Fehler beim Laden.</p>'; });
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#161b22;border:1px solid #30363d;padding:12px 20px;border-radius:10px;font-size:14px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.4)';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 2500);
}

// Load stats every 30 seconds
setInterval(loadStats, 30000);
