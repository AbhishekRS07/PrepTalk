"use client";
import React, { useEffect, useState } from 'react';
import { db } from '../../../../utils/db';
import { PrepTalk } from '../../../../utils/schema';
import { eq } from 'drizzle-orm';
import Webcam from 'react-webcam';
import { Lightbulb, WebcamIcon } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';

const InterView = ({ params }) => {
    const [interviewData, setInterviewData] = useState(null);
    const [webcamEnable, setWebcamEnable] = useState(false);

    useEffect(() => {
        GetInterviewDetails();
        // Check local storage for webcam state
        const savedWebcamState = localStorage.getItem('webcamEnabled');
        if (savedWebcamState === 'true') {
            setWebcamEnable(true);
        }
    }, [params.interviewId]);

    const GetInterviewDetails = async () => {
        const result = await db.select().from(PrepTalk)
            .where(eq(PrepTalk.mockId, params.interviewId));
        setInterviewData(result[0]);
    };

    const handleEnableWebcam = () => {
        setWebcamEnable(true);
        localStorage.setItem('webcamEnabled', 'true'); // Save the webcam state
    };

    return (
        <div className='my-10 flex flex-col items-center'>
            <h2 className='font-bold text-3xl mb-8 text-center'>Let's Get Started</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-start w-full max-w-4xl'>
                <div className='flex flex-col items-center'>
                    {webcamEnable ? (
                        <Webcam
                            onUserMedia={() => setWebcamEnable(true)}
                            onUserMediaError={() => setWebcamEnable(false)}
                            mirrored={true}
                            className="rounded-lg border shadow-lg"
                            style={{ width: '100%', height: 'auto', maxWidth: '400px' }}
                        />
                    ) : (
                        <div className='flex flex-col items-center'>
                            <WebcamIcon className='h-64 w-full my-7 p-5 bg-secondary rounded-lg border' />
                            <Button className="bg-primary" onClick={handleEnableWebcam}>
                                Enable Webcam and Microphone
                            </Button>
                        </div>
                    )}
                    <Link href={'/dashboard/interview/'+params.interviewId+'/start'}>
                        <Button className='mt-4'>Start Interview</Button>
                    </Link>
                </div>
                
                <div className='flex flex-col gap-6'>
                    {interviewData ? (
                        <div className='bg-white p-6 rounded-lg shadow-lg'>
                            <h2 className='text-lg font-semibold mb-4'>Interview Details</h2>
                            <p className='mb-2'><strong>Job Role/Position:</strong> {interviewData.jobPosition}</p>
                            <p className='mb-2'><strong>Job Description/Tech Stack:</strong> {interviewData.jobDesc}</p>
                            <p><strong>Job Experience:</strong> {interviewData.jobexperience}</p>
                        </div>
                    ) : (
                        <div>Loading interview details...</div>
                    )}
                    
                    <div className='bg-gray-100 p-6 rounded-lg shadow-md'>
                        <div className='flex items-center mb-4'>
                            <Lightbulb className='mr-2 text-yellow-500' />
                            <h2 className='text-yellow-500 text-xl font-semibold'>Information</h2>
                        </div>
                        <p>{process.env.NEXT_PUBLIC_INFORMATION}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InterView;
