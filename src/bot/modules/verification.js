const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/schema');

async function sendVerificationPanel(channel) {
  const settings = await db.getSettings(channel.guild.id);
  const ver = await db.getVerification(channel.guild.id);

  if (!settings.verification_enabled) {
    return channel.send('❌ Verification nicht aktiviert.');
  }
  if (!ver.role_de_id && !ver.role_en_id && !ver.role_id) {
    return channel.send('❌ Keine Verifikations-Rollen konfiguriert. Nutze `/verify setup`.');
  }

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Verifikation')
    .setDescription('Wähle deine Sprache / Choose your language:')
    .setFooter({ text: 'Nur verifizierte Nutzer können Commands nutzen.' })
    .setTimestamp();

  const row = new ActionRowBuilder();

  if (ver.role_de_id) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('verify_de')
        .setEmoji('🇩🇪')
        .setLabel('Verifizieren (DE)')
        .setStyle(ButtonStyle.Success)
    );
  }
  if (ver.role_en_id) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('verify_en')
        .setEmoji('🇬🇧')
        .setLabel('Verify (EN)')
        .setStyle(ButtonStyle.Primary)
    );
  }
  if (!ver.role_de_id && !ver.role_en_id && ver.role_id) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('verify_me')
        .setEmoji('✅')
        .setLabel('Verifizieren')
        .setStyle(ButtonStyle.Success)
    );
  }

  if (!row.components.length) return;

  const msg = await channel.send({ embeds: [embed], components: [row] });
  await db.setVerification(channel.guild.id, 'channel_id', channel.id);
  await db.setVerification(channel.guild.id, 'message_id', msg.id);
}

async function handleVerify(interaction) {
  const ver = await db.getVerification(interaction.guild.id);
  const member = await interaction.guild.members.fetch(interaction.user.id);

  let roleId, langLabel;
  if (interaction.customId === 'verify_de') {
    roleId = ver.role_de_id;
    langLabel = 'DE';
  } else if (interaction.customId === 'verify_en') {
    roleId = ver.role_en_id;
    langLabel = 'EN';
  } else {
    roleId = ver.role_id;
    langLabel = '';
  }

  if (!roleId) {
    return interaction.reply({ content: '❌ Keine Verifikations-Rolle konfiguriert.', ephemeral: true });
  }

  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) return interaction.reply({ content: '❌ Verifikations-Rolle nicht gefunden.', ephemeral: true });

  if (member.roles.cache.has(role.id)) {
    return interaction.reply({ content: '✅ Du bist bereits verifiziert!', ephemeral: true });
  }

  await member.roles.add(role);

  const msg = langLabel === 'DE' ? '✅ Du wurdest erfolgreich verifiziert! Willkommen!' :
             langLabel === 'EN' ? '✅ You have been verified! Welcome!' :
             '✅ Du wurdest erfolgreich verifiziert!';
  await interaction.reply({ content: msg, ephemeral: true });

  // Also give legacy role_id as base role if using DE/EN
  if (ver.role_id && ver.role_id !== roleId && !member.roles.cache.has(ver.role_id)) {
    await member.roles.add(ver.role_id).catch(() => {});
  }
}

/**
 * Check if a member is verified. Returns false if verification is enabled but member has no verify role.
 */
async function isVerified(guild, member) {
  const settings = await db.getSettings(guild.id);
  if (!settings.verification_enabled) return true;

  const ver = await db.getVerification(guild.id);
  const roles = [ver.role_de_id, ver.role_en_id, ver.role_id].filter(Boolean);
  if (!roles.length) return true;

  return roles.some(id => member.roles.cache.has(id));
}

module.exports = { sendVerificationPanel, handleVerify, isVerified };
