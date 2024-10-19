import ast

# Function to extract Config attributes with comments
def extract_config_attributes_with_comments(class_node, input_code):
    config = {}
    code_lines = input_code.splitlines()

    for node in class_node.body:
        if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
            key = node.targets[0].id
            value = ast.literal_eval(node.value)

            # Fetch comment directly after the line of the assignment (if any)
            line_number = node.lineno - 1
            comment = None
            if line_number < len(code_lines) - 1:
                next_line = code_lines[line_number + 1].strip()  # Move to the next line for comments
                if "#" in next_line:
                    comment = next_line.split("#", 1)[1].strip()

            # Store the key, value, and comment in the config dictionary
            config[key] = {
                "value": value,
                "description": comment if comment else "No description available"
            }
    return config

# Function to find and extract the Config class and attributes
def extract_config_class(input_code):
    try:
        parsed_code = ast.parse(input_code)
        for node in parsed_code.body:
            if isinstance(node, ast.ClassDef) and node.name == "Config":
                return extract_config_attributes_with_comments(node, input_code)
        # If the Config class is not found, raise an error
        raise ValueError("No 'Config' class found in the provided code.")
    except Exception as e:
        raise ValueError(f"Failed to parse code: {e}")
