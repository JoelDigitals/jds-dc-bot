const express = require('express');
const router = express.Router();
const { syncGetDb, saveDb } = require('../../database/schema');

function db() { return syncGetDb(); }
function query(sql, params) {
  const stmt = db().prepare(sql);
  if (params) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}
function run(sql, params) {
  db().run(sql, params);
}

router.get('/guild/:guildId', (req, res) => {
  if (!req.session.authenticated) return res.status(401).json({ error: 'Unauthorized' });
  const r = query('SELECT * FROM guild_settings WHERE guild_id = ?', [req.params.guildId]);
  res.json(r[0] || { guild_id: req.params.guildId });
});

router.post('/guild/:guildId/setting', (req, res) => {
  if (!req.session.authenticated) return res.status(401).json({ error: 'Unauthorized' });
  const { key, value } = req.body;
  run(`UPDATE guild_settings SET "${key}" = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?`, [value, req.params.guildId]);
  saveDb();
  res.json({ success: true });
});

router.get('/guild/:guildId/warns', (req, res) => {
  if (!req.session.authenticated) return res.status(401).json({ error: 'Unauthorized' });
  res.json(query('SELECT * FROM warns WHERE guild_id = ? ORDER BY warned_at DESC', [req.params.guildId]));
});

router.get('/guild/:guildId/tickets', (req, res) => {
  if (!req.session.authenticated) return res.status(401).json({ error: 'Unauthorized' });
  res.json(query("SELECT * FROM tickets WHERE guild_id = ? AND status = 'open'", [req.params.guildId]));
});

module.exports = router;
