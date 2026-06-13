const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Lösche Nachrichten in diesem Channel')
    .addIntegerOption(opt => opt.setName('anzahl').setDescription('Anzahl der Nachrichten').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('anzahl');
    await interaction.channel.bulkDelete(amount, true);
    const reply = await interaction.reply({ content: `🗑️ ${amount} Nachrichten gelöscht.`, ephemeral: true });
  }
};
