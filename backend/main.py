import requests
import json
import sqlite3
import os
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Resilink AI Backend API. Server is successfully running! 🚀"}

class ComplaintRequest(BaseModel):
    name: str
    phone: str
    text: str

# Naya Database Setup (Name aur Phone ke sath)
def init_db():
    conn = sqlite3.connect("resilink.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT,
            name TEXT,
            phone TEXT,
            raw_text TEXT,
            location TEXT,
            resource_type TEXT,
            severity TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

@app.post("/extract")
async def extract_complaint_data(request: ComplaintRequest):
    try:
        # Ticket ID Generate
        ticket_id = f"RES-{random.randint(1000, 9999)}"

        # Groq API Call
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
        prompt = f"Extract details from: {request.text}. Return ONLY JSON with keys: 'location', 'resource_type', 'severity' (Low/Medium/Critical)."
        
        payload = {"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": prompt}]}
        
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        
        ai_text = data['choices'][0]['message']['content'].strip()
        if ai_text.startswith("```json"): ai_text = ai_text.replace("```json", "").replace("```", "").strip()
        extracted_data = json.loads(ai_text)
        
        # Database Save
        conn = sqlite3.connect("resilink.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO complaints (ticket_id, name, phone, raw_text, location, resource_type, severity) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (ticket_id, request.name, request.phone, request.text, extracted_data.get('location'), extracted_data.get('resource_type'), extracted_data.get('severity')))
        conn.commit()
        conn.close()
        
        return {"status": "success", "ticket_id": ticket_id, "data": extracted_data}
        
    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/hotspots")
def get_hotspots():
    try:
        conn = sqlite3.connect("resilink.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT location, resource_type, COUNT(*) as count 
            FROM complaints 
            GROUP BY location, resource_type
            ORDER BY count DESC
        """)
        rows = cursor.fetchall()
        conn.close()
        
        hotspots = [{"location": r[0], "resource": r[1], "count": r[2]} for r in rows]
        return {"status": "success", "data": hotspots}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class LetterRequest(BaseModel):
    location: str
    resource: str

@app.post("/generate-letter")
async def generate_official_letter(request: LetterRequest):
    try:
        prompt = f"""
        Act as a professional civic grievance AI. Write a formal letter to the District Collector.
        Subject: Urgent action required regarding severe shortage of {request.resource} in {request.location}.
        Body: Mention that multiple citizens have reported this crisis. Request immediate administrative intervention.
        Keep it formal, concise, and professional. Do not include placeholders like [Your Name].
        """
        
        url = "[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)"
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2
        }
        
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        draft = data['choices'][0]['message']['content'].strip()
        
        return {"status": "success", "letter": draft}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))