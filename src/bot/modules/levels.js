const { EmbedBuilder } = require('discord.js');
const db = require('../../database/schema');

const XP_PER_MESSAGE = 15;
const XP_COOLDOWN = 60;

async function handleMessageXp(message) {
  if (message.author.bot) return;
  const settings = await db.getSettings(message.guild.id);
  if (!settings.levels_enabled) return;

  const cooldown = await db.getLevel(message.guild.id, message.author.id);
  if (cooldown.last_message_at) {
    const diff = (Date.now() - new Date(cooldown.last_message_at).getTime()) / 1000;
    if (diff < XP_COOLDOWN) return;
  }

  const result = await db.addXp(message.guild.id, message.author.id, XP_PER_MESSAGE);

  if (result.leveledUp) {
    const lvlMsg = settings.levels_message
      .replace(/{user}/g, `<@${message.author.id}>`)
      .replace(/{level}/g, result.level)
      .replace(/{server}/g, message.guild.name);

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🎉 Level Up!')
      .setDescription(lvlMsg)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields({ name: 'Neues Level', value: `**${result.level}**`, inline: true })
      .setTimestamp();

    if (settings.levels_channel_id) {
      const ch = message.guild.channels.cache.get(settings.levels_channel_id);
      if (ch) await ch.send({ embeds: [embed] }).catch(() => {});
    } else {
      await message.channel.send({ embeds: [embed] }).catch(() => {});
    }
  }
}

async function getRankInfo(guildId, userId) {
  const all = await db.getLeaderboard(guildId, 1000);
  const rank = all.findIndex(u => u.user_id === userId) + 1;
  const userLevel = await db.getLevel(guildId, userId);
  return { ...userLevel, rank: rank > 0 ? rank : '-' };
}

module.exports = { handleMessageXp, getRankInfo, XP_PER_MESSAGE };
