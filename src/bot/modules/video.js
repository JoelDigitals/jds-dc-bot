const RssParser = require('rss-parser');
const { EmbedBuilder, ChannelType } = require('discord.js');
const https = require('https');
const db = require('../../database/schema');
const logger = require('../../utils/logger');

const parser = new RssParser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'content:encoded'],
  },
});

// --- YouTube handle → channel ID resolver ---

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redir = res.headers.location.startsWith('http')
          ? res.headers.location
          : `https://www.youtube.com${res.headers.location}`;
        return resolve(httpsGet(redir));
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
      res.on('error', reject);
    }).on('error', reject).setTimeout(10000, () => { reject(new Error('timeout')); });
  });
}

const channelIdCache = new Map();

async function resolveHandleToId(handle) {
  const key = handle.toLowerCase().replace(/^@/, '');
  if (channelIdCache.has(key)) return channelIdCache.get(key);
  try {
    const { data } = await httpsGet(`https://www.youtube.com/@${key}/about`);
    const match = data.match(/UC[\w-]{22,}/);
    if (match) { channelIdCache.set(key, match[0]); return match[0]; }
  } catch {}
  return null;
}

// --- RSS URL builder for YouTube ---

async function buildYtRssUrl(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('https://www.youtube.com/feeds/videos.xml')) return trimmed;
  if (/^UC[\w-]{22,}$/.test(trimmed)) return `https://www.youtube.com/feeds/videos.xml?channel_id=${trimmed}`;
  const chanMatch = trimmed.match(/channel\/(UC[\w-]+)/);
  if (chanMatch) return `https://www.youtube.com/feeds/videos.xml?channel_id=${chanMatch[1]}`;
  const handleMatch = trimmed.match(/@([\w.-]+)/);
  if (handleMatch) {
    const id = await resolveHandleToId(handleMatch[1]);
    if (id) return `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;
  }
  return trimmed; // fallback: use as-is
}

// --- Helper ---

function extractImage(item) {
  if (item['media:content']) {
    const mc = Array.isArray(item['media:content']) ? item['media:content'][0] : item['media:content'];
    if (mc?.$?.url) return mc.$.url;
  }
  if (item['media:thumbnail']) {
    const mt = Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0] : item['media:thumbnail'];
    if (mt?.$?.url) return mt.$.url;
  }
  const videoId = item.id?.replace('yt:video:', '') || '';
  if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  return null;
}

function extractDesc(item) {
  if (item.contentSnippet) return item.contentSnippet.substring(0, 200);
  if (item['content:encoded']) return item['content:encoded'].replace(/<[^>]+>/g, '').trim().substring(0, 200);
  return '';
}

function parseFeeds(settings) {
  const feeds = [];
  if (settings.video_feeds) {
    try {
      const parsed = JSON.parse(settings.video_feeds);
      if (Array.isArray(parsed)) {
        for (const f of parsed) {
          if (f.url) feeds.push({
            url: f.url, name: f.name || '', platform: f.platform || '',
            channelId: f.channel_id || null, pingRoleId: f.ping_role_id || null,
          });
        }
      }
    } catch {}
  }
  // Fallback: old single YouTube field
  if (!feeds.length && settings.video_youtube_channel) {
    feeds.push({
      url: settings.video_youtube_channel, name: 'YouTube',
      platform: 'youtube', channelId: settings.video_channel_id || null,
      pingRoleId: settings.video_ping_role_id || null,
    });
  }
  return feeds;
}

// --- Main ---

async function checkVideos(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const settings = await db.getSettings(guild.id);
      if (!settings.video_enabled) continue;

      const feeds = parseFeeds(settings);
      if (!feeds.length) continue;

      for (const feed of feeds) {
        try {
          await processFeed(client, guild, settings, feed);
        } catch (err) {
          logger.error(`Video feed error for ${guild.name} (${feed.url}): ${err.message}`);
        }
      }
    } catch (err) {
      logger.error(`Video check error for ${guild.name}: ${err.message}`);
    }
  }
}

async function processFeed(client, guild, settings, feed) {
  const channelId = feed.channelId || settings.video_channel_id;
  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  // Resolve YouTube URL to RSS
  let rssUrl = feed.url.trim();
  if (feed.platform === 'youtube' || rssUrl.includes('youtube.com') || rssUrl.includes('youtu.be')) {
    rssUrl = await buildYtRssUrl(rssUrl);
  }

  const feedData = await parser.parseURL(rssUrl);
  const color = settings.embed_color ? parseInt(settings.embed_color.replace('#', ''), 16) : 0xFF0000;

  for (const item of feedData.items.slice(0, 3)) {
    if (!item.link) continue;
    if (await db.hasVideoPosted(guild.id, item.link)) continue;

    const desc = extractDesc(item);
    const image = extractImage(item);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🎬 ${item.title || 'Neues Video'}`)
      .setURL(item.link)
      .setDescription(desc)
      .addFields(
        { name: '📅 Veröffentlicht', value: item.pubDate ? new Date(item.pubDate).toLocaleDateString('de-DE') : 'Unbekannt', inline: true },
        { name: '🔗 Link', value: item.link, inline: true }
      )
      .setFooter({ text: feed.name || '🎥 Video Bot' })
      .setTimestamp();

    if (image) embed.setImage(image);

    const ping = feed.pingRoleId ? `<@&${feed.pingRoleId}>` : '';

    try {
      const msg = await channel.send({ content: ping || '📺 **Neues Video!**', embeds: [embed] });
      if (channel.type === ChannelType.GuildAnnouncement) {
        await msg.crosspost();
      }
    } catch (err) {
      logger.error(`Failed to send video to ${guild.name}/${channel.name}: ${err.message}`);
    }
    await db.markVideoPosted(guild.id, item.title, item.link, item.pubDate);
    logger.bot(`Video posted in ${guild.name}: ${item.title}`);
  }
}

module.exports = { checkVideos };
