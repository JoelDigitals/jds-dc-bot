const { SlashCommandBuilder } = require('discord.js');
const { createPoll } = require('../modules/polls');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Erstelle eine Umfrage')
    .addStringOption(opt => opt.setName('frage').setDescription('Die Frage').setRequired(true))
    .addStringOption(opt => opt.setName('option1').setDescription('Option 1').setRequired(true))
    .addStringOption(opt => opt.setName('option2').setDescription('Option 2').setRequired(true))
    .addStringOption(opt => opt.setName('option3').setDescription('Option 3'))
    .addStringOption(opt => opt.setName('option4').setDescription('Option 4'))
    .addStringOption(opt => opt.setName('option5').setDescription('Option 5'))
    .addStringOption(opt => opt.setName('option6').setDescription('Option 6'))
    .addStringOption(opt => opt.setName('option7').setDescription('Option 7'))
    .addStringOption(opt => opt.setName('option8').setDescription('Option 8'))
    .addStringOption(opt => opt.setName('option9').setDescription('Option 9'))
    .addStringOption(opt => opt.setName('option10').setDescription('Option 10')),

  async execute(interaction) {
    const question = interaction.options.getString('frage');
    const options = [];
    for (let i = 1; i <= 10; i++) {
      const opt = interaction.options.getString(`option${i}`);
      if (opt) options.push(opt);
    }
    await createPoll(interaction, question, options);
  }
};
