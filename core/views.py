# core/views.py
from rest_framework import viewsets, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.mail import send_mail
from .models import TrustedContact, SOSAlert, CustomUser
from .serializers import TrustedContactSerializer, UserRegistrationSerializer

class RegisterUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

class TrustedContactViewSet(viewsets.ModelViewSet):
    serializer_class = TrustedContactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TrustedContact.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TriggerSOSView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        
        # Log the alert coordinates to the Neon DB
        alert = SOSAlert.objects.create(
            user=request.user,
            latitude=lat,
            longitude=lng
        )
        
        # Dispatch email notifications to trusted contacts with emails
        maps_link = f"https://www.google.com/maps?q={lat},{lng}"
        contacts = TrustedContact.objects.filter(user=request.user, is_active=True)
        recipient_emails = [c.email for c in contacts if c.email]
        
        if recipient_emails:
            send_mail(
                subject='URGENT: Safety Alert from Tahafuz',
                message=f'URGENT! {request.user.username} has triggered an SOS emergency alert. Their current location is: {maps_link}',
                from_email=None,
                recipient_list=recipient_emails,
                fail_silently=True,
            )
        
        return Response({"status": "SOS Logged and Emails Dispatched", "alert_id": alert.id}, status=201)