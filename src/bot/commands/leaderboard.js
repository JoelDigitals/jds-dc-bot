const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Zeige die Top 10 Spieler an'),

  async execute(interaction) {
    const top = await getLeaderboard(interaction.guild.id, 10);

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🏆 Leaderboard')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp();

    if (!top.length) {
      embed.setDescription('Noch keine Daten vorhanden. Schreibe Nachrichten um XP zu sammeln!');
    } else {
      const medals = ['🥇', '🥈', '🥉'];
      const desc = top.map((u, i) => {
        const medal = medals[i] || `#${i+1}`;
        return `${medal} <@${u.user_id}> — Level **${u.level}** (${u.xp} XP)`;
      }).join('\n');
      embed.setDescription(desc);
    }

    await interaction.reply({ embeds: [embed] });
  }
};
