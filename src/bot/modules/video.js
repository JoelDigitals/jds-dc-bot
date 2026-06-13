const RssParser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const db = require('../../database/schema');
const logger = require('../../utils/logger');

const parser = new RssParser();

async function checkVideos(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const settings = await db.getSettings(guild.id);
      if (!settings.video_enabled || !settings.video_channel_id || !settings.video_youtube_channel) continue;

      const channel = guild.channels.cache.get(settings.video_channel_id);
      if (!channel) continue;

      // Use YouTube RSS feed
      const channelUrl = settings.video_youtube_channel;
      const rssUrl = channelUrl.includes('youtube.com')
        ? `https://www.youtube.com/feeds/videos.xml?channel_id=${getYouTubeChannelId(channelUrl)}`
        : channelUrl;

      const feed = await parser.parseURL(rssUrl);

      for (const item of feed.items.slice(0, 3)) {
        if (!item.link) continue;
        if (await db.hasVideoPosted(guild.id, item.link)) continue;

        const videoId = item.id?.replace('yt:video:', '') || '';
        const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle(`🎬 ${item.title || 'Neues Video'}`)
          .setURL(item.link)
          .setDescription(item.contentSnippet ? item.contentSnippet.substring(0, 200) : '')
          .addFields(
            { name: '📅 Hochgeladen', value: item.pubDate ? new Date(item.pubDate).toLocaleDateString('de-DE') : 'Unbekannt', inline: true },
            { name: '🔗 Link', value: item.link, inline: true }
          )
          .setFooter({ text: '🎥 Video Bot' })
          .setTimestamp();

        if (thumbnailUrl) {
          embed.setImage(thumbnailUrl);
        }

        const pingRole = settings.video_ping_role_id ? `<@&${settings.video_ping_role_id}>` : '';
        const content = pingRole ? pingRole : '📺 **Neues Video!**';
        await channel.send({ content, embeds: [embed] });
        await db.markVideoPosted(guild.id, item.title, item.link, item.pubDate);
        logger.bot(`Video posted in ${guild.name}: ${item.title}`);
      }
    } catch (err) {
      logger.error(`Video check error for ${guild.name}: ${err.message}`);
    }
  }
}

function getYouTubeChannelId(url) {
  // Supports https://www.youtube.com/channel/UCxxx or @handle
  const channelMatch = url.match(/channel\/(UC[\w-]+)/);
  if (channelMatch) return channelMatch[1];

  // For @handles, we'd need the API - return as-is for RSS
  return url;
}

module.exports = { checkVideos };
