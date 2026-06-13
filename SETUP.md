# Discord Bot + Django Web Overlay — Setup Anleitung

## 1. Projektstruktur

```
Discord Bot/
├── .env                    # Discord Token, Web-Zugangsdaten
├── database.sqlite         # Gemeinsame Datenbank (Bot + Django)
│
├── src/                    # Node.js Discord Bot
│   ├── index.js            # Bot-Einstiegspunkt
│   ├── bot/
│   │   ├── client.js       # Discord Client + Intents
│   │   ├── commands/       # 18 Slash-Commands
│   │   ├── events/         # Event-Handler (ready, join, leave, etc.)
│   │   └── modules/        # 12 Bot-Module (welcome, ticket, news, etc.)
│   ├── database/
│   │   └── schema.js       # SQLite Schema + Query-Helfer
│   └── utils/
│       └── logger.js
│
├── web/                    # Django Web Overlay
│   ├── manage.py           # Django Management
│   ├── requirements.txt    # Python-Abhängigkeiten
│   ├── web_overlay/
│   │   ├── settings.py     # Django Settings
│   │   └── urls.py         # Root-URLs
│   ├── dashboard/
│   │   ├── views.py        # Views + API-Endpunkte
│   │   ├── urls.py         # Dashboard-Routen
│   │   ├── models.py       # DB-Models (unmanaged, liest Bot-DB)
│   │   ├── templates/dashboard/
│   │   │   ├── index.html          # Haupt-Dashboard
│   │   │   ├── login.html          # Login-Seite
│   │   │   ├── warns.html          # Verwarnungen-Seite
│   │   │   ├── tickets.html        # Tickets-Seite
│   │   │   └── modules_*.html      # 22 Module (je 1 Include)
│   │   └── templatetags/
│   │       └── dashboard_extras.py # Custom Template-Filter
│   ├── static/
│   │   ├── css/style.css
│   │   └── js/dashboard.js
│   └── media/
│
└── package.json            # Node.js Abhängigkeiten
```

## 2. Discord Bot Setup

### Voraussetzungen
- Node.js 18+ installiert
- Discord Developer Portal: Bot erstellt + Token kopiert

### .env Datei anlegen

Erstelle `.env` im Hauptverzeichnis (neben `src/`):

```
DISCORD_TOKEN=dein_discord_bot_token
CLIENT_ID=deine_application_id
WEB_USER=admin
WEB_PASSWORD=admin123
SESSION_SECRET=irgendein_geheimer_string
WEB_PORT=3000
```

### Bot installieren & starten

```powershell
# Im Hauptverzeichnis:
cd "C:\Users\Joel\Desktop\Joel Digitals\Programming\Discord Bot"

# Node.js Abhängigkeiten installieren
npm install

# Bot starten
node src/index.js
```

Der Bot sollte sich nun mit "🤖 Discord Bot ist online!" melden.

### Discord Bot Intents (Entwickler-Portal)
Aktiviere im Discord Developer Portal unter "Bot":
- ✅ Presence Intent
- ✅ Server Members Intent
- ✅ Message Content Intent

## 3. Django Web Overlay Setup

### Voraussetzungen
- Python 3.10+ installiert

### Django installieren

```powershell
# Python-Abhängigkeiten installieren
pip install -r web\requirements.txt
```

### Admin-Benutzer erstellen

```powershell
# Django Migrationen ausführen (für das Auth-System)
python web\manage.py migrate

# Admin-Benutzer anlegen
python web\manage.py create_admin

# Oder manuell:
python web\manage.py createsuperuser
# Benutzername: admin
# Passwort: admin123
```

### Django starten

```powershell
# Django Entwicklungsserver starten
python web\manage.py runserver 3000
```

Das Dashboard ist nun erreichbar unter: http://localhost:3000

## 4. Ersteinrichtung

1. **Discord Bot starten**: `node src/index.js`
2. **Django starten**: `python web\manage.py runserver 3000` (in einem zweiten Terminal)
3. **Web Dashboard öffnen**: http://localhost:3000
4. **Einloggen**: Benutzername `admin`, Passwort `admin123`
5. **Server-ID eingeben**:
   - Discord öffnen → Server-Einstellungen → Widget → Server-ID kopieren
   - Oder: Discord Entwicklermodus aktivieren → Rechtsklick auf Server → "ID kopieren"
   - Im Dashboard oben in das Feld einfügen und "Verbinden" klicken
