const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/schema');

async function sendReactionRolePanel(channel, settings) {
  const roles = await db.getReactionRoles(channel.guild.id);
  if (!roles.length) {
    return channel.send('Keine Reaction Roles konfiguriert.');
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📋 Rollen Auswahl')
    .setDescription('Klicke auf einen Button, um die entsprechende Rolle zu erhalten oder zu entfernen.')
    .setTimestamp();

  const rows = [];
  let currentRow = new ActionRowBuilder();

  for (let i = 0; i < roles.length; i++) {
    const r = roles[i];
    if (i > 0 && i % 5 === 0) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }

    const styleMap = { primary: ButtonStyle.Primary, secondary: ButtonStyle.Secondary, success: ButtonStyle.Success, danger: ButtonStyle.Danger };
    currentRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`rr_${r.id}`)
        .setLabel(r.label || r.role_id)
        .setStyle(styleMap[r.style] || ButtonStyle.Primary)
        .setEmoji(r.emoji || '✅')
    );
  }
  if (currentRow.components.length) rows.push(currentRow);

  const msg = await channel.send({ embeds: [embed], components: rows });
  return msg;
}

async function handleReactionRoleClick(interaction) {
  const rrId = interaction.customId.replace('rr_', '');
  const allRoles = await db.getReactionRoles(interaction.guild.id);
  const rr = allRoles.find(r => r.id == rrId);
  if (!rr) return interaction.reply({ content: 'Diese Rolle existiert nicht mehr.', ephemeral: true });

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const role = interaction.guild.roles.cache.get(rr.role_id);
  if (!role) return interaction.reply({ content: 'Rolle nicht gefunden.', ephemeral: true });

  if (member.roles.cache.has(role.id)) {
    await member.roles.remove(role);
    await interaction.reply({ content: `✅ Rolle **${role.name}** wurde entfernt.`, ephemeral: true });
  } else {
    await member.roles.add(role);
    await interaction.reply({ content: `✅ Rolle **${role.name}** wurde hinzugefügt.`, ephemeral: true });
  }
}

module.exports = { sendReactionRolePanel, handleReactionRoleClick };
