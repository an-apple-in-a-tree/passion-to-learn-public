from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from models.summarizer import TextSummarizer
from models.question_generator import QuestionGenerator
from models.distractor_generator import DistractorGenerator
from models.quality_ranker import QualityRanker
from models.difficulty_adjuster import DifficultyAdjuster

app = FastAPI(title="AI Study Assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
summarizer = TextSummarizer()
question_generator = QuestionGenerator()
distractor_generator = DistractorGenerator()
quality_ranker = QualityRanker()
difficulty_adjuster = DifficultyAdjuster()

class TextInput(BaseModel):
    text: str
    difficulty: Optional[str] = "medium"

class QuestionResponse(BaseModel):
    question: str
    correct_answer: str
    distractors: List[str]
    difficulty: str
    quality_score: float

@app.post("/summarize")
async def summarize_text(input_data: TextInput):
    try:
        summary = summarizer.summarize(input_data.text)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-questions")
async def generate_questions(input_data: TextInput):
    try:
        # Generate initial questions
        questions = question_generator.generate(input_data.text)
        
        # Add distractors
        questions_with_distractors = []
        for q in questions:
            distractors = distractor_generator.generate(q["question"], q["correct_answer"])
            q["distractors"] = distractors
            questions_with_distractors.append(q)
        
        # Rank questions by quality
        ranked_questions = quality_ranker.rank(questions_with_distractors)
        
        # Adjust difficulty
        final_questions = difficulty_adjuster.adjust(ranked_questions, input_data.difficulty)
        
        return {"questions": final_questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def process_feedback(question_id: str, correct: bool):
    try:
        difficulty_adjuster.update(question_id, correct)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 