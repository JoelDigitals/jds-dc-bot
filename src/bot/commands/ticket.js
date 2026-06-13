const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createTicketPanel } = require('../modules/ticket');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket-System verwalten')
    .addSubcommand(sub => sub.setName('panel').setDescription('Erstelle das Ticket-Panel in diesem Channel'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'panel') {
      await createTicketPanel(interaction.channel);
      await interaction.reply({ content: '✅ Ticket-Panel wurde erstellt!', ephemeral: true });
    }
  }
};
