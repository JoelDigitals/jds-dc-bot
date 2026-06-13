const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Zeige Verwarnungen eines Benutzers an')
    .addUserOption(opt => opt.setName('benutzer').setDescription('Benutzer').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('benutzer');
    const warns = await db.getWarns(interaction.guild.id, user.id);

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle(`⚠️ Verwarnungen für ${user.tag}`)
      .setDescription(warns.length === 0 ? 'Keine Verwarnungen.' : `${warns.length} Verwarnung(en):`);

    if (warns.length > 0) {
      const fields = warns.map((w, i) => ({
        name: `#${i + 1} - ${new Date(w.warned_at).toLocaleDateString('de-DE')}`,
        value: `Moderator: <@${w.moderator_id}>\nGrund: ${w.reason || 'Kein Grund'}`
      }));
      embed.addFields(fields.slice(0, 25));
    }

    await interaction.reply({ embeds: [embed] });
  }
};
