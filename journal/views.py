from django.shortcuts import get_object_or_404, render
from django.http import HttpResponseRedirect, HttpResponse
from django.core.urlresolvers import reverse
from journal.models import Post

def index(request):
    context = {}
    return render(request, 'journal/index.html', context)

def edit(request):
    context = {}
    return render(request, "journal/edit.html", context)
