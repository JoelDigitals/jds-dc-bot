const { SlashCommandBuilder } = require('discord.js');
const { createSuggestion } = require('../modules/suggestions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Erstelle einen Vorschlag für den Server')
    .addStringOption(opt => opt.setName('vorschlag').setDescription('Dein Vorschlag').setRequired(true)),

  async execute(interaction) {
    const content = interaction.options.getString('vorschlag');
    await createSuggestion(interaction, content);
  }
};
