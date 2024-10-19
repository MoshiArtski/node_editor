from src.services.node_service import NodeService
from fastapi import HTTPException
from src.utils.parser_utils import extract_config_class, extract_config_attributes_with_comments
import ast

class NodeController:
    def __init__(self):
        self.node_service = NodeService()

    def process_node(self, node_name: str, node_code: str):
        try:
            # Log the incoming node code for debugging
            print(f"Processing node code: {node_code[:100]}...")  # Log the first 100 characters of node code

            # Parse and extract the Config class attributes
            parsed_config = extract_config_class(node_code)
            if parsed_config is None:
                raise HTTPException(status_code=400, detail="Failed to find 'Config' class in node code.")

            # Optionally, extract individual class attributes (if needed)
            parsed_code = ast.parse(node_code)
            for node in parsed_code.body:
                if isinstance(node, ast.ClassDef) and node.name == "Config":
                    class_attributes = extract_config_attributes_with_comments(node, node_code)
                    parsed_config["class_attributes"] = class_attributes

            return {
                "node_name": node_name,
                "configurations": parsed_config,
            }

        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Error processing node: {str(e)}")

        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Unexpected error: {str(e)}")
