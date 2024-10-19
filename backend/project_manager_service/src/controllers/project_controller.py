from src.services.project_manager_service import ProjectManagerService

class ProjectController:
    def __init__(self):
        self.project_service = ProjectManagerService()

    async def create_project(self, user_id: str, name: str, description: str):
        return await self.project_service.create_project(user_id, name, description)

    async def get_project(self, project_id: str):
        return await self.project_service.get_project(project_id)

    async def update_project(self, project_id: str, content: dict):
        return await self.project_service.update_project(project_id, content)

    async def delete_project(self, project_id: str):
        return await self.project_service.delete_project(project_id)
