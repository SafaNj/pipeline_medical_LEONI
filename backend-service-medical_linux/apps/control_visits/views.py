"""Views for control_visits (left intentionally minimal for now)."""

from django.shortcuts import render

def index(request):
    return render(request, 'control_visits/index.html')
