import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-discord-bot-key-change-me')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'dashboard',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'web_overlay.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'dashboard.context_processors.discord_settings',
            ],
        },
    },
]

WSGI_APPLICATION = 'web_overlay.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('PGDATABASE', 'postgres'),
        'USER': os.environ.get('PGUSER', 'postgres.toeqgxdeoaaxjzkzzymy'),
        'PASSWORD': os.environ.get('PGPASSWORD', 'JDS_BoT2026!'),
        'HOST': os.environ.get('PGHOST', 'aws-0-eu-west-1.pooler.supabase.com'),
        'PORT': os.environ.get('PGPORT', '6543'),
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

LANGUAGE_CODE = 'de-de'
TIME_ZONE = 'Europe/Berlin'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

if not DEBUG:
    CSRF_TRUSTED_ORIGINS = os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',')
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

LOGIN_URL = '/login/'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/login/'
SESSION_COOKIE_AGE = 86400

# Discord OAuth2
DISCORD_CLIENT_ID = os.environ.get('DISCORD_CLIENT_ID', '')
DISCORD_CLIENT_SECRET = os.environ.get('DISCORD_CLIENT_SECRET', '')
DISCORD_REDIRECT_URI = os.environ.get('DISCORD_REDIRECT_URI', 'http://localhost:3000/auth/discord/callback/')
DISCORD_BOT_TOKEN = os.environ.get('DISCORD_TOKEN', '')

# Bot Invite
DISCORD_INVITE_PERMISSIONS = os.environ.get('DISCORD_INVITE_PERMISSIONS', '8')

# Dashboard URL (for bot messages)
DASHBOARD_URL = os.environ.get('DASHBOARD_URL', 'http://localhost:3000')

# Bot API (for live guild/channel/role data)
BOT_API_URL = os.environ.get('BOT_API_URL', 'http://localhost:3001')
