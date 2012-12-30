from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.core.urlresolvers import reverse

from django.contrib import auth
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required

from journal.models import Post

import re

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
            'error': 'wrong'
        })

@login_required
def logout(request):
    auth.logout(request)
    return HttpResponseRedirect(reverse("journal:index"))

def registration(request):
    return render(request, 'journal/registration.html')

def register(request):
    first_name = request.POST.get('first_name', '')
    last_name = request.POST.get('last_name', '')
    username = request.POST.get('username', '')
    password = request.POST.get('password', '')
    repeat_password = request.POST.get('repeat_password', '')
    email = request.POST.get("email", "")

    error_msg = check_registration(username, password, repeat_password, email)
    if error_msg is not None:
        return render(request, "journal/registration.html", {
            'error_msg': error_msg
        })

    try:
        User.objects.create_user(username, email, password)
    except:
        return render(request, "journal/registration.html", {'error': "something's wrong"})
    user = auth.authenticate(username=username, password=password)
    if user is not None and user.is_active:
        auth.login(request, user)
        return render(request, "journal/home.html", {
            'username': username
        })
    return render(request, "journal/index.html", {'error': "something's wrong"})

def check_registration(username, password, repeat_password, email):
    error_msg = None
    if not re.match(r'^\w+$', username):
        error_msg = "username can only contain letters or numbers"
    elif User.objects.filter(username=username).exists():
        error_msg = "username already exists"
    elif len(password) < 6:
        error_msg = "password must have at least 6 characters"
    elif password != repeat_password:
        error_msg = "passwords don't match"
    elif email != "" and User.objects.filter(email=email).exists():
        error_msg = "email already registered"
    return error_msg