6. **Module konfigurieren**: Toggles umschalten, Channel-IDs eintragen, Einstellungen speichern
7. **Im Discord**: Bei aktivierten Modulen wie Tickets, Reaction Roles, Verification die entsprechenden Slash-Commands ausführen (z.B. `/ticket panel`, `/verify setup @Rolle`)

## 5. Wichtige Hinweise

- **Beide Prozesse müssen laufen** — Bot + Django
- Bot und Django teilen sich **dieselbe SQLite-Datenbank** (`database.sqlite`)
- Django liest die vom Bot erstellten Tabellen (managed = False)
- Einstellungen im Dashboard werden sofort per AJAX gespeichert
- Der Bot startet automatisch alle Cron-Jobs (News/Videos alle 15 Min, Giveaways/Reminders, Geburtstage stündlich)
- Slash-Commands werden beim Start des Bots automatisch registriert

## 6. Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Bot startet nicht | `DISCORD_TOKEN` in `.env` prüfen |
| Django zeigt "no such table" | Bot einmal starten (erstellt die DB) |
| Keine Slash-Commands | `npm run deploy` oder Bot neustarten |
| Dashboard kann nicht speichern | CSRF-Token prüfen (Seite neuladen) |
| SQLite gesperrt | Kein gleichzeitiger Schreibzugriff von Bot + Django |

## 7. Altes Express-Overlay

Das alte Express/EJS-Overlay in `src/web/` wird nicht mehr verwendet. Die Logik wurde vollständig nach Django migriert. Du kannst `src/web/` löschen, wenn du willst:

```powershell
Remove-Item -Recurse -Force src\web
```

## 8. Nützliche Befehle

```powershell
# Bot starten
node src/index.js

# Django starten (Port 3000)
python web\manage.py runserver 3000

# Django mit eigenem Port
python web\manage.py runserver 8080

# Admin-Benutzer anlegen
python web\manage.py create_admin

# Django Migrationen (nur für Auth-Tabellen)
python web\manage.py migrate

# Alle Slash-Commands manuell registrieren
npm run deploy
```

## 9. Projekt-Typ und Architektur

Architektur: **Bot + Web Dashboard (separate Prozesse, gemeinsame DB)**

- Der **Discord Bot** (Node.js/discord.js) verarbeitet alle Discord-Events und -Befehle
- Das **Django Web Overlay** (Python) stellt das Admin-Dashboard bereit
- Beide greifen auf **dieselbe SQLite-Datenbank** zu
- Der Bot schreibt, Django liest/schreibt Einstellungen
- Für Discord-spezifische Daten (Servernamen, Channel-Listen) nutzt Django die Datenbank-Tabellen

Deine 22 Module sind vollständig konfigurierbar:
1. ✅ Begrüßung (Welcome) — Channel + DM
2. ✅ Verabschiedung (Goodbye) — Channel
3. ✅ Tickets — Support-System
4. ✅ News — RSS Feed
5. ✅ Video — YouTube RSS
6. ✅ Suggestions — Vorschläge
7. ✅ Level System — XP + Ränge
8. ✅ Reaction Roles — Button-Panel
9. ✅ Giveaways — Verlosungen
10. ✅ Autorole — Join-Rolle
11. ✅ Economy — Währungssystem
12. ✅ Umfragen (Polls)
13. ✅ Geburtstage (Birthdays)
14. ✅ Moderation — Warn/Kick/Ban
15. ✅ AutoMod — Wort-/Linkfilter
16. ✅ Logging — Audit-Log
17. ✅ Temp Voice — Temporäre Channels
18. ✅ Server Stats — Counter-Channels
19. ✅ Custom Commands — Prefix-Befehle
20. ✅ Tags / FAQ — Wissensdatenbank
21. ✅ Counting Game — Zählspiel
22. ✅ Verification — Button-Verifikation
