import json, os, urllib.parse
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db import connection
from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.urls import reverse
from .models import GuildSettings, Profile
from .forms import RegisterForm
import requests

def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

# --- Login / Logout / Register ---

def login_view(request):
    error = None
    # Redirect directly to Discord OAuth if ?discord=1
    if request.GET.get('discord') == '1':
        return redirect('discord_login')
    if request.method == 'POST':
        user = authenticate(username=request.POST['username'], password=request.POST['password'])
        if user:
            login(request, user)
            next_url = request.GET.get('next', '/')
            return redirect(next_url)
        error = 'Falscher Benutzername oder Passwort!'
    return render(request, 'dashboard/login.html', {'error': error})

def logout_view(request):
    logout(request)
    return redirect(settings.LOGOUT_REDIRECT_URL)

def set_language(request):
    lang = request.GET.get('lang', 'de')
    if lang not in ('de', 'en'):
        lang = 'de'
    request.session['lang'] = lang
    next_url = request.GET.get('next', '/')
    return redirect(next_url)

def register_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            Profile.objects.create(user=user)
            login(request, user)
            return redirect('/')
    else:
        form = RegisterForm()
    return render(request, 'dashboard/register.html', {'form': form})

# --- Discord OAuth2 ---

def discord_login(request):
    params = {
        'client_id': settings.DISCORD_CLIENT_ID,
        'redirect_uri': settings.DISCORD_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'identify guilds',
        'prompt': 'consent',
    }
    url = 'https://discord.com/api/oauth2/authorize?' + urllib.parse.urlencode(params)
    return HttpResponseRedirect(url)

def discord_callback(request):
    code = request.GET.get('code')
    error = request.GET.get('error')
    if error or not code:
        return render(request, 'dashboard/login.html', {'error': 'Discord-Login abgebrochen.'})

    # Exchange code for token
    data = {
        'client_id': settings.DISCORD_CLIENT_ID,
        'client_secret': settings.DISCORD_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': settings.DISCORD_REDIRECT_URI,
        'scope': 'identify guilds',
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    r = requests.post('https://discord.com/api/oauth2/token', data=data, headers=headers)
    if r.status_code != 200:
        try:
            err_detail = r.json()
            err_msg = err_detail.get('error_description', err_detail.get('error', str(r.text)))
        except:
            err_msg = r.text[:200]
        return render(request, 'dashboard/login.html', {'error': f'Token-Austausch fehlgeschlagen: {err_msg}'})
    token_data = r.json()
    access_token = token_data['access_token']
    refresh_token = token_data.get('refresh_token', '')

    # Fetch user info from Discord
    headers = {'Authorization': f'Bearer {access_token}'}
    r = requests.get('https://discord.com/api/users/@me', headers=headers)
    if r.status_code != 200:
        return render(request, 'dashboard/login.html', {'error': 'Discord-Benutzerdaten konnten nicht abgerufen werden.'})
    discord_user = r.json()
    discord_id = discord_user['id']
    username = discord_user['username']
    avatar_hash = discord_user.get('avatar')
    avatar_url = f'https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.png' if avatar_hash else f'https://cdn.discordapp.com/embed/avatars/{int(discord_user["discriminator"]) % 5}.png'

    # Find or create user
    try:
        profile = Profile.objects.select_related('user').get(discord_id=discord_id)
        user = profile.user
        profile.discord_access_token = access_token
        profile.discord_refresh_token = refresh_token
        profile.avatar_url = avatar_url
        profile.save()
    except Profile.DoesNotExist:
        # Try to match by username or create new
        base_username = username.lower().replace(' ', '_')[:28]
        try_user = None
        try:
            profile = Profile.objects.select_related('user').get(user__username=base_username)
            if not profile.discord_id:
                user = profile.user
                profile.discord_id = discord_id
                profile.discord_access_token = access_token
                profile.discord_refresh_token = refresh_token
                profile.avatar_url = avatar_url
                profile.save()
            else:
                try_user = User.objects.create_user(username=f'{base_username}_{discord_id[:4]}', password=User.objects.make_random_password())
                try_user.save()
                user = try_user
        except Profile.DoesNotExist:
            try_user = User.objects.create_user(username=f'{base_username}_{discord_id[:4]}', password=User.objects.make_random_password())
            try_user.save()
            user = try_user

        if not Profile.objects.filter(user=user).exists():
            Profile.objects.create(
                user=user, discord_id=discord_id,
                discord_access_token=access_token,
                discord_refresh_token=refresh_token,
                avatar_url=avatar_url
            )

    login(request, user)
    response = redirect('/')
    return response

# --- Helper: Live-Daten aus Bot API ---

def fetch_bot_api(path):
    """Ruft die Bot-API auf und gibt JSON zurück oder None."""
    try:
        r = requests.get(f'{settings.BOT_API_URL}{path}', timeout=5)
        if r.status_code == 200:
            return r.json()
    except requests.RequestException:
        pass
    return None

def bot_is_online():
    """Prüft ob die Bot-API erreichbar ist."""
    try:
        r = requests.get(f'{settings.BOT_API_URL}/api/guilds', timeout=3)
        return r.status_code == 200
    except:
        return False

# --- Dashboard / Landing ---

def dashboard(request):
    """Zeigt Landing Page (nicht eingeloggt) oder Dashboard (eingeloggt)."""
    if not request.user.is_authenticated:
        return render(request, 'dashboard/landing.html')

    cursor = connection.cursor()
    cursor.execute("SELECT COUNT(*) as c FROM guild_settings WHERE welcome_enabled=1")
    welcome_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) as c FROM tickets WHERE status='open'")
    ticket_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) as c FROM warns")
    warn_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) as c FROM levels")
    level_count = cursor.fetchone()[0]
    cursor.close()

    guild_id = request.GET.get('guild_id', '')
    settings = None
    channels = []
    roles = []
    if guild_id:
        try:
            settings = GuildSettings.objects.get(guild_id=guild_id)
        except GuildSettings.DoesNotExist:
            pass
        # Live-Daten vom Bot holen
        channels = fetch_bot_api(f'/api/guild/channels?guildId={guild_id}') or []
        roles = fetch_bot_api(f'/api/guild/roles?guildId={guild_id}') or []

    # Discord-connected guilds — filtere nur Server, die den Bot haben
    user_guilds = []
    bot_guild_ids = set()
    cursor = connection.cursor()
    cursor.execute('SELECT guild_id FROM guild_settings')
    for row in cursor.fetchall():
        bot_guild_ids.add(row[0])
    cursor.close()

    try:
        profile = request.user.profile
        if profile.discord_access_token:
            headers = {'Authorization': f'Bearer {profile.discord_access_token}'}
            r = requests.get('https://discord.com/api/users/@me/guilds', headers=headers, timeout=5)
            if r.status_code == 200:
                all_guilds = r.json()
                user_guilds = [
                    g for g in all_guilds
                    if ((int(g.get('permissions', 0)) & 0x20) or (int(g.get('permissions', 0)) & 0x8))
                    and g['id'] in bot_guild_ids
                ]
                if not guild_id and user_guilds:
                    guild_id = user_guilds[0]['id']
                    try:
                        settings = GuildSettings.objects.get(guild_id=guild_id)
                    except GuildSettings.DoesNotExist:
                        pass
                    channels = fetch_bot_api(f'/api/guild/channels?guildId={guild_id}') or []
                    roles = fetch_bot_api(f'/api/guild/roles?guildId={guild_id}') or []
    except (Profile.DoesNotExist, AttributeError, requests.RequestException):
        pass

    return render(request, 'dashboard/index.html', {
        'bot_online': bot_is_online(),
        'welcome_count': welcome_count,
        'ticket_count': ticket_count,
        'warn_count': warn_count,
        'level_count': level_count,
        'guild_id': guild_id,
        'settings': settings,
        'user_guilds': user_guilds,
        'channels': channels,
        'roles': roles,
    })

