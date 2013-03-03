from django.conf.urls import patterns, url
from journal import views

# todo. one front view only. rename home to index.html
urlpatterns = patterns(
    '',
    url(r'^$', views.home, name='home'),
    url(r'^isloggedin$', views.isloggedin, name='isloggedin'),
    url(r'^login$', views.login, name='login'),
    url(r'^home/$', views.home, name='home'),
    url(r'^register$', views.register, name='register'),
    url(r'^logout$', views.logout, name='logout'),
    url(r'^editpost$', views.editpost, name='editpost'),
    url(r'^createpost$', views.createpost, name='createpost'),
    url(r'^randomposts$', views.randomposts, name='randomposts'),
    url(r'^relatedposts$', views.relatedposts, name='relatedposts'),
    url(r'^gettags$', views.gettags, name='gettags'),
)
