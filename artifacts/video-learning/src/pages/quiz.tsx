import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useGetSession, useSubmitQuiz, getGetSessionQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Check, ChevronRight, Loader2, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AnswersMap = Record<number, "A" | "B" | "C" | "D">;

export default function Quiz() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  
  const { data: session, isLoading } = useGetSession(id, {
    query: {
      enabled: !!id,
      queryKey: getGetSessionQueryKey(id),
    }
  });

  const submitQuiz = useSubmitQuiz();

  const questions = useMemo(() => session?.questions || [], [session]);
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((currentQuestionIndex) / questions.length) * 100 : 0;

  const handleSelectOption = (option: "A" | "B" | "C" | "D") => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      const submissionData = Object.entries(answers).map(([qId, selectedOption]) => ({
        questionId: parseInt(qId, 10),
        selectedOption
      }));

      const result = await submitQuiz.mutateAsync({
        id,
        data: { answers: submissionData }
      });

      // Navigate to results with the attempt ID
      // Wouter doesn't have native state passing easily, we'll fetch attempts on the results page or use a query param
      setLocation(`/sessions/${id}/results?attempt=${result.attemptId}`);
    } catch (err) {
      toast({
        title: "Submission failed",
        description: "There was an error submitting your quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold mb-4">No questions found</h2>
        <Button onClick={() => setLocation(`/sessions/${id}`)}>Back to Session</Button>
      </div>
    );
  }

  const selectedOption = answers[currentQuestion.id];
  const isAnswered = !!selectedOption;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-secondary/10">
      {/* Quiz Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
        <Button variant="ghost" size="sm" onClick={() => setLocation(`/sessions/${id}`)} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Exit
        </Button>
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-primary" />
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        <div className="w-20" /> {/* Spacer for alignment */}
      </header>

      {/* Progress Bar */}
      <Progress value={progress} className="h-1 rounded-none bg-secondary" />

      {/* Quiz Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-3xl mx-auto">
        <div className="w-full animate-in slide-in-from-bottom-4 fade-in duration-300" key={currentQuestion.id}>
          
          <div className="mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-semibold uppercase tracking-wider mb-4 border border-accent/20">
              {currentQuestion.topic}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
              {currentQuestion.questionText}
            </h2>
          </div>

          <div className="space-y-3 mt-8">
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const optionText = currentQuestion[`option${opt}` as keyof typeof currentQuestion] as string;
              const isSelected = selectedOption === opt;
              
              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  className={cn(
                    "w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group",
                    isSelected 
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                      : "border-border/60 bg-card hover:border-primary/40 hover:bg-secondary/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                  )}>
                    {opt}
                  </div>
                  <span className={cn("text-lg", isSelected ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {optionText}
                  </span>
                  {isSelected && <Check className="w-5 h-5 text-primary ml-auto" />}
                </button>
              );
            })}
          </div>

        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-card border-t border-border p-6 mt-auto">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handlePrevious} 
            disabled={currentQuestionIndex === 0}
            className="rounded-xl px-6"
          >
            Previous
          </Button>
          
          {isLastQuestion ? (
            <Button 
              size="lg" 
              onClick={handleSubmit} 
              disabled={!isAnswered || submitQuiz.isPending}
              className="rounded-xl px-8 bg-primary text-primary-foreground"
            >
              {submitQuiz.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Quiz"}
            </Button>
          ) : (
            <Button 
              size="lg" 
              onClick={handleNext} 
              disabled={!isAnswered}
              className="rounded-xl px-8"
            >
              Next <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
