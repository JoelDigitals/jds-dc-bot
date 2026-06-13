const { EmbedBuilder } = require('discord.js');
const db = require('../../database/schema');

async function getLogChannel(guild) {
  const s = await db.getSettings(guild.id);
  if (!s.logging_enabled || !s.logging_channel_id) return null;
  return guild.channels.cache.get(s.logging_channel_id);
}

async function sendLog(guild, embed) {
  const ch = await getLogChannel(guild);
  if (ch) await ch.send({ embeds: [embed] }).catch(() => {});
}

async function logMessageDelete(message) {
  if (!message.guild || message.author?.bot) return;
  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('🗑️ Nachricht gelöscht')
    .addFields(
      { name: 'Autor', value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: 'Channel', value: `${message.channel}`, inline: true },
      { name: 'Nachricht', value: message.content ? message.content.substring(0, 1000) : '(kein Text/Embed)' }
    )
    .setTimestamp();
  await sendLog(message.guild, embed);
}

async function logMessageUpdate(oldMessage, newMessage) {
  if (!oldMessage.guild || oldMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;
  const embed = new EmbedBuilder()
    .setColor(0xFFA500)
    .setTitle('✏️ Nachricht bearbeitet')
    .addFields(
      { name: 'Autor', value: `${oldMessage.author.tag}`, inline: true },
      { name: 'Channel', value: `${oldMessage.channel}`, inline: true },
      { name: 'Vorher', value: (oldMessage.content || '(leer)').substring(0, 500) },
      { name: 'Nachher', value: (newMessage.content || '(leer)').substring(0, 500) }
    )
    .setTimestamp();
  await sendLog(oldMessage.guild, embed);
}

async function logMemberJoin(member) {
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('📥 Mitglied beigetreten')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'Benutzer', value: `${member.user.tag} (${member.user.id})`, inline: true },
      { name: 'Erstellt am', value: `<t:${Math.floor(member.user.createdAt / 1000)}:R>`, inline: true }
    )
    .setTimestamp();
  await sendLog(member.guild, embed);
}

async function logMemberRemove(member) {
  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('📤 Mitglied verlassen')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'Benutzer', value: `${member.user.tag} (${member.user.id})` },
      { name: 'Rollen', value: member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'Keine' }
    )
    .setTimestamp();
  await sendLog(member.guild, embed);
}

async function logVoiceStateUpdate(oldState, newState) {
  const guild = newState.guild || oldState.guild;
  const member = newState.member || oldState.member;
  if (!member) return;

  let embed;
  if (!oldState.channelId && newState.channelId) {
    embed = new EmbedBuilder().setColor(0x00FF00).setTitle('🔊 Voice beigetreten')
      .addFields({ name: 'Benutzer', value: `${member.user.tag}`, inline: true }, { name: 'Channel', value: `${newState.channel?.name}`, inline: true });
  } else if (oldState.channelId && !newState.channelId) {
    embed = new EmbedBuilder().setColor(0xFF0000).setTitle('🔇 Voice verlassen')
      .addFields({ name: 'Benutzer', value: `${member.user.tag}`, inline: true }, { name: 'Channel', value: `${oldState.channel?.name}`, inline: true });
  } else if (oldState.channelId !== newState.channelId) {
    embed = new EmbedBuilder().setColor(0xFFA500).setTitle('🔁 Voice gewechselt')
      .addFields(
        { name: 'Benutzer', value: `${member.user.tag}`, inline: true },
        { name: 'Von', value: `${oldState.channel?.name}`, inline: true },
        { name: 'Nach', value: `${newState.channel?.name}`, inline: true }
      );
  }
  if (embed) { embed.setTimestamp(); await sendLog(guild, embed); }
}

module.exports = { logMessageDelete, logMessageUpdate, logMemberJoin, logMemberRemove, logVoiceStateUpdate };
