# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrustedContactViewSet, TriggerSOSView, RegisterUserView

router = DefaultRouter()
router.register(r'contacts', TrustedContactViewSet, basename='contacts')

urlpatterns = [
    path('sos/', TriggerSOSView.as_view(), name='trigger_sos'),
    path('register/', RegisterUserView.as_view(), name='register'),
    path('', include(router.urls)),
]