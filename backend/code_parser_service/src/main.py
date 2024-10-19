from sanic import Sanic
from sanic_cors import CORS  # Import Sanic-CORS for automatic CORS handling
from src.routes.node_routes import bp as node_blueprint

# Create a Sanic app instance
app = Sanic("CodeParserService")

# Automatically manage CORS for all routes
CORS(app)

# Register the node blueprint
app.blueprint(node_blueprint, url_prefix="/api")

