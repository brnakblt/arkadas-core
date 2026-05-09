import os
import google.generativeai as genai
from dotenv import load_dotenv
import fitz  # PyMuPDF

load_dotenv()

class AIService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
        else:
            self.model = None

    async def generate_svg_template(self, goal: str, theme: str, difficulty: str):
        if not self.model:
            return self.get_fallback_svg()

        prompt = f"""
        Generate a simple, educational SVG drawing template for a special education student.
        Goal: {goal}
        Theme: {theme}
        Difficulty: {difficulty}
        
        The SVG should be:
        1. Minimalist and clear.
        2. Use dashed or dotted lines for tracing.
        3. Scalable (viewBox="0 0 100 100").
        4. Valid SVG code only, no extra text.
        
        Return ONLY the SVG string.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            svg_content = response.text.strip()
            if "```svg" in svg_content:
                svg_content = svg_content.split("```svg")[1].split("```")[0].strip()
            elif "```" in svg_content:
                svg_content = svg_content.split("```")[1].split("```")[0].strip()
            return svg_content
        except Exception as e:
            print(f"AI Generation Error: {e}")
            return self.get_fallback_svg()

    async def parse_ram_report(self, pdf_content: bytes):
        if not self.model:
            return {"error": "AI model not configured"}

        # Extract text from PDF
        text = ""
        with fitz.open(stream=pdf_content, filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()

        prompt = f"""
        Extract structured information from this Turkish RAM (Rehberlik ve Araştırma Merkezi) report text.
        Identify:
        1. Student Full Name
        2. TCKN (11-digit ID)
        3. Diagnosis
        4. Support Program Category (Zihinsel, Bedensel, Otizm, Dil-Konuşma, İşitme, Özel Öğrenme)
        5. Report End Date (Expiry)
        6. Specific Educational Goals/Targets (BEP Hedefleri)
        
        Text Content:
        {text}
        
        Return the result as a VALID JSON object with these keys: 
        fullName, tcIdentity, diagnosis, category, endDate, targets (list of strings).
        
        Use ISO date format (YYYY-MM-DD) for endDate.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            json_text = response.text.strip()
            # Basic JSON extraction from markdown if present
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0].strip()
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0].strip()
            
            return json_text
        except Exception as e:
            print(f"AI Parsing Error: {e}")
            return {"error": str(e)}

    def get_fallback_svg(self):
        return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="black" stroke-dasharray="4" fill="none" /></svg>'

ai_service = AIService()
