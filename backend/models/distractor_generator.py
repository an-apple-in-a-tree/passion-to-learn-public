from transformers import BertForMaskedLM, BertTokenizer
import torch
from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

class DistractorGenerator:
    def __init__(self):
        # Initialize BERT for masked language modeling
        self.bert_model_name = "bert-base-uncased"
        self.bert_tokenizer = BertTokenizer.from_pretrained(self.bert_model_name)
        self.bert_model = BertForMaskedLM.from_pretrained(self.bert_model_name)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.bert_model.to(self.device)
        
        # Initialize sentence transformer for semantic similarity
        self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Common distractors for different types of answers
        self.common_distractors = {
            "number": ["0", "1", "10", "100", "1000"],
            "date": ["yesterday", "tomorrow", "next week", "last month"],
            "location": ["here", "there", "somewhere else", "nowhere"],
            "person": ["someone else", "nobody", "everyone", "anyone"],
            "default": ["none of the above", "all of the above", "cannot be determined"]
        }
    
    def generate(self, question: str, correct_answer: str, num_distractors: int = 3) -> List[str]:
        """Generate plausible distractors for a given question and correct answer."""
        # Get answer type
        answer_type = self._get_answer_type(correct_answer)
        
        # Generate distractors using BERT
        bert_distractors = self._generate_bert_distractors(question, correct_answer, num_distractors)
        
        # Add common distractors based on answer type
        common_distractors = self.common_distractors.get(answer_type, self.common_distractors["default"])
        
        # Combine and rank distractors
        all_distractors = bert_distractors + common_distractors
        ranked_distractors = self._rank_distractors(question, correct_answer, all_distractors)
        
        # Select top distractors
        selected_distractors = ranked_distractors[:num_distractors]
        
        return selected_distractors
    
    def _get_answer_type(self, answer: str) -> str:
        """Determine the type of answer (number, date, location, etc.)."""
        # Simple heuristic-based type detection
        if answer.replace(".", "").isdigit():
            return "number"
        elif any(word in answer.lower() for word in ["yesterday", "tomorrow", "today", "week", "month", "year"]):
            return "date"
        elif any(word in answer.lower() for word in ["where", "place", "location", "city", "country"]):
            return "location"
        elif any(word in answer.lower() for word in ["who", "person", "name"]):
            return "person"
        return "default"
    
    def _generate_bert_distractors(self, question: str, correct_answer: str, num_distractors: int) -> List[str]:
        """Generate distractors using BERT masked language modeling."""
        # Prepare input
        masked_question = question.replace(correct_answer, "[MASK]")
        inputs = self.bert_tokenizer(
            masked_question,
            return_tensors="pt",
            padding=True,
            truncation=True
        ).to(self.device)
        
        # Get predictions
        with torch.no_grad():
            outputs = self.bert_model(**inputs)
            predictions = outputs.logits
        
        # Get top predictions for the masked token
        mask_token_index = torch.where(inputs["input_ids"] == self.bert_tokenizer.mask_token_id)[1]
        mask_token_logits = predictions[0, mask_token_index, :]
        top_tokens = torch.topk(mask_token_logits, num_distractors + 1, dim=1).indices[0]
        
        # Convert tokens to words
        distractors = []
        for token_id in top_tokens:
            word = self.bert_tokenizer.decode([token_id])
            if word != correct_answer and word not in distractors:
                distractors.append(word)
        
        return distractors[:num_distractors]
    
    def _rank_distractors(self, question: str, correct_answer: str, distractors: List[str]) -> List[str]:
        """Rank distractors based on semantic similarity and plausibility."""
        # Get embeddings
        question_embedding = self.sentence_transformer.encode([question])[0]
        answer_embedding = self.sentence_transformer.encode([correct_answer])[0]
        distractor_embeddings = self.sentence_transformer.encode(distractors)
        
        # Calculate similarities
        question_similarities = cosine_similarity([question_embedding], distractor_embeddings)[0]
        answer_similarities = cosine_similarity([answer_embedding], distractor_embeddings)[0]
        
        # Combine scores (higher similarity to question, lower similarity to answer)
        scores = question_similarities - 0.5 * answer_similarities
        
        # Rank distractors
        ranked_indices = np.argsort(scores)[::-1]
        ranked_distractors = [distractors[i] for i in ranked_indices]
        
        return ranked_distractors 