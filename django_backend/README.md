# NovaGen Django Companion API

This is a **supplementary Django companion API** for the NovaGen project. It satisfies internship requirements for Django automated testing and Pylint validation.

**Important:** The production NovaGen application continues to use **Next.js, TypeScript, Supabase, and Gemini AI**. This Django backend is a small companion module; it does not replace or modify any part of the existing application.

## Quick start

```powershell
cd django_backend
.\.venv\Scripts\Activate.ps1
```

If script execution is blocked, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Install dependencies

```powershell
python -m pip install -r requirements.txt
```

## Run migrations

```powershell
python manage.py migrate
```

The backend uses Django's default SQLite database. It does not connect to the live Supabase project.

## Start the development server

```powershell
python manage.py runserver
```

Available endpoints:

| Method | Endpoint                    | Description                  |
|--------|-----------------------------|------------------------------|
| GET    | `/api/health/`              | Health check                 |
| GET    | `/api/document-types/`       | Supported document types     |
| POST   | `/api/validate-document/`   | Validate a document file     |

## Run Django tests

```powershell
python manage.py test
```

## Calculate the Pylint score

```powershell
python -m pylint --load-plugins=pylint_django --django-settings-module=config.settings core config manage.py
```

## Project structure

```
django_backend/
  .venv/              # Python virtual environment
  core/
    services.py       # Document validation logic
    views.py          # JSON API views
    urls.py           # App-level URL routing
    tests.py          # Automated tests
  config/
    settings.py       # Django project settings
    urls.py           # Root URL configuration
  manage.py           # Django management script
  .pylintrc           # Pylint configuration
  requirements.txt    # Python dependencies
```
