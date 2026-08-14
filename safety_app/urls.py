# safety_app/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Serve the PWA frontend interface at the root URL
    path('', TemplateView.as_view(template_name='index.html'), name='home'), 
    
    path('admin/', admin.site.urls),
    
    # Authentication / Login Endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Core App API Endpoints (/api/contacts/, /api/sos/, and /api/register/)
    path('api/', include('core.urls')),
]