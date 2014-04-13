from django.shortcuts import render, render_to_response

def task(request, task_id):
    print "Hello"
    return render_to_response('task.html', { 'task_id': task_id })