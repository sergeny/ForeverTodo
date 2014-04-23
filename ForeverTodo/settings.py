"""
Django settings for ForeverTodo project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os, sys
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/

#############################################################################
#                                                                           #
#                          DEBUG or PRODUCTION                              #
#                                                                           #
# DEBUG if running Django development server, PRODUCTION otherwise          #
#                                                                           #
#############################################################################
RUNNING_DEV_SERVER = (len(sys.argv) > 1) and (sys.argv[1] == 'runserver')

DEBUG = RUNNING_DEV_SERVER

TEMPLATE_DEBUG = DEBUG


# Detect the timezone
if not 'ORIGINAL_TIMEZONE' in os.environ:
    f = os.popen('date +%Z')
    tz = f.read().upper()
    os.environ['ORIGINAL_TIMEZONE']=tz
    print ('DEBUG: %d, RUNNING_DEV_SERVER: %d, system timezone: %s ' % (DEBUG, RUNNING_DEV_SERVER, tz))


if not (DEBUG or RUNNING_DEV_SERVER):
    SECRET_KEY = os.environ['SECRET_KEY']
else:
    os.environ['DJANGO_DEBUG']='1'
    # Now make it really obvious in your templates that we are in debug mode. Change text, background, etc.
    # something like {% if request.META.DJANGO_DEBUG %}DEBUG MODE!{% else %}My Fancy App{% endif %}

    SECRET_KEY = 'DEBUG_INSECURE_SECRET_KEY_ae$kh(7b%$+a fcw_bdnzl#)$t88x7h2-p%eg_ei5m=w&2p-)1+'

    # But what if we are idiots and are still somehow running with DEBUG=True in production?!
    # 1. Make sure SECRET_KEY is not set
    assert not SECRET_KEY in os.environ
    # 2. Make sure the timezone is not UTC or GMT (indicating production)

    tz = os.environ['ORIGINAL_TIMEZONE']
    assert tz != '' and (not 'UTC' in tz) and (not 'GMT' in tz)
    # 3. Look for environment variables suggesting we are in PROD
    for key in os.environ:
        for red_flag in ['heroku', 'amazon', 'aws', 'prod', 'gondor']:
            assert not red_flag in key.lower()
            assert not red_flag in os.environ[key].lower()




LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': ('%(asctime)s [%(process)d] [%(levelname)s] ' +
                       'pathname=%(pathname)s lineno=%(lineno)s ' +
                       'funcname=%(funcName)s %(message)s'),
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        }
    },
    'handlers': {
        'null': {
            'level': 'DEBUG',
            'class': 'logging.NullHandler',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        }
    },
    'loggers': {
        'apiLogger': {
            'handlers': ['console'],
            'level': 'INFO',
        }
    }
}


ALLOWED_HOSTS = []


TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

TEMPLATE_DIRS = (
    os.path.join(BASE_DIR, 'templates'),
)


# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'djangosecure',

    'tastypie',
    'account',
    'pinax_theme_bootstrap',
    'bootstrapform',
    'pinax_theme_bootstrap_account',
    'app_todo',
)

TEMPLATE_CONTEXT_PROCESSORS =  (
"django.contrib.auth.context_processors.auth",
"django.core.context_processors.debug",
"django.core.context_processors.i18n",
"django.core.context_processors.media",
"django.core.context_processors.static",
"django.core.context_processors.tz",
"django.contrib.messages.context_processors.messages",
"account.context_processors.account",)

MIDDLEWARE_CLASSES = (
    'djangosecure.middleware.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    "account.middleware.LocaleMiddleware",
    "account.middleware.TimezoneMiddleware",
)

ROOT_URLCONF = 'ForeverTodo.urls'

WSGI_APPLICATION = 'ForeverTodo.wsgi.application'



### for Heroku deployment ###
if not (DEBUG or RUNNING_DEV_SERVER):
    # Parse database configuration from $DATABASE_URL
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config()
    }
else: # debug database
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }


# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

STATIC_URL = '/static/'

STATICFILES_DIRS = (
    os.path.join(BASE_DIR, "static"),
#    '/var/www/static/',
)


THEME_ACCOUNT_CONTACT_EMAIL = "no-contact@sad.com"






# Honor the 'X-Forwarded-Proto' header for request.is_secure()
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Allow all host headers
ALLOWED_HOSTS = ['*']

# Static asset configuration
import os
####BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_ROOT = 'staticfiles'
STATIC_URL = '/static/'

STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'static'),
)



### Tastypie for the API
TASTYPIE_DATETIME_FORMATTING = 'rfc-2822'

### Sending email through an external API ###

EMAIL_USE_TLS = True
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = os.environ['EMAIL_HOST_USER']
EMAIL_HOST_PASSWORD = os.environ['EMAIL_HOST_PASSWORD']


if not (DEBUG or RUNNING_DEV_SERVER):
    ### Security
    SECURE_SSL_REDIRECT = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

    SECURE_HSTS_SECONDS = 86400000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_BROWSER_XSS_FILTER = True

    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    # I give up. I tried to make it work, and I did pass the token and then set X-CSRFToken via jQuery.
    # It appears, though, that jQuery is resetting it to null anyway, just because the csrftoken cookie is Httponly.
    # Let this one be without Httponly...
    # CSRF_COOKIE_HTTPONLY = True
    CSRF_COOKIE_SECURE = True
