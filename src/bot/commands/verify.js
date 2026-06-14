const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendVerificationPanel } = require('../modules/verification');
const db = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verification System')
    .addSubcommand(sub => sub.setName('setup')
      .setDescription('Richte Verification ein (DE/EN Rollen)')
      .addRoleOption(o => o.setName('de_rolle').setDescription('Rolle für DE-Verifikation').setRequired(true))
      .addRoleOption(o => o.setName('en_rolle').setDescription('Rolle für EN-Verifikation').setRequired(false))
      .addRoleOption(o => o.setName('base_rolle').setDescription('Basis-Rolle für alle Verifizierten (optional)').setRequired(false)))
    .addSubcommand(sub => sub.setName('panel').setDescription('Sende das Verification-Panel'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'setup') {
      const deRole = interaction.options.getRole('de_rolle');
      const enRole = interaction.options.getRole('en_rolle');
      const baseRole = interaction.options.getRole('base_rolle');

      await db.setVerification(interaction.guild.id, 'role_de_id', deRole.id);
      if (enRole) await db.setVerification(interaction.guild.id, 'role_en_id', enRole.id);
      if (baseRole) await db.setVerification(interaction.guild.id, 'role_id', baseRole.id);
      await db.setVerification(interaction.guild.id, 'enabled', '1');
      await db.updateSetting(interaction.guild.id, 'verification_enabled', '1');

      const parts = [`🇩🇪 ${deRole.name}`];
      if (enRole) parts.push(`🇬🇧 ${enRole.name}`);
      if (baseRole) parts.push(`🔷 Basis: ${baseRole.name}`);
      await interaction.reply({ content: `✅ Verification eingerichtet:\n${parts.join('\n')}\n\nNutze \`/verify panel\``, ephemeral: true });
    }
    if (sub === 'panel') {
      await sendVerificationPanel(interaction.channel);
      await interaction.reply({ content: '✅ Panel gesendet!', ephemeral: true });
    }
  }
};
