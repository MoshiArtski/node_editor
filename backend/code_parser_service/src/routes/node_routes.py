from sanic import Blueprint, response
from sanic.request import Request
from src.controllers.node_controller import NodeController

# Create a Sanic blueprint
bp = Blueprint("node_routes")

node_controller = NodeController()


# Define the route for processing the node
@bp.route("/parse-code/", methods=["POST"])
async def process_node(request: Request):
    try:
        # Manually validate request data
        data = request.json

        # Check for required fields
        if not data or "node_name" not in data or "node_code" not in data:
            return response.json({"error": "node_name and node_code are required"}, status=400)

        node_name = data["node_name"]
        node_code = data["node_code"]

        # Process the node using the controller
        result = node_controller.process_node(node_name, node_code)

        # Return the response
        return response.json(result)

    except Exception as e:
        return response.json({"error": str(e)}, status=500)
