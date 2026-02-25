from tg import expose, TGController, AppConfig, request, response
from wsgiref.simple_server import make_server
from model import session, Listing, User, Claim
import datetime
from tg import session as tg_session
from controllers import RootController # Imports the structure we just built

config = AppConfig(minimal=True, root_controller=RootController())

print("CibiNet API Server online at http://localhost:8080/api/")
application = config.make_wsgi_app()

if __name__=="__main__":
    server = make_server('0.0.0.0', 8080, application)
    server.serve_forever()