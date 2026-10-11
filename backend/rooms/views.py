from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Room
from .serializers import RoomSerializer , RoomImageSerializer

class RoomListCreateView(generics.ListCreateAPIView):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Room.objects.all().order_by('-created_at')

    def perform_create(self, serializer):

        if self.request.user.profile.role != 'owner':
            raise PermissionDenied(
                'Only house owners can create rooms.'
            )

        serializer.save(owner=self.request.user)

class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Room.objects.all()

    def perform_update(self, serializer):
        room = self.get_object()

        if room.owner != self.request.user:
            raise PermissionDenied(
                'You can only edit your own rooms.'
            )

        serializer.save()

    def perform_destroy(self, instance):
        if instance.owner != self.request.user:
            raise PermissionDenied(
                'You can only delete your own rooms.'
            )

        instance.delete()

class RoomImageCreateView(generics.CreateAPIView):
    serializer_class = RoomImageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):

        room = serializer.validated_data['room']

        if room.owner != self.request.user:
            raise PermissionDenied(
                'You can only upload images to your own rooms.'
            )

        serializer.save()
