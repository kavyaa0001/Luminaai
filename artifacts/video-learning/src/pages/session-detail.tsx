import { useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetSession, getGetSessionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, BarChart2, CheckCircle2, Clock, BrainCircuit, FileText, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function SessionDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: session, isLoading, error } = useGetSession(id, {
    query: {
      enabled: !!id,
      queryKey: getGetSessionQueryKey(id),
    }
  });

  // Polling if processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session?.status === "processing" || session?.status === "pending") {
      interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session?.status, id, queryClient]);

  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-destructive">Error loading session</h2>
        <Button onClick={() => setLocation("/sessions")} variant="outline" className="mt-4">Back to Sessions</Button>
      </div>
    );
  }

  if (isLoading || !session) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-6">
        <Skeleton className="w-32 h-8" />
        <Skeleton className="w-3/4 h-12" />
        <div className="flex gap-4">
          <Skeleton className="w-24 h-8 rounded-full" />
          <Skeleton className="w-32 h-8 rounded-full" />
        </div>
        <div className="grid md:grid-cols-3 gap-8 mt-10">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="w-full h-40 rounded-2xl" />
            <Skeleton className="w-full h-64 rounded-2xl" />
          </div>
          <Skeleton className="w-full h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isReady = session.status === "ready";
  const isProcessing = session.status === "processing" || session.status === "pending";

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      <Link href="/sessions" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Library
      </Link>

      <div className="flex flex-col md:flex-row gap-6 justify-between items-start mb-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Badge 
              variant={isReady ? "default" : isProcessing ? "secondary" : "destructive"} 
              className="px-3 py-1 text-sm rounded-full"
            >
              {isProcessing && <div className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2 inline-block" />}
              {session.status.toUpperCase()}
            </Badge>
            {session.youtubeUrl && (
              <a href={session.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
            {session.title || "Untitled Session"}
          </h1>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(session.keyTopics) ? session.keyTopics : (typeof session.keyTopics === 'string' ? JSON.parse(session.keyTopics || '[]') : [])).map((topic: string, i: number) => (
              <span key={i} className="px-3 py-1.5 bg-secondary/60 border border-secondary text-secondary-foreground text-sm rounded-lg font-medium">
                {topic}
              </span>
            ))}
          </div>
        </div>

        {isReady && (
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Button 
              size="lg" 
              className="rounded-xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              onClick={() => setLocation(`/sessions/${session.id}/quiz`)}
            >
              <BrainCircuit className="w-5 h-5 mr-2" /> Start Quiz
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-xl border-border bg-card"
              onClick={() => setLocation(`/sessions/${session.id}/attempts`)}
            >
              <BarChart2 className="w-5 h-5 mr-2" /> History
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Summary Section */}
          <section className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground">
              <FileText className="w-5 h-5 text-primary" /> Key Takeaways
            </h2>
            {isProcessing ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/6" />
                <p className="text-sm text-muted-foreground animate-pulse mt-4">AI is analyzing the video transcript...</p>
              </div>
            ) : session.summary ? (
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                {session.summary.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 last:mb-0">{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No summary available.</p>
            )}
          </section>

          {/* Transcript (if available and needed) */}
          {session.transcript && (
            <section className="bg-secondary/20 rounded-3xl p-6 md:p-8">
              <h2 className="text-lg font-bold mb-4">Transcript Excerpt</h2>
              <div className="h-48 overflow-y-auto pr-4 text-sm text-muted-foreground leading-relaxed space-y-2 font-mono scrollbar-thin">
                {session.transcript}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-xl shadow-primary/10 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <h3 className="font-semibold text-primary-foreground/80 mb-6">Quiz Details</h3>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  <span>Questions</span>
                </div>
                <span className="font-bold text-xl">{session.questionCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  <span>Est. Time</span>
                </div>
                <span className="font-bold text-xl">{Math.max(2, Math.round((session.questionCount || 0) * 1.5))} min</span>
              </div>
            </div>
            
            {!isReady && (
              <div className="mt-6 pt-4 border-t border-primary-foreground/20 text-sm text-primary-foreground/80">
                Quiz generation in progress...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
