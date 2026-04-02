"use client";

import { useEffect, useRef, useState } from "react";
import { PrepTalk } from "../../../../../utils/schema";
import { db } from "../../../../../utils/db";
import { eq } from "drizzle-orm";
import dynamic from "next/dynamic";
import QuestionsSection from "./_components/QuestionsSection";
import { Button } from "../../../../../components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CircleStop, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Prevent SSR — react-hook-speech-to-text accesses window at import time
const RecordAns = dynamic(() => import("./_components/RecordAns"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

const StartInterview = ({ params }) => {
  const [interviewData, setInterviewData] = useState();
  const [prepTalks, setPrepTalks] = useState([]);
  const [active, setActive] = useState(0);
  const [ending, setEnding] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const recordAnsRef = useRef();
  const router = useRouter();

  useEffect(() => {
    GetInterviewDetails();
  }, [params.interviewId]);

  const GetInterviewDetails = async () => {
    try {
      const result = await db
        .select()
        .from(PrepTalk)
        .where(eq(PrepTalk.mockId, params.interviewId));

      if (result.length > 0) {
        const raw = result[0].jsonMockResp;
        const cleaned = raw.replace(/^[^{[]*/, "").replace(/[^}\]]*$/, "").trim();
        const valid = cleaned.startsWith("[") ? cleaned : `[${cleaned}]`;
        setPrepTalks(JSON.parse(valid));
        setInterviewData(result[0]);
      }
    } catch (err) {
      console.error("Error fetching interview:", err);
    }
  };

  // Save current answer then move to next question
  const handleNext = async () => {
    setNavigating(true);
    if (recordAnsRef.current) {
      await recordAnsRef.current.saveCurrentAnswer();
    }
    setActive((p) => p + 1);
    setNavigating(false);
  };

  const handlePrev = async () => {
    setNavigating(true);
    if (recordAnsRef.current) {
      await recordAnsRef.current.saveCurrentAnswer();
    }
    setActive((p) => p - 1);
    setNavigating(false);
  };

  const handleEndInterview = async () => {
    setEnding(true);
    if (recordAnsRef.current) {
      await recordAnsRef.current.saveCurrentAnswer();
    }
    router.push("/dashboard/interview/" + interviewData?.mockId + "/feedback");
  };

  const progress = prepTalks.length
    ? Math.round(((active + 1) / prepTalks.length) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur border-b border-border px-5 md:px-20 lg:px-36 py-3">
        <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {active + 1} / {prepTalks.length}
            </span>
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={active === 0 || navigating}
              onClick={handlePrev}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            {active < prepTalks.length - 1 ? (
              <Button
                size="sm"
                onClick={handleNext}
                disabled={navigating}
                className="gap-1"
              >
                {navigating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleEndInterview}
                disabled={ending}
                className="gap-1.5"
              >
                {ending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CircleStop className="h-4 w-4" />
                    End Interview
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 px-5 md:px-20 lg:px-36 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border rounded-2xl p-6 min-h-80"
          >
            <QuestionsSection
              mockInterQuestion={prepTalks}
              active={active}
              onQuestionClick={setActive}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <RecordAns
              ref={recordAnsRef}
              mockInterQuestion={prepTalks}
              active={active}
              interviewData={interviewData}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StartInterview;
