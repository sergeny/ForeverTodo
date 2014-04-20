from tastypie.resources import ModelResource
from tastypie.authentication import SessionAuthentication, ApiKeyAuthentication, MultiAuthentication
from app_todo.models import TodoItem
from tastypie.authorization import Authorization
from tastypie.exceptions import Unauthorized

from tastypie import fields

# It should be fine to import get_user_model here, right?
# The api.py is included in urls.py, which is initialized after all the models.
# (as mentioned in https://code.djangoproject.com/ticket/19218)
from django.contrib.auth import get_user_model


class UserObjectsOnlyAuthorization(Authorization):
    def read_list(self, object_list, bundle):
        # This assumes a ``QuerySet`` from ``ModelResource``.
        return object_list.filter(user=bundle.request.user)

    def read_detail(self, object_list, bundle):
        # Is the requested object owned by the user?
        return bundle.obj.user == bundle.request.user

    def create_list(self, object_list, bundle):
        # Assuming they're auto-assigned to ``user``.
        return object_list

    def create_detail(self, object_list, bundle):
        return bundle.obj.user == bundle.request.user

    def update_list(self, object_list, bundle):
        allowed = []

        # Since they may not all be saved, iterate over them.
        for obj in object_list:
            if obj.user == bundle.request.user:
                allowed.append(obj)

        return allowed

    def update_detail(self, object_list, bundle):
        return bundle.obj.user == bundle.request.user

    def delete_list(self, object_list, bundle):
        allowed = []

        # Since they may not all be deleted, iterate over them.
        for obj in object_list:
            if obj.user == bundle.request.user:
                allowed.append(obj)

        return allowed
        # Sorry user, no deletes for you!
        # raise Unauthorized("Sorry, no deletes.")

    def delete_detail(self, object_list, bundle):
        return bundle.obj.user == bundle.request.user
        #  raise Unauthorized("Sorry, no deletes.")


class UserResource(ModelResource):
    class Meta:
        queryset = get_user_model().objects.all()
        resource_name='user'
        fields=['username']                    # Hide all fields except for the username
        allowed_methods = []                   # DENY ALL
        authentication = MultiAuthentication() # DENY ALL

        #authorization = DenyAuthorization()
        # The user resource cannot be secured with UserObjectsOnlyAuthorization.
        # Cannot connect in curl and specify username and api_key because it thinks that I am trying to filter:
        # {"error": "The 'username' field does not allow filtering."}
        # Cannot user the browser either.
        #
        # authorization = UserObjectsOnlyAuthorization()

class TodoItemResource(ModelResource):
    user = fields.ForeignKey(UserResource, 'user')

    class Meta:
        queryset = TodoItem.objects.all()
        resource_name='todo'
        # allowed_methods = ['get', 'post', 'delete']
        authentication = MultiAuthentication(SessionAuthentication(), ApiKeyAuthentication())
        authorization = UserObjectsOnlyAuthorization()


