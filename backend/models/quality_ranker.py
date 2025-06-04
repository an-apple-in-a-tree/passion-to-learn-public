import torch
import torch.nn as nn
import torch.nn.functional as F
from sentence_transformers import SentenceTransformer
from typing import List, Dict
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class SiameseNetwork(nn.Module):
    def __init__(self, embedding_dim=384):
        super(SiameseNetwork, self).__init__()
        self.embedding = SentenceTransformer('all-MiniLM-L6-v2')
        self.fc1 = nn.Linear(embedding_dim * 2, 256)
        self.fc2 = nn.Linear(256, 128)
        self.fc3 = nn.Linear(128, 1)
        
    def forward(self, x1, x2):
        # Get embeddings
        e1 = self.embedding.encode(x1, convert_to_tensor=True)
        e2 = self.embedding.encode(x2, convert_to_tensor=True)
        
        # Concatenate embeddings
        combined = torch.cat((e1, e2), dim=1)
        
        # Pass through fully connected layers
        x = F.relu(self.fc1(combined))
        x = F.relu(self.fc2(x))
        x = torch.sigmoid(self.fc3(x))
        
        return x

class QualityRanker:
    def __init__(self):
        self.model = SiameseNetwork()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Load pre-trained weights if available
        try:
            self.model.load_state_dict(torch.load('models/quality_ranker_weights.pth'))
            self.model.eval()
        except:
            print("No pre-trained weights found. Using untrained model.")
    
    def rank(self, questions: List[Dict]) -> List[Dict]:
        """Rank questions based on quality metrics."""
        # Calculate quality scores
        scored_questions = []
        for q in questions:
            quality_score = self._calculate_quality_score(q)
            q['quality_score'] = quality_score
            scored_questions.append(q)
        
        # Sort questions by quality score
        ranked_questions = sorted(scored_questions, key=lambda x: x['quality_score'], reverse=True)
        
        return ranked_questions
    
    def _calculate_quality_score(self, question: Dict) -> float:
        """Calculate quality score for a question using multiple metrics."""
        # 1. Question clarity score
        clarity_score = self._calculate_clarity_score(question['question'])
        
        # 2. Answer distinctiveness score
        distinctiveness_score = self._calculate_distinctiveness_score(
            question['question'],
            question['correct_answer'],
            question['distractors']
        )
        
        # 3. Semantic coherence score
        coherence_score = self._calculate_coherence_score(
            question['question'],
            question['correct_answer']
        )
        
        # Combine scores with weights
        final_score = (
            0.4 * clarity_score +
            0.3 * distinctiveness_score +
            0.3 * coherence_score
        )
        
        return final_score
    
    def _calculate_clarity_score(self, question: str) -> float:
        """Calculate how clear and well-formed the question is."""
        # Simple heuristic-based scoring
        score = 1.0
        
        # Check question mark
        if not question.endswith('?'):
            score *= 0.8
        
        # Check question length
        words = question.split()
        if len(words) < 5:
            score *= 0.7
        elif len(words) > 20:
            score *= 0.8
        
        # Check for common question words
        question_words = ['what', 'where', 'when', 'why', 'how', 'which', 'who']
        if not any(word in question.lower() for word in question_words):
            score *= 0.9
        
        return score
    
    def _calculate_distinctiveness_score(self, question: str, correct_answer: str, distractors: List[str]) -> float:
        """Calculate how distinct the correct answer is from distractors."""
        # Get embeddings
        correct_embedding = self.sentence_transformer.encode([correct_answer])[0]
        distractor_embeddings = self.sentence_transformer.encode(distractors)
        
        # Calculate similarities
        similarities = cosine_similarity([correct_embedding], distractor_embeddings)[0]
        
        # Lower similarity means higher distinctiveness
        distinctiveness = 1 - np.mean(similarities)
        
        return distinctiveness
    
    def _calculate_coherence_score(self, question: str, answer: str) -> float:
        """Calculate semantic coherence between question and answer."""
        # Get embeddings
        question_embedding = self.sentence_transformer.encode([question])[0]
        answer_embedding = self.sentence_transformer.encode([answer])[0]
        
        # Calculate similarity
        similarity = cosine_similarity([question_embedding], [answer_embedding])[0][0]
        
        return similarity 