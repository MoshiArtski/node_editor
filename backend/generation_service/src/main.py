from sanic import Sanic
from sanic_cors import CORS  # Import Sanic-CORS for automatic CORS handling
from src.routes.generation_routes import bp as generation_blueprint

# Create a Sanic app instance
app = Sanic("GenerationService")

# Automatically manage CORS for all routes
CORS(app)

# Register the node blueprint
app.blueprint(generation_blueprint, url_prefix="/api")

