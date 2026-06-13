const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/schema');
const logger = require('../../utils/logger');

const pendingCategories = new Map();

async function createTicketPanel(channel, settings) {
  const color = settings?.embed_color ? parseInt(settings.embed_color.replace('#', ''), 16) : 0x5865F2;
  const footer = settings?.embed_footer || 'Support-System';
  const title = settings?.ticket_panel_title || 'Ticket Support';
  const desc = settings?.ticket_panel_desc || 'Klicke auf den Button unten, um ein Ticket zu erstellen.\nEin Teammitglied wird sich um dein Anliegen kümmern.';

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(desc)
    .setFooter({ text: footer })
    .setTimestamp();

  if (settings?.ticket_banner_url) embed.setImage(settings.ticket_banner_url);

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Ticket erstellen')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫')
    );

  await channel.send({ embeds: [embed], components: [row] });
}

function parseCategories(raw) {
  if (!raw) return [];
  try { const c = JSON.parse(raw); return Array.isArray(c) ? c : []; } catch { return []; }
}

function buildReasonModal(subject) {
  return new ModalBuilder()
    .setCustomId('ticket_reason')
    .setTitle('Ticket erstellen')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('ticket_reason_input')
          .setLabel('Beschreibe dein Anliegen')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Wobei benötigst du Hilfe? (optional)')
          .setRequired(false)
          .setMaxLength(500)
      )
    );
}

async function handleTicketCreate(interaction) {
  const settings = await db.getSettings(interaction.guild.id);
  if (!settings.ticket_enabled) {
    return interaction.reply({ content: 'Ticket-System ist deaktiviert.', ephemeral: true });
  }

  const categories = parseCategories(settings.ticket_categories);

  if (!categories.length) {
    pendingCategories.set(interaction.user.id, { subject: 'Support', staffRoleId: null });
    return interaction.showModal(buildReasonModal('Support'));
  }

  const options = categories.map((cat, i) => ({
    label: cat.name || `Kategorie ${i + 1}`,
    description: cat.description ? cat.description.substring(0, 100) : undefined,
    value: String(i),
    emoji: cat.emoji ? { name: cat.emoji } : undefined,
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_category_select')
    .setPlaceholder('Wähle eine Kategorie')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(select);

  await interaction.reply({
    content: 'Bitte wähle eine Kategorie für dein Ticket:',
    components: [row],
    ephemeral: true,
  });
}

async function handleTicketCategorySelect(interaction) {
  if (!interaction.isStringSelectMenu()) return;

  const categoryIndex = parseInt(interaction.values[0], 10);
  const settings = await db.getSettings(interaction.guild.id);
  const categories = parseCategories(settings.ticket_categories);
  const category = categories[categoryIndex] || { name: 'Support' };

  pendingCategories.set(interaction.user.id, {
    subject: category.name || 'Support',
    staffRoleId: category.staff_role_id || null,
  });

  await interaction.showModal(buildReasonModal(category.name));
}

async function handleTicketReasonSubmit(interaction) {
  if (!interaction.isModalSubmit()) return;

  const reason = interaction.fields.getTextInputValue('ticket_reason_input') || '';
  const pending = pendingCategories.get(interaction.user.id) || { subject: 'Support', staffRoleId: null };
  pendingCategories.delete(interaction.user.id);

  const settings = await db.getSettings(interaction.guild.id);

  await interaction.deferReply({ ephemeral: true });
  await createTicketDirect(interaction, settings, pending.subject, pending.staffRoleId, reason);
}

async function createTicketDirect(interaction, settings, subject, categoryStaffRoleId, reason) {
  const categoryId = settings.ticket_category_id;
  const staffRoleId = categoryStaffRoleId || settings.ticket_staff_role_id;
  const guild = interaction.guild || interaction.member.guild;

  const openTickets = await db.getOpenTickets(guild.id);
  const existing = openTickets.find(t => t.user_id === interaction.user.id);
  if (existing) {
    const msg = `Du hast bereits ein offenes Ticket: <#${existing.channel_id}>`;
    if (interaction.replied || interaction.deferred) return interaction.followUp({ content: msg, ephemeral: true });
    return interaction.reply({ content: msg, ephemeral: true });
  }

  const ticketName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const staffRole = staffRoleId ? guild.roles.cache.get(staffRoleId) : null;

  const permissionOverwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
  ];
  if (staffRole) {
    permissionOverwrites.push({
      id: staffRole.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  const ticketChannel = await guild.channels.create({
    name: ticketName,
    type: ChannelType.GuildText,
    category: categoryId || undefined,
    permissionOverwrites,
    topic: `Ticket von ${interaction.user.tag} — ${subject}`,
  });

  await db.createTicket(guild.id, ticketChannel.id, interaction.user.id, subject);

  const welcomeMsg = settings.ticket_welcome_message || 'Ein Teammitglied wird sich bald um dein Anliegen kümmern.';
  const color = settings.embed_color ? parseInt(settings.embed_color.replace('#', ''), 16) : 0x5865F2;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🎫 ${subject}`)
    .setDescription(`${welcomeMsg}\n\nBitte beschreibe dein Anliegen so genau wie möglich.`)
    .addFields(
      { name: 'Erstellt von', value: interaction.user.tag, inline: true },
      { name: 'Kategorie', value: subject, inline: true }
    )
    .setTimestamp();

  if (reason) {
    embed.addFields({ name: 'Grund', value: reason });
  }

  if (settings.embed_footer) embed.setFooter({ text: settings.embed_footer });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Ticket schließen')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒')
  );

  await ticketChannel.send({ content: staffRole ? `<@&${staffRole.id}>` : '', embeds: [embed], components: [row] });

  const reply = { content: `Ticket erstellt: ${ticketChannel}`, ephemeral: true };
  if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
  else await interaction.reply(reply);

  logger.bot(`Ticket created by ${interaction.user.tag} in ${guild.name} — ${subject}`);
}

async function handleTicketClose(interaction) {
  const ticket = await db.getTicket(interaction.guild.id, interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ content: 'Dies ist kein Ticket-Channel.', ephemeral: true });
  }

  const modal = new ModalBuilder()
    .setCustomId('ticket_close_reason')
    .setTitle('Ticket schließen')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('ticket_close_reason_input')
          .setLabel('Grund (optional)')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Warum wird das Ticket geschlossen?')
          .setRequired(false)
          .setMaxLength(500)
      )
    );

  await interaction.showModal(modal);
}

async function handleTicketCloseReasonSubmit(interaction) {
  if (!interaction.isModalSubmit()) return;

  const reason = interaction.fields.getTextInputValue('ticket_close_reason_input') || '';
  const ticket = await db.getTicket(interaction.guild.id, interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ content: 'Ticket nicht gefunden.', ephemeral: true });
  }

  await interaction.deferReply();

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('🔒 Ticket geschlossen')
    .setDescription(`Ticket von <@${ticket.user_id}> wurde von ${interaction.user.tag} geschlossen.`)
    .setTimestamp();

  if (reason) {
    embed.addFields({ name: 'Grund', value: reason });
  }

  await interaction.channel.send({ embeds: [embed] });

  await db.closeTicket(interaction.guild.id, interaction.channel.id);

  setTimeout(async () => {
    try {
      await interaction.channel.delete();
      logger.bot(`Ticket channel deleted: ${interaction.channel.name}`);
    } catch (err) {
      logger.error(`Could not delete ticket channel: ${err.message}`);
    }
  }, 5000);
}

module.exports = { createTicketPanel, handleTicketCreate, handleTicketClose, handleTicketCategorySelect, handleTicketReasonSubmit, handleTicketCloseReasonSubmit };
