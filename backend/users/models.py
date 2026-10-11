
# Create your models here.
from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):

    ROLE_CHOICES = (
        ('seeker', 'Room Seeker'),
        ('owner', 'House Owner'),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    profile_image = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True
    )

    def __str__(self):
        return self.user.username