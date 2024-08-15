import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from '../../../components/ui/button';

const InterviewCard = ({ interview }) => {
  const router = useRouter();

  const onStart = () => {
    router.push('/dashboard/interview/' + interview?.mockId);
  };

  const onFeedback = () => {
    router.push('/dashboard/interview/' + interview?.mockId + '/feedback');
  };

  return (
    <div className='border shadow-lg rounded-xl p-6 bg-white hover:shadow-xl transition-shadow duration-300'>
      <h2 className='font-bold text-lg text-primary mb-2'>{interview?.jobPosition}</h2>
      <h3 className='text-sm text-gray-600 mb-1'>{interview?.jobExperience} years of experience</h3>
      <p className='text-xs text-gray-500 mb-4'>Created At: {interview?.createdAt}</p>
      
      <div className='flex justify-between mt-4'>
        <Button 
          onClick={onFeedback} 
          size="sm" 
          variant="outline" 
          className="w-1/2 mr-2 py-2 border-gray-400 text-gray-700 hover:bg-gray-100"
        >
          Feedback
        </Button>
        <Button 
          onClick={onStart} 
          size="sm" 
          className="w-1/2 ml-2 py-2 bg-blue-500 text-white hover:bg-blue-600"
        >
          Start
        </Button>
      </div>
    </div>
  );
};

export default InterviewCard;
