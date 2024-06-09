import { Card, Text, Button } from "@radix-ui/themes";
import { useState } from "react";

export default function QuestionCard({
  question,
  answers,
  correctAnswerIndex,
}) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isCorrect, setIsCorrect] = useState(null);

  const handleClick = (index) => {
    setSelectedIndex(index);
    setIsCorrect(index === correctAnswerIndex);
  };

  return (
    <Card variant="surface" className="bg-white rounded-lg shadow-md">
      <Text
        as="div"
        color="gray"
        size="2"
        className="bg-black text-white text-m p-4"
      >
        {question}
      </Text>
      {answers.map((answer, index) => (
        <div key={index} className="mb-2">
          <Button
            onClick={() => handleClick(index)}
            className="w-full py-4 px-4 rounded-md transition-colors duration-300"
          >
            {answer}
          </Button>
          {selectedIndex === index && (
            <Text
              as="div"
              size="1"
              className={`text-sm p-4 text-blue-900 ${
                isCorrect ? ' text-green-500 ' : ' text-red-500 '
              } mt-1`}
            >
              {isCorrect ? 'Correct!' : 'Try again!'}
            </Text>
          )}
        </div>
      ))}
    </Card>
  );
}
