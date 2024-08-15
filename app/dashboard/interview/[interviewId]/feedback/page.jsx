"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../../../utils/db";
import { UserAnswer } from "../../../../../utils/schema";
import { eq } from "drizzle-orm";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../../../components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import { useRouter } from "next/navigation";

const Feedback = ({ params }) => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const router = useRouter();

  useEffect(() => {
    GetFeedback();
  }, []);

  const GetFeedback = async () => {
    try {
      const result = await db
        .select()
        .from(UserAnswer)
        .where(eq(UserAnswer.mockIdRef, params.interviewId))
        .orderBy(UserAnswer.id);

      console.log(result);
      setFeedbackList(result);

      // Calculate the average rating
      const totalRating = result.reduce((sum, item) => sum + parseFloat(item.rating), 0);
      const average = (totalRating / result.length).toFixed(1); // Keep one decimal point
      setAverageRating(average);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  return (
    <div className="p-10 min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md">
       
        {feedbackList.length === 0 ? (
          <h2 className="font-bold text-xl text-gray-500">No Interview Record Found</h2>
        ) : (
          <>
           <h2 className="text-4xl font-extrabold text-green-600 mb-4">Congratulations!</h2>
           <h2 className="font-semibold text-2xl text-gray-800">Here is your Interview Feedback</h2>
            <h2 className="text-xl text-gray-600 my-4">
              Your overall interview rating:{" "}
              <strong className="text-green-700">{averageRating}/10</strong>
            </h2>
            <h2 className="text-md text-gray-500 mb-6">
              Find the correct answer along with your answer and feedback for improvement below:
            </h2>
            {feedbackList.map((item, index) => (
              <Collapsible className="mt-5" key={index} defaultOpen={false}>
                <CollapsibleTrigger className="p-4 bg-blue-100 rounded-lg my-2 text-left flex justify-between items-center w-full shadow-sm hover:bg-blue-200 transition-all duration-200">
                  <span className="font-semibold text-gray-800">{item.question}</span>
                  <ChevronsUpDown className="h-5 w-5 text-gray-600" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-gray-100 rounded-lg mt-2 border border-gray-200">
                  <div className="space-y-4">
                    <h2 className="text-red-700 font-medium">
                      <strong>Rating:</strong> {item.rating}
                    </h2>
                    <p className="p-4 border rounded-lg bg-red-50 text-red-950 shadow-sm">
                      <strong>Your Answer:</strong> {item.userAns}
                    </p>
                    <p className="p-4 border rounded-lg bg-green-50 text-green-900 shadow-sm">
                      <strong>Correct Answer:</strong> {item.correctAns}
                    </p>
                    <p className="p-4 border rounded-lg bg-blue-50 text-blue-700 shadow-sm">
                      <strong>Feedback:</strong> {item.feedback}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </>
        )}
      </div>
      <div className="mt-8">
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg shadow-md transition duration-200"
          onClick={() => router.replace("/dashboard")}
        >
          Go Home
        </Button>
      </div>
    </div>
  );
};

export default Feedback;
