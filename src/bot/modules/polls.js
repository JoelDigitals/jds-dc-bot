const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/schema');

const EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

async function createPoll(interaction, question, options) {
  if (options.length < 2 || options.length > 10) {
    return interaction.reply({ content: '❌ 2-10 Optionen erforderlich.', ephemeral: true });
  }

  const desc = options.map((o, i) => `${EMOJIS[i]} ${o}`).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📊 ' + question)
    .setDescription(desc)
    .setFooter({ text: `Von ${interaction.user.tag}` })
    .setTimestamp();

  const msg = await interaction.channel.send({ embeds: [embed] });

  for (let i = 0; i < options.length; i++) {
    await msg.react(EMOJIS[i]);
  }

  await db.createPoll(interaction.guild.id, interaction.channel.id, msg.id, question, options, interaction.user.id);
  await interaction.reply({ content: '✅ Umfrage erstellt!', ephemeral: true });
}

module.exports = { createPoll };
