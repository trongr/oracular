from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.core.urlresolvers import reverse

from django.contrib import auth
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required

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
    if password != repeat_password or len(password) < 6:
        return HttpResponseRedirect(reverse('journal:registration')) # TODO. Pass along error msg
    try:
        User.objects.create_user(username, email, password)
    except: # TODO. More fine-grained error checkinng.
        return HttpResponseRedirect(reverse('journal:registration')) # TODO. error msg
    user = auth.authenticate(username=username, password=password)
    if user is not None and user.is_active:
        auth.login(request, user)
        return render(request, "journal/home.html", {
            'username': username
        })
    return render(request, "journal/index.html", {'error': "something's wrong"})
