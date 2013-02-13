import json
# from django.core.serializers.json import DjangoJSONEncoder
# from django.core import serializers
from rest_framework import serializers
from rest_framework.renderers import JSONRenderer

import re
import random
from datetime import datetime

from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.core.urlresolvers import reverse

from django.contrib import auth
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required

from journal.models import Post

JSONTYPE = "application/json"

POSTID = "id"
TITLE = "title"
BODY = "body"
SUBJECT = "subject"
UPDATED = "updated"

STATUS = "status"

USERNAME = "username"
POST = "post"

POSTCOUNT = "postcount"

def index(request):
    return render(request, 'journal/index.html')

@login_required
def edit_post(request, post_id):
    if Post.objects.filter(creator=request.user.id).filter(id=post_id).exists():
        title = request.POST["title_edit"]
        body = request.POST["body_edit"]
        subject = request.POST["subject_edit"]
        post = Post.objects.get(id=post_id)
        post.title = title
        post.body = body
        post.subject = subject
        post.updated = datetime.now()
        post.save()
        return HttpResponseRedirect(reverse('journal:home'))
    return render(request, "home.html", {
        "error_msg": "something's wrong: couldn't edit post"
    })

def home(request):
    if request.user.is_authenticated():
        creator = request.user.id
        count = Post.objects.filter(creator=creator).count()
        if count > 0:
            ind = random.randint(0, count - 1)
            post = Post.objects.filter(creator=creator)[ind]
        else:
            post = None
        return render(request, "journal/home.html", {
            'username': request.user.username,
            'post': post,
        })

def login(request):
    password = request.POST.get('password', '')
    username = request.POST.get('username', '')
    user = auth.authenticate(username=username, password=password)
    if user is not None and user.is_active:
        auth.login(request, user)
        return HttpResponseRedirect(reverse('journal:home'))
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
        return render(request, "journal/registration.html", {
            'error': "something's wrong"
        })
    user = auth.authenticate(username=username, password=password)
    if user is not None and user.is_active:
        auth.login(request, user)
        return HttpResponseRedirect(reverse("journal:home"))
    return render(request, "journal/index.html", {
        'error': "something's wrong"
    })

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

@login_required
def createpost(request):
    title = request.POST.get(TITLE, "")
    body = request.POST.get(BODY, "")
    subject = request.POST.get(SUBJECT, "")
    creator = request.user
    try:
        Post.objects.create(title=title, body=body, creator=creator, subject=subject)
        return HttpResponse(json.dumps({
            TITLE: title,
            BODY: body,
            SUBJECT: subject,
        }), content_type=JSONTYPE)
    except:
        return HttpResponse(json.dumps({
            STATUS: 1,
        }), content_type=JSONTYPE)

@login_required
def randomposts(request):
    if request.user.is_authenticated():
        creator = request.user.id
        postcount = int(request.GET.get(POSTCOUNT, 1))
        maximum = Post.objects.filter(creator=creator).count()
        randomlist = random.sample(xrange(maximum), min(maximum, postcount))
        posts = []
        for i, post in enumerate(Post.objects.filter(creator=creator)):
            if i in randomlist:
                posts.append(post)
        data = {
            "posts": PostSerializer(posts, many=True).data
        }
        return JSONResponse(data)

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('id', 'title', 'body', 'subject', 'updated')

class JSONResponse(HttpResponse):
    """
        An HttpResponse that renders it's content into JSON.
    """
    def __init__(self, data, **kwargs):
        content = JSONRenderer().render(data)
        kwargs['content_type'] = 'application/json'
        super(JSONResponse, self).__init__(content, **kwargs)
