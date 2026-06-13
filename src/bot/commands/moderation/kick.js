const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { kickUser } = require('../../modules/moderation');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicke einen Benutzer vom Server')
    .addUserOption(opt => opt.setName('benutzer').setDescription('Der zu kickende Benutzer').setRequired(true))
    .addStringOption(opt => opt.setName('grund').setDescription('Grund des Kicks').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('benutzer');
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';
    const member = await interaction.guild.members.fetch(user.id);

    try {
      const embed = await kickUser(interaction.guild, interaction.user, member, reason);
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply({ content: `Fehler: ${err.message}`, ephemeral: true });
    }
  }
};
