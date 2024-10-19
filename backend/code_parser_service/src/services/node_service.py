from src.utils.parser_utils import extract_config_class

class NodeService:
    def process_node_code(self, node_name: str, node_code: str):
        # Parse the input code using the utility function
        parsed_code = extract_config_class(node_code)

        if parsed_code is None:
            raise ValueError("Config class not found")

        return {
            "node_name": node_name,
            "configurations": parsed_code,
            "full_code": node_code.strip()
        }
