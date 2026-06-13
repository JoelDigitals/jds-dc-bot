import json, os
from django import template
from django.utils.safestring import mark_safe
from django.conf import settings

register = template.Library()

_translations = None

def load_translations():
    global _translations
    if _translations is None:
        path = os.path.join(settings.BASE_DIR, 'dashboard', 'translations.json')
        try:
            with open(path, 'r', encoding='utf-8') as f:
                _translations = json.load(f)
        except:
            _translations = {}
    return _translations

@register.simple_tag(takes_context=True)
def _(context, key):
    lang = context.get('LANG', 'de')
    t = load_translations()
    entry = t.get(key, {})
    return entry.get(lang, entry.get('de', key))

@register.filter
def get(d, key):
    if d is None:
        return ''
    if isinstance(d, dict):
        return d.get(key, '')
    try:
        return getattr(d, key, '')
    except:
        return ''

CHANNEL_ICONS = {0: '#', 2: '♫', 4: '▣', 5: '📢', 15: '⊞', 16: '▤'}
CHANNEL_COLORS = {0: '#8ab4f8', 2: '#34a853', 4: '#fbbc04', 5: '#ea4335', 15: '#c9d1d9', 16: '#57F287'}
CHANNEL_NAMES = {0: 'Text', 2: 'Voice', 4: 'Kategorie', 5: 'Ankündigung', 15: 'Forum', 16: 'Media'}

def _channel_label(ch):
    t = ch.get('type', 0)
    icon = CHANNEL_ICONS.get(t, '#')
    color = CHANNEL_COLORS.get(t, '#999')
    label = CHANNEL_NAMES.get(t, 'Unbekannt')
    return f'<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:22px;height:22px;border-radius:6px;background:{color}20;color:{color};display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">{icon}</span><span>{label}</span></span>'

CHANNEL_TYPE_FILTERS = {
    'text': [0, 5],
    'voice': [2],
    'category': [4],
}

@register.simple_tag(takes_context=True)
def channel_select(context, field_id, placeholder='', channel_type=None):
    channels = context.get('channels', [])
    settings = context.get('settings')
    current_value = ''
    if settings:
        current_value = str(get(settings, field_id))

    allowed = CHANNEL_TYPE_FILTERS.get(channel_type) if channel_type else None
    if allowed:
        channels = [ch for ch in channels if ch.get('type') in allowed]

    html = f'<select id="{field_id}" onchange="updateSetting(\'{field_id}\', this.value)" class="dc-select">'
    html += f'<option value="">— {placeholder} —</option>'
    for ch in channels:
        sel = ' selected' if str(ch['id']) == current_value else ''
        label = _channel_label(ch)
        html += f'<option value="{ch["id"]}"{sel}>{label} {ch["name"]}</option>'
    html += '</select>'
    return mark_safe(html)

@register.simple_tag(takes_context=True)
def role_select(context, field_id, placeholder=''):
    roles = context.get('roles', [])
    settings = context.get('settings')
    current_value = ''
    if settings:
        current_value = str(get(settings, field_id))

    html = f'<select id="{field_id}" onchange="updateSetting(\'{field_id}\', this.value)" class="dc-select">'
    html += f'<option value="">— {placeholder} —</option>'
    for r in roles:
        sel = ' selected' if str(r['id']) == current_value else ''
        color = r.get('color', '#999')
        html += f'<option value="{r["id"]}"{sel}><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:22px;height:22px;border-radius:6px;background:{color}20;color:{color};display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">@</span><span>{r["name"]}</span></span></option>'
    html += '</select>'
    return mark_safe(html)
