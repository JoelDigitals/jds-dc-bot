from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

class RegisterForm(UserCreationForm):
    email = forms.EmailField(required=True, label='E-Mail')

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].label = 'Benutzername'
        self.fields['password1'].label = 'Passwort'
        self.fields['password2'].label = 'Passwort bestätigen'
        for field in self.fields.values():
            field.widget.attrs.update({'placeholder': field.label})
