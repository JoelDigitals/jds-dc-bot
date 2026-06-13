const cron = require('node-cron');
const logger = require('../../utils/logger');
const { checkGiveaways } = require('../modules/giveaway');
const { updateServerStats } = require('../modules/serverstats');
const { checkBirthdays } = require('../modules/birthday');
const db = require('../../database/schema');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.success(`Bot ist online als ${client.user.tag}`);
    logger.info(`Aktiv auf ${client.guilds.cache.size} Servern`);

    const activities = [
      { name: `${client.guilds.cache.size} Server`, type: 3 },
      { name: '/help | Web Dashboard', type: 0 },
      { name: '🎫 Tickets & Support', type: 0 }
    ];

    let i = 0;
    setInterval(() => {
      client.user.setActivity(activities[i]);
      i = (i + 1) % activities.length;
    }, 30000);

    // Server stats update every 30 min
    cron.schedule('*/30 * * * *', async () => {
      for (const guild of client.guilds.cache.values()) {
        await updateServerStats(guild);
      }
      logger.info('📊 Server Stats aktualisiert');
    });

    // Giveaway check every 30 seconds
    setInterval(async () => {
      await checkGiveaways(client);
    }, 30000);

    // Reminder check every 30 seconds
    setInterval(async () => {
      const reminders = await db.getDueReminders();
      for (const r of reminders) {
        const guild = client.guilds.cache.get(r.guild_id);
        if (guild) {
          const channel = guild.channels.cache.get(r.channel_id);
          if (channel) {
            channel.send(`⏰ <@${r.user_id}> Erinnerung: ${r.message}`);
          }
        } else {
          // DM the user if guild not available
          client.users.fetch(r.user_id).then(user => {
            user.send(`⏰ Erinnerung: ${r.message}`);
          }).catch(() => {});
        }
        await db.deleteReminder(r.id);
      }
    }, 30000);

    // Birthday check every hour
    cron.schedule('0 * * * *', async () => {
      await checkBirthdays(client);
    });
    // Also check on startup
    setTimeout(async () => await checkBirthdays(client), 10000);

    // Initial server stats
    setTimeout(async () => {
      for (const guild of client.guilds.cache.values()) {
        await updateServerStats(guild);
      }
    }, 5000);
  }
};
