
from rest_framework import serializers
from .models import Room, RoomImage


class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = [
            'id',
            'room',
            'image',
            'uploaded_at',
        ]

        read_only_fields = [
            'id',
            'uploaded_at',
        ]


class RoomSerializer(serializers.ModelSerializer):
    owner = serializers.CharField(
        source='owner.username',
        read_only=True
    )

    # Return all images associated with this room
    images = RoomImageSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Room

        fields = [
            'id',
            'owner',
            'title',
            'description',
            'rent',
            'location',
            'room_size',
            'environment',
            'availability',
            'images',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'owner',
            'images',
            'created_at',
            'updated_at',
        ]