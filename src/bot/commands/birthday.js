const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Geburtstag verwalten')
    .addSubcommand(sub => sub.setName('set').setDescription('Setze deinen Geburtstag').addIntegerOption(o => o.setName('tag').setDescription('Tag (1-31)').setRequired(true).setMinValue(1).setMaxValue(31)).addIntegerOption(o => o.setName('monat').setDescription('Monat (1-12)').setRequired(true).setMinValue(1).setMaxValue(12)).addIntegerOption(o => o.setName('jahr').setDescription('Jahr (optional)').setMinValue(1900).setMaxValue(2026)))
    .addSubcommand(sub => sub.setName('show').setDescription('Zeige deinen Geburtstag')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'set') {
      const day = interaction.options.getInteger('tag');
      const month = interaction.options.getInteger('monat');
      const year = interaction.options.getInteger('jahr') || null;
      await db.setBirthday(interaction.guild.id, interaction.user.id, month, day, year);
      const dateStr = `${day}.${month}.${year || ''}`;
      await interaction.reply({ content: `✅ Geburtstag auf **${dateStr}** gesetzt! 🎂`, ephemeral: true });
    }
    if (sub === 'show') {
      const bd = await db.getBirthday(interaction.guild.id, interaction.user.id);
      if (!bd) return interaction.reply({ content: '❌ Kein Geburtstag gesetzt. `/birthday set`', ephemeral: true });
      await interaction.reply({ content: `🎂 Dein Geburtstag: **${bd.day}.${bd.month}.${bd.year || '?'}**`, ephemeral: true });
    }
  }
};
