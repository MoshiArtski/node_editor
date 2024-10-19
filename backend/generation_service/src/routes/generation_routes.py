from sanic import Blueprint, response
from src.services.generation_service import GenerationService
from src.config.settings import settings

bp = Blueprint("generation_routes")
generation_service = GenerationService(settings.SUPABASE_URL, settings.SUPABASE_KEY)


@bp.route("/generate_project", methods=["POST"])
async def generate_project(request):
    try:
        project_name = request.json.get("project_name", "default_project")

        # Fetch all nodes from the database
        nodes = generation_service.get_nodes_from_db()

        # Generate the project structure based on nodes
        result = generation_service.generate_project_structure(nodes, project_name)
        return response.json(result)
    except Exception as e:
        return response.json({"error": str(e)}, status=500)
