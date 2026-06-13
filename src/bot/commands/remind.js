const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Erstelle eine Erinnerung')
    .addStringOption(opt => opt.setName('nachricht').setDescription('Was soll ich dir sagen?').setRequired(true))
    .addStringOption(opt => opt.setName('zeit').setDescription('Wann? (z.B. 10m, 1h, 1d, 30.06.2025 15:00)').setRequired(true)),

  async execute(interaction) {
    const message = interaction.options.getString('nachricht');
    const timeStr = interaction.options.getString('zeit');

    let remindAt;
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (match) {
      const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
      remindAt = new Date(Date.now() + parseInt(match[1]) * (mult[match[2]] || 60000));
    } else {
      remindAt = new Date(timeStr);
    }

    if (!remindAt || remindAt <= new Date()) {
      return interaction.reply({ content: '❌ Ungültiges Datum. Beispiele: `10m`, `2h`, `1d` oder `2025-12-31 18:00`', ephemeral: true });
    }

    if (remindAt > new Date(Date.now() + 365 * 86400000)) {
      return interaction.reply({ content: '❌ Maximal 1 Jahr in die Zukunft.', ephemeral: true });
    }

    await db.addReminder(interaction.user.id, interaction.guild.id, interaction.channel.id, message, remindAt.toISOString());

    await interaction.reply({
      content: `⏰ Erinnerung gesetzt für <t:${Math.floor(remindAt.getTime() / 1000)}:R>!\n📝 ${message}`,
      ephemeral: false
    });
  }
};
