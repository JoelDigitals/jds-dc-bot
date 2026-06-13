const { logMessageUpdate } = require('../modules/logging');

module.exports = {
  name: 'messageUpdate',
  once: false,
  async execute(oldMessage, newMessage) {
    logMessageUpdate(oldMessage, newMessage);
  }
};
