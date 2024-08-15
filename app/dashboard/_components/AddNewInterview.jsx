"use client";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../../components/ui/dialog"; 
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { chatSession } from "../../../lib/GeminiAIModal";
import { PrepTalk } from "../../../utils/schema";
import { LoaderCircle } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { db } from "../../../utils/db"
import { useRouter } from "next/navigation";
const AddNewInterview = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const[jobPosition, setJobPosition] = useState();
  const[jobDesc, setJobDesc] = useState();
  const[jobExperience, setJobExperience] = useState();
  const[loading, setLoading] = useState(false);
  const [jsonResponse, setJsonResponse] = useState();
  const {user} = useUser();
 const route = useRouter()
  const onSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
  
    let cleanedResponse = "";
    try {
      console.log(jobDesc, jobExperience, jobPosition);
  
      const InputPrompt = `Job position: ${jobPosition}, Job Description: ${jobDesc}, Years of Experience: ${jobExperience}. Depending upon the job position, job description, and the years of experience, generate ${process.env.NEXT_PUBLIC_INTERVIEW_OUESTION_COUNT} interview questions along with the answers in JSON format. Provide "question" and "answer" fields in JSON.`;
  
      const result = await chatSession.sendMessage(InputPrompt);
      const rawResponse = await result.response.text();
  
      // Clean up the response
      cleanedResponse = rawResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim(); // Removes any leading/trailing whitespace
  
      // Attempt to parse the cleaned response
      const parsedResponse = JSON.parse(cleanedResponse);
      console.log(parsedResponse);
    } catch (error) {
      console.error("Error parsing the JSON response:", error);
    } finally {
      setJsonResponse(cleanedResponse);

      if (cleanedResponse) {
        const resp = await db.insert(PrepTalk)
          .values({
            mockId: uuidv4(),
            jsonMockResp: cleanedResponse,
            jobPosition: jobPosition,
            jobDesc: jobDesc,
            jobexperience: jobExperience,
            createdBy: user?.primaryEmailAddress.emailAddress,
            createdAt: moment().format('DD-MM-yyyy')
          })
          .returning({ mockId: PrepTalk.mockId });
        console.log("Inserted ID:", resp);
        if(resp){
          setOpenDialog(false)
          route.push('/dashboard/interview'+resp[0]?.mockId)
        }
      } else {
        console.log("error");
      }
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        className='p-10 border rounded-lg bg-secondary hover:scale-105 hover:shadow-md cursor-pointer transition-all' 
        onClick={() => setOpenDialog(true)}
      >
        <h2 className='text-lg'>+ Add New</h2>
      </div>
      <Dialog open={openDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Tell us more about your job interview</DialogTitle>
            <DialogDescription>
              <form onSubmit={onSubmit}>
                <div>
                  <h2>Add details about your job position/role, Job description</h2>
                  <div className="mt-7 my-2">
                    <label>Job Role/Job Position</label>
                    <Input placeholder="Ex. Full Stack Developer" required
                      onChange={(event)=>setJobPosition(event.target.value)}
                    />
                  </div>
                  <div className="my-3">
                    <label>Job Description/Tech Stack (In Short)</label>
                    <Textarea placeholder="Ex. React, Node, Next, Sql" required
                      onChange={(event)=>setJobDesc(event.target.value)} />
                  </div>
                  <div className="my-3">
                    <label>Years of Experience</label>
                    <Input type="number" max="40" placeholder="Ex. 3" required
                      onChange={(event)=>setJobExperience(event.target.value)} />
                  </div>
                </div>
                <div className="flex gap-5 justify-end">
                  <Button type="button" variant="ghost" onClick={() => setOpenDialog(false)}>Cancel</Button>
                  <Button disabled={loading} type="submit">
                    {loading ? (
                      <>
                        <LoaderCircle className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Start Interview"
                    )}
                  </Button>
                </div>
              </form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewInterview;
