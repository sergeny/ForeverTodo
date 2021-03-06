from django.shortcuts import render, render_to_response
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from tastypie.models import ApiKey
import hashlib


def index(request):
    x=RequestContext(request)
    return render_to_response('index.html', {'request': request}, context_instance=RequestContext(request))

# The page will issue a new key on POST request, if it received the correct hash of the current key.

# After all, we need some way for the user to regenerate the key, and I did not want to make it
# a part of the API for security reasons. (Don't want to rely on tastypie to manage its own api keys.)
@login_required
def api_page(request):
    ctx = {'request' : request}
    if request.user.is_authenticated():
        ak = ApiKey.objects.get_or_create(user=request.user)[0]
        hash = hashlib.sha1(ak.key).hexdigest()
        if request.method == 'POST': # Re-generate the key on POST request, if a prefix of the current_key was provided correctly
            if request.POST.get('current_key_hash') == hash:
                ak.key = None
                ak.save() # Tastypie will generate a new key at this point
                hash = hashlib.sha1(ak.key).hexdigest()
        ctx['api_key'] = ak.key
        ctx['api_key_hash'] = hash
        # reverse('api_dispatch_list', args=['v1', 'todo'])
        ctx['api_base'] = request.build_absolute_uri(reverse('api_dispatch_list', args=['v1', 'todo']))
        ctx['user_uri'] = reverse('api_dispatch_detail', args=['v1', 'user', request.user.pk])
    x=RequestContext(request)
    return render_to_response('api_page.html', ctx, context_instance=RequestContext(request))
