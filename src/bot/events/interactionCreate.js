const { handleTicketCreate, handleTicketClose, handleTicketCategorySelect, handleTicketReasonSubmit, handleTicketCloseReasonSubmit } = require('../modules/ticket');
const { handleReactionRoleClick } = require('../modules/reactionroles');
const { handleSuggestionAction } = require('../modules/suggestions');
const { handleVerify, isVerified } = require('../modules/verification');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    // Button interactions
    if (interaction.isButton()) {
      if (interaction.customId === 'create_ticket') return handleTicketCreate(interaction);
      if (interaction.customId === 'close_ticket') return handleTicketClose(interaction);
      if (interaction.customId === 'giveaway_join') {
        return interaction.reply({ content: '✅ Du nimmst am Giveaway teil!', ephemeral: true });
      }
      if (interaction.customId.startsWith('rr_')) return handleReactionRoleClick(interaction);
      if (['suggest_approve', 'suggest_deny', 'suggest_implement'].includes(interaction.customId)) {
        return handleSuggestionAction(interaction);
      }
      if (['verify_me', 'verify_de', 'verify_en'].includes(interaction.customId)) return handleVerify(interaction);
    }

    // Select menu interactions
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_category_select') return handleTicketCategorySelect(interaction);
    }

    // Modal submissions
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'ticket_reason') return handleTicketReasonSubmit(interaction);
      if (interaction.customId === 'ticket_close_reason') return handleTicketCloseReasonSubmit(interaction);
      return;
    }

    // Slash commands
    if (!interaction.isChatInputCommand()) return;

    // Block unverified users (skip admins and server owner)
    if (interaction.guild) {
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      if (member && !(await isVerified(interaction.guild, member))) {
        const isAdmin = member.permissions.has('Administrator') || interaction.user.id === interaction.guild.ownerId;
        if (!isAdmin) {
          return interaction.reply({
            content: '❌ Du musst dich zuerst verifizieren! Nutze den Verifikations-Button in der Willkommens-Nachricht.',
            ephemeral: true,
          });
        }
      }
    }

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Command error ${interaction.commandName}:`, error);
      const reply = { content: '❌ Bei der Ausführung ist ein Fehler aufgetreten.', ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
      else await interaction.reply(reply);
    }
  }
};
