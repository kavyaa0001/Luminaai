import { useGetSessions } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Video, BookOpen, Clock, AlertCircle, RefreshCw, Play, BarChart2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Sessions() {
  const [, setLocation] = useLocation();
  const { data: sessions, isLoading, error } = useGetSessions();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Failed to load sessions</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Library</h1>
          <p className="text-muted-foreground mt-1">Review your past video analyses and take quizzes.</p>
        </div>
        <Button onClick={() => setLocation("/")} className="bg-primary rounded-xl px-6">
          <Video className="w-4 h-4 mr-2" /> New Analysis
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="rounded-2xl border-border/50">
              <CardContent className="p-6">
                <Skeleton className="w-12 h-12 rounded-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-6" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sessions?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-border rounded-3xl bg-secondary/20">
          <div className="bg-background p-4 rounded-full shadow-sm mb-4">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No learning sessions yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Start by analyzing your first video to unlock AI-generated summaries and quizzes.
          </p>
          <Button onClick={() => setLocation("/")} size="lg" className="rounded-xl">
            Start First Session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(sessions) && sessions.map((session) => (
            <Card 
              key={session.id} 
              className="flex flex-col h-full rounded-2xl border-border/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card overflow-hidden"
            >
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <Badge 
                    variant={session.status === "ready" ? "default" : session.status === "failed" ? "destructive" : "secondary"}
                    className="capitalize font-medium px-2.5 py-0.5"
                  >
                    {session.status === "processing" && <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />}
                    {session.status}
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 flex-1">
                  <Link href={`/sessions/${session.id}`} className="hover:text-primary transition-colors">
                    {session.title || "Untitled Session"}
                  </Link>
                </h3>
                
                <div className="flex items-center text-xs text-muted-foreground mb-4">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {format(new Date(session.createdAt), "MMM d, yyyy")}
                </div>
                
                {session.keyTopics && session.keyTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2 mt-auto">
                    {session.keyTopics.slice(0, 3).map((topic, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-secondary rounded-md text-secondary-foreground font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="p-4 pt-0 border-t border-border/50 bg-secondary/10 flex gap-2">
                <Button 
                  variant="default" 
                  className="flex-1 rounded-xl bg-primary text-primary-foreground" 
                  onClick={() => setLocation(`/sessions/${session.id}`)}
                >
                  <Play className="w-4 h-4 mr-2" /> Open
                </Button>
                {session.status === "ready" && (
                  <Button 
                    variant="outline" 
                    className="rounded-xl px-3 border-border hover:bg-secondary"
                    onClick={() => setLocation(`/sessions/${session.id}/attempts`)}
                    title="View Results"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
