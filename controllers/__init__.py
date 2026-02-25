from tg import TGController, expose
from .auth import AuthController
from .listings import ListingController
from .system import SystemController

class ApiController(TGController):
    auth = AuthController()
    listings = ListingController()
    system = SystemController()

    @expose('json')
    def index(self):
        return {"version": "2.0", "status": "running"}

class RootController(TGController):
    api = ApiController()

    @expose('json')
    def index(self):
        return {"message": "Welcome to CibiNet"}