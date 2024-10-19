from sanic import Blueprint, response
from src.controllers.project_controller import ProjectController

project_bp = Blueprint("project_routes")
project_controller = ProjectController()

@project_bp.route("/create", methods=["POST"])
async def create_project(request):
    data = request.json
    user_id = data.get("user_id")
    name = data.get("name")
    description = data.get("description", "")

    result = await project_controller.create_project(user_id, name, description)
    if "error" in result:
        return response.json({"error": result["error"]}, status=500)

    return response.json({"message": "Project created", "data": result}, status=201)

@project_bp.route("/get/<project_id>", methods=["GET"])
async def get_project(request, project_id):
    result = await project_controller.get_project(project_id)
    if "error" in result:
        return response.json({"error": result["error"]}, status=404)

    return response.json({"message": "Project fetched", "data": result}, status=200)

@project_bp.route("/update/<project_id>", methods=["PUT"])
async def update_project(request, project_id):
    content = request.json.get("content")
    result = await project_controller.update_project(project_id, content)
    if "error" in result:
        return response.json({"error": result["error"]}, status=500)

    return response.json({"message": "Project updated", "data": result}, status=200)

@project_bp.route("/delete/<project_id>", methods=["DELETE"])
async def delete_project(request, project_id):
    result = await project_controller.delete_project(project_id)
    if "error" in result:
        return response.json({"error": result["error"]}, status=500)

    return response.json({"message": "Project deleted", "data": result}, status=200)
