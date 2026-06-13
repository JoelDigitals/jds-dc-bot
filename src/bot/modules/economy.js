const { EmbedBuilder } = require('discord.js');
const db = require('../../database/schema');

const DAILY_AMOUNT = 100;
const WORK_MIN = 20;
const WORK_MAX = 80;

async function getCooldown(userId, guildId, type) {
  const eco = await db.getEconomy(guildId, userId);
  const last = type === 'daily' ? eco.daily_at : eco.work_at;
  if (!last) return 0;
  const diff = Date.now() - new Date(last + 'Z').getTime();
  const cooldown = type === 'daily' ? 86400000 : 3600000;
  return Math.max(0, cooldown - diff);
}

async function daily(userId, guildId) {
  const cd = await getCooldown(userId, guildId, 'daily');
  if (cd > 0) return { error: 'daily', cooldown: cd };
  await db.updateBalance(guildId, userId, DAILY_AMOUNT);
  await db.setDailyAt(guildId, userId);
  return { amount: DAILY_AMOUNT };
}

async function work(userId, guildId) {
  const cd = await getCooldown(userId, guildId, 'work');
  if (cd > 0) return { error: 'work', cooldown: cd };
  const amount = Math.floor(Math.random() * (WORK_MAX - WORK_MIN + 1)) + WORK_MIN;
  await db.updateBalance(guildId, userId, amount);
  await db.setWorkAt(guildId, userId);
  return { amount };
}

async function slots(userId, guildId, bet) {
  const eco = await db.getEconomy(guildId, userId);
  if (eco.balance < bet) return { error: 'money' };

  const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
  const result = [];
  for (let i = 0; i < 3; i++) result.push(symbols[Math.floor(Math.random() * symbols.length)]);

  let win = 0;
  if (result[0] === result[1] && result[1] === result[2]) {
    win = result[0] === '7️⃣' ? bet * 10 : result[0] === '💎' ? bet * 5 : bet * 3;
  } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
    win = Math.floor(bet * 1.5);
  }

  await db.updateBalance(guildId, userId, win - bet);
  return { result, win, net: win - bet };
}

async function transfer(fromId, toId, guildId, amount) {
  const eco = await db.getEconomy(guildId, fromId);
  if (eco.balance < amount) return { error: 'money' };
  await db.updateBalance(guildId, fromId, -amount);
  await db.updateBalance(guildId, toId, amount);
  return { amount };
}

function formatTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

module.exports = { daily, work, slots, transfer, formatTime, getCooldown };
