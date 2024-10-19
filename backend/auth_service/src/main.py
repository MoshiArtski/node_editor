from sanic import Sanic
from sanic_cors import CORS
from src.routes.auth_routes import auth_bp as auth_blueprint

app = Sanic("AuthService")

# Enable CORS for specific origins
CORS(app, resources={r"/auth/*": {"origins": "*"}})

# Register blueprints
app.blueprint(auth_blueprint, url_prefix="/auth")
