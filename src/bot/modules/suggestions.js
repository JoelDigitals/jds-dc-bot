const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/schema');

async function createSuggestion(interaction, content) {
  const settings = await db.getSettings(interaction.guild.id);
  if (!settings.suggestions_enabled || !settings.suggestions_channel_id) {
    return interaction.reply({ content: '❌ Suggestions sind nicht konfiguriert.', ephemeral: true });
  }

  const channel = interaction.guild.channels.cache.get(settings.suggestions_channel_id);
  if (!channel) return interaction.reply({ content: '❌ Suggestions-Channel nicht gefunden.', ephemeral: true });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('💡 Vorschlag')
    .setDescription(content)
    .addFields(
      { name: 'Von', value: interaction.user.tag, inline: true },
      { name: 'Status', value: '🟡 Ausstehend', inline: true }
    )
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('suggest_approve').setLabel('✅ Approve').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('suggest_deny').setLabel('❌ Deny').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('suggest_implement').setLabel('🔧 Implemented').setStyle(ButtonStyle.Primary)
    );

  const msg = await channel.send({ embeds: [embed], components: [row] });
  await msg.react('👍');
  await msg.react('👎');

  await db.createSuggestion(interaction.guild.id, channel.id, msg.id, interaction.user.id, content);
  await interaction.reply({ content: `✅ Vorschlag wurde erstellt: ${channel}`, ephemeral: true });
}

async function handleSuggestionAction(interaction) {
  if (!interaction.member.permissions.has('ModerateMembers')) {
    return interaction.reply({ content: '❌ Keine Berechtigung.', ephemeral: true });
  }

  const embed = EmbedBuilder.from(interaction.message.embeds[0]);
  let status = '';

  if (interaction.customId === 'suggest_approve') { status = '✅ Angenommen'; embed.setColor(0x00FF00); }
  else if (interaction.customId === 'suggest_deny') { status = '❌ Abgelehnt'; embed.setColor(0xFF0000); }
  else if (interaction.customId === 'suggest_implement') { status = '🔧 Implementiert'; embed.setColor(0x5865F2); }

  embed.spliceFields(1, 1, { name: 'Status', value: status, inline: true });
  await interaction.message.edit({ embeds: [embed], components: [] });
  await interaction.reply({ content: `✅ Status aktualisiert: ${status}`, ephemeral: true });
}

module.exports = { createSuggestion, handleSuggestionAction };
