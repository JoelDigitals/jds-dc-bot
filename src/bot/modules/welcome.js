const { EmbedBuilder } = require('discord.js');
const db = require('../../database/schema');
const logger = require('../../utils/logger');

async function handleWelcome(member) {
  try {
    const settings = await db.getSettings(member.guild.id);

    if (!settings.welcome_enabled) return;

    // Channel message
    if (settings.welcome_channel_id) {
      const channel = member.guild.channels.cache.get(settings.welcome_channel_id);
      if (channel) {
        const message = settings.welcome_message
          .replace(/{user}/g, `<@${member.id}>`)
          .replace(/{server}/g, member.guild.name)
          .replace(/{membercount}/g, member.guild.memberCount);

        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('👋 Willkommen!')
          .setDescription(message)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: `Mitglied #${member.guild.memberCount}` })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
        logger.bot(`Welcome message sent to ${member.user.tag} in ${member.guild.name}`);
      }
    }

    // DM
    if (settings.welcome_dm_enabled && settings.welcome_dm_message) {
      const dmMessage = settings.welcome_dm_message
        .replace(/{user}/g, member.user.username)
        .replace(/{server}/g, member.guild.name);

      const dmEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(`Willkommen auf ${member.guild.name}!`)
        .setDescription(dmMessage)
        .setThumbnail(member.guild.iconURL({ dynamic: true }))
        .setTimestamp();

      await member.send({ embeds: [dmEmbed] }).catch(() => {
        logger.warn(`Could not send DM to ${member.user.tag}`);
      });
    }
  } catch (err) {
    logger.error(`Welcome error: ${err.message}`);
  }
}

module.exports = { handleWelcome };
