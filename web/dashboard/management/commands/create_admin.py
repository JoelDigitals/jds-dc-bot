import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Erstellt den Admin-Benutzer aus der .env oder mit Defaults'

    def handle(self, *args, **options):
        username = os.environ.get('WEB_USER', 'admin')
        password = os.environ.get('WEB_PASSWORD', 'admin123')
        email = os.environ.get('WEB_EMAIL', 'admin@localhost')

        if User.objects.filter(username=username).exists():
            self.stdout.write(f'Benutzer "{username}" existiert bereits.')
            return

        User.objects.create_superuser(username=username, password=password, email=email)
        self.stdout.write(self.style.SUCCESS(f'Admin-Benutzer "{username}" erstellt.'))
