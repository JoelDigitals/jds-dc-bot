const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economy-admin')
    .setDescription('Shop verwalten')
    .addSubcommand(sub => sub.setName('shop-add').setDescription('Item hinzufügen').addStringOption(o => o.setName('name').setDescription('Item-Name').setRequired(true)).addIntegerOption(o => o.setName('preis').setDescription('Preis in Coins').setRequired(true).setMinValue(1)).addRoleOption(o => o.setName('rolle').setDescription('Rolle (optional)')).addStringOption(o => o.setName('beschreibung').setDescription('Beschreibung (optional)')))
    .addSubcommand(sub => sub.setName('shop-remove').setDescription('Item entfernen').addIntegerOption(o => o.setName('id').setDescription('Item-ID').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'shop-add') {
      const name = interaction.options.getString('name');
      const price = interaction.options.getInteger('preis');
      const role = interaction.options.getRole('rolle');
      const desc = interaction.options.getString('beschreibung') || '';
      await db.addShopItem(interaction.guild.id, name, price, role?.id, desc);
      await interaction.reply({ content: `✅ **${name}** für ${price} 🪙 hinzugefügt!`, ephemeral: true });
    }
    if (sub === 'shop-remove') {
      const id = interaction.options.getInteger('id');
      await db.removeShopItem(id);
      await interaction.reply({ content: `✅ Item #${id} entfernt.`, ephemeral: true });
    }
  }
};
