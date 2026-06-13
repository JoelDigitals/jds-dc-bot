const { ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/schema');

async function handleVoiceJoin(member, channel) {
  const settings = await db.getSettings(member.guild.id);
  if (!settings.tempvoice_enabled || !settings.tempvoice_channel_id) return;
  if (channel.id !== settings.tempvoice_channel_id) return;

  const categoryId = settings.tempvoice_category_id;
  const name = `🔊 ${member.user.username}s Channel`;

  const newChannel = await member.guild.channels.create({
    name: name.substring(0, 32),
    type: ChannelType.GuildVoice,
    parent: categoryId || undefined,
    permissionOverwrites: [
      { id: member.guild.id, deny: [PermissionFlagsBits.ManageChannels] },
      { id: member.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, PermissionFlagsBits.MoveMembers] }
    ],
    reason: `Temporärer Voice-Channel von ${member.user.tag}`
  });

  await db.createTempVoice(member.guild.id, newChannel.id, member.id);

  // Move user to new channel after a short delay
  setTimeout(async () => {
    try {
      await member.voice.setChannel(newChannel);
    } catch (e) {}
  }, 500);
}

async function handleVoiceLeave(channelId) {
  const tv = await db.getTempVoice(channelId);
  if (!tv) return;

  const guild = global.botClient?.guilds.cache.get(tv.guild_id);
  if (!guild) return;

  const ch = guild.channels.cache.get(channelId);
  if (!ch) { await db.deleteTempVoice(channelId); return; }

  // Delete if empty
  if (ch.members.size === 0) {
    setTimeout(async () => {
      try {
        const updated = guild.channels.cache.get(channelId);
        if (updated && updated.members.size === 0) {
          await updated.delete(`Temporärer Channel leer`);
          await db.deleteTempVoice(channelId);
        }
      } catch (e) {}
    }, 3000);
  }
}

module.exports = { handleVoiceJoin, handleVoiceLeave };
