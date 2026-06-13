const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cc')
    .setDescription('Custom Commands verwalten')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Erstelle einen neuen Befehl')
        .addStringOption(opt => opt.setName('name').setDescription('Befehlsname').setRequired(true))
        .addStringOption(opt => opt.setName('antwort').setDescription('Antworttext').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Lösche einen Befehl')
        .addStringOption(opt => opt.setName('name').setDescription('Befehlsname').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('Zeige alle Befehle'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const name = interaction.options.getString('name').toLowerCase();
      const response = interaction.options.getString('antwort');
      await db.addCustomCommand(interaction.guild.id, name, response);
      await interaction.reply({ content: `✅ Befehl \`!${name}\` wurde erstellt.`, ephemeral: true });
    }

    if (sub === 'remove') {
      const name = interaction.options.getString('name').toLowerCase();
      await db.removeCustomCommand(interaction.guild.id, name);
      await interaction.reply({ content: `✅ Befehl \`!${name}\` wurde gelöscht.`, ephemeral: true });
    }

    if (sub === 'list') {
      const cmds = await db.getCustomCommands(interaction.guild.id);
      if (!cmds.length) return interaction.reply({ content: 'Keine Custom Commands vorhanden.', ephemeral: true });
      const list = cmds.map(c => `\`!${c.name}\` — ${c.response.substring(0, 50)}`).join('\n');
      await interaction.reply({ content: `**📋 Custom Commands:**\n${list}`, ephemeral: false });
    }
  }
};
