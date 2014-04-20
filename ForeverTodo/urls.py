from django.conf.urls import patterns, include, url

from django.contrib import admin
from tastypie.api import Api
from app_todo.api import TodoItemResource, UserResource
admin.autodiscover()

v1_api = Api(api_name='v1')
v1_api.register(UserResource())
v1_api.register(TodoItemResource())
#todo_item_resource = TodoItemResource()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'ForeverTodo.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^$', 'app_todo.views.index', name='home'),

    url(r'^api/', include(v1_api.urls)),

    url(r"^account/", include("account.urls")),
    url(r'^admin/', include(admin.site.urls)),
)

