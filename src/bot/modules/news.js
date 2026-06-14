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
  // 1. enclosure (RSS standard)
  if (item.enclosure?.url) return item.enclosure.url;

  // 2. media:content (WordPress featured image)
  if (item['media:content']) {
    const mc = Array.isArray(item['media:content']) ? item['media:content'][0] : item['media:content'];
    if (mc?.$?.url) return mc.$.url;
  }

  // 3. media:thumbnail
  if (item['media:thumbnail']) {
    const mt = Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0] : item['media:thumbnail'];
    if (mt?.$?.url) return mt.$.url;
    if (typeof mt === 'string') return mt;
  }

  // 4. itunes:image
  if (item.itunes?.image) return item.itunes.image;

  // 5. [Bild: URL] format (Blogger / custom CMS)
  const textData = item['content:encoded'] || item.content || '';
  let m = textData.match(/\[Bild:\s*(https?:\/\/[^\]]+\.(?:png|jpg|jpeg|gif|webp)[^\]]*)\]/i);
  if (!m) m = textData.match(/\[Image:\s*(https?:\/\/[^\]]+\.(?:png|jpg|jpeg|gif|webp)[^\]]*)\]/i);
  if (m) return m[1].split('?')[0];

  // 6. og:image / twitter:image from content
  m = textData.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (!m) m = textData.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
  if (m) return m[1];

  // 7. Standard img tag
  m = textData.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) return m[1];

  // 8. link-based: link itself is an image
  if (item.link && /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(item.link)) {
    return item.link;
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
