const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('counting')
    .setDescription('Counting Game einrichten')
    .addChannelOption(opt => opt.setName('channel').setDescription('Zähl-Channel').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    await db.updateSetting(interaction.guild.id, 'counting_enabled', '1');
    await db.initCounting(interaction.guild.id, channel.id);
    await interaction.reply({ content: `✅ Counting Game in ${channel} aktiviert! Start bei **1**.`, ephemeral: true });
  }
};
