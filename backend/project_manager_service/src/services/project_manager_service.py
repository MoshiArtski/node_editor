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
            # Corrected Supabase call
            response = self.supabase.table("projects").insert([data]).execute()
            self.logger.debug(f"📥 Create project response: {self._safe_json_dump(response)}")
            return response
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
            self.logger.debug(f"📥 Update project response: {self._safe_json_dump(response)}")
            return response
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
