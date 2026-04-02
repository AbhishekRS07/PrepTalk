"use client";
import { Volume2 } from "lucide-react";
import { Button } from "../../../../../../components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const QuestionsSection = ({ mockInterQuestion, active, onQuestionClick }) => {
  const textToSpeech = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(speech);
    }
  };

  if (!mockInterQuestion?.length) return null;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Question pills */}
      <div className="flex flex-wrap gap-2">
        {mockInterQuestion.map((_, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(index)}
            className={cn(
              "h-8 w-8 rounded-full text-xs font-semibold transition-all",
              active === index
                ? "bg-primary text-primary-foreground shadow-md scale-110"
                : "bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary"
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question text */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Question {active + 1} of {mockInterQuestion.length}
            </p>
            <h2 className="text-lg font-medium leading-relaxed">
              {mockInterQuestion[active]?.question}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => textToSpeech(mockInterQuestion[active]?.question)}
            >
              <Volume2 className="h-4 w-4" />
              Read aloud
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Note */}
      <div className="bg-accent rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
        <span className="font-semibold text-accent-foreground">Note: </span>
        {process.env.NEXT_PUBLIC_QUESTION_NOTE}
      </div>
    </div>
  );
};

export default QuestionsSection;
