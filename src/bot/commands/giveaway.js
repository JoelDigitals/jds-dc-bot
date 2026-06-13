const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createGiveaway } = require('../modules/giveaway');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Erstelle ein Giveaway')
    .addStringOption(opt => opt.setName('preis').setDescription('Was gibt es zu gewinnen?').setRequired(true))
    .addStringOption(opt => opt.setName('dauer').setDescription('Dauer (z.B. 1h, 30m, 2d)').setRequired(true))
    .addIntegerOption(opt => opt.setName('gewinner').setDescription('Anzahl der Gewinner').setMinValue(1).setMaxValue(25))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const prize = interaction.options.getString('preis');
    const durationStr = interaction.options.getString('dauer');
    const winners = interaction.options.getInteger('gewinner') || 1;

    const match = durationStr.match(/^(\d+)([smhd])$/);
    if (!match) return interaction.reply({ content: '❌ Ungültige Dauer. Beispiele: 30m, 1h, 2d, 7d', ephemeral: true });

    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const duration = parseInt(match[1]) * (multipliers[match[2]] || 60000);

    if (duration < 10000) return interaction.reply({ content: '❌ Mindestens 10 Sekunden.', ephemeral: true });
    if (duration > 2592000000) return interaction.reply({ content: '❌ Maximal 30 Tage.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    try {
      await createGiveaway(interaction.channel, prize, winners, duration, interaction.user);
      await interaction.editReply({ content: '✅ Giveaway wurde erstellt!' });
    } catch (err) {
      await interaction.editReply({ content: `❌ Fehler: ${err.message}` });
    }
  }
};
