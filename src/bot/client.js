const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const logger = require('../utils/logger');

function createBot(token) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildVoiceStates
    ]
  });

  client.commands = new Collection();

  // Load commands
  const commandsPath = path.join(__dirname, 'commands');
  loadCommands(commandsPath, client);

  // Load events
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    logger.info(`Event loaded: ${event.name}`);
  }

  client.login(token).catch(err => {
    logger.error(`Failed to login: ${err.message}`);
    process.exit(1);
  });

  return client;
}

function loadCommands(dir, client) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      loadCommands(fullPath, client);
    } else if (file.name.endsWith('.js')) {
      const command = require(fullPath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.info(`Command loaded: ${command.data.name}`);
      }
    }
  }
}

module.exports = { createBot };
