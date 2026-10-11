
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        profile = request.user.profile

        image_url = None
        if profile.profile_image:
            image_url = request.build_absolute_uri(
                profile.profile_image.url
            )

        return Response({
            "username": request.user.username,
            "email": request.user.email,
            "phone": profile.phone,
            "role": profile.role,
            "profile_image": image_url,
        })

    def patch(self, request):
        profile = request.user.profile
        image = request.FILES.get("profile_image")

        if not image:
            return Response(
                {"error": "Please select a profile image."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if profile.role != "owner":
            return Response(
                {"error": "Only owners can upload profile images."},
                status=status.HTTP_403_FORBIDDEN,
            )

        profile.profile_image = image
        profile.save()

        return Response({
            "message": "Profile image uploaded successfully.",
            "profile_image": request.build_absolute_uri(
                profile.profile_image.url
            ),
        })
