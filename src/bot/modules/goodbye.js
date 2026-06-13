const { EmbedBuilder } = require('discord.js');
const db = require('../../database/schema');
const logger = require('../../utils/logger');

async function handleGoodbye(member) {
  try {
    const settings = await db.getSettings(member.guild.id);
    if (!settings.goodbye_enabled || !settings.goodbye_channel_id) return;

    const channel = member.guild.channels.cache.get(settings.goodbye_channel_id);
    if (!channel) return;

    const message = settings.goodbye_message
      .replace(/{user}/g, member.user.username)
      .replace(/{server}/g, member.guild.name)
      .replace(/{membercount}/g, member.guild.memberCount);

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('👋 Auf Wiedersehen!')
      .setDescription(message)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Mitglieder: ${member.guild.memberCount}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    logger.bot(`Goodbye: ${member.user.tag} left ${member.guild.name}`);
  } catch (err) {
    logger.error(`Goodbye error: ${err.message}`);
  }
}

module.exports = { handleGoodbye };
