from django.conf.urls import patterns, include, url

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'ForeverTodo.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^task/(?P<task_id>\d+)/$', 'app_todo.views.task'),

    url(r'^admin/', include(admin.site.urls)),
)
