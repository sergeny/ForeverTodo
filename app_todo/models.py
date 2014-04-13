from django.db import models
from django.conf import settings

class TodoItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL)
    title = models.CharField(max_length=100)
    text = models.CharField(max_length=1000)
    completed = models.BooleanField()
