from sanic import Sanic
from sanic_cors import CORS
from src.routes.auth_routes import auth_bp as auth_blueprint
from src.routes.project_routes import project_bp as project_blueprint

app = Sanic("ProjectManagerService")

# Automatically manage CORS for all routes
CORS(app)

# Register blueprints
app.blueprint(auth_blueprint, url_prefix="/auth")
app.blueprint(project_blueprint, url_prefix="/projects")
