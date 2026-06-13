const { logMessageDelete } = require('../modules/logging');

module.exports = {
  name: 'messageDelete',
  once: false,
  async execute(message) {
    logMessageDelete(message);
  }
};
