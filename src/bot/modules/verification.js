const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/schema');

async function sendVerificationPanel(channel) {
  const settings = await db.getSettings(channel.guild.id);
  const ver = await db.getVerification(channel.guild.id);

  if (!settings.verification_enabled || !ver.role_id) {
    return channel.send('❌ Verification nicht konfiguriert. Rolle fehlt.');
  }

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Verifikation')
    .setDescription('Klicke auf den Button, um dich zu verifizieren und Zugriff auf den Server zu erhalten.')
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('verify_me')
        .setEmoji('✅')
        .setLabel('Verifizieren')
        .setStyle(ButtonStyle.Success)
    );

  const msg = await channel.send({ embeds: [embed], components: [row] });
  await db.setVerification(channel.guild.id, 'channel_id', channel.id);
  await db.setVerification(channel.guild.id, 'message_id', msg.id);
}

async function handleVerify(interaction) {
  const ver = await db.getVerification(interaction.guild.id);
  const role = interaction.guild.roles.cache.get(ver.role_id);
  if (!role) return interaction.reply({ content: '❌ Verifikations-Rolle nicht gefunden.', ephemeral: true });

  const member = await interaction.guild.members.fetch(interaction.user.id);
  if (member.roles.cache.has(role.id)) {
    return interaction.reply({ content: '✅ Du bist bereits verifiziert!', ephemeral: true });
  }

  await member.roles.add(role);
  await interaction.reply({ content: '✅ Du wurdest erfolgreich verifiziert!', ephemeral: true });
}

module.exports = { sendVerificationPanel, handleVerify };
