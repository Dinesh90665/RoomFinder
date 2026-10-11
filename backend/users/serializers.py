from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    phone = serializers.CharField(
        write_only=True,
        required=False
    )

    role = serializers.ChoiceField(
        choices=Profile.ROLE_CHOICES,
        write_only=True
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'phone',
            'role',
        ]

    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        role = validated_data.pop('role')

        user = User.objects.create_user(
            **validated_data
        )

        Profile.objects.create(
            user=user,
            phone=phone,
            role=role
        )

        return user

    def to_representation(self, instance):
        profile = instance.profile
        return {
            'username': instance.username,
            'email': instance.email,
            'phone': instance.profile.phone,
            'role': instance.profile.role,
            'profile_image': (
            profile.profile_image.url
            if profile.profile_image
            else None
        ),

            
        }