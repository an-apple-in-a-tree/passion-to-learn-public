import numpy as np
from typing import List, Dict
import json
import os
from datetime import datetime

class DifficultyAdjuster:
    def __init__(self):
        self.difficulty_levels = ["easy", "medium", "hard"]
        self.learning_rate = 0.1
        self.exploration_rate = 0.2
        
        # Initialize or load difficulty estimates
        self.difficulty_estimates = self._load_difficulty_estimates()
        
        # Initialize or load student performance history
        self.student_history = self._load_student_history()
    
    def adjust(self, questions: List[Dict], target_difficulty: str) -> List[Dict]:
        """Adjust question difficulty based on target difficulty and student history."""
        adjusted_questions = []
        
        for q in questions:
            # Get current difficulty estimate
            current_difficulty = q.get('difficulty', 'medium')
            
            # Calculate difficulty adjustment
            adjusted_difficulty = self._calculate_adjusted_difficulty(
                current_difficulty,
                target_difficulty
            )
            
            # Update question with adjusted difficulty
            q['difficulty'] = adjusted_difficulty
            adjusted_questions.append(q)
        
        return adjusted_questions
    
    def update(self, question_id: str, correct: bool):
        """Update difficulty estimates based on student performance."""
        if question_id not in self.difficulty_estimates:
            return
        
        # Get current estimate
        current_estimate = self.difficulty_estimates[question_id]
        
        # Update estimate using Thompson sampling
        if correct:
            current_estimate['successes'] += 1
        else:
            current_estimate['failures'] += 1
        
        # Calculate new difficulty
        total_attempts = current_estimate['successes'] + current_estimate['failures']
        success_rate = current_estimate['successes'] / total_attempts
        
        # Update difficulty based on success rate
        if success_rate > 0.7:  # Too easy
            current_estimate['difficulty'] = self._increase_difficulty(current_estimate['difficulty'])
        elif success_rate < 0.3:  # Too hard
            current_estimate['difficulty'] = self._decrease_difficulty(current_estimate['difficulty'])
        
        # Save updated estimates
        self._save_difficulty_estimates()
    
    def _calculate_adjusted_difficulty(self, current: str, target: str) -> str:
        """Calculate adjusted difficulty using Thompson sampling."""
        if np.random.random() < self.exploration_rate:
            # Exploration: randomly choose a difficulty
            return np.random.choice(self.difficulty_levels)
        
        # Exploitation: use current estimates
        current_index = self.difficulty_levels.index(current)
        target_index = self.difficulty_levels.index(target)
        
        # Calculate adjustment
        if current_index < target_index:
            return self._increase_difficulty(current)
        elif current_index > target_index:
            return self._decrease_difficulty(current)
        else:
            return current
    
    def _increase_difficulty(self, current: str) -> str:
        """Increase difficulty level."""
        current_index = self.difficulty_levels.index(current)
        if current_index < len(self.difficulty_levels) - 1:
            return self.difficulty_levels[current_index + 1]
        return current
    
    def _decrease_difficulty(self, current: str) -> str:
        """Decrease difficulty level."""
        current_index = self.difficulty_levels.index(current)
        if current_index > 0:
            return self.difficulty_levels[current_index - 1]
        return current
    
    def _load_difficulty_estimates(self) -> Dict:
        """Load difficulty estimates from file."""
        try:
            with open('models/difficulty_estimates.json', 'r') as f:
                return json.load(f)
        except:
            return {}
    
    def _save_difficulty_estimates(self):
        """Save difficulty estimates to file."""
        os.makedirs('models', exist_ok=True)
        with open('models/difficulty_estimates.json', 'w') as f:
            json.dump(self.difficulty_estimates, f)
    
    def _load_student_history(self) -> Dict:
        """Load student performance history from file."""
        try:
            with open('models/student_history.json', 'r') as f:
                return json.load(f)
        except:
            return {}
    
    def _save_student_history(self):
        """Save student performance history to file."""
        os.makedirs('models', exist_ok=True)
        with open('models/student_history.json', 'w') as f:
            json.dump(self.student_history, f)
    
    def record_student_performance(self, student_id: str, question_id: str, correct: bool):
        """Record student performance for future difficulty adjustments."""
        if student_id not in self.student_history:
            self.student_history[student_id] = []
        
        self.student_history[student_id].append({
            'question_id': question_id,
            'correct': correct,
            'timestamp': datetime.now().isoformat()
        })
        
        self._save_student_history() 