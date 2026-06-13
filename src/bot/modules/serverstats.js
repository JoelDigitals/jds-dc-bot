const { ChannelType } = require('discord.js');
const db = require('../../database/schema');

async function updateServerStats(guild) {
  const settings = await db.getSettings(guild.id);
  if (!settings.serverstats_enabled || !settings.serverstats_category_id) return;

  const category = guild.channels.cache.get(settings.serverstats_category_id);
  if (!category) return;

  const total = guild.memberCount;
  const humans = guild.members.cache.filter(m => !m.user.bot).size;
  const bots = guild.members.cache.filter(m => m.user.bot).size;

  const channels = guild.channels.cache.filter(c => c.parentId === settings.serverstats_category_id && c.type === ChannelType.GuildVoice);

  const names = {
    total: `👥 Mitglieder: ${total}`,
    humans: `👤 Nutzer: ${humans}`,
    bots: `🤖 Bots: ${bots}`
  };

  for (const [key, name] of Object.entries(names)) {
    let ch = channels.find(c => c.name.startsWith(key === 'total' ? '👥' : key === 'humans' ? '👤' : '🤖'));
    if (!ch) {
      ch = await guild.channels.create({
        name: name.substring(0, 32),
        type: ChannelType.GuildVoice,
        parent: settings.serverstats_category_id,
        permissionOverwrites: [{ id: guild.id, deny: ['Connect'] }]
      });
    } else if (ch.name !== name) {
      await ch.setName(name.substring(0, 32));
    }
  }
}

module.exports = { updateServerStats };
