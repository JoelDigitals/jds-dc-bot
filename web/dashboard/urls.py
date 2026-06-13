from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    path('lang/', views.set_language, name='set_language'),
    path('auth/discord/', views.discord_login, name='discord_login'),
    path('auth/discord/callback/', views.discord_callback, name='discord_callback'),
    path('update-setting/', views.update_setting, name='update_setting'),
    path('warns/', views.warns_list, name='warns'),
    path('tickets/', views.tickets_list, name='tickets'),
    path('api/guild/<str:guild_id>/', views.api_guild_settings, name='api_guild_settings'),
    path('api/guild/<str:guild_id>/warns/', views.api_guild_warns, name='api_guild_warns'),
    path('api/guild/<str:guild_id>/tickets/', views.api_guild_tickets, name='api_guild_tickets'),
    path('api/guild/<str:guild_id>/bot-info/', views.api_guild_bot_info, name='api_guild_bot_info'),
    path('api/send-ticket-panel/', views.api_send_ticket_panel, name='api_send_ticket_panel'),
    path('api/send-test-embed/', views.api_send_test_embed, name='api_send_test_embed'),
]
