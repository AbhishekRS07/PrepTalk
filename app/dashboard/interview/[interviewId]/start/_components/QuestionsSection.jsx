import { Lightbulb, Volume2 } from 'lucide-react';
import React from 'react';

const QuestionsSection = ({ mockInterQuestion, active, onQuestionClick }) => {

  const textToSpeech=(text)=>{
if('speechSynthesis' in window){
  const speech = new SpeechSynthesisUtterance(text)
  window.speechSynthesis.speak(speech)
}
else{
  alert("Your browser does not support text to speech")
}
  }
  return mockInterQuestion && (
    <div className='p-5 border rounded-lg my-10'>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5'>
        {mockInterQuestion.map((question, index) => (
          <h2 
            key={index}
            className={`p-2 bg-secondary rounded-full text-xs md:text-sm text-center cursor-pointer ${active === index ? 'text-white bg-blue-600' : ''} w-28`}
            onClick={() => onQuestionClick(index)} 
          >
            Question #{index + 1}
          </h2>
        ))}
      </div> 
      
      <h2 className='my-5 text-md md:text-lg'>{mockInterQuestion[active]?.question}</h2>
      <Volume2 onClick={()=>textToSpeech(mockInterQuestion[active]?.question)}/>
      <div className='border rounded-lg p-5 bg-blue-100 mt-10'>
        <h2 className='flex gap-2 items-center  text-blue-600'>
          <Lightbulb />
          <strong>Note:</strong>
        </h2>
        <h2 className='text-sm '>{process.env.NEXT_PUBLIC_QUESTION_NOTE}</h2>
      </div>
    </div>
  );
};

export default QuestionsSection;
