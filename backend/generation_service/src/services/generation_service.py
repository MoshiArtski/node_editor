import os
import shutil
from supabase import create_client, Client
from src.utils.logger import get_logger
from src.config.settings import settings


class GenerationService:
    def __init__(self, supabase_url=None, supabase_key=None):
        # Properly initialize the Supabase client
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        self.logger = get_logger(__name__)  # Initialize the logger
        self.base_project_path = os.path.join(os.getcwd(), 'generated_projects')

    def generate_project_structure(self, node_data_list, project_name, use_tests=True, use_versioning=True):
        """
        Generates the project structure with nodes and optional tests and versioning.
        """
        try:
            # Create base project folder with the project name
            project_folder = os.path.join(self.base_project_path, project_name)
            graph_folder = os.path.join(project_folder, 'graph')
            nodes_folder = os.path.join(graph_folder, 'nodes')
            tests_folder = os.path.join(project_folder, 'tests')

            # Create directories if they don't exist
            os.makedirs(nodes_folder, exist_ok=True)

            if use_tests:
                os.makedirs(tests_folder, exist_ok=True)

            # Loop through nodes and generate files
            for node in node_data_list:
                node_name = node.get('node_name', 'unnamed').lower().replace(" ", "_")
                full_code = node.get('full_code', '# No code provided')

                # Generate the file path and write the code
                file_path = os.path.join(nodes_folder, f"{node_name}.py")

                with open(file_path, 'w') as f:
                    f.write(full_code)

                self.logger.info(f"Generated file: {file_path}")

                # Generate corresponding test file (if tests are enabled)
                if use_tests:
                    test_file_path = os.path.join(tests_folder, f"test_{node_name}.py")
                    self._generate_test_file(test_file_path, node_name)
                    self.logger.info(f"Generated test file: {test_file_path}")

            # Add version control (Git) if enabled
            if use_versioning:
                self._initialize_version_control(project_folder)

            return {"status": "success", "message": f"Project generated at {project_folder}"}
        except Exception as e:
            self.logger.error(f"Error generating project: {str(e)}")
            return {"status": "error", "message": str(e)}

    def _generate_test_file(self, test_file_path, node_name):
        """
        Generates a simple test file for the given node.
        """
        test_content = f"""
import unittest
from graph.nodes.{node_name} import {node_name}

class Test{node_name.capitalize()}(unittest.TestCase):
    def test_node_functionality(self):
        self.assertTrue(True)  # Placeholder for actual test logic

if __name__ == '__main__':
    unittest.main()
"""
        with open(test_file_path, 'w') as test_file:
            test_file.write(test_content)

    def _initialize_version_control(self, project_folder):
        """
        Initializes Git version control for the generated project.
        """
        try:
            gitignore_content = """
# Ignore Python compiled files
__pycache__/
*.py[cod]

# Ignore environment variables
.env
"""
            # Create a .gitignore file
            with open(os.path.join(project_folder, '.gitignore'), 'w') as f:
                f.write(gitignore_content)

            # Initialize git repository
            os.system(f"cd {project_folder} && git init && git add . && git commit -m 'Initial project setup'")
            self.logger.info(f"Initialized Git repository in {project_folder}")
        except Exception as e:
            self.logger.error(f"Error initializing Git: {str(e)}")

    def get_nodes_from_db(self):
        """
        Fetches node data from the Supabase database.
        """
        try:
            response = self.supabase.table('nodes').select('*').execute()
            return response.data
        except Exception as e:
            self.logger.error(f"Error fetching nodes: {str(e)}")
            return []

    def cleanup_generated_project(self, project_name):
        """
        Deletes the generated project folder to free up space.
        """
        try:
            project_folder = os.path.join(self.base_project_path, project_name)
            shutil.rmtree(project_folder)
            self.logger.info(f"Deleted project folder: {project_folder}")
        except Exception as e:
            self.logger.error(f"Error cleaning up project: {str(e)}")
            return {"status": "error", "message": str(e)}
        return {"status": "success", "message": f"Project {project_name} cleaned up successfully"}
