import { useState, useEffect } from "react";
import "./App.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import QuestionCard from "./components/Card";
import AOS from "aos";

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
    <div className="sans">
      <div className="bg-header relative h-screen w-screen overflow-hidden rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <h1 className="serif text-white font-black text-9xl my-8">
            Passion to Learn
          </h1>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-school"
            width="200"
            height="200"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="#ffffff"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
            <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
          </svg>
        </div>
      </div>
      <div className="relative h-0 w-screen overflow-hidden rounded-lg"></div>

      <div className="flex w-full bg-black text-white">
        <img
          data-aos="fade-up"
          src="https://img.freepik.com/premium-photo/ai-generated-cute-young-girl-student-studying_988987-616.jpg"
          className="mr-8 w-[600px] h-full"
        />

        <div className="h-96 w-full pb-16">
          <p className={`text-2xl p-20`}>
            Get started for free and explore the power of AI-assisted learning.
            Dive in now.
          </p>
        </div>
      </div>

      <div className="flex w-full bg-black">
        <div className="h-96 w-full text-white p-20 text-2xl">
          <h3 className="text-3xl text-extrabold">
            Join the Learning Revolution:{" "}
          </h3>
          <p className={`text-xl mt-4`}>
            <ul>
              <li> - Enhance your study sessions</li>
              <li> - Supplement your learning materials</li>
              <li> - Dive deeper into any your education</li>
            </ul>
          </p>
        </div>
        <img
          data-aos="fade-right"
          src="https://magazine.alumni.ubc.ca/sites/default/files/styles/max_1300x1300/public/2023-09/AIart-1920x1080.jpg?itok=i4Yw51WT"
          className="ml-8 w-2/3 h-full"
        />
      </div>

      <div className="flex w-full bg-black text-white">
        <img
          data-aos="fade-up"
          src="https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F269219ca-d567-4d31-ba47-231d30ead8b1_1024x1024.png"
          className="mr-8 w-[600px] h-full"
        />

        <div className="h-96 w-full pb-16">
          <p className={`text-2xl p-20`}>
          Our AI generates thought-provoking multiple-choice questions that meet the rigorous standards of higher education institutions worldwide.          </p>
        </div>
      </div>


      <main
        data-aos="zoom-in-up"
        className="bg-grey-200 flex flex-col mt-12 items-center justify-center w-full px-12 h-full"
      >
        <h1 className="text-3xl serif mb-4">
          Enter Your Notes to start reviewing:{" "}
        </h1>
        <textarea
          value={classNotes}
          onChange={(e) => setClassNotes(e.target.value)}
          placeholder="Enter class notes here..."
          rows={20}
          cols={50}
          className="rounded-lg mx-4 w-5/6 h-96 p-8 border-2 border-black"
        />

        <button
          onClick={fetchData}
          className="bg-black text-white p-4 my-8 rounded-xl"
        >
          Review Now!
        </button>

        <div className="m-4 w-3/4">
          <div className="bg-pink-100 p-4 mb-8">
            <h2 className="text-lg font-bold">Main Idea: </h2>
            {summary && <p className="my-4 font-medium"> {summary}</p>}
          </div>
          {questions.map((question, index) => (
            <QuestionCard
              key={index}
              question={question}
              answers={allAnswers[index]}
              correctAnswerIndex={correctAnswerIndices[index]}
            />
          ))}
        </div>
      </main>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
        <path
          fill="#000000"
          fill-opacity="1"
          d="M0,224L30,229.3C60,235,120,245,180,213.3C240,181,300,107,360,101.3C420,96,480,160,540,208C600,256,660,288,720,261.3C780,235,840,149,900,106.7C960,64,1020,64,1080,90.7C1140,117,1200,171,1260,181.3C1320,192,1380,160,1410,144L1440,128L1440,320L1410,320C1380,320,1320,320,1260,320C1200,320,1140,320,1080,320C1020,320,960,320,900,320C840,320,780,320,720,320C660,320,600,320,540,320C480,320,420,320,360,320C300,320,240,320,180,320C120,320,60,320,30,320L0,320Z"
        ></path>
      </svg>
    </div>
  );
}

export default App;

/*

Knowledge and the Knower

Content Test
“It is the mark of an educated mind to be able to entertain a thought without accepting it.” 
					- Aristotle
- An educated mind is able to critically evaluate and consider a differing opinions that do not align with their own worldview. This is important because while we hold our personal worldviews to a great degree of certainty (ie. we trust in them a lot and believe that we are correct), worldviews have their own pitfalls including brain biases, Our worldviews are a collection of ideals and values that we possess through the influence of our cultures and personal experiences. While our worldviews guide us through our decision-making processes in many different areas such as politics and religion
Quotes
Knowledge and the Knower
“It is the mark of an educated mind to be able to entertain a thought without accepting it.” 
			

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
Collective action or trade union’s right to collectively bargain 
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
