const logger = require('../../utils/logger');
const db = require('../../database/schema');

function getDashboardUrl() {
  try {
    return process.env.DASHBOARD_URL || 'http://localhost:3000';
  } catch {
    return 'http://localhost:3000';
  }
}

module.exports = {
  name: 'guildCreate',
  once: false,
  async execute(guild) {
    logger.success(`➕ Bot zu Server beigetreten: ${guild.name} (${guild.id}) - ${guild.memberCount} Mitglieder`);

    // Auto-create settings row (getSettings does this)
    await db.getSettings(guild.id);

    const dashboardUrl = getDashboardUrl();

    // Try to send a welcome message to the system channel
    const channel = guild.systemChannel || guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages'));
    if (channel) {
      channel.send({
        embeds: [{
          color: 0x5865F2,
          title: 'Vielen Dank, dass du mich eingeladen hast!',
          description: 'Ich bin ein vielseitiger Discord-Bot mit vielen Modulen.\n\n' +
            `⚙️ **Konfiguriere mich im Web-Dashboard:**\n${dashboardUrl}\n\n` +
            '📋 **Erste Schritte:**\n' +
            `1. Öffne das Dashboard: ${dashboardUrl}\n` +
            '2. Melde dich mit Discord an\n' +
            '3. Wähle diesen Server aus\n' +
            '4. Aktiviere die gewünschten Module\n\n' +
            '🎮 **Wichtige Befehle:**\n' +
            '`/ticket panel` - Ticket-System einrichten\n' +
            '`/reactionrole panel` - Reaktionrollen-Panel\n' +
            '`/verify setup @Rolle` - Verifikation einrichten',
          footer: { text: 'Viel Spaß mit dem Bot!' }
        }]
      }).catch(() => {});
    }
  }
};
