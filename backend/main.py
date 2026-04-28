import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from tg import AppConfig
from wsgiref.simple_server import make_server
from controllers import RootController
from controllers.system import run_cleanup
from model import Base, engine, session as db_session
import threading
import time
Base.metadata.create_all(engine)

CLEANUP_INTERVAL_SECONDS = 300
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')


class SessionResetMiddleware:
    """Roll back the global SQLAlchemy session before every request so a poisoned
    transaction from a prior failure can't cascade into 500s on later requests."""

    def __init__(self, app, db_session):
        self.app = app
        self.db_session = db_session

    def __call__(self, environ, start_response):
        try:
            self.db_session.rollback()
        except Exception:
            pass
        return self.app(environ, start_response)


class StaticFileMiddleware:
    """Serve uploaded images from the uploads directory."""

    CONTENT_TYPES = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.gif': 'image/gif',
        '.webp': 'image/webp',
    }

    def __init__(self, app, directory, url_prefix='/uploads'):
        self.app = app
        self.directory = directory
        self.url_prefix = url_prefix

    def __call__(self, environ, start_response):
        path = environ.get('PATH_INFO', '')
        if path.startswith(self.url_prefix + '/'):
            filename = os.path.basename(path[len(self.url_prefix) + 1:])
            filepath = os.path.join(self.directory, filename)
            if os.path.isfile(filepath):
                ext = os.path.splitext(filename)[1].lower()
                ct = self.CONTENT_TYPES.get(ext, 'application/octet-stream')
                with open(filepath, 'rb') as f:
                    data = f.read()
                start_response('200 OK', [
                    ('Content-Type', ct),
                    ('Content-Length', str(len(data))),
                    ('Cache-Control', 'public, max-age=3600'),
                ])
                return [data]
            start_response('404 Not Found', [('Content-Type', 'text/plain')])
            return [b'Not found']
        return self.app(environ, start_response)


def cleanup_scheduler():
    """UC06: Background daemon that autonomously expires stale listings."""
    while True:
        time.sleep(CLEANUP_INTERVAL_SECONDS)
        try:
            count = run_cleanup()
            if count:
                print(f"[Scheduler] Expired {count} listing(s).")
        except Exception as e:
            print(f"[Scheduler] Cleanup error: {e}")


config = AppConfig(minimal=True, root_controller=RootController())
config['session.enabled'] = True
config['session.type'] = 'cookie'
config['session.key'] = 'cibinet_session'
config['session.validate_key'] = 'cibinet-dev-secret-key'
config['session.secure'] = False
application = config.make_wsgi_app()
application = SessionResetMiddleware(application, db_session)
application = StaticFileMiddleware(application, UPLOAD_DIR)

if __name__ == "__main__":
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    scheduler = threading.Thread(target=cleanup_scheduler, daemon=True)
    scheduler.start()
    print("CibiNet API Server online at http://localhost:8080/api/")
    print(f"[Scheduler] Safety pruning running every {CLEANUP_INTERVAL_SECONDS}s.")
    server = make_server('0.0.0.0', 8080, application)
    server.serve_forever()
