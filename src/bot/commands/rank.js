const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRankInfo } = require('../modules/levels');
const { getLeaderboard } = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Zeige deinen Rang und Level an')
    .addUserOption(opt => opt.setName('benutzer').setDescription('Benutzer (optional)')),

  async execute(interaction) {
    const user = interaction.options.getUser('benutzer') || interaction.user;
    const info = await getRankInfo(interaction.guild.id, user.id);

    const nextLevelXp = 50 * Math.pow(info.level + 1, 2);
    const currentLevelXp = 50 * Math.pow(info.level, 2);
    const xpInLevel = info.xp - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;
    const progress = Math.min(100, Math.floor((xpInLevel / (xpNeeded || 1)) * 100));

    const bar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`📊 ${user.username}'s Rang`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Level', value: `**${info.level}**`, inline: true },
        { name: 'Rang', value: `#${info.rank}`, inline: true },
        { name: 'XP', value: `${info.xp} (${bar})`, inline: false }
      )
      .setFooter({ text: `${xpInLevel}/${xpNeeded} XP bis Level ${info.level + 1}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
