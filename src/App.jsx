import { useState, useEffect } from "react";
import "./App.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import QuestionCard from "./components/Card";
import AOS from "aos";
import { Theme } from '@radix-ui/themes';
import AIStudyAssistant from './components/AIStudyAssistant';
import '@radix-ui/themes/styles.css';

document.addEventListener("DOMContentLoaded", (e) => {
  AOS.init({
    duration: 1500,
    easing: "ease-in-out",
    once: true,
  });
});

function App() {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]); // Array of questions
  const [allAnswers, setAllAnswers] = useState([]); // Array of arrays of answers
  const [correctAnswerIndices, setCorrectAnswerIndices] = useState([]); // Array of indices of correct answers
  const [classNotes, setClassNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [summarized, setSummarized] = useState(false); // Declare summarized as a state variable
  let submit = "Start Reviewing";
  console.log("Loaded");

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

  const fetchQuestion = async () => {
    const prompt = `
      Given the provided class notes: ${classNotes}, craft a thought-provoking multiple-choice 
      question that challenges the student's critical thinking and deep understanding of the 
      subject matter. The question should not be immediately apparent. Please create a single
       question and do not show the answer choices. Question should be in paragraph format with no extra syntax
       such as "**Question**". Note: If the provided class notes are insufficient
        or irrelevant to academic content, respond with an error message.`;
    const result = await genAI
      .getGenerativeModel({ model: "gemini-pro" })
      .generateContent(prompt);
    const response = await result.response;
    return response.text();
  };

  const fetchAnswers = async (questionText) => {
    const prompt = `
  Create 4 distinct answer choices for the question:
  ${questionText}
  Use the following format to list the answers, separating them with a tilde (~):
  A) ~ B) ~ C) ~ D)
  Replace the bracketed text with the actual answer choices. Do not include any additional
   formatting such as "[]" or "**" or "1.". Note: The correct answer is concealed among the options and will be disclosed after a selection is made.
`;
    const result = await genAI
      .getGenerativeModel({ model: "gemini-pro" })
      .generateContent(prompt);
    const response = await result.response;
    return response.text();
  };

  const fetchCorrectAnswer = async (questionText) => {
    const prompt = `
      Based on the question and answer choices you've generated:
  Question: ${questionText}
  Answer Choices: ${allAnswers.join(" ~ ")}
  You must return a number between 0 and 3, inclusive.
  This number corresponds to the index of the correct answer choice.
  Example: If the correct answer is the third choice, provide '2' as the index.
    `;
    const result = await genAI
      .getGenerativeModel({ model: "gemini-pro" })
      .generateContent(prompt);
    const response = await result.response;
    const correctAnswerIndex = parseInt(response.text().trim());
    return correctAnswerIndex;
  };

  const fetchSummary = async () => {
    const prompt = `
      Please provide a concise one sentence summary 
      (cover the main idea and purpose) of the following class notes:
      ${classNotes}
    `;
    const result = await genAI
      .getGenerativeModel({ model: "gemini-pro" })
      .generateContent(prompt);
    const response = await result.response;
    setSummary(response.text());
  };

  useEffect(() => {}, [classNotes]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!summarized) {
        fetchSummary();
        submit = "Get More Questions";
        setSummarized(true);
      }
      const questionText = await fetchQuestion();
      const answerText = await fetchAnswers(questionText);
      const answers = answerText
        .split("~")
        .filter((answer) => answer.trim() !== ""); // Filter out empty answers
      const correctAnswerIndex = await fetchCorrectAnswer(questionText);

      setQuestions((prevQuestions) => [...prevQuestions, questionText]);
      setAllAnswers((prevAllAnswers) => [...prevAllAnswers, answers]);
      setCorrectAnswerIndices((prevCorrectAnswerIndices) => [
        ...prevCorrectAnswerIndices,
        correctAnswerIndex,
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Theme>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">
            AI-Powered Study Assistant
          </h1>
          <AIStudyAssistant />
        </div>
      </div>
    </Theme>
  );
}

export default App;

/*

Knowledge and the Knower

Content Test
"It is the mark of an educated mind to be able to entertain a thought without accepting it." 
					- Aristotle
- An educated mind is able to critically evaluate and consider a differing opinions that do not align with their own worldview. This is important because while we hold our personal worldviews to a great degree of certainty (ie. we trust in them a lot and believe that we are correct), worldviews have their own pitfalls including brain biases, Our worldviews are a collection of ideals and values that we possess through the influence of our cultures and personal experiences. While our worldviews guide us through our decision-making processes in many different areas such as politics and religion
Quotes
Knowledge and the Knower
"It is the mark of an educated mind to be able to entertain a thought without accepting it." 
			

Terminology
Knowledge: some representation of the world as it is
Fact: knowledge claim of the world that we are certain of
Opinion: is a knowledge claim that an individual believes to be true based on their certainty of facts in the world (opinion/point of view)

Certainty: (a state of mind) is the extent to which the individual believes their opinion to be fact
How convinced we are of the truth of the knowledge, not how true it is
Certainty
Indisputable - death
Dubious - the earth is flat
Criminal court - shadow of a reasonable doubt; must need proof of someone committing a crime
Civil court- lower bar; looking at likely probability instead of needing certain proof
Rational Certainty- justified, reasoned, with evidence (selected to support beliefs, usually never complete; cherry picking due to the quality of evidence)
Irrational Certainty - based on intuition faith (not always wrong)
Appear to be supported by evidence (rationalization, cherry-picking, confirmation bias, sweeping generalizations)
Scientists accept uncertainty (absolute certainty is avoided)
Skepticism 

How do we know what we claim to know (Goal to examine)?

Underlying assumptions
Ordinary objects survive gradual decay
an object goes where its parts go
transitivity of identity
Solution
Deny an object where its parts go
deny ordinary objects survive gradual change (Joseph butler)
A and B are both accepted, transitivity of identity
Deny, Ordinary objects have overlapping parts

Ted Talk notes. 
Ex: sensors that believe to find marijuana in students lockers (50% accuracy)
you can say a miracle happens but in reality it is just a test (beginning of change for science)
Theories (kaleidoscopic views and povs for beliefs; Saturn had three bodies)


Justified: coherence with previous dara 

04/19

VID -true, believes and justified -> is now not knowledge
the gettier problem
story justified without knowledge

Plato effect
being closed minded to other perspectives (caves)
was a rationalist and believed in discovering a higher truth


May 8th, 2024
Political Spectrum 
Far Left
Anarcho-Communism 
Left Libertarianism 
State Communism
No private property
Everything is commonly owned in a communal setting for the collective good
Left Wing
Democratic Socialism
Social Democracy
Social freedom 
Collective action or trade union's right to collectively bargain 
Class Solidarity 
High govt intervention in economy - public sector
Distributive justice 
(Neo-liberal Consensus)
Centre-left
Social Liberalism (moderate government intervention in the economy)
Social Freedom
Equality of Opportunity
Respect for social/cultural diversity
Individualism
Rule of law
Representative Democracy 
Centre-right
Economic Liberalism
Economic Freedom
Private Property
Free Trade
Meritocracy
Individualism
Rule of Law
Rep Democracy
Right-Wing
Neo-conservatism
Economic Liberalism
Social Conservatism
Tradition
Family Values
Xenophobic
Highly Religious
Anti-multiculturalism 
Anti-LGBTQ
Strong military 
Far-Right
Neo-fascism
White nationalists, or openly racists
Strong military 
Anti-LGBTQ
Anti-feminist
Anti-union
Anti-immigrant
Anti-multiculturalism  
Neo-nazism
Anarcho-Capitalism
Right-Libertarianism
No public sector
Everything is privatized 
Free association of individuals governed by a free market 





*/
