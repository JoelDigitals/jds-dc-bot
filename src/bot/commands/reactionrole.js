const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendReactionRolePanel } = require('../modules/reactionroles');
const db = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Reaction Roles verwalten')
    .addSubcommand(sub => sub.setName('panel').setDescription('Sende das Rollen-Panel in diesen Channel'))
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Füge eine Rolle hinzu')
        .addRoleOption(opt => opt.setName('rolle').setDescription('Die Rolle').setRequired(true))
        .addStringOption(opt => opt.setName('emoji').setDescription('Emoji').setRequired(true))
        .addStringOption(opt => opt.setName('label').setDescription('Button-Text'))
        .addStringOption(opt => opt.setName('style').setDescription('Button-Stil').addChoices({ name: 'Primary', value: 'primary' }, { name: 'Success', value: 'success' }, { name: 'Danger', value: 'danger' }, { name: 'Secondary', value: 'secondary' })))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') {
      await sendReactionRolePanel(interaction.channel, interaction.guild.id);
      await interaction.reply({ content: '✅ Panel gesendet!', ephemeral: true });
    }

    if (sub === 'add') {
      const role = interaction.options.getRole('rolle');
      const emoji = interaction.options.getString('emoji');
      const label = interaction.options.getString('label') || role.name;
      const style = interaction.options.getString('style') || 'primary';

      await db.addReactionRole(interaction.guild.id, interaction.channel.id, '', role.id, emoji, label, style);
      await interaction.reply({ content: `✅ Rolle **${role.name}** wurde hinzugefügt. Verwende \`/reactionrole panel\` um das Panel zu senden.`, ephemeral: true });
    }
  }
};
