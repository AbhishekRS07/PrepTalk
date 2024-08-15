"use client";

import React, { useEffect, useState } from 'react';
import { PrepTalk } from '../../../../../utils/schema';
import { db } from '../../../../../utils/db';
import { eq } from 'drizzle-orm';
import QuestionsSection from './_components/QuestionsSection';
import RecordAns from './_components/RecordAns';
import { Button } from '../../../../../components/ui/button';
import Link from 'next/link';

const StartInterview = ({ params }) => {
  const [interviewData, setInterviewData] = useState();
  const [prepTalks, setPrepTalks] = useState([]);
  const [active, setActive] = useState(0); // State to manage the active question index

  useEffect(() => {
    GetInterviewDetails();
  }, [params.interviewId]);

  const GetInterviewDetails = async () => {
    try {
      const result = await db.select().from(PrepTalk)
        .where(eq(PrepTalk.mockId, params.interviewId));
      
      if (result.length > 0) {
        const rawJsonMockResp = result[0].jsonMockResp;
        console.log("Raw JSON Response:", rawJsonMockResp); // Log the raw JSON string
  
        // Clean up the JSON string if necessary
        const cleanedResponse = rawJsonMockResp
          .replace(/^[^{[]*/, '')  // Remove anything before the first `{` or `[`
          .replace(/[^}\]]*$/, '')  // Remove anything after the last `}` or `]`
          .trim();  // Remove leading/trailing whitespace
  
        // Add square brackets to make it a valid JSON array if needed
        let validJsonResponse = cleanedResponse;
  
        if (!cleanedResponse.startsWith('[')) {
          validJsonResponse = `[${cleanedResponse}]`;
        }
  
        console.log("Cleaned JSON Response:", validJsonResponse); // Log the cleaned JSON string
  
        // Attempt to parse the JSON string
        const jsonMockResp = JSON.parse(validJsonResponse);
        console.log("Parsed JSON Response:", jsonMockResp);
        
        setPrepTalks(jsonMockResp);
        setInterviewData(result[0]);
      } else {
        console.error('No interview data found for the given ID.');
      }
    } catch (error) {
      console.error('Error fetching interview details:', error);
    }
  };

  const handleQuestionClick = (index) => {
    setActive(index); // Update the active question index
  };

  return (
    <div className="min-h-screen p-8">
      <div className='flex justify-end gap-6'>
        {active > 0 && (
          <Button 
            onClick={() => setActive(active - 1)} 
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Previous Question
          </Button>
        )}
        {active !== prepTalks?.length - 1 && (
          <Button 
            onClick={() => setActive(active + 1)} 
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
          >
            Next Question
          </Button>
        )}
        {active === prepTalks?.length - 1 && (
          <Link href={'/dashboard/interview/' + interviewData?.mockId + "/feedback"}>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
            >
              End Interview
            </Button>
          </Link>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-10 bg-white shadow-lg p-6 rounded-lg'>
        <QuestionsSection 
          mockInterQuestion={prepTalks} 
          active={active} 
          onQuestionClick={handleQuestionClick}
        />
        <RecordAns 
          mockInterQuestion={prepTalks} 
          active={active} 
          interviewData={interviewData} 
        />
      </div>
    </div>
  );
};

export default StartInterview;
