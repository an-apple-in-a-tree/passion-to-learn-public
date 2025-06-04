import React, { useState } from 'react';
import { Card, Text, TextField, Button, Flex, Box, Select } from '@radix-ui/themes';

const AIStudyAssistant = () => {
  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSummarize = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:8000/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, difficulty }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }
      
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:8000/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, difficulty }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }
      
      const data = await response.json();
      setQuestions(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (questionId, correct) => {
    try {
      await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question_id: questionId, correct }),
      });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  return (
    <Card size="2">
      <Flex direction="column" gap="4">
        <Text size="6" weight="bold">AI Study Assistant</Text>
        
        <TextField.Root>
          <TextField.Input
            placeholder="Enter your study material..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ minHeight: '100px' }}
          />
        </TextField.Root>
        
        <Select.Root value={difficulty} onValueChange={setDifficulty}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="easy">Easy</Select.Item>
            <Select.Item value="medium">Medium</Select.Item>
            <Select.Item value="hard">Hard</Select.Item>
          </Select.Content>
        </Select.Root>
        
        <Flex gap="2">
          <Button onClick={handleSummarize} disabled={loading || !text}>
            {loading ? 'Processing...' : 'Summarize'}
          </Button>
          <Button onClick={handleGenerateQuestions} disabled={loading || !text}>
            {loading ? 'Processing...' : 'Generate Questions'}
          </Button>
        </Flex>
        
        {error && (
          <Text color="red">{error}</Text>
        )}
        
        {summary && (
          <Box>
            <Text weight="bold">Summary:</Text>
            <Text>{summary}</Text>
          </Box>
        )}
        
        {questions.length > 0 && (
          <Box>
            <Text weight="bold">Generated Questions:</Text>
            {questions.map((q, index) => (
              <Card key={index} style={{ marginTop: '1rem' }}>
                <Text weight="bold">{q.question}</Text>
                <Flex direction="column" gap="2" style={{ marginTop: '1rem' }}>
                  {[q.correct_answer, ...q.distractors].map((answer, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      onClick={() => handleAnswerSubmit(q.id, answer === q.correct_answer)}
                    >
                      {answer}
                    </Button>
                  ))}
                </Flex>
                <Text size="2" color="gray">
                  Difficulty: {q.difficulty} | Quality Score: {q.quality_score.toFixed(2)}
                </Text>
              </Card>
            ))}
          </Box>
        )}
      </Flex>
    </Card>
  );
};

export default AIStudyAssistant; 