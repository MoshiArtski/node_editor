from src.services.auth_service import AuthService

class AuthController:
    def __init__(self):
        self.auth_service = AuthService()

    async def sign_up(self, email: str, password: str):
        return await self.auth_service.sign_up(email, password)

    async def sign_in(self, email: str, password: str):
        return await self.auth_service.sign_in(email, password)
