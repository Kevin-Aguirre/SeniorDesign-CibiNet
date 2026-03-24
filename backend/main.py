from tg import AppConfig
from wsgiref.simple_server import make_server
from controllers import RootController
from controllers.system import run_cleanup
import threading
import time

CLEANUP_INTERVAL_SECONDS = 300  # run safety pruning every 5 minutes


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
application = config.make_wsgi_app()

if __name__ == "__main__":
    scheduler = threading.Thread(target=cleanup_scheduler, daemon=True)
    scheduler.start()
    print("CibiNet API Server online at http://localhost:8080/api/")
    print(f"[Scheduler] Safety pruning running every {CLEANUP_INTERVAL_SECONDS}s.")
    server = make_server('0.0.0.0', 8080, application)
    server.serve_forever()
