from django.urls import path

from .views import RoomListCreateView,  RoomDetailView ,RoomImageCreateView


urlpatterns = [
    path(
        '',
        RoomListCreateView.as_view(),
        name='room-list-create'
    ),
     path(
        '<int:pk>/',
        RoomDetailView.as_view(),
        name='room-detail'
    ),
    path(
    'images/uploads/',
    RoomImageCreateView.as_view(),
    name='room-image-create'
),
]