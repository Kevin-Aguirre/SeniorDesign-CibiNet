from tg import expose, TGController, AppConfig
from wsgiref.simple_server import make_server

class RootController(TGController):
    @expose('json')
    def index(self):
        return dict(project="CibiNet", status="Online")

    @expose('json')
    def discovery(self, lat=None, lon=None):

        return {
            "listings": [
                {"id": 1, "food": "Apples", "lat": lat, "lon": lon}
            ]
        }

config = AppConfig(minimal=True, root_controller=RootController())

print("CibiNet Backend starting on http://localhost:8080...")
application = config.make_wsgi_app()
server = make_server('0.0.0.0', 8080, application)
server.serve_forever()