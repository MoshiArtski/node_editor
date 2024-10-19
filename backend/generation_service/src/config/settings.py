from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
env_path = os.path.join(os.path.dirname(__file__), "../../.env")  # Adjust the path to .env
load_dotenv(dotenv_path=env_path)  # Load the .env file


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str

    class Config:
        env_file = env_path  # Optional: use Pydantic's env_file config to load .env


# Initialize settings
settings = Settings()


