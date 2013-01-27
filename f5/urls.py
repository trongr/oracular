from django.http import HttpResponseRedirect
from django.conf.urls import patterns, include, url
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('',
    url(r"^$", lambda x: HttpResponseRedirect('/journal/')),
    # Examples:
    # url(r'^$', 'f5.views.home', name='home'),
    url(r'^journal/', include('journal.urls', namespace='journal')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
    # url(r'^accounts/', include('registration.urls')),
)
