const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { daily, work, slots, transfer, formatTime, getCooldown } = require('../modules/economy');
const db = require('../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('Wirtschaftssystem')
    .addSubcommand(sub => sub.setName('balance').setDescription('Zeige dein Guthaben').addUserOption(o => o.setName('benutzer').setDescription('Benutzer')))
    .addSubcommand(sub => sub.setName('daily').setDescription('Tägliche Belohnung abholen'))
    .addSubcommand(sub => sub.setName('work').setDescription('Arbeiten für Coins'))
    .addSubcommand(sub => sub.setName('slots').setDescription('Spiele Slot-Maschine').addIntegerOption(o => o.setName('einsatz').setDescription('Dein Einsatz').setRequired(true).setMinValue(1)))
    .addSubcommand(sub => sub.setName('transfer').setDescription('Sende Coins').addUserOption(o => o.setName('empfänger').setDescription('Empfänger').setRequired(true)).addIntegerOption(o => o.setName('betrag').setDescription('Anzahl Coins').setRequired(true).setMinValue(1)))
    .addSubcommand(sub => sub.setName('shop').setDescription('Items kaufen'))
    .addSubcommand(sub => sub.setName('leaderboard').setDescription('Reichste Spieler')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'balance') {
      const user = interaction.options.getUser('benutzer') || interaction.user;
      const eco = await db.getEconomy(interaction.guild.id, user.id);
      const embed = new EmbedBuilder()
        .setColor(0xFFD700).setTitle(`💰 ${user.username}'s Wallet`)
        .addFields({ name: 'Bargeld', value: `${eco.balance} 🪙`, inline: true }, { name: 'Bank', value: `${eco.bank} 🪙`, inline: true }, { name: 'Gesamt', value: `${eco.balance + eco.bank} 🪙`, inline: true })
        .setThumbnail(user.displayAvatarURL({ dynamic: true })).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'daily') {
      const result = await daily(interaction.user.id, interaction.guild.id);
      if (result.error) return interaction.reply({ content: `⏰ Komm in ${formatTime(result.cooldown)} wieder!`, ephemeral: true });
      return interaction.reply(`✅ Tägliche Belohnung: **${result.amount}** 🪙 erhalten!`);
    }

    if (sub === 'work') {
      const result = await work(interaction.user.id, interaction.guild.id);
      if (result.error) return interaction.reply({ content: `⏰ Du kannst in ${formatTime(result.cooldown)} wieder arbeiten.`, ephemeral: true });
      const jobs = ['Programmierer', 'Koch', 'Designer', 'Musiker', 'Lehrer', 'Gärtner', 'Bäcker'];
      return interaction.reply(`💼 Als **${jobs[Math.floor(Math.random() * jobs.length)]}** verdient: **${result.amount}** 🪙`);
    }

    if (sub === 'slots') {
      const bet = interaction.options.getInteger('einsatz');
      const result = await slots(interaction.user.id, interaction.guild.id, bet);
      if (result.error) return interaction.reply({ content: '❌ Nicht genug Coins!', ephemeral: true });
      const msg = `${result.result.join(' ')}\n${result.win > 0 ? `🎉 Gewonnen: **${result.win}** 🪙` : `💔 Verloren: **${Math.abs(result.net)}** 🪙`}`;
      return interaction.reply(msg);
    }

    if (sub === 'transfer') {
      const to = interaction.options.getUser('empfänger');
      const amount = interaction.options.getInteger('betrag');
      if (to.id === interaction.user.id) return interaction.reply({ content: '❌ Du kannst dir nicht selbst senden.', ephemeral: true });
      const result = await transfer(interaction.user.id, to.id, interaction.guild.id, amount);
      if (result.error) return interaction.reply({ content: '❌ Nicht genug Coins!', ephemeral: true });
      return interaction.reply(`✅ **${amount}** 🪙 an ${to} gesendet!`);
    }

    if (sub === 'shop') {
      const items = await db.getShopItems(interaction.guild.id);
      if (!items.length) return interaction.reply({ content: '📭 Shop ist leer. Admin: `/economy shop add`', ephemeral: true });
      const embed = new EmbedBuilder().setColor(0xFFD700).setTitle('🏪 Shop').setTimestamp();
      items.forEach((item, i) => {
        embed.addFields({ name: `${i + 1}. ${item.name} — ${item.price} 🪙`, value: item.description || 'Keine Beschreibung', inline: false });
      });
      await interaction.reply({ embeds: [embed] });
    }

    if (sub === 'leaderboard') {
      const top = await db.getEconomyLeaderboard(interaction.guild.id, 10);
      const embed = new EmbedBuilder().setColor(0xFFD700).setTitle('🏆 Reichste Spieler').setThumbnail(interaction.guild.iconURL({ dynamic: true })).setTimestamp();
      if (!top.length) embed.setDescription('Keine Daten.');
      else embed.setDescription(top.map((u, i) => `#${i + 1} <@${u.user_id}> — ${u.balance + u.bank} 🪙`).join('\n'));
      await interaction.reply({ embeds: [embed] });
    }
  }
};
