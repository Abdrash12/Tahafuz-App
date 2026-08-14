# core/views.py
import os
import resend
from rest_framework import viewsets, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import TrustedContact, SOSAlert, CustomUser
from .serializers import TrustedContactSerializer, UserRegistrationSerializer

# Initialize Resend with the environment variable API key
resend.api_key = os.getenv("RESEND_API_KEY")

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
        
        # Dispatch email notifications to trusted contacts using Resend HTTPS SDK
        maps_link = f"https://www.google.com/maps?q={lat},{lng}"
        contacts = TrustedContact.objects.filter(user=request.user, is_active=True)
        
        for contact in contacts:
            if contact.email:
                try:
                    resend.Emails.send({
                        "from": "onboarding@resend.dev",
                        "to": contact.email,
                        "subject": "URGENT: Safety Alert from Tahafuz",
                        "html": f"""
                            <div style="font-family: Arial, sans-serif; padding: 20px; background: #fdf2f2; border-left: 6px solid #e74c3c;">
                                <h2 style="color: #c0392b;">🚨 Emergency SOS Alert!</h2>
                                <p>Your contact <strong>{request.user.username}</strong> has triggered an emergency distress signal.</p>
                                <p><strong>Live GPS Location:</strong> <a href="{maps_link}" target="_blank">Click here to open Google Maps</a></p>
                                <p style="font-size: 12px; color: #7f8c8d;">Coordinates: {lat}, {lng}</p>
                            </div>
                        """
                    })
                except Exception as e:
                    print(f"Failed to send email to {contact.email}: {e}")
        
        return Response({"status": "SOS Logged and Emails Dispatched", "alert_id": alert.id}, status=201)
