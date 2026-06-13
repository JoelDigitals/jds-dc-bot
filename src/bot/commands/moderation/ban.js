const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { banUser } = require('../../modules/moderation');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banne einen Benutzer vom Server')
    .addUserOption(opt => opt.setName('benutzer').setDescription('Der zu bannende Benutzer').setRequired(true))
    .addStringOption(opt => opt.setName('grund').setDescription('Grund des Bans').setRequired(false))
    .addIntegerOption(opt => opt.setName('nachrichten').setDescription('Tage an Nachrichten zum Löschen (0-7)').setMinValue(0).setMaxValue(7).setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('benutzer');
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';
    const deleteDays = interaction.options.getInteger('nachrichten') || 0;
    const member = await interaction.guild.members.fetch(user.id);

    try {
      const embed = await banUser(interaction.guild, interaction.user, member, reason, deleteDays);
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply({ content: `Fehler: ${err.message}`, ephemeral: true });
    }
  }
};
