from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import torch
from typing import List
import nltk
from rouge_score import rouge_scorer

class TextSummarizer:
    def __init__(self):
        self.model_name = "facebook/bart-large-cnn"  # Using BART instead of T5
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        
        # Download required NLTK data
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
    
    def preprocess_text(self, text: str) -> List[str]:
        """Split text into sentences and prepare for summarization."""
        sentences = nltk.sent_tokenize(text)
        return sentences
    
    def summarize(self, text: str, max_length: int = 150) -> str:
        """Generate a summary using BART model."""
        # Preprocess text
        sentences = self.preprocess_text(text)
        
        # Prepare input
        input_text = " ".join(sentences)
        inputs = self.tokenizer(
            input_text,
            max_length=1024,
            truncation=True,
            return_tensors="pt"
        ).to(self.device)
        
        # Generate summary
        summary_ids = self.model.generate(
            inputs["input_ids"],
            max_length=max_length,
            min_length=40,
            length_penalty=2.0,
            num_beams=4,
            early_stopping=True
        )
        
        summary = self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        return summary
    
    def evaluate_summary(self, original_text: str, summary: str) -> dict:
        """Evaluate summary quality using ROUGE scores."""
        scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
        scores = scorer.score(original_text, summary)
        return {
            'rouge1': scores['rouge1'].fmeasure,
            'rouge2': scores['rouge2'].fmeasure,
            'rougeL': scores['rougeL'].fmeasure
        } 