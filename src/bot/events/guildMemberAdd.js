const { handleWelcome } = require('../modules/welcome');
const { logMemberJoin } = require('../modules/logging');
const db = require('../../database/schema');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    if (member.user.bot) return;
    await handleWelcome(member);

    // Logging
    logMemberJoin(member);

    // Autorole
    const settings = await db.getSettings(member.guild.id);
    if (settings.autorole_enabled && settings.autorole_role_id) {
      const role = member.guild.roles.cache.get(settings.autorole_role_id);
      if (role) {
        await member.roles.add(role).catch(() => {});
      }
    }
  }
};
