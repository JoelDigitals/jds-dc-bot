require('dotenv').config();

const logger = require('./utils/logger');
const { createBot } = require('./bot/client');
const { startBotApi } = require('./bot/api');
const { checkNews } = require('./bot/modules/news');
const { checkVideos } = require('./bot/modules/video');
const { getDb } = require('./database/schema');

const token = process.env.DISCORD_TOKEN;

if (!token) {
  logger.error('❌ DISCORD_TOKEN in .env ist nicht gesetzt!');
  logger.error('📝 Trage deinen Token in die .env Datei ein.');
  process.exit(1);
}

async function main() {
  // Initialize database first
  await getDb();
  logger.success('📦 Datenbank initialisiert');

  // Create and start the bot
  const client = createBot(token);

  // Make client globally accessible
  global.botClient = client;

  // Start bot API for Django (not needed on Render — Django uses Discord REST API directly)
  if (!process.env.RENDER) {
    startBotApi(client);
  }

  // Bot ready
  client.once('ready', async () => {
    logger.success('🤖 Discord Bot ist online!');
    logger.info('🌐 Web Dashboard läuft separat via Django (python web/manage.py runserver)');

    // Register slash commands
    try {
      const { REST, Routes } = require('discord.js');
      const fs = require('fs');
      const path = require('path');

      const commands = [];
      function loadCommands(dir) {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          if (file.isDirectory()) loadCommands(fullPath);
          else if (file.name.endsWith('.js')) {
            const cmd = require(fullPath);
            if (cmd.data) commands.push(cmd.data.toJSON());
          }
        }
      }
      loadCommands(path.join(__dirname, 'bot', 'commands'));

      const rest = new REST({ version: '10' }).setToken(token);
      await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
      logger.success(`${commands.length} Slash Commands registriert`);
    } catch (err) {
      logger.warn(`Slash Commands nicht registriert: ${err.message}`);
      logger.info('Manuelle Registrierung via: npm run deploy');
    }

    // Start scheduled tasks
    const cron = require('node-cron');
    cron.schedule('*/15 * * * *', () => checkNews(client));
    cron.schedule('*/15 * * * *', () => checkVideos(client));
    logger.info('⏰ Geplante Tasks: News & Videos alle 15 Min');
  });
}

main().catch(err => {
  logger.error(`Startup Fehler: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => { logger.info('👋 Bot wird heruntergefahren...'); process.exit(0); });
process.on('SIGTERM', () => { logger.info('👋 Bot wird heruntergefahren...'); process.exit(0); });
