from django.shortcuts import render, render_to_response
from django.template import RequestContext

def task(request, task_id):
    print "Hello"
    return render_to_response('task.html', { 'task_id': task_id })


def index(request):
    x=RequestContext(request)
    return render_to_response('index.html', {'request': request}, context_instance=RequestContext(request))