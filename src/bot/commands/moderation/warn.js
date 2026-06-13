const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { warnUser } = require('../../modules/moderation');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Verwarne einen Benutzer')
    .addUserOption(opt => opt.setName('benutzer').setDescription('Der zu verwarnende Benutzer').setRequired(true))
    .addStringOption(opt => opt.setName('grund').setDescription('Grund der Verwarnung').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('benutzer');
    const reason = interaction.options.getString('grund');
    const member = await interaction.guild.members.fetch(user.id);

    try {
      const embed = await warnUser(interaction.guild, interaction.user, member, reason);
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply({ content: `Fehler: ${err.message}`, ephemeral: true });
    }
  }
};
