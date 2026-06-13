const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error('DISCORD_TOKEN und CLIENT_ID in .env müssen gesetzt sein.');
  process.exit(1);
}

const commands = [];

function loadCommands(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      loadCommands(fullPath);
    } else if (file.name.endsWith('.js')) {
      const command = require(fullPath);
      if ('data' in command) {
        commands.push(command.data.toJSON());
      }
    }
  }
}

loadCommands(path.join(__dirname, 'bot', 'commands'));

const guildId = process.argv[2]; // Optional: --guild <id> für sofortige Registrierung

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Lade ${commands.length} Slash Commands...`);
    let route;
    if (guildId && guildId !== '--global') {
      route = Routes.applicationGuildCommands(clientId, guildId);
      console.log(`Registriere für Guild: ${guildId}`);
    } else {
      route = Routes.applicationCommands(clientId);
      console.log('Registriere global (kann bis 1h dauern)');
    }
    const data = await rest.put(route, { body: commands });
    console.log(`${data.length} Commands erfolgreich registriert!`);
  } catch (err) {
    console.error('Fehler beim Registrieren:', err);
  }
})();
