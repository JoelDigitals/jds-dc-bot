const { logVoiceStateUpdate } = require('../modules/logging');
const { handleVoiceJoin, handleVoiceLeave } = require('../modules/tempvoice');

module.exports = {
  name: 'voiceStateUpdate',
  once: false,
  async execute(oldState, newState) {
    // Logging
    logVoiceStateUpdate(oldState, newState);

    // Temp Voice - user joined a channel
    if (newState.channelId && (!oldState.channelId || oldState.channelId !== newState.channelId)) {
      await handleVoiceJoin(newState.member, newState.channel);
    }

    // Temp Voice - user left a channel
    if (oldState.channelId && !newState.channelId) {
      await handleVoiceLeave(oldState.channelId);
    }
  }
};
