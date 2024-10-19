from src.services.generation_service import GenerationService
from src.config.settings import settings  # Import the settings

class GenerationController:
    def __init__(self):
        # Pass the Supabase URL and Key to the GenerationService
        self.generation_service = GenerationService(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    def generate_project(self, data_list: list):
        # Call the generation service to generate the project structure
        return self.generation_service.generate_project_structure(data_list)
