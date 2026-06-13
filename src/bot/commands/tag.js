const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Tags/FAQ System')
    .addSubcommand(sub => sub.setName('add').setDescription('Tag erstellen').addStringOption(o => o.setName('name').setDescription('Tag-Name').setRequired(true)).addStringOption(o => o.setName('inhalt').setDescription('Tag-Inhalt').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Tag löschen').addStringOption(o => o.setName('name').setDescription('Tag-Name').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('Alle Tags anzeigen'))
    .addSubcommand(sub => sub.setName('show').setDescription('Tag anzeigen').addStringOption(o => o.setName('name').setDescription('Tag-Name').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'add') {
      const name = interaction.options.getString('name').toLowerCase();
      const content = interaction.options.getString('inhalt');
      await db.addTag(interaction.guild.id, name, content, interaction.user.id);
      await interaction.reply({ content: `✅ Tag \`${name}\` erstellt. Nutzer rufen mit \`?${name}\` auf.`, ephemeral: true });
    }
    if (sub === 'remove') {
      const name = interaction.options.getString('name').toLowerCase();
      await db.removeTag(interaction.guild.id, name);
      await interaction.reply({ content: `✅ Tag \`${name}\` gelöscht.`, ephemeral: true });
    }
    if (sub === 'list') {
      const tags = await db.getAllTags(interaction.guild.id);
      if (!tags.length) return interaction.reply({ content: 'Keine Tags.', ephemeral: true });
      const list = tags.map(t => `\`?${t.name}\` — ${t.content.substring(0, 60)}`).join('\n');
      await interaction.reply({ content: `**📚 Tags:**\n${list}`, ephemeral: false });
    }
    if (sub === 'show') {
      const name = interaction.options.getString('name').toLowerCase();
      const tag = await db.getTag(interaction.guild.id, name);
      if (!tag) return interaction.reply({ content: '❌ Tag nicht gefunden.', ephemeral: true });
      await interaction.reply({ content: `**${tag.name}:**\n${tag.content}`, ephemeral: false });
    }
  }
};
