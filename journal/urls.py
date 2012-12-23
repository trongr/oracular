from django.conf.urls import patterns, url
from journal import views

urlpatterns = patterns(
    '',
    url(r'^$', views.index, name='index'),
    url(r'^edit/(?P<post_id>\d+)/$', views.edit, name='edit'),
    url(r'^home/$', views.home, name='home'),
    url(r'^logout/$', views.logout, name='logout'),
)