const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/schema');

async function createGiveaway(channel, prize, winners, duration, host) {
  const endTime = Date.now() + duration;
  const endsAt = new Date(endTime).toISOString();

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('🎉 Giveaway!')
    .setDescription(`**${prize}**\n\nKlicke auf den Button, um teilzunehmen!`)
    .addFields(
      { name: '👑 Gewinner', value: `${winners}`, inline: true },
      { name: '⏰ Endet', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true },
      { name: '🎁 Veranstalter', value: `${host}`, inline: true }
    )
    .setFooter({ text: 'Giveaway' })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_join')
        .setEmoji('🎉')
        .setLabel('Teilnehmen')
        .setStyle(ButtonStyle.Success)
    );

  const msg = await channel.send({ embeds: [embed], components: [row] });
  await msg.react('🎉');

  await db.createGiveaway(channel.guild.id, channel.id, msg.id, prize, winners, endsAt, host.id);

  return msg;
}

async function checkGiveaways(client) {
  const active = await db.getActiveGiveaways();
  const now = Date.now();

  for (const g of active) {
    const endTime = new Date(g.ends_at).getTime();
    if (endTime > now) continue;

    try {
      const guild = client.guilds.cache.get(g.guild_id);
      if (!guild) continue;
      const channel = guild.channels.cache.get(g.channel_id);
      if (!channel) continue;

      const msg = await channel.messages.fetch(g.message_id).catch(() => null);
      if (!msg) continue;

      const reaction = msg.reactions.cache.get('🎉');
      let participants = [];
      if (reaction) {
        const users = await reaction.users.fetch();
        participants = users.filter(u => !u.bot).map(u => u.id);
      }

      const winners = [];
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(g.winners, shuffled.length); i++) {
        winners.push(shuffled[i]);
      }

      const winnerText = winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'Keine Teilnehmer';

      const resultEmbed = EmbedBuilder.from(msg.embeds[0] || {})
        .setColor(0x00FF00)
        .setTitle('🎉 Giveaway beendet!')
        .setDescription(`**${g.prize}**\n\n👑 **Gewinner:** ${winnerText}`)
        .setFooter({ text: 'Giveaway beendet' });

      await msg.edit({ embeds: [resultEmbed], components: [] });

      await channel.send(`🎉 **Giveaway beendet!**\n${winnerText} hat/haben **${g.prize}** gewonnen!`);

      await db.endGiveaway(g.id);

      // DM winners
      for (const w of winners) {
        try {
          const user = await client.users.fetch(w);
          const dmEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎉 Du hast gewonnen!')
            .setDescription(`Du hast **${g.prize}** auf **${guild.name}** gewonnen!`)
            .setTimestamp();
          await user.send({ embeds: [dmEmbed] });
        } catch (e) {}
      }
    } catch (err) {
      console.error(`Giveaway error: ${err.message}`);
    }
  }
}

module.exports = { createGiveaway, checkGiveaways };