@login_required
@csrf_exempt
def update_setting(request):
    if request.method == 'POST':
        guild_id = request.POST.get('guild_id')
        key = request.POST.get('key')
        value = request.POST.get('value', '')
        if guild_id and key:
            cursor = connection.cursor()
            cursor.execute(f'UPDATE guild_settings SET "{key}" = %s, updated_at = CURRENT_TIMESTAMP WHERE guild_id = %s', [value, guild_id])
            connection.commit()
            cursor.close()
            # Save last guild for user
            try:
                profile = request.user.profile
                profile.last_guild_id = guild_id
                profile.save()
            except (Profile.DoesNotExist, AttributeError):
                pass
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': True})
            return redirect(f'/?guild_id={guild_id}&saved=1')
    return redirect('/')

# --- Warns / Tickets pages ---

@login_required
def warns_list(request):
    guild_id = request.GET.get('guild_id', '')
    warns = []
    if guild_id:
        cursor = connection.cursor()
        cursor.execute('SELECT * FROM warns WHERE guild_id = %s ORDER BY warned_at DESC LIMIT 50', [guild_id])
        warns = dictfetchall(cursor)
        cursor.close()
    return render(request, 'dashboard/warns.html', {'warns': warns, 'guild_id': guild_id})

@login_required
def tickets_list(request):
    guild_id = request.GET.get('guild_id', '')
    tickets = []
    if guild_id:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM tickets WHERE guild_id = %s AND status='open'", [guild_id])
        tickets = dictfetchall(cursor)
        cursor.close()
    return render(request, 'dashboard/tickets.html', {'tickets': tickets, 'guild_id': guild_id})

# --- API Endpoints ---

