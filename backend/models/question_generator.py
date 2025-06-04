from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch
from typing import List, Dict
import json
import random

class QuestionGenerator:
    def __init__(self):
        self.model_name = "gpt2-medium"
        self.tokenizer = GPT2Tokenizer.from_pretrained(self.model_name)
        self.model = GPT2LMHeadModel.from_pretrained(self.model_name)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        
        # Few-shot examples for question generation
        self.few_shot_examples = [
            {
                "text": "The process of photosynthesis converts light energy into chemical energy.",
                "question": "What does photosynthesis convert light energy into?",
                "answer": "chemical energy"
            },
            {
                "text": "The human brain contains approximately 86 billion neurons.",
                "question": "How many neurons are in the human brain?",
                "answer": "86 billion"
            }
        ]
    
    def _create_prompt(self, text: str) -> str:
        """Create a prompt with few-shot examples."""
        prompt = "Generate a multiple-choice question from the following text:\n\n"
        
        # Add few-shot examples
        for example in self.few_shot_examples:
            prompt += f"Text: {example['text']}\n"
            prompt += f"Question: {example['question']}\n"
            prompt += f"Answer: {example['answer']}\n\n"
        
        # Add the target text
        prompt += f"Text: {text}\n"
        prompt += "Question:"
        return prompt
    
    def generate(self, text: str, num_questions: int = 3) -> List[Dict]:
        """Generate multiple-choice questions from the given text."""
        questions = []
        
        for _ in range(num_questions):
            # Create prompt
            prompt = self._create_prompt(text)
            
            # Tokenize and generate
            inputs = self.tokenizer.encode(
                prompt,
                return_tensors="pt",
                max_length=512,
                truncation=True
            ).to(self.device)
            
            # Generate question
            output = self.model.generate(
                inputs,
                max_length=100,
                num_return_sequences=1,
                temperature=0.7,
                top_p=0.9,
                do_sample=True
            )
            
            # Decode and process output
            generated_text = self.tokenizer.decode(output[0], skip_special_tokens=True)
            question = generated_text.split("Question:")[-1].strip()
            
            # Extract answer (this is a simplified version - in practice, you'd want more robust extraction)
            answer = self._extract_answer(question)
            
            questions.append({
                "question": question,
                "correct_answer": answer,
                "difficulty": random.choice(["easy", "medium", "hard"])
            })
        
        return questions
    
    def _extract_answer(self, question: str) -> str:
        """Extract the answer from the generated question."""
        # This is a simplified version - in practice, you'd want more robust extraction
        # or use a separate model to generate the answer
        return question.split("?")[0].split()[-1] 