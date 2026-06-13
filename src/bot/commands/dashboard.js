const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Zeigt den Link zum Web-Dashboard'),

  async execute(interaction) {
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🌐 Web-Dashboard')
      .setDescription(`Konfiguriere mich ganz einfach über das Web-Dashboard:\n\n**[Dashboard öffnen](${dashboardUrl})**\n\nMelde dich dort mit Discord an und wähle deinen Server aus.`)
      .setFooter({ text: 'Alle Einstellungen bequem per Klick' });
    await interaction.reply({ embeds: [embed] });
  }
};
