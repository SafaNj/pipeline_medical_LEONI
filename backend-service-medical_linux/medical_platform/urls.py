from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/account/', include('apps.account.urls')),
    path('api/consultations/', include('apps.consultations.urls')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/medical-records/', include('apps.medical_records.urls')),
    path('api/medical-work/', include('apps.medical_work.urls')),
    path('api/control-visits/', include('apps.control_visits.urls')),
    path('api/planning/', include('apps.planning.urls')),
    path('api/act-infirmier/', include('apps.act_infirmier.urls')),
    path('api/stock/', include('apps.stock.urls')),
    path('api/embauche/', include('apps.embauche.urls')),
    path('api/visites-periodiques/', include('apps.visites_periodiques.urls')),
    path('api/surveillance-speciale/', include('apps.surveillance_speciale.urls')),
    path('api/hsee/', include('apps.hsee.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)