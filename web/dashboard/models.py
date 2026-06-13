from django.db import models
from django.contrib.auth.models import User

class GuildSettings(models.Model):
    guild_id = models.TextField(primary_key=True)
    prefix = models.TextField(default='!')
    welcome_enabled = models.IntegerField(default=0)
    welcome_channel_id = models.TextField(null=True, blank=True)
    welcome_message = models.TextField(default='Willkommen {user} auf dem Server {server}!')
    welcome_dm_enabled = models.IntegerField(default=0)
    welcome_dm_message = models.TextField(default='Hallo {user}, willkommen auf {server}!')
    welcome_embed_title = models.TextField(null=True, blank=True)
    welcome_embed_desc = models.TextField(null=True, blank=True)
    welcome_embed_image = models.TextField(null=True, blank=True)
    welcome_embed_thumbnail = models.TextField(null=True, blank=True)
    goodbye_enabled = models.IntegerField(default=0)
    goodbye_channel_id = models.TextField(null=True, blank=True)
    goodbye_message = models.TextField(default='{user} hat den Server verlassen.')
    goodbye_dm_enabled = models.IntegerField(default=0)
    goodbye_dm_message = models.TextField(null=True, blank=True)
    embed_color = models.TextField(null=True, blank=True)
    embed_footer = models.TextField(null=True, blank=True)
    ticket_banner_url = models.TextField(null=True, blank=True)
    ticket_categories = models.TextField(null=True, blank=True)
    ticket_enabled = models.IntegerField(default=0)
    ticket_category_id = models.TextField(null=True, blank=True)
    ticket_staff_role_id = models.TextField(null=True, blank=True)
    ticket_welcome_message = models.TextField(default='Ein Teammitglied wird sich bald um dein Anliegen kümmern.')
    ticket_panel_title = models.TextField(null=True, blank=True)
    ticket_panel_desc = models.TextField(null=True, blank=True)
    news_enabled = models.IntegerField(default=0)
    news_channel_id = models.TextField(null=True, blank=True)
    news_rss_url = models.TextField(null=True, blank=True)
    video_enabled = models.IntegerField(default=0)
    video_channel_id = models.TextField(null=True, blank=True)
    video_youtube_channel = models.TextField(null=True, blank=True)
    video_tiktok_channel_id = models.TextField(null=True, blank=True)
    video_tiktok_user = models.TextField(null=True, blank=True)
    video_twitch_channel_id = models.TextField(null=True, blank=True)
    video_twitch_user = models.TextField(null=True, blank=True)
    video_twitter_channel_id = models.TextField(null=True, blank=True)
    video_twitter_user = models.TextField(null=True, blank=True)
    video_instagram_channel_id = models.TextField(null=True, blank=True)
    video_instagram_user = models.TextField(null=True, blank=True)
    video_ping_role_id = models.TextField(null=True, blank=True)
    news_ping_role_id = models.TextField(null=True, blank=True)
    news_rss_feeds = models.TextField(null=True, blank=True)
    rss_ping_role_id = models.TextField(null=True, blank=True)
    music_enabled = models.IntegerField(default=0)
    music_channel_id = models.TextField(null=True, blank=True)
    voicerole_enabled = models.IntegerField(default=0)
    voicerole_channel_id = models.TextField(null=True, blank=True)
    voicerole_role_id = models.TextField(null=True, blank=True)
    autoresponder_enabled = models.IntegerField(default=0)
    invitetracker_enabled = models.IntegerField(default=0)
    invitetracker_channel_id = models.TextField(null=True, blank=True)
    moderation_enabled = models.IntegerField(default=0)
    moderation_log_channel_id = models.TextField(null=True, blank=True)
    autorole_enabled = models.IntegerField(default=0)
    autorole_role_id = models.TextField(null=True, blank=True)
    logging_enabled = models.IntegerField(default=0)
    logging_channel_id = models.TextField(null=True, blank=True)
    automod_enabled = models.IntegerField(default=0)
    automod_badwords = models.TextField(null=True, blank=True)
    automod_block_links = models.IntegerField(default=0)
    automod_block_invites = models.IntegerField(default=0)
    levels_enabled = models.IntegerField(default=0)
    levels_channel_id = models.TextField(null=True, blank=True)
    levels_message = models.TextField(default='Glückwunsch {user}, du hast Level {level} erreicht!')
    reactionroles_enabled = models.IntegerField(default=0)
    giveaway_enabled = models.IntegerField(default=0)
    suggestions_enabled = models.IntegerField(default=0)
    suggestions_channel_id = models.TextField(null=True, blank=True)
    tempvoice_enabled = models.IntegerField(default=0)
    tempvoice_category_id = models.TextField(null=True, blank=True)
    tempvoice_channel_id = models.TextField(null=True, blank=True)
    serverstats_enabled = models.IntegerField(default=0)
    serverstats_category_id = models.TextField(null=True, blank=True)
    customcommands_enabled = models.IntegerField(default=0)
    economy_enabled = models.IntegerField(default=0)
    birthday_enabled = models.IntegerField(default=0)
    birthday_channel_id = models.TextField(null=True, blank=True)
    birthday_role_id = models.TextField(null=True, blank=True)
    poll_enabled = models.IntegerField(default=0)
    counting_enabled = models.IntegerField(default=0)
    tags_enabled = models.IntegerField(default=0)
    verification_enabled = models.IntegerField(default=0)
    created_at = models.TextField(null=True, blank=True)
    updated_at = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'guild_settings'

class Warn(models.Model):
    id = models.IntegerField(primary_key=True)
    guild_id = models.TextField()
    user_id = models.TextField()
    moderator_id = models.TextField()
    reason = models.TextField(null=True, blank=True)
    warned_at = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'warns'

class Ticket(models.Model):
    id = models.IntegerField(primary_key=True)
    guild_id = models.TextField()
    channel_id = models.TextField(null=True, blank=True)
    user_id = models.TextField()
    subject = models.TextField(null=True, blank=True)
    status = models.TextField(default='open')
    created_at = models.TextField(null=True, blank=True)
    closed_at = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'tickets'

class Level(models.Model):
    id = models.IntegerField(primary_key=True)
    guild_id = models.TextField()
    user_id = models.TextField()
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    last_message_at = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'levels'

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    discord_id = models.CharField(max_length=32, null=True, blank=True, unique=True)
    discord_access_token = models.TextField(null=True, blank=True)
    discord_refresh_token = models.TextField(null=True, blank=True)
    avatar_url = models.TextField(null=True, blank=True)
    last_guild_id = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} (Discord: {self.discord_id})'
