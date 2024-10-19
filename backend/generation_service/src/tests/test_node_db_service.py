import pytest
from fastapi.testclient import TestClient
import os
from dotenv import load_dotenv

# Load environment variables from the backend/.env file
env_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(dotenv_path=env_path)

# Import the FastAPI app from the correct path
from src.main import app  # Assuming your main FastAPI app is in src/main.py

client = TestClient(app)

# Sample node data for testing
node_data = {
    "node_name": "Test Node",
    "configurations": {"key1": "value1", "key2": "value2"},
    "full_code": "class Config:\n    key1 = 'value1'\n    key2 = 'value2'",
    "is_public": True
}


def test_create_node():
    # Send a POST request to create a new node
    response = client.post("/nodes/", json=node_data)

    # Check if the response status code is 200 (success)
    assert response.status_code == 200

    # Check if the response contains the node ID
    data = response.json()
    assert "node_id" in data

    # Check if the node was correctly created by retrieving it
    node_id = data["node_id"]
    get_response = client.get(f"/nodes/{node_id}")

    # Check if the GET request was successful
    assert get_response.status_code == 200

    # Verify the data matches what was inserted
    node = get_response.json()
    assert node["node_name"] == node_data["node_name"]
    assert node["configurations"] == node_data["configurations"]
    assert node["full_code"] == node_data["full_code"]
    assert node["is_public"] == node_data["is_public"]
