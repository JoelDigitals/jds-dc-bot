const db = require('../../database/schema');

async function checkMessage(message) {
  if (message.author.bot) return null;
  const settings = await db.getSettings(message.guild.id);
  if (!settings.automod_enabled) return null;

  const content = message.content.toLowerCase();

  // Bad words filter
  if (settings.automod_badwords) {
    const words = settings.automod_badwords.split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
    for (const word of words) {
      if (content.includes(word)) {
        message.delete().catch(() => {});
        message.channel.send(`${message.author}, deine Nachricht enthält unangemessene Inhalte.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        return 'badword';
      }
    }
  }

  // Invite filter
  if (settings.automod_block_invites) {
    const inviteRegex = /(discord\.(gg|com\/invite)\/[\w-]+)/gi;
    if (inviteRegex.test(content) && !message.member?.permissions.has('ManageMessages')) {
      message.delete().catch(() => {});
      message.channel.send(`${message.author}, Einladungen sind nicht erlaubt.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      return 'invite';
    }
  }

  // Link filter
  if (settings.automod_block_links) {
    const linkRegex = /https?:\/\//gi;
    if (linkRegex.test(content) && !message.member?.permissions.has('ManageMessages')) {
      message.delete().catch(() => {});
      message.channel.send(`${message.author}, Links sind nicht erlaubt.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      return 'link';
    }
  }

  return null;
}

module.exports = { checkMessage };
