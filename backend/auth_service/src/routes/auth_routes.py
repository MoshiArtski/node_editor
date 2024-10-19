from sanic import Blueprint, response
from src.controllers.auth_controller import AuthController

auth_bp = Blueprint("auth_routes")
auth_controller = AuthController()

@auth_bp.route("/sign_up", methods=["POST"])
async def sign_up(request):
    data = request.json
    email = data.get("email")
    password = data.get("password")

    result = await auth_controller.sign_up(email, password)
    if "error" in result:
        return response.json({"error": result["error"]}, status=500)

    return response.json({"message": "Sign-up successful", "data": result}, status=201)

@auth_bp.route("/sign_in", methods=["POST"])
async def sign_in(request):
    data = request.json
    email = data.get("email")
    password = data.get("password")

    result = await auth_controller.sign_in(email, password)
    if "error" in result:
        return response.json({"error": result["error"]}, status=401)

    return response.json({"message": "Sign-in successful", "data": result}, status=200)
