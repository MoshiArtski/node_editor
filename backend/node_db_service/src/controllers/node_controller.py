from sanic.exceptions import NotFound, BadRequest
from src.services.node_service import NodeService


class NodeController:
    def __init__(self):
        self.node_service = NodeService()

    def get_node(self, node_id: str):
        # Call the service to find the node by ID
        node = self.node_service.find_node(node_id)

        # If node not found, raise a Sanic NotFound exception
        if not node:
            raise NotFound("Node not found")

        # Extract configuration (properties) if they exist
        configuration = node[0].get("configuration", {})  # Extract configuration from the JSONB field
        properties = configuration if configuration else {}

        return {"node": node[0], "properties": properties}


    def create_node(self, node_data: dict):
        # Check for required fields
        if "node_name" not in node_data or "full_code" not in node_data:
            raise BadRequest("Missing required fields: node_name or full_code")

        # Add any other validation needed
        if "is_public" not in node_data:
            node_data["is_public"] = True  # Default to True if not provided

        if "owner_id" not in node_data:
            raise BadRequest("Missing required field: owner_id")

        # Set to Null
        node_data["owner_id"] = None

        # Create the node
        created_node = self.node_service.create_node(node_data)
        return created_node

    def get_all_nodes(self):
        nodes = self.node_service.get_all_nodes()
        if not nodes:
            raise NotFound("No nodes found")
        return nodes
