import { useLocation, useParams, useSearch } from "wouter";
import { useGetSessionAttempts, useGetSession, getGetSessionAttemptsQueryKey } from "@workspace/api-client-react";
import { useMemo } from "react";
import { Trophy, ArrowRight, CheckCircle2, XCircle, ChevronLeft, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function QuizResults() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const attemptId = searchParams.get("attempt") ? parseInt(searchParams.get("attempt")!, 10) : null;
  const [, setLocation] = useLocation();

  const { data: session } = useGetSession(id, { query: { enabled: !!id } });
  const { data: attempts, isLoading } = useGetSessionAttempts(id, {
    query: {
      enabled: !!id,
      queryKey: getGetSessionAttemptsQueryKey(id),
    }
  });

  // Find the specific attempt, or default to the most recent one
  const result = useMemo(() => {
    if (!attempts || attempts.length === 0) return null;
    if (attemptId) {
      return attempts.find(a => a.id === attemptId) || attempts[0];
    }
    return attempts[0]; // assumes sorted desc by backend, if not we could sort here
  }, [attempts, attemptId]);

  if (isLoading) {
    return <div className="p-10 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!result || !session) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold mb-4">Results not found</h2>
        <Button onClick={() => setLocation(`/sessions/${id}`)}>Back to Session</Button>
      </div>
    );
  }

  const isExcellent = result.percentage >= 80;
  const isGood = result.percentage >= 60 && result.percentage < 80;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
      <Button variant="ghost" onClick={() => setLocation(`/sessions/${id}`)} className="mb-6 -ml-4 text-muted-foreground">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Session
      </Button>

      {/* Score Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center border-8 relative z-10 bg-card shadow-xl",
            isExcellent ? "border-green-500 text-green-500" : isGood ? "border-accent text-accent" : "border-destructive text-destructive"
          )}>
            <span className="text-4xl font-bold">{Math.round(result.percentage)}%</span>
          </div>
          <div className="absolute -top-2 -right-2 bg-background rounded-full p-2 shadow-md z-20">
            <Trophy className={cn("w-6 h-6", isExcellent ? "text-green-500" : isGood ? "text-accent" : "text-destructive")} />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isExcellent ? "Outstanding Work!" : isGood ? "Good Job!" : "Keep Practicing!"}
        </h1>
        <p className="text-muted-foreground text-lg">
          You scored {result.score} out of {result.totalQuestions} correctly on <span className="font-semibold text-foreground">{session.title}</span>
        </p>
      </div>

      {/* Topic Analysis Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="border-border/50 shadow-sm bg-card rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-green-600 mb-4 font-semibold">
              <Target className="w-5 h-5" /> Strong Topics
            </div>
            {result.strongTopics && result.strongTopics.length > 0 ? (
              <ul className="space-y-3">
                {result.strongTopics.map((topic, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No specific strengths identified yet. Keep going!</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-accent mb-4 font-semibold">
              <Lightbulb className="w-5 h-5" /> Focus Areas
            </div>
            {result.weakTopics && result.weakTopics.length > 0 ? (
              <ul className="space-y-3">
                {result.weakTopics.map((topic, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5 mx-1" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Great job! No major weaknesses detected.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button 
          size="lg" 
          variant="outline" 
          className="rounded-xl px-8 border-border"
          onClick={() => setLocation(`/sessions/${id}/quiz`)}
        >
          Retake Quiz
        </Button>
        <Button 
          size="lg" 
          className="rounded-xl px-8 bg-primary"
          onClick={() => setLocation("/dashboard")}
        >
          View Dashboard <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* 
        Note: The actual question breakdown would go here if `QuizResult` returned the detailed answers. 
        Based on the types, QuizResult does have `answers` with isCorrect, selectedOption, correctOption.
        If we want to show it, we can map over `result.answers`. However, wait, the API type `QuizResult` 
        doesn't have `answers` in `QuizAttempt`, but it does in `QuizResult` response from mutation.
        Since we fetched from `useGetSessionAttempts` which returns `QuizAttempt[]`, we don't have the answers detail here.
        To keep it clean, we just show the summary.
      */}
    </div>
  );
}
