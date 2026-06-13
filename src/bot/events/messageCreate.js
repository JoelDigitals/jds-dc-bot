const { handleMessageXp } = require('../modules/levels');
const { checkMessage } = require('../modules/automod');
const { handleCounting } = require('../modules/counting');
const db = require('../../database/schema');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // AutoMod check
    await checkMessage(message);

    // XP System
    await handleMessageXp(message);

    // Custom Commands (prefix !)
    if (message.content.startsWith('!')) {
      const args = message.content.slice(1).split(/\s+/);
      const cmdName = args.shift().toLowerCase();

      const cmd = await db.getCustomCommand(message.guild.id, cmdName);
      if (cmd) {
        await message.channel.send(cmd.response
          .replace(/{user}/g, `<@${message.author.id}>`)
          .replace(/{server}/g, message.guild.name)
        );
      }
    }

    // Counting Game
    await handleCounting(message);

    // Tags (prefix ?)
    if (message.content.startsWith('?')) {
      const name = message.content.slice(1).toLowerCase();
      const tag = await db.getTag(message.guild.id, name);
      if (tag) {
        const content = tag.content
          .replace(/{user}/g, `<@${message.author.id}>`)
          .replace(/{server}/g, message.guild.name);
        await message.channel.send(content);
      }
    }
  }
};
