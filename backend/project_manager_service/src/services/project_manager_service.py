from supabase import create_client, Client
from src.utils.logger import get_logger
from src.config.settings import settings
import json

class ProjectManagerService:
    def __init__(self):
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        self.logger = get_logger(__name__)

    def _safe_json_dump(self, obj):
        """Safely convert object to JSON string for logging"""
        try:
            return json.dumps(obj, default=str, indent=2)
        except Exception as e:
            return f"[Error converting to JSON: {str(e)}]"

    async def create_project(self, user_id: str, name: str, description: str = None):
        """Create a new project"""
        self.logger.info(f"📝 Creating project '{name}' for user: {user_id}")
        try:
            data = {
                "user_id": user_id,
                "name": name,
                "description": description or "",
                "content": {}  # Placeholder for project content
            }
            # Supabase call
            response = self.supabase.table("projects").insert([data]).execute()
            self.logger.debug(f"📥 Create project response: {self._safe_json_dump(response)}")
            return {"data": response.data}
        except Exception as e:
            self.logger.error(f"🔥 Error creating project: {str(e)}")
            return {"error": str(e)}

    async def get_project(self, project_id: str):
        """Fetch a project by ID"""
        self.logger.info(f"🔍 Fetching project with ID: {project_id}")
        try:
            response = self.supabase.table("projects").select("*").eq("id", project_id).single().execute()
            self.logger.debug(f"📥 Get project response: {self._safe_json_dump(response)}")
            return response
        except Exception as e:
            self.logger.error(f"🔥 Error fetching project: {str(e)}")
            return {"error": str(e)}

    async def update_project(self, project_id: str, content: dict):
        """Update the content of an existing project"""
        self.logger.info(f"📝 Updating project ID: {project_id}")
        try:
            response = self.supabase.table("projects").update({"content": content}).eq("id", project_id).execute()

            # Log the full response to understand its structure
            self.logger.debug(f"📥 Full Update Project Response: {response}")

            # Use the appropriate attribute to check for errors or extract data
            if hasattr(response, 'error') and response.error:
                raise Exception(response.error.message)

            # Assuming response.data contains the updated data
            if hasattr(response, 'data'):
                updated_project_data = response.data
                if not updated_project_data:
                    raise Exception("No data returned from the update operation.")

                self.logger.debug(f"📥 Update project response: {self._safe_json_dump(updated_project_data)}")
                return {"data": updated_project_data}

            # If response format is not as expected, raise an error
            raise Exception("Unexpected response format from Supabase.")

        except Exception as e:
            self.logger.error(f"🔥 Error updating project: {str(e)}")
            return {"error": str(e)}

    async def delete_project(self, project_id: str):
        """Delete a project by ID"""
        self.logger.info(f"🗑️ Deleting project with ID: {project_id}")
        try:
            response = self.supabase.table("projects").delete().eq("id", project_id).execute()
            self.logger.debug(f"📥 Delete project response: {self._safe_json_dump(response)}")
            return response
        except Exception as e:
            self.logger.error(f"🔥 Error deleting project: {str(e)}")
            return {"error": str(e)}

    async def get_all_projects_for_user(self, user_id: str):
        """Fetch all projects for a specific user by their user_id"""
        self.logger.info(f"🔍 Fetching all projects for user: {user_id}")
        try:
            response = self.supabase.table("projects").select("*").eq("user_id", user_id).execute()
            self.logger.debug(f"📥 Get all projects response: {self._safe_json_dump(response)}")
            return {"data": response.data}
        except Exception as e:
            self.logger.error(f"🔥 Error fetching projects for user: {str(e)}")
            return {"error": str(e)}