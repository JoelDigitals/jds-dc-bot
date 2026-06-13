const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendVerificationPanel } = require('../modules/verification');
const db = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verification System')
    .addSubcommand(sub => sub.setName('setup').setDescription('Richte Verification ein').addRoleOption(o => o.setName('rolle').setDescription('Rolle nach Verifikation').setRequired(true)))
    .addSubcommand(sub => sub.setName('panel').setDescription('Sende das Verification-Panel'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'setup') {
      const role = interaction.options.getRole('rolle');
      await db.setVerification(interaction.guild.id, 'role_id', role.id);
      await db.setVerification(interaction.guild.id, 'enabled', '1');
      await db.updateSetting(interaction.guild.id, 'verification_enabled', '1');
      await interaction.reply({ content: `✅ Verification-Rolle **${role.name}** gesetzt! Nutze \`/verify panel\``, ephemeral: true });
    }
    if (sub === 'panel') {
      await sendVerificationPanel(interaction.channel);
      await interaction.reply({ content: '✅ Panel gesendet!', ephemeral: true });
    }
  }
};
