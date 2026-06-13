import os
from django.conf import settings

def discord_settings(request):
    client_id = settings.DISCORD_CLIENT_ID
    perms = os.environ.get('DISCORD_INVITE_PERMISSIONS', '8')
    invite_url = f'https://discord.com/api/oauth2/authorize?client_id={client_id}&permissions={perms}&scope=bot+applications.commands'
    
    # Language from session, default 'de'
    lang = request.session.get('lang', 'de')
    
    return {
        'DISCORD_CLIENT_ID': client_id,
        'BOT_INVITE_URL': invite_url,
        'DASHBOARD_URL': settings.DASHBOARD_URL,
        'BOT_API_URL': settings.BOT_API_URL,
        'LANG': lang,
    }
