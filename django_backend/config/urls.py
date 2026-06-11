"""URL configuration for the NovaGen Django companion backend."""

from django.contrib import admin
from django.urls import include, path

from core.views import root

urlpatterns = [
    path("", root, name="root"),
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
]
