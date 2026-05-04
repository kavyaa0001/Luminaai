import { useParams, Link } from "wouter";
import { useGetSessionAttempts, useGetSession, getGetSessionAttemptsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ArrowLeft, History, Trophy, Clock, BrainCircuit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Attempts() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: session, isLoading: sessionLoading } = useGetSession(id, { query: { enabled: !!id } });
  const { data: attempts, isLoading: attemptsLoading } = useGetSessionAttempts(id, {
    query: {
      enabled: !!id,
      queryKey: getGetSessionAttemptsQueryKey(id),
    }
  });

  const isLoading = sessionLoading || attemptsLoading;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      <Link href={`/sessions/${id}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Session
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <History className="w-7 h-7 text-primary" /> Attempt History
          </h1>
          {session && (
            <p className="text-muted-foreground mt-2">
              Showing past quiz attempts for <span className="font-semibold text-foreground">{session.title}</span>
            </p>
          )}
        </div>
        <Link href={`/sessions/${id}/quiz`}>
          <Button className="bg-primary rounded-xl">
            <BrainCircuit className="w-4 h-4 mr-2" /> Retake Quiz
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : attempts?.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border/50 rounded-3xl">
          <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-foreground mb-2">No attempts yet</h3>
          <p className="text-muted-foreground mb-6">You haven't taken the quiz for this session.</p>
          <Link href={`/sessions/${id}/quiz`}>
            <Button size="lg" className="rounded-xl">Start Quiz</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts?.map((attempt, index) => {
            const isLatest = index === 0;
            const isExcellent = attempt.percentage >= 80;
            const isGood = attempt.percentage >= 60 && attempt.percentage < 80;

            return (
              <Card 
                key={attempt.id} 
                className={`overflow-hidden rounded-2xl border ${isLatest ? 'border-primary/30 shadow-md shadow-primary/5' : 'border-border/50'} bg-card`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Left Side - Score */}
                  <div className={`p-6 flex flex-col items-center justify-center min-w-[160px] border-b sm:border-b-0 sm:border-r border-border/50 ${isLatest ? 'bg-primary/5' : 'bg-secondary/10'}`}>
                    <div className={`text-3xl font-bold mb-1 ${isExcellent ? 'text-green-600' : isGood ? 'text-accent' : 'text-destructive'}`}>
                      {Math.round(attempt.percentage)}%
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {attempt.score} / {attempt.totalQuestions}
                    </div>
                  </div>

                  {/* Right Side - Details */}
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {format(new Date(attempt.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                      </div>
                      {isLatest && (
                        <span className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full uppercase tracking-wide">
                          Latest
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Strengths</span>
                        {attempt.strongTopics?.length ? (
                          <div className="text-sm text-foreground truncate">{attempt.strongTopics.join(", ")}</div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">-</div>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Weaknesses</span>
                        {attempt.weakTopics?.length ? (
                          <div className="text-sm text-foreground truncate">{attempt.weakTopics.join(", ")}</div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">-</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
