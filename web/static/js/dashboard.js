let currentGuildId = typeof CURRENT_GUILD_ID !== 'undefined' && CURRENT_GUILD_ID ? CURRENT_GUILD_ID : null;

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
const csrfToken = getCookie('csrftoken');

const MODULES_MAP = {
  welcome: 'welcome_enabled',
  goodbye: 'goodbye_enabled',
  ticket: 'ticket_enabled',
  news: 'news_enabled',
  video: 'video_enabled',
  suggestions: 'suggestions_enabled',
  levels: 'levels_enabled',
  reactionroles: 'reactionroles_enabled',
  giveaway: 'giveaway_enabled',
  autorole: 'autorole_enabled',
  economy: 'economy_enabled',
  poll: 'poll_enabled',
  birthday: 'birthday_enabled',
  moderation: 'moderation_enabled',
  automod: 'automod_enabled',
  logging: 'logging_enabled',
  tempvoice: 'tempvoice_enabled',
  serverstats: 'serverstats_enabled',
  customcommands: 'customcommands_enabled',
  tags: 'tags_enabled',
  counting: 'counting_enabled',
  verification: 'verification_enabled',
  music: 'music_enabled',
  voicerole: 'voicerole_enabled',
  autoresponder: 'autoresponder_enabled',
  invitetracker: 'invitetracker_enabled',
};

document.addEventListener('DOMContentLoaded', function() {
  loadModules();
});

function selectGuild(guildId) {
  if (!guildId) return;
  window.location.href = '/?guild_id=' + guildId;
}

function showModule(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');
  event.currentTarget.classList.add('active');
  if (name === 'moderation') loadWarns();
  if (name === 'ticket') { loadTickets(); populateChannelSelects(); }
  if (name === 'design') populateChannelSelects();
}

function updateModuleIndicators(settings) {
  for (const [moduleId, settingKey] of Object.entries(MODULES_MAP)) {
    const navItem = document.querySelector(`.nav-item[onclick*="'${moduleId}'"]`);
    if (!navItem) continue;
    const val = settings[settingKey];
    const enabled = val == 1 || val === '1' || val === true;
    navItem.classList.toggle('module-enabled', enabled);
    navItem.classList.toggle('module-disabled', !enabled);
  }
}

function loadModules() {
  if (!currentGuildId) return;
  fetch('/api/guild/' + currentGuildId + '/')
    .then(r => r.json())
    .then(settings => {
      if (!settings || !settings.guild_id) return;
      updateModuleIndicators(settings);
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
    const id = prompt('Server ID eingeben:');
    if (!id) return;
    window.location.href = '/?guild_id=' + id;
    return;
  }

  const form = new FormData();
  form.append('guild_id', currentGuildId);
  form.append('csrfmiddlewaretoken', csrfToken);
  form.append('key', key);
  form.append('value', value);

  fetch('/update-setting/', {
    method: 'POST',
    body: form
  })
  .then(r => {
    if (r.ok) {
      showToast('Gespeichert');
      for (const [moduleId, settingKey] of Object.entries(MODULES_MAP)) {
        if (settingKey === key) {
          const navItem = document.querySelector(`.nav-item[onclick*="'${moduleId}'"]`);
          if (navItem) {
            const enabled = value == 1 || value === '1' || value === true;
            navItem.classList.toggle('module-enabled', enabled);
            navItem.classList.toggle('module-disabled', !enabled);
          }
          break;
        }
      }
    }
  })
  .catch(() => showToast('Fehler'));
}

function loadWarns() {
  const el = document.getElementById('warnsList');
  if (!el || !currentGuildId) return;
  el.innerHTML = '<p style="color:rgba(255,255,255,0.5);">Lade...</p>';

  fetch('/api/guild/' + currentGuildId + '/warns/')
    .then(r => r.json())
    .then(data => {
      if (!data.length) {
        el.innerHTML = '<p style="color:rgba(255,255,255,0.5);">Keine Verwarnungen.</p>';
        return;
      }
      let html = '<table class="table"><thead><tr><th>Benutzer</th><th>Moderator</th><th>Grund</th><th>Datum</th></tr></thead><tbody>';
      data.slice(0, 20).forEach(w => {
        html += '<tr><td><code>' + w.user_id + '</code></td><td><code>' + w.moderator_id + '</code></td><td>' + (w.reason || '-') + '</td><td>' + (w.warned_at || '-') + '</td></tr>';
      });
      html += '</tbody></table>';
      el.innerHTML = html;
    })
    .catch(() => { el.innerHTML = '<p style="color:rgba(255,255,255,0.5);">Fehler beim Laden.</p>'; });
}

function loadTickets() {
  const el = document.getElementById('ticketList');
  if (!el || !currentGuildId) return;
  el.innerHTML = '<p style="color:rgba(255,255,255,0.5);">Lade...</p>';

  fetch('/api/guild/' + currentGuildId + '/tickets/')
    .then(r => r.json())
    .then(data => {
      if (!data.length) {
        el.innerHTML = '<p style="color:rgba(255,255,255,0.5);">Keine offenen Tickets.</p>';
        return;
      }
      let html = '<table class="table"><thead><tr><th>Benutzer</th><th>Betreff</th><th>Erstellt</th></tr></thead><tbody>';
      data.forEach(t => {
        html += '<tr><td><code>' + t.user_id + '</code></td><td>' + (t.subject || '-') + '</td><td>' + (t.created_at || '-') + '</td></tr>';
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

function populateChannelSelects() {
  var selects = document.querySelectorAll('#testEmbedChannel, #ticketPanelChannel');
  selects.forEach(function(sel) {
    sel.innerHTML = '<option value="">— Channel auswählen —</option>';
    if (!window.CHANNELS || !CHANNELS.length) return;
    var textChannels = CHANNELS.filter(function(c) { return c.type === 0 || c.type === 5; });
    textChannels.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = '#' + c.name;
      sel.appendChild(opt);
    });
  });
}

function sendTicketPanel(channelId) {
  if (!channelId) return;
  fetch('/api/send-ticket-panel/', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'guild_id=' + encodeURIComponent(currentGuildId) + '&channel_id=' + encodeURIComponent(channelId) + '&csrfmiddlewaretoken=' + encodeURIComponent(csrfToken)
  })
  .then(r => r.json())
  .then(d => { if (d.success) showToast('Ticket-Panel gesendet!'); else showToast('Fehler: ' + (d.error || '')); })
  .catch(() => showToast('Fehler beim Senden'));
}

function sendTestEmbed(channelId) {
  if (!channelId) return;
  fetch('/api/send-test-embed/', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'guild_id=' + encodeURIComponent(currentGuildId) + '&channel_id=' + encodeURIComponent(channelId) + '&csrfmiddlewaretoken=' + encodeURIComponent(csrfToken)
  })
  .then(r => r.json())
  .then(d => { if (d.success) showToast('Test-Embed gesendet!'); else showToast('Fehler: ' + (d.error || '')); })
  .catch(() => showToast('Fehler beim Senden'));
}
