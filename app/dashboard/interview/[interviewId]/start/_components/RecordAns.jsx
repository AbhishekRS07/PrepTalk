"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '../../../../../../components/ui/button';
import WebcamComponent from 'react-webcam';
import useSpeechToText from 'react-hook-speech-to-text';
import { toast } from 'sonner';
import { chatSession } from '../../../../../../lib/GeminiAIModal';
import { db } from '../../../../../../utils/db';
import { UserAnswer } from '../../../../../../utils/schema';
import { useUser } from '@clerk/nextjs';
import moment from 'moment';

const RecordAns = ({mockInterQuestion,active,interviewData}) => {
    const [userAnswer, setUserAnswer] = useState(''); 
    const{user} = useUser();
    const[loading, setLoading]= useState(false);
    const {
        error,
        interimResult,
        isRecording,
        results,
        setResults,
        startSpeechToText,
        stopSpeechToText,
    } = useSpeechToText({
        continuous: true,
        useLegacyResults: false
    });

    const [webcamEnabled, setWebcamEnabled] = useState(false);

    useEffect(() => {
        // Check local storage for webcam state
        const savedWebcamState = localStorage.getItem('webcamEnabled');
        if (savedWebcamState === 'true') {
            setWebcamEnabled(true);
        }
    }, []);

    useEffect(() => {
        // Safely handle results updates
        if (results) {
            const newTranscript = results.map(result => result.transcript).join(' ');
            setUserAnswer(prevAns => prevAns + ' ' + newTranscript);
        }
    }, [results]);

    // useEffect(() => {
    //     console.log('Checking if UpdateAnswer should run:', { isRecording, userAnswer });
    //   if(!isRecording&&userAnswer.length>10){
    //     UpdateAnswer()
    //   }
    // }, [userAnswer])
    

    // Function to start recording safely
    const handleStartRecording = () => {
        if (!isRecording) {
            startSpeechToText();
        }
    };

    // Function to stop recording safely
    const handleStopRecording = async () => {
        if (isRecording) {
            setLoading(true);
            await stopSpeechToText(); // Ensure the recording stops before proceeding
            
            console.log('Recording stopped. isRecording:', isRecording);
            
            // Now check the condition to run UpdateAnswer
            if (userAnswer.length > 10) {
                console.log('Calling UpdateAnswer from handleStopRecording');
                UpdateAnswer();
            }
            
            setLoading(false);
        }
    };
    const UpdateAnswer = async () => {
        try {
            const feedbackPrompt = "Question" + mockInterQuestion[active]?.question + "User Answer:" + userAnswer + 
            ", Depends on question and answer for the given interview question" + 
            "please give us a rating for the answer and feedback as an area of improvement if any" + 
            "In just 3 to 5 lines to improve it in JSON format with rating field and feedback field";
    
            const result = await chatSession.sendMessage(feedbackPrompt);
            const mockJsonResp = (await result.response.text()).replace('```json', '').replace('```', '');
    
            console.log("Raw AI Response:", mockJsonResp);
    
            const JsonFeedbackResp = JSON.parse(mockJsonResp);
            
            console.log("Parsed AI Feedback:", JsonFeedbackResp);
    
            const resp = await db.insert(UserAnswer)
                .values({
                    mockIdRef: interviewData?.mockId,
                    question: mockInterQuestion[active]?.question,
                    correctAns: mockInterQuestion[active]?.answer,
                    userAns: userAnswer,
                    feedback: JsonFeedbackResp?.feedback,
                    rating: JsonFeedbackResp?.rating,
                    userEmail: user?.primaryEmailAddress?.emailAddress,
                    createdAt: moment().format('DD-MM-yyyy')
                });
    
            console.log("Database Response:", resp);
    
            if (resp) {
                toast('Answer saved successfully');
            }
    
            setUserAnswer('');
            setResults([]) 
        } catch (error) {
            setResults([])
            console.error("Error in UpdateAnswer:", error);
            toast('Failed to save answer');
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div>
            <div className='flex flex-col justify-center items-center my-20 bg-black rounded-lg p-5 relative'>
                {webcamEnabled ? (
                    <WebcamComponent
                        mirrored={true}
                        style={{
                            height: 300,
                            width: '100%',
                            zIndex: 10,
                        }}
                    />
                ) : (
                    <div className='relative w-full h-72 bg-slate-200 flex justify-center items-center rounded-lg'>
                        <Image 
                            src='/webcam.png' 
                            alt='Webcam' 
                            width={200} 
                            height={200} 
                            className='absolute'
                        />
                    </div>
                )}
            </div>
            <div className='mt-4'>
                <Button variant="outline" onClick={isRecording ? handleStopRecording : handleStartRecording}>
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
            </div>
            {/* <Button onClick={() => console.log(userAnswer)}>Show</Button> */}
        </div>
    );
};

export default RecordAns;
