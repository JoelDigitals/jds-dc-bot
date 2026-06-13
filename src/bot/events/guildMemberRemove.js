const { handleGoodbye } = require('../modules/goodbye');
const { logMemberRemove } = require('../modules/logging');

module.exports = {
  name: 'guildMemberRemove',
  once: false,
  async execute(member) {
    if (member.user.bot) return;
    await handleGoodbye(member);
    logMemberRemove(member);
  }
};
