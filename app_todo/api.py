from tastypie.resources import ModelResource
from tastypie.authentication import SessionAuthentication, ApiKeyAuthentication, MultiAuthentication
from app_todo.models import TodoItem


class TodoItemResource(ModelResource):
    class Meta:
        queryset = TodoItem.objects.all()
        resource_name='todo'
        authentication = MultiAuthentication(SessionAuthentication(), ApiKeyAuthentication())

