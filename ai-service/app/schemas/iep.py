from pydantic import BaseModel, Field
from typing import List, Optional, Any

class StudentInfo(BaseModel):
    name: str = Field(..., description="Student's full name")
    age: int = Field(..., description="Age")
    diagnosis: Optional[str] = Field(None, description="Medical/Educational diagnosis")
    grade: Optional[str] = Field(None, description="Current grade level")

class IEPGenerationRequest(BaseModel):
    student_info: StudentInfo
    ram_report_content: str = Field(..., description="Text content extracted from RAM (Rehberlik Araştırma Merkezi) report")
    additional_notes: Optional[str] = Field(None, description="Teachers' observations or specific goals")

class IEPGoal(BaseModel):
    domain: str = Field(..., description="e.g. Cognitive, Social, Motor")
    long_term_goal: str
    short_term_objectives: List[str]

class IEPGenerationResponse(BaseModel):
    student_name: str
    summary_of_needs: str
    recommended_goals: List[IEPGoal]
    suggested_accommodations: List[str]
    raw_completion: Optional[str] = None
