from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User


class Room(models.Model):

    AVAILABILITY_CHOICES = (
        ('available', 'Available'),
        ('rented', 'Rented'),
    )

    ENVIRONMENT_CHOICES = (
        ('quiet', 'Quiet'),
        ('normal', 'Normal'),
        ('noisy', 'Noisy'),
    )

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='rooms'
    )

    title = models.CharField(
        max_length=200
    )

    description = models.TextField()

    rent = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    location = models.CharField(
        max_length=255
    )

    room_size = models.CharField(
        max_length=100,
        blank=True
    )

    environment = models.CharField(
        max_length=20,
        choices=ENVIRONMENT_CHOICES,
        default='normal'
    )

    availability = models.CharField(
        max_length=20,
        choices=AVAILABILITY_CHOICES,
        default='available'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.title
    


class RoomImage(models.Model):

    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='images'
    )

    image = models.ImageField(
        upload_to='rooms/'
        
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Image for {self.room.title}"