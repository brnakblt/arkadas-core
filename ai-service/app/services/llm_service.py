import json
from openai import OpenAI
from app.core.config import settings
from app.schemas.iep import IEPGenerationRequest, IEPGenerationResponse, IEPGoal

class LLMService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.client = None
        
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            print("WARNING: OPENAI_API_KEY not set. LLM features will fail.")

    def generate_iep(self, request: IEPGenerationRequest) -> IEPGenerationResponse:
        if not self.client:
            raise ValueError("OpenAI API Key is not configured.")

        system_prompt = """
        You are an expert Special Education consultant in Turkey. 
        Your task is to generate a draft Individualized Education Program (BEP - Bireyselleştirilmiş Eğitim Programı) 
        based on the provided RAM (Rehberlik ve Araştırma Merkezi) report text and student details.

        Output must be valid JSON matching this structure:
        {
            "student_name": "string",
            "summary_of_needs": "string",
            "recommended_goals": [
                {
                    "domain": "string (e.g. Bilişsel, Sosyal, Özbakım)",
                    "long_term_goal": "string",
                    "short_term_objectives": ["string", "string"]
                }
            ],
            "suggested_accommodations": ["string"]
        }
        
        Use Turkish language. Be professional, empathetic, and compliant with MEB (Milli Eğitim Bakanlığı) standards.
        """

        user_content = f"""
        Student: {request.student_info.name}, Age: {request.student_info.age}
        Diagnosis: {request.student_info.diagnosis}
        
        RAM Report Content:
        {request.ram_report_content}
        
        Notes:
        {request.additional_notes or "None"}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            parsed = json.loads(content)
            
            return IEPGenerationResponse(**parsed, raw_completion=content)
            
        except Exception as e:
            print(f"LLM Generation Error: {str(e)}")
            raise e

llm_service = LLMService()
