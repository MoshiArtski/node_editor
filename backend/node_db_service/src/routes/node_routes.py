from sanic import Blueprint, response
from sanic.request import Request
from sanic.exceptions import BadRequest
from src.controllers.node_controller import NodeController

# Create a Sanic blueprint
bp = Blueprint("node_routes")

# Create an instance of NodeController
node_controller = NodeController()


# Route to get a node by ID
@bp.route("/nodes/<node_id>", methods=["GET"])
async def get_node(request: Request, node_id: str):
    try:
        # Fetch node using the controller
        node_data = node_controller.get_node(node_id)
        return response.json(node_data)
    except Exception as e:
        return response.json({"error": str(e)}, status=500)


# Route to get all nodes
@bp.route("/nodes", methods=["GET"])
async def get_all_nodes(request: Request):
    try:
        # Fetch all nodes using the controller
        nodes_data = node_controller.get_all_nodes()
        return response.json(nodes_data)
    except Exception as e:
        return response.json({"error": str(e)}, status=500)


# Route to create a new node
@bp.route("/nodes/", methods=["POST"])
async def create_node(request):
    try:
        # Log the incoming request for debugging
        print(f"Incoming POST request data: {request.json}")

        node_data = request.json
        if not node_data:
            return response.json({"error": "Invalid request data"}, status=400)

        # Validate required fields
        missing_fields = []
        if "node_name" not in node_data:
            missing_fields.append("node_name")
        if "full_code" not in node_data:
            missing_fields.append("full_code")
        if "owner_id" not in node_data:
            missing_fields.append("owner_id")

        if missing_fields:
            return response.json({"error": f"Missing required field(s): {', '.join(missing_fields)}"}, status=400)

        # Call the controller to create the node
        created_node = node_controller.create_node(node_data)

        # Log successful creation
        print(f"Node created successfully: {created_node}")

        # Return the created node in the response
        return response.json(f"Node created successfully: {created_node}", status=201)

    except Exception as e:
        print(f"Internal server error: {str(e)}")
        return response.json({"error": "Internal Server Error", "details": str(e)}, status=500)
