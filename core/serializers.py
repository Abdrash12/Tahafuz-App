# core/serializers.py
from rest_framework import serializers
from .models import TrustedContact


from .models import TrustedContact, CustomUser # Import CustomUser

class TrustedContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustedContact
        fields = ['id', 'name', 'phone_number',  'email', 'is_active']
        from rest_framework import serializers

class UserRegistrationSerializer(serializers.ModelSerializer):
    # Make password write-only so it doesn't accidentally leak in API responses
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'fallback_phone']

    def create(self, validated_data):
        # create_user automatically hashes the password securely
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            fallback_phone=validated_data.get('fallback_phone', '')
        )
        return user