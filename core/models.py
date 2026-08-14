from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser

# Your existing CustomUser model
class CustomUser(AbstractUser):
    fallback_phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return self.username

class TrustedContact(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='contacts')
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.phone_number})"

class SOSAlert(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='alerts')
    timestamp = models.DateTimeField(auto_now_add=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    resolved = models.BooleanField(default=False)

class HeatmapPin(models.Model):
    DANGER_LEVELS = [(1, 'Caution'), (2, 'Warning'), (3, 'Danger')]
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    danger_level = models.IntegerField(choices=DANGER_LEVELS)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)