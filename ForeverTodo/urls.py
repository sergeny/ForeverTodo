from django.conf.urls import patterns, include, url

from django.contrib import admin
from app_todo.api import TodoItemResource
admin.autodiscover()

todo_item_resource = TodoItemResource()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'ForeverTodo.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^task/(?P<task_id>\d+)/$', 'app_todo.views.task'),

    url(r'^api/', include(todo_item_resource.urls)),

    url(r'^admin/', include(admin.site.urls)),
)
