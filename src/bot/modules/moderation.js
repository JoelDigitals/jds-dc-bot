const { EmbedBuilder } = require('discord.js');
const db = require('../../database/schema');
const logger = require('../../utils/logger');

async function logToChannel(guild, message) {
  const settings = await db.getSettings(guild.id);
  if (!settings.moderation_log_channel_id) return;
  const channel = guild.channels.cache.get(settings.moderation_log_channel_id);
  if (channel) {
    await channel.send(message).catch(() => {});
  }
}

async function warnUser(guild, moderator, user, reason) {
  await db.addWarn(guild.id, user.id, moderator.id, reason);
  const warns = await db.getWarns(guild.id, user.id);

  const embed = new EmbedBuilder()
    .setColor(0xFFA500)
    .setTitle('⚠️ Verwarnung')
    .setDescription(`${user} wurde verwarnt.`)
    .addFields(
      { name: 'Benutzer', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag}`, inline: true },
      { name: 'Grund', value: reason || 'Kein Grund angegeben' },
      { name: 'Verwarnungen gesamt', value: `${warns.length}` }
    )
    .setTimestamp();

  // DM the user
  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle(`⚠️ Verwarnung auf ${guild.name}`)
      .setDescription(`Du wurdest verwarnt.`)
      .addFields(
        { name: 'Grund', value: reason || 'Kein Grund angegeben' },
        { name: 'Verwarnungen', value: `${warns.length}` }
      )
      .setTimestamp();
    await user.send({ embeds: [dmEmbed] });
  } catch (err) {
    logger.warn(`Could not DM warn to ${user.tag}`);
  }

  await logToChannel(guild, { embeds: [embed] });
  logger.bot(`${user.tag} was warned by ${moderator.tag} in ${guild.name}: ${reason}`);
  return embed;
}

async function kickUser(guild, moderator, user, reason) {
  if (!user.kickable) {
    throw new Error('Ich kann diesen Benutzer nicht kicken.');
  }

  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(`🔨 Kick von ${guild.name}`)
      .setDescription(`Du wurdest von **${guild.name}** gekickt.`)
      .addFields({ name: 'Grund', value: reason || 'Kein Grund angegeben' })
      .setTimestamp();
    await user.send({ embeds: [dmEmbed] });
  } catch (err) {
    logger.warn(`Could not DM kick to ${user.tag}`);
  }

  await user.kick(reason);

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('🔨 Kick')
    .setDescription(`${user} wurde gekickt.`)
    .addFields(
      { name: 'Benutzer', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag}`, inline: true },
      { name: 'Grund', value: reason || 'Kein Grund angegeben' }
    )
    .setTimestamp();

  await logToChannel(guild, { embeds: [embed] });
  logger.bot(`${user.tag} was kicked by ${moderator.tag} in ${guild.name}: ${reason}`);
  return embed;
}

async function banUser(guild, moderator, user, reason, deleteDays = 0) {
  if (!user.bannable) {
    throw new Error('Ich kann diesen Benutzer nicht bannen.');
  }

  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(`⛔ Ban von ${guild.name}`)
      .setDescription(`Du wurdest von **${guild.name}** gebannt.`)
      .addFields({ name: 'Grund', value: reason || 'Kein Grund angegeben' })
      .setTimestamp();
    await user.send({ embeds: [dmEmbed] });
  } catch (err) {
    logger.warn(`Could not DM ban to ${user.tag}`);
  }

  await guild.bans.create(user, { deleteMessageDays: deleteDays, reason });

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('⛔ Ban')
    .setDescription(`${user} wurde gebannt.`)
    .addFields(
      { name: 'Benutzer', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag}`, inline: true },
      { name: 'Grund', value: reason || 'Kein Grund angegeben' }
    )
    .setTimestamp();

  await logToChannel(guild, { embeds: [embed] });
  logger.bot(`${user.tag} was banned by ${moderator.tag} in ${guild.name}: ${reason}`);
  return embed;
}

module.exports = { warnUser, kickUser, banUser };
