const RssParser = require('rss-parser');
const { EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../../database/schema');
const logger = require('../../utils/logger');

const parser = new RssParser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'content:encoded'],
  },
});

function extractImage(item) {
  if (item.enclosure?.url && /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(item.enclosure.url)) {
    return item.enclosure.url;
  }
  if (item['media:content']) {
    const mc = Array.isArray(item['media:content']) ? item['media:content'][0] : item['media:content'];
    if (mc?.$?.url) return mc.$.url;
  }
  if (item['media:thumbnail']) {
    const mt = Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0] : item['media:thumbnail'];
    if (mt?.$?.url) return mt.$.url;
  }
  if (item['content:encoded']) {
    const match = item['content:encoded'].match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  if (item.content) {
    const match = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  return null;
}

function extractDescription(item) {
  if (item.contentSnippet) return item.contentSnippet.substring(0, 300);
  if (item['content:encoded']) {
    const text = item['content:encoded'].replace(/<[^>]+>/g, '').trim();
    return text.substring(0, 300);
  }
  if (item.content) {
    const text = item.content.replace(/<[^>]+>/g, '').trim();
    return text.substring(0, 300);
  }
  return '';
}

function parseFeeds(settings) {
  const feeds = [];
  // New multi-feed format
  if (settings.news_rss_feeds) {
    try {
      const parsed = JSON.parse(settings.news_rss_feeds);
      if (Array.isArray(parsed)) {
        for (const f of parsed) {
          if (f.url) feeds.push({ url: f.url, name: f.name || '', pingRoleId: f.ping_role_id || null, channelId: f.channel_id || null });
        }
      }
    } catch {}
  }
  // Fallback: single old-school feed
  if (!feeds.length && settings.news_rss_url) {
    feeds.push({ url: settings.news_rss_url, name: '', pingRoleId: settings.news_ping_role_id || null });
  }
  return feeds;
}

async function processFeed(client, guild, channel, feed, settings) {
  const feedData = await parser.parseURL(feed.url);
  const color = settings.embed_color ? parseInt(settings.embed_color.replace('#', ''), 16) : 0x1DB954;

  for (const item of feedData.items.slice(0, 5)) {
    if (!item.link) continue;
    if (await db.hasNewsPosted(guild.id, item.link)) continue;

    const description = extractDescription(item);
    const imageUrl = extractImage(item);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(item.title || 'Neuer Blog-Artikel')
      .setURL(item.link)
      .setDescription(description)
      .addFields(
        { name: '📅 Veröffentlicht', value: item.pubDate ? new Date(item.pubDate).toLocaleDateString('de-DE') : 'Unbekannt', inline: true },
        { name: '🔗 Link', value: item.link, inline: true }
      )
      .setFooter({ text: feed.name || '📰 News Bot' })
      .setTimestamp();

    if (feed.name) {
      embed.addFields({ name: '📡 Quelle', value: feed.name, inline: true });
    }

    if (imageUrl) {
      embed.setImage(imageUrl);
    }

    const pingRole = feed.pingRoleId ? `<@&${feed.pingRoleId}>` : '';

    try {
      const msg = await channel.send({ content: pingRole, embeds: [embed] });
      // Auto-publish in announcement channels
      if (channel.type === ChannelType.GuildAnnouncement) {
        await msg.crosspost();
      }
    } catch (err) {
      logger.error(`Failed to send news to ${guild.name}/${channel.name}: ${err.message}`);
    }

    await db.markNewsPosted(guild.id, item.title, item.link, item.pubDate);
    logger.bot(`News posted in ${guild.name}: ${item.title}`);
  }
}

async function checkNews(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const settings = await db.getSettings(guild.id);
      if (!settings.news_enabled) continue;

      const feeds = parseFeeds(settings);
      if (!feeds.length) continue;

      for (const feed of feeds) {
        try {
          // Use feed-specific channel, fallback to global
          const chId = feed.channelId || settings.news_channel_id;
          if (!chId) continue;
          const channel = guild.channels.cache.get(chId);
          if (!channel) continue;

          await processFeed(client, guild, channel, feed, settings);
        } catch (err) {
          logger.error(`News feed error for ${guild.name} (${feed.url}): ${err.message}`);
        }
      }
    } catch (err) {
      logger.error(`News check error for ${guild.name}: ${err.message}`);
    }
  }
}

module.exports = { checkNews };
