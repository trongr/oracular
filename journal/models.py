from datetime import datetime
from django.contrib.auth.models import User
from django.db import models

class Post(models.Model):
    subject = models.CharField(max_length=222)
    title = models.CharField(max_length=222)
    body = models.TextField()
    created = models.DateTimeField('date created', default=datetime.now)
    updated = models.DateTimeField('date updated', default=datetime.now)
    creator = models.ForeignKey(User, blank=True, null=True)

    def __unicode__(self):
        return "{0}/{1}: {2}".format(self.subject, self.title, self.body)

