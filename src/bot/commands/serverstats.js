const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Server Stats einrichten')
    .addChannelOption(opt => opt.setName('kategorie').setDescription('Die Kategorie für die Stats-Channels').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const category = interaction.options.getChannel('kategorie');
    await db.updateSetting(interaction.guild.id, 'serverstats_enabled', '1');
    await db.updateSetting(interaction.guild.id, 'serverstats_category_id', category.id);
    await interaction.reply({ content: `✅ Server Stats werden in Kategorie **${category.name}** erstellt.`, ephemeral: true });
  }
};
