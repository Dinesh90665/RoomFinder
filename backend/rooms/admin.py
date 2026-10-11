from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Room, RoomImage


class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'owner',
        'rent',
        'location',
        'environment',
        'availability',
        'created_at',
    )

    list_filter = (
        'availability',
        'environment',
        'created_at',
    )

    search_fields = (
        'title',
        'location',
        'owner__username',
    )

    inlines = [RoomImageInline]


@admin.register(RoomImage)
class RoomImageAdmin(admin.ModelAdmin):
    list_display = (
        'room',
        'image',
        'uploaded_at',
    )

    search_fields = (
        'room__title',
    )