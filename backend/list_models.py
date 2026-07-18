import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

# API URL
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

response = requests.get(url)
data = response.json()

if 'models' in data:
    print("--- SARE AVAILABLE MODELS ---")
    for model in data['models']:
        # Bas naam print karo, crash nahi hoga
        print(f"Model Name: {model.get('name')}")
else:
    print("Error:", data)