from django.db import models
from django.conf import settings

class TodoItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL)
    title = models.CharField(max_length=100)
    text = models.CharField(max_length=1000)
    priority = models.IntegerField() # 0 is low and 2 is high
    expires = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField()
