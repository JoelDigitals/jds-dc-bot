const { EmbedBuilder } = require('discord.js');
const db = require('../../database/schema');

async function checkBirthdays(client) {
  const now = new Date();
  const today = `${now.getMonth() + 1}-${now.getDate()}`;

  for (const guild of client.guilds.cache.values()) {
    try {
      const settings = await db.getSettings(guild.id);
      if (!settings.birthday_enabled) continue;

      const birthdays = await db.getTodaysBirthdays(guild.id);
      if (!birthdays.length) continue;

      const channel = settings.birthday_channel_id ? guild.channels.cache.get(settings.birthday_channel_id) : null;
      const role = settings.birthday_role_id ? guild.roles.cache.get(settings.birthday_role_id) : null;

      for (const b of birthdays) {
        const member = await guild.members.fetch(b.user_id).catch(() => null);
        if (!member) continue;

        const age = b.year ? now.getFullYear() - b.year : null;

        const embed = new EmbedBuilder()
          .setColor(0xFF69B4)
          .setTitle('🎂 Happy Birthday!')
          .setDescription(`Alles Gute zum Geburtstag, ${member}! 🎉🎈`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        if (age) embed.addFields({ name: 'Alter', value: `${age} Jahre`, inline: true });

        if (channel) await channel.send({ embeds: [embed] }).catch(() => {});
        if (role) await member.roles.add(role).catch(() => {});
      }
    } catch (e) {}
  }
}

module.exports = { checkBirthdays };
