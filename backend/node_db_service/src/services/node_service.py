from supabase import create_client, Client
from src.config.settings import settings
from src.utils.logger import get_logger  # Import the custom logger


class NodeService:
    def __init__(self):
        # Properly initialize the Supabase client
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        self.logger = get_logger(__name__)  # Initialize the logger

    def find_node(self, node_id: str):
        try:
            self.logger.info(f"Finding node with ID: {node_id}")
            # Adjust the column name to configurations instead of configuration
            response = self.supabase.table("nodes").select("*, configurations").eq("id", node_id).execute()

            if response.data:
                self.logger.info(f"Node found: {response.data}")
                return response.data
            else:
                self.logger.error(f"Error: Node with ID {node_id} not found.")
                return None
        except Exception as e:
            self.logger.exception(f"Exception occurred while finding node: {str(e)}")
            return None

    def create_node(self, node_data: dict):
        try:
            # Debugging log to check the node data
            self.logger.info(f"Attempting to create node with data: {node_data}")

            # Insert the node data into the "nodes" table
            response = self.supabase.table("nodes").insert(node_data).execute()

            # Check if the node creation was successful
            if response.data:
                self.logger.info(f"Node created successfully: {response.data}")
                return response.data
            else:
                self.logger.error(f"Error creating node: {response}")
                return None
        except Exception as e:
            self.logger.exception(f"Exception occurred while creating node: {str(e)}")
            return None

    def get_all_nodes(self):
        try:
            response = self.supabase.table("nodes").select("*").execute()
            if response.data:
                return response.data
            return []
        except Exception as e:
            print(f"Exception occurred while fetching all nodes: {str(e)}")
            return []
