from supabase import create_client, Client
from src.utils.logger import get_logger
from src.config.settings import settings
import json

class AuthService:
    def __init__(self):
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        self.logger = get_logger(__name__)

    def _safe_json_dump(self, obj):
        """Safely convert object to JSON string for logging"""
        try:
            return json.dumps(obj, default=str, indent=2)
        except Exception as e:
            return f"[Error converting to JSON: {str(e)}]"

    async def sign_in(self, email: str, password: str):
        self.logger.info(f"📝 Attempting sign-in for email: {email}")
        try:
            # Remove 'await' from this line since sign_in_with_password is synchronous
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            self.logger.warning(f"📥 Raw Supabase response: {self._safe_json_dump(response)}")

            if response.session and response.user:
                data = {
                    "user_id": response.user.id,
                    "email": response.user.email,
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token,
                    "expires_in": response.session.expires_in,
                    "token_type": response.session.token_type
                }

                return {
                    "message": "Sign-in successful",
                    "data": {"user": data}
                }
            else:
                self.logger.warning(f"❌ Sign-in failed for email: {email} - Invalid session or user data")
                return {"message": "Sign-in failed", "error": "Invalid session or user data"}
        except Exception as e:
            self.logger.error(f"🔥 Error during sign-in for email {email}: {str(e)}")
            self.logger.exception(e)
            return {"error": str(e)}

    async def sign_up(self, email: str, password: str):
        self.logger.info(f"📝 Attempting sign-up for email: {email}")
        try:
            response = await self.supabase.auth.sign_up({
                "email": email,
                "password": password
            })
            self.logger.debug(f"📥 Sign-up response: {self._safe_json_dump(response)}")
            return response
        except Exception as e:
            self.logger.error(f"🔥 Error during sign-up: {str(e)}")
            return {"error": str(e)}
