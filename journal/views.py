import operator
from django.db.models import Q

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
TAGS = "tags"
SUBJECT = "subject"
UPDATED = "updated"

STATUS = "status"

USERNAME = "username"
POST = "post"

POSTCOUNT = "postcount"

# todo. replace this with home.html. show a sample public app on
# index.html: the only difference between home.html and index.html
# would be that one has a login bar and the other doesn't.
#
# should we just hide it or create different views?
def index(request):
    return render(request, 'journal/index.html')

def savepost(request, postid):
    title = request.POST.get(TITLE, "")
    body = request.POST.get(BODY, "")
    subject = request.POST.get(SUBJECT, "")
    creator = request.user
    post = Post.objects.get(id=postid)
    post.title = title
    post.body = body
    post.subject = subject
    post.updated = datetime.now()
    post.save()

# todo. parse and save tags in model
@login_required
def editpost(request):
    postid = request.POST.get(POSTID, "")
    try:
        if Post.objects.filter(creator=request.user.id).filter(id=int(postid)).exists():
            savepost(request, postid)
            return jsonpost(request)
    except:
        return jsonerror()

def jsonerror():
    return HttpResponse(json.dumps({
        STATUS: 1,
    }), content_type=JSONTYPE)

def jsonpost(request):
    return HttpResponse(json.dumps({
        TITLE: request.POST.get(TITLE, ""),
        BODY: request.POST.get(BODY, ""),
        SUBJECT: request.POST.get(SUBJECT, ""),
    }), content_type=JSONTYPE)

def home(request):
    # if request.user.is_authenticated():
    return render(request, "journal/home.html")

# todo. https
def login(request):
    password = request.GET.get('password', '')
    username = request.GET.get('username', '')
    user = auth.authenticate(username=username, password=password)
    if user is not None and user.is_active:
        auth.login(request, user)
        return JSONResponse({
            "isloggedin": True
        })
    return JSONResponse({
        "isloggedin": False
    })

@login_required
def logout(request):
    auth.logout(request)
    return JSONResponse({
        "isloggedin": False
    })

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

# todo. if not logged in create post in public account username password
@login_required
def createpost(request):
    title = request.POST.get(TITLE, "")
    body = request.POST.get(BODY, "")
    subject = request.POST.get(SUBJECT, "")
    creator = request.user
    try:
        Post.objects.create(title=title, body=body, creator=creator, subject=subject)
        return jsonpost(request)
    except:
        return jsonerror()

def isloggedin(request):
    if request.user.is_authenticated():
        return JSONResponse({"isloggedin": True})
    else:
        return JSONResponse({"isloggedin": False})

# @login_required
def randomposts(request):
    # todo. default limit 20
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
    else:
        # todo. return public posts
        data = {
        }
        return JSONResponse(data)

# todo. validate everything
def relatedposts(req):
    if req.user.is_authenticated():
        creator = req.user.id
        where = req.GET.get("where")

        # todo opt. remove short words. todo opt. do this on client
        relatedwords = req.GET.getlist("relatedwords[]") # get("relatedwords").split()

        postcount = int(req.GET.get(POSTCOUNT, 1))

        # result = Post.objects.filter(creator=creator).filter(reduce(operator.or_, (Q(subject__icontains=rw) | Q(title__icontains=rw) for rw in relatedwords)))
        result = None;
        if where == "title":
            result = Post.objects.filter(creator=creator).filter(reduce(operator.or_, (Q(title__icontains=rw) for rw in relatedwords)))
        elif where == "subject":
            result = Post.objects.filter(creator=creator).filter(reduce(operator.or_, (Q(subject__icontains=rw) for rw in relatedwords)))
        elif where == "body":
            # relatedwords = [lword for lword in relatedwords if len(lword) >= 4]
            # if relatedwords:
            result = Post.objects.filter(creator=creator).filter(reduce(operator.or_, (Q(body__icontains=rw) for rw in relatedwords)))

        posts = []
        if result:
            maximum = result.count()
            ind = random.randint(0, maximum - 1)
            posts.append(result[ind])

        # same format as randomposts response to make it easy for
        # home.js/loadposts()
        data = {
            "posts": PostSerializer(posts, many=True).data
        }
        return JSONResponse(data)
    else:
        # todo. return public posts
        data = {
        }
        return JSONResponse(data)

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('id', 'title', 'body', 'subject', 'created', 'updated')

class JSONResponse(HttpResponse):
    """
        An HttpResponse that renders its content into JSON.
    """
    def __init__(self, data, **kwargs):
        content = JSONRenderer().render(data)
        kwargs['content_type'] = 'application/json'
        super(JSONResponse, self).__init__(content, **kwargs)

# tags are just subjects split by spaces
def gettags(req):
    pass
    # if request.user.is_authenticated():
    #     creator = request.user.id
    #     postcount = int(request.GET.get(POSTCOUNT, 1))
    #     maximum = Post.objects.filter(creator=creator).count()
    #     randomlist = random.sample(xrange(maximum), min(maximum, postcount))
    #     posts = []
    #     for i, post in enumerate(Post.objects.filter(creator=creator)):
    #         if i in randomlist:
    #             posts.append(post)
    #     data = {
    #         "posts": PostSerializer(posts, many=True).data
    #     }
    #     return JSONResponse(data)
    # else:
    #     # todo. return public posts
    #     data = {
    #     }
    #     return JSONResponse(data)
