from django.contrib import auth
from django.shortcuts import get_object_or_404, render
from django.http import HttpResponseRedirect, HttpResponse
from django.core.urlresolvers import reverse
from journal.models import Post

def index(request):
    return render(request, 'journal/index.html')

def edit(request):
    return render(request, "journal/edit.html")

def home(request):
    username = request.POST.get('username', '')
    password = request.POST.get('password', '')
    user = auth.authenticate(username=username, password=password)
    if user is not None and user.is_active:
        auth.login(request, user)
        return render(request, "journal/home.html", {
                'username': username
                })
    else:
        return render(request, "journal/index.html", {
                'error': 'wrong login'
                })