@login_required
def api_guild_settings(request, guild_id):
    cursor = connection.cursor()
    cursor.execute('SELECT * FROM guild_settings WHERE guild_id = %s', [guild_id])
    row = cursor.fetchone()
    if row:
        columns = [col[0] for col in cursor.description]
        data = dict(zip(columns, row))
        cursor.close()
        return JsonResponse(data)
    cursor.close()
    return JsonResponse({'guild_id': guild_id})

@login_required
def api_guild_warns(request, guild_id):
    cursor = connection.cursor()
    cursor.execute('SELECT * FROM warns WHERE guild_id = %s ORDER BY warned_at DESC', [guild_id])
    data = dictfetchall(cursor)
    cursor.close()
    return JsonResponse(data, safe=False)

@login_required
def api_guild_tickets(request, guild_id):
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM tickets WHERE guild_id = %s AND status='open'", [guild_id])
    data = dictfetchall(cursor)
    cursor.close()
    return JsonResponse(data, safe=False)

@login_required
def api_guild_bot_info(request, guild_id):
    """Liefert Discord-Server-Info (Name, Icon, Member) aus dem Bot-Cache."""
    bot = getattr(settings, 'BOT_CLIENT', None) or getattr(settings, 'botClient', None)
    if bot is None:
        import sys
        if hasattr(sys, '_getframe'):
            bot = globals().get('botClient')
    if bot is None:
        try:
            bot = __import__('builtins').__dict__.get('botClient')
        except:
            pass
    try:
        from django.conf import settings as s
        bot = getattr(s, 'BOT_CLIENT', None)
    except:
        pass
    
    # Try to find the bot client globally
    import gc
    for obj in gc.get_objects():
        if hasattr(obj, 'guilds') and hasattr(obj.guilds, 'cache'):
            bot = obj
            break

    if bot:
        guild = bot.guilds.cache.get(guild_id)
        if guild:
            return JsonResponse({
                'id': guild.id,
                'name': guild.name,
                'icon': guild.iconURL() if hasattr(guild, 'iconURL') else None,
                'memberCount': guild.memberCount,
                'channels': [{'id': c.id, 'name': c.name, 'type': str(c.type)} for c in guild.channels.cache.values()],
                'roles': [{'id': r.id, 'name': r.name} for r in guild.roles.cache.values()],
            })
    return JsonResponse({'error': 'Bot nicht verbunden oder Server nicht gefunden'}, status=404)

@login_required
@csrf_exempt
def api_send_ticket_panel(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    guild_id = request.POST.get('guild_id')
    channel_id = request.POST.get('channel_id')
    if not guild_id or not channel_id:
        return JsonResponse({'error': 'guild_id and channel_id required'}, status=400)
    try:
        gs = GuildSettings.objects.get(guild_id=guild_id)
    except GuildSettings.DoesNotExist:
        gs = None
    r = requests.post(f'{settings.BOT_API_URL}/api/send/ticket-panel', json={
        'guildId': guild_id,
        'channelId': channel_id,
        'settings': {
            'embed_color': gs.embed_color if gs else None,
            'embed_footer': gs.embed_footer if gs else None,
            'ticket_banner_url': gs.ticket_banner_url if gs else None,
            'ticket_panel_title': gs.ticket_panel_title if gs else None,
            'ticket_panel_desc': gs.ticket_panel_desc if gs else None,
        }
    }, timeout=5)
    try:
        data = r.json()
    except:
        data = {}
    if r.status_code == 200:
        return JsonResponse({'success': True, **data})
    return JsonResponse({'error': data.get('error', 'Fehler beim Senden')}, status=400)

@login_required
@csrf_exempt
def api_send_test_embed(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    guild_id = request.POST.get('guild_id')
    channel_id = request.POST.get('channel_id')
    if not guild_id or not channel_id:
        return JsonResponse({'error': 'guild_id and channel_id required'}, status=400)
    try:
        gs = GuildSettings.objects.get(guild_id=guild_id)
    except GuildSettings.DoesNotExist:
        gs = None
    embed_color = gs.embed_color if gs else '#5865F2'
    embed_footer = gs.embed_footer if gs else None
    r = requests.post(f'{settings.BOT_API_URL}/api/send/embed', json={
        'guildId': guild_id,
        'channelId': channel_id,
        'title': 'Test Embed',
        'description': 'Dies ist ein Test-Embed mit deinen aktuellen Design-Einstellungen.\n\n✅ Farbe: ' + embed_color + '\n✅ Footer: ' + (embed_footer or 'keiner'),
        'color': embed_color,
        'footer': embed_footer,
    }, timeout=5)
    try:
        data = r.json()
    except:
        data = {}
    if r.status_code == 200:
        return JsonResponse({'success': True, **data})
    return JsonResponse({'error': data.get('error', 'Fehler beim Senden')}, status=400)
