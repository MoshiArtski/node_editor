from sanic import Sanic
from sanic_cors import CORS
from src.routes.project_routes import project_bp as project_blueprint

app = Sanic("ProjectManagerService")

# Automatically manage CORS for all routes
CORS(app)

# Register blueprints
app.blueprint(project_blueprint, url_prefix="/projects")
