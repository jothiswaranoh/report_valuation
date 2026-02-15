from app.core.celery_app import celery_app

# Import tasks here to ensure they are registered with the Celery worker
# from app.services import my_tasks 

if __name__ == "__main__":
    celery_app.start()
