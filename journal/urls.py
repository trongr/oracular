from django.conf.urls import patterns, url
from journal import views

urlpatterns = patterns(
    '',
    url(r'^$', views.index, name='index'),
    url(r'^home/$', views.home, name='home'),
    url(r'^registration/$', views.registration, name='registration'),
    url(r'^register/$', views.register, name='register'),
    url(r'^logout/$', views.logout, name='logout'),
    url(r'^edit/(?P<post_id>\d+)/$', views.edit, name='edit'),
)
