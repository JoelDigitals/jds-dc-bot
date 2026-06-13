const http = require('http');
const { EmbedBuilder } = require('discord.js');

let client = null;

function startBotApi(botClient) {
  client = botClient;
  const port = process.env.BOT_API_PORT || 3001;

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const url = new URL(req.url, `http://localhost:${port}`);
    const path = url.pathname;
    const guildId = url.searchParams.get('guildId');

    if (path === '/api/guilds' && req.method === 'GET') {
      const guilds = client.guilds.cache.map(g => ({
        id: g.id, name: g.name, icon: g.iconURL(), memberCount: g.memberCount,
      }));
      res.end(JSON.stringify(guilds));
    }
    else if (path === '/api/guild/channels' && guildId && req.method === 'GET') {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return sendError(res, 'Guild not found');
      const channels = guild.channels.cache
        .filter(c => c.type === 0 || c.type === 2 || c.type === 4 || c.type === 5 || c.type === 15 || c.type === 16)
        .map(c => ({ id: c.id, name: c.name, type: c.type }));
      res.end(JSON.stringify(channels));
    }
    else if (path === '/api/guild/roles' && guildId && req.method === 'GET') {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return sendError(res, 'Guild not found');
      const roles = guild.roles.cache
        .filter(r => r.name !== '@everyone')
        .map(r => ({ id: r.id, name: r.name, color: r.hexColor }));
      res.end(JSON.stringify(roles));
    }
    else if (path === '/api/send/embed' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const guild = client.guilds.cache.get(data.guildId);
          if (!guild) return sendError(res, 'Guild not found');
          const channel = guild.channels.cache.get(data.channelId);
          if (!channel) return sendError(res, 'Channel not found');

          const embed = new EmbedBuilder()
            .setColor(parseInt(data.color?.replace('#', '') || '5865F2', 16))
            .setDescription(data.description || '');
          if (data.title) embed.setTitle(data.title);
          if (data.image) embed.setImage(data.image);
          if (data.thumbnail) embed.setThumbnail(data.thumbnail);
          if (data.footer) embed.setFooter({ text: data.footer });
          if (data.author) embed.setAuthor({ name: data.author });

          await channel.send({ embeds: [embed] });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          sendError(res, err.message);
        }
      });
    }
    else if (path === '/api/send/ticket-panel' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const guild = client.guilds.cache.get(data.guildId);
          if (!guild) return sendError(res, 'Guild not found');
          const channel = guild.channels.cache.get(data.channelId);
          if (!channel) return sendError(res, 'Channel not found');

          const settings = data.settings || {};
          const embed = new EmbedBuilder()
            .setColor(parseInt((settings.embed_color || '#5865F2').replace('#', ''), 16))
            .setTitle(settings.ticket_panel_title || 'Ticket erstellen')
            .setDescription(settings.ticket_panel_desc || 'Klicke auf den Button, um ein Ticket zu erstellen.');
          if (settings.embed_footer) embed.setFooter({ text: settings.embed_footer });
          if (settings.ticket_banner_url) embed.setImage(settings.ticket_banner_url);

          const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('create_ticket')
              .setLabel('Ticket erstellen')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🎫')
          );

          await channel.send({ embeds: [embed], components: [row] });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          sendError(res, err.message);
        }
      });
    }
    else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  server.listen(port, () => {
    console.log(`  🤖 Bot API: http://localhost:${port}`);
  });
}

function sendError(res, msg) {
  res.statusCode = 400;
  res.end(JSON.stringify({ error: msg }));
}

module.exports = { startBotApi };
