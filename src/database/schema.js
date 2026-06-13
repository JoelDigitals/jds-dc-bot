const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.SUPABASE_URL || 'postgresql://postgres.toeqgxdeoaaxjzkzzymy:JDS_BoT2026%21@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
});

function q(sql, params = []) {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

async function query(sql, params = []) {
  const res = await pool.query(q(sql, params), params);
  return res.rows;
}

async function run(sql, params = []) {
  await pool.query(q(sql, params), params);
}

async function getDb() {
  await pool.query('SELECT 1');
  return pool;
}

function syncGetDb() { return pool; }

// === Guild Settings ===
async function getSettings(guildId) {
  let r = await query('SELECT * FROM guild_settings WHERE guild_id = ?', [guildId]);
  if (!r.length) {
    await run('INSERT INTO guild_settings (guild_id) VALUES (?) ON CONFLICT (guild_id) DO NOTHING', [guildId]);
    r = await query('SELECT * FROM guild_settings WHERE guild_id = ?', [guildId]);
  }
  return r[0] || {};
}
async function updateSetting(guildId, key, value) {
  await run(`UPDATE guild_settings SET "${key}" = ?, updated_at = NOW() WHERE guild_id = ?`, [String(value), guildId]);
}

// === Moderation ===
async function addWarn(guildId, userId, moderatorId, reason) {
  await run('INSERT INTO warns (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)', [guildId, userId, moderatorId, reason]);
}
async function getWarns(guildId, userId) {
  return query('SELECT * FROM warns WHERE guild_id = ? AND user_id = ? ORDER BY warned_at DESC', [guildId, userId]);
}
async function getAllWarns(guildId) {
  return query('SELECT * FROM warns WHERE guild_id = ? ORDER BY warned_at DESC', [guildId]);
}

// === Tickets ===
async function createTicket(guildId, channelId, userId, subject) {
  await run('INSERT INTO tickets (guild_id, channel_id, user_id, subject) VALUES (?, ?, ?, ?)', [guildId, channelId, userId, subject]);
}
async function getTicket(guildId, channelId) {
  const r = await query('SELECT * FROM tickets WHERE guild_id = ? AND channel_id = ?', [guildId, channelId]);
  return r[0] || null;
}
async function closeTicket(guildId, channelId) {
  await run('UPDATE tickets SET status = ?, closed_at = NOW() WHERE guild_id = ? AND channel_id = ?', ['closed', guildId, channelId]);
}
async function getOpenTickets(guildId) {
  return query('SELECT * FROM tickets WHERE guild_id = ? AND status = ?', [guildId, 'open']);
}

// === News ===
async function hasNewsPosted(guildId, url) {
  const r = await query('SELECT id FROM news_posts WHERE guild_id = ? AND url = ?', [guildId, url]);
  return r.length > 0;
}
async function markNewsPosted(guildId, title, url, publishedAt) {
  try { await run('INSERT INTO news_posts (guild_id, title, url, published_at) VALUES (?, ?, ?, ?)', [guildId, title || '', url, publishedAt || new Date().toISOString()]); } catch (e) {}
}

// === Video ===
async function hasVideoPosted(guildId, url) {
  const r = await query('SELECT id FROM video_posts WHERE guild_id = ? AND url = ?', [guildId, url]);
  return r.length > 0;
}
async function markVideoPosted(guildId, title, url, publishedAt) {
  try { await run('INSERT INTO video_posts (guild_id, title, url, published_at) VALUES (?, ?, ?, ?)', [guildId, title || '', url, publishedAt || new Date().toISOString()]); } catch (e) {}
}

// === Levels ===
async function addXp(guildId, userId, amount) {
  const now = new Date().toISOString();
  const u = await query('SELECT * FROM levels WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
  if (!u.length) {
    await run('INSERT INTO levels (guild_id, user_id, xp, level, last_message_at) VALUES (?, ?, ?, ?, ?)', [guildId, userId, amount, 1, now]);
    return { xp: amount, level: 1 };
  }
  const newXp = u[0].xp + amount;
  const newLevel = Math.floor(Math.sqrt(newXp / 50)) + 1;
  const leveledUp = newLevel > u[0].level;
  await run('UPDATE levels SET xp = ?, level = ?, last_message_at = ? WHERE guild_id = ? AND user_id = ?', [newXp, newLevel, now, guildId, userId]);
  return { xp: newXp, level: newLevel, leveledUp };
}
async function getLevel(guildId, userId) {
  const r = await query('SELECT * FROM levels WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
  return r[0] || { xp: 0, level: 0 };
}
async function getLeaderboard(guildId, limit = 10) {
  return query('SELECT * FROM levels WHERE guild_id = ? ORDER BY level DESC, xp DESC LIMIT ?', [guildId, limit]);
}

// === Reaction Roles ===
async function addReactionRole(guildId, channelId, messageId, roleId, emoji, label, style) {
  await run('INSERT INTO reaction_roles (guild_id, channel_id, message_id, role_id, emoji, label, style) VALUES (?, ?, ?, ?, ?, ?, ?)', [guildId, channelId, messageId, roleId, emoji, label, style || 'primary']);
}
async function getReactionRoles(guildId) {
  return query('SELECT * FROM reaction_roles WHERE guild_id = ?', [guildId]);
}
async function getReactionRolesByMessage(guildId, messageId) {
  return query('SELECT * FROM reaction_roles WHERE guild_id = ? AND message_id = ?', [guildId, messageId]);
}
async function removeReactionRole(id) {
  await run('DELETE FROM reaction_roles WHERE id = ?', [id]);
}

// === Giveaways ===
async function createGiveaway(guildId, channelId, messageId, prize, winners, endsAt, hostedBy) {
  await run('INSERT INTO giveaways (guild_id, channel_id, message_id, prize, winners, ends_at, hosted_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [guildId, channelId, messageId, prize, winners, endsAt, hostedBy]);
  const r = await query('SELECT * FROM giveaways WHERE message_id = ?', [messageId]);
  return r[0];
}
async function getActiveGiveaways() {
  return query("SELECT * FROM giveaways WHERE ended = 0");
}
async function endGiveaway(id) {
  await run('UPDATE giveaways SET ended = 1 WHERE id = ?', [id]);
}

// === Suggestions ===
async function createSuggestion(guildId, channelId, messageId, userId, content) {
  await run('INSERT INTO suggestions (guild_id, channel_id, message_id, user_id, content) VALUES (?, ?, ?, ?, ?)', [guildId, channelId, messageId, userId, content]);
}
async function getSuggestions(guildId) {
  return query('SELECT * FROM suggestions WHERE guild_id = ? ORDER BY created_at DESC', [guildId]);
}

// === Temp Voice ===
async function createTempVoice(guildId, channelId, ownerId) {
  await run('INSERT INTO temp_voice (guild_id, channel_id, owner_id) VALUES (?, ?, ?)', [guildId, channelId, ownerId]);
}
async function getTempVoice(channelId) {
  const r = await query('SELECT * FROM temp_voice WHERE channel_id = ?', [channelId]);
  return r[0] || null;
}
async function deleteTempVoice(channelId) {
  await run('DELETE FROM temp_voice WHERE channel_id = ?', [channelId]);
}

// === Custom Commands ===
async function addCustomCommand(guildId, name, response) {
  await run('INSERT INTO custom_commands (guild_id, name, response) VALUES (?, ?, ?) ON CONFLICT (guild_id, name) DO UPDATE SET response = ?', [guildId, name, response, response]);
}
async function getCustomCommand(guildId, name) {
  const r = await query('SELECT * FROM custom_commands WHERE guild_id = ? AND name = ?', [guildId, name]);
  return r[0] || null;
}
async function getCustomCommands(guildId) {
  return query('SELECT * FROM custom_commands WHERE guild_id = ?', [guildId]);
}
async function removeCustomCommand(guildId, name) {
  await run('DELETE FROM custom_commands WHERE guild_id = ? AND name = ?', [guildId, name]);
}

// === Reminders ===
async function addReminder(userId, guildId, channelId, message, remindAt) {
  await run('INSERT INTO reminders (user_id, guild_id, channel_id, message, remind_at) VALUES (?, ?, ?, ?, ?)', [userId, guildId, channelId, message, remindAt]);
  const r = await query('SELECT * FROM reminders ORDER BY id DESC LIMIT 1');
  return r[0];
}
async function getDueReminders() {
  return query("SELECT * FROM reminders WHERE remind_at <= NOW()");
}
async function deleteReminder(id) {
  await run('DELETE FROM reminders WHERE id = ?', [id]);
}

// === Economy ===
async function getEconomy(guildId, userId) {
  let r = await query('SELECT * FROM economy WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
  if (!r.length) {
    await run('INSERT INTO economy (guild_id, user_id) VALUES (?, ?) ON CONFLICT (guild_id, user_id) DO NOTHING', [guildId, userId]);
    r = await query('SELECT * FROM economy WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
  }
  return r[0];
}
async function updateBalance(guildId, userId, amount) {
  const e = await getEconomy(guildId, userId);
  const newBal = Math.max(0, e.balance + amount);
  await run('UPDATE economy SET balance = ? WHERE guild_id = ? AND user_id = ?', [newBal, guildId, userId]);
  return newBal;
}
async function updateBank(guildId, userId, amount) {
  const e = await getEconomy(guildId, userId);
  const newBank = Math.max(0, e.bank + amount);
  await run('UPDATE economy SET bank = ? WHERE guild_id = ? AND user_id = ?', [newBank, guildId, userId]);
  return newBank;
}
async function setDailyAt(guildId, userId) {
  await run("UPDATE economy SET daily_at = NOW() WHERE guild_id = ? AND user_id = ?", [guildId, userId]);
}
async function setWorkAt(guildId, userId) {
  await run("UPDATE economy SET work_at = NOW() WHERE guild_id = ? AND user_id = ?", [guildId, userId]);
}
async function getEconomyLeaderboard(guildId, limit = 10) {
  return query('SELECT * FROM economy WHERE guild_id = ? ORDER BY balance + bank DESC LIMIT ?', [guildId, limit]);
}
async function addShopItem(guildId, name, price, roleId, desc) {
  await run('INSERT INTO economy_shop (guild_id, name, price, role_id, description) VALUES (?, ?, ?, ?, ?)', [guildId, name, price, roleId || null, desc || '']);
}
async function getShopItems(guildId) {
  return query('SELECT * FROM economy_shop WHERE guild_id = ?', [guildId]);
}
async function removeShopItem(id) {
  await run('DELETE FROM economy_shop WHERE id = ?', [id]);
}
async function addPurchase(guildId, userId, itemId) {
  await run('INSERT INTO economy_purchases (guild_id, user_id, item_id) VALUES (?, ?, ?)', [guildId, userId, itemId]);
}
async function getPurchases(guildId, userId) {
  return query('SELECT * FROM economy_purchases WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
}

// === Birthdays ===
async function setBirthday(guildId, userId, month, day, year) {
  await run('INSERT INTO birthdays (guild_id, user_id, month, day, year) VALUES (?, ?, ?, ?, ?) ON CONFLICT (guild_id, user_id) DO UPDATE SET month = ?, day = ?, year = ?', [guildId, userId, month, day, year || null, month, day, year || null]);
}
async function getBirthday(guildId, userId) {
  const r = await query('SELECT * FROM birthdays WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
  return r[0] || null;
}
async function getTodaysBirthdays(guildId) {
  const now = new Date();
  return query('SELECT * FROM birthdays WHERE guild_id = ? AND month = ? AND day = ?', [guildId, now.getMonth() + 1, now.getDate()]);
}

// === Polls ===
async function createPoll(guildId, channelId, messageId, question, options, creatorId) {
  await run('INSERT INTO polls (guild_id, channel_id, message_id, question, options, creator_id) VALUES (?, ?, ?, ?, ?, ?)', [guildId, channelId, messageId, question, JSON.stringify(options), creatorId]);
}

// === Counting ===
async function initCounting(guildId, channelId) {
  await run('INSERT INTO counting (guild_id, channel_id) VALUES (?, ?) ON CONFLICT (channel_id) DO NOTHING', [guildId, channelId]);
}
async function getCounting(channelId) {
  const r = await query('SELECT * FROM counting WHERE channel_id = ?', [channelId]);
  return r[0] || null;
}
async function updateCounting(channelId, count, userId) {
  await run('UPDATE counting SET current_count = ?, last_user_id = ? WHERE channel_id = ?', [count, userId, channelId]);
}

// === Tags ===
async function addTag(guildId, name, content, authorId) {
  await run('INSERT INTO tags (guild_id, name, content, author_id) VALUES (?, ?, ?, ?) ON CONFLICT (guild_id, name) DO UPDATE SET content = ?, author_id = ?', [guildId, name.toLowerCase(), content, authorId, content, authorId]);
}
async function getTag(guildId, name) {
  const r = await query('SELECT * FROM tags WHERE guild_id = ? AND name = ?', [guildId, name.toLowerCase()]);
  return r[0] || null;
}
async function getAllTags(guildId) {
  return query('SELECT * FROM tags WHERE guild_id = ? ORDER BY name', [guildId]);
}
async function removeTag(guildId, name) {
  await run('DELETE FROM tags WHERE guild_id = ? AND name = ?', [guildId, name.toLowerCase()]);
}

// === Verification ===
async function getVerification(guildId) {
  let r = await query('SELECT * FROM verification WHERE guild_id = ?', [guildId]);
  if (!r.length) {
    await run('INSERT INTO verification (guild_id) VALUES (?) ON CONFLICT DO NOTHING', [guildId]);
    r = await query('SELECT * FROM verification WHERE guild_id = ?', [guildId]);
  }
  return r[0];
}
async function setVerification(guildId, key, value) {
  await getVerification(guildId);
  await run(`UPDATE verification SET "${key}" = ? WHERE guild_id = ?`, [String(value), guildId]);
}

module.exports = {
  getDb, syncGetDb, getSettings, updateSetting,
  addWarn, getWarns, getAllWarns,
  createTicket, getTicket, closeTicket, getOpenTickets,
  hasNewsPosted, markNewsPosted, hasVideoPosted, markVideoPosted,
  addXp, getLevel, getLeaderboard,
  addReactionRole, getReactionRoles, getReactionRolesByMessage, removeReactionRole,
  createGiveaway, getActiveGiveaways, endGiveaway,
  createSuggestion, getSuggestions,
  createTempVoice, getTempVoice, deleteTempVoice,
  addCustomCommand, getCustomCommand, getCustomCommands, removeCustomCommand,
  addReminder, getDueReminders, deleteReminder,
  getEconomy, updateBalance, updateBank, setDailyAt, setWorkAt, getEconomyLeaderboard,
  addShopItem, getShopItems, removeShopItem, addPurchase, getPurchases,
  setBirthday, getBirthday, getTodaysBirthdays,
  createPoll,
  initCounting, getCounting, updateCounting,
  addTag, getTag, getAllTags, removeTag,
  getVerification, setVerification
};
