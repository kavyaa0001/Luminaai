import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Youtube, Upload, ArrowRight, PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useCreateSession, useAnalyzeSession, useGetSessions, getGetSessionsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL").includes("youtube.com", { message: "Must be a YouTube URL" }).or(z.string().includes("youtu.be", { message: "Must be a YouTube URL" })),
});

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: sessions } = useGetSessions();
  const createSession = useCreateSession();
  const analyzeSession = useAnalyzeSession();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsProcessing(true);
      // Create session
      const newSession = await createSession.mutateAsync({
        data: {
          title: "New Video Analysis",
          youtubeUrl: values.url,
        }
      });
      
      // Trigger analysis immediately
      await analyzeSession.mutateAsync({ id: newSession.id });
      
      toast({
        title: "Video submitted!",
        description: "We are analyzing the content. You can start the quiz shortly.",
      });
      
      queryClient.invalidateQueries({ queryKey: getGetSessionsQueryKey() });
      setLocation(`/sessions/${newSession.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to submit video",
        description: "Please check your URL and try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const recentSessions = Array.isArray(sessions) ? sessions.slice(0, 3) : [];

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-10 space-y-12 animate-in fade-in zoom-in duration-500">
      
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto mt-8 md:mt-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground font-medium text-sm mb-6 border border-accent/20">
          <SparklesIcon className="w-4 h-4 text-accent" />
          <span>Transform watching into active learning</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
          Master any topic with your <br className="hidden md:block"/>
          <span className="text-primary">AI Video Tutor</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Paste a YouTube link and we'll instantly generate a comprehensive study guide, key takeaways, and an interactive quiz to test your understanding.
        </p>

        {/* Input Form */}
        <div className="bg-card p-4 rounded-2xl shadow-xl border border-border/50 max-w-2xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <div className="relative">
                        <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          placeholder="Paste a YouTube video URL..." 
                          className="pl-12 py-6 text-base bg-secondary/30 border-transparent focus-visible:bg-background rounded-xl"
                          disabled={isProcessing}
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                size="lg" 
                className="py-6 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing</>
                ) : (
                  <><SparklesIcon className="mr-2 h-5 w-5" /> Analyze Video</>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </section>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <section className="pt-8 border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Jump Back In</h2>
            <Button variant="ghost" onClick={() => setLocation("/sessions")} className="text-primary">
              View all <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentSessions.map(session => (
              <Card 
                key={session.id} 
                className="group cursor-pointer hover:shadow-md transition-all duration-300 border-border/50 bg-card hover:bg-secondary/20 rounded-2xl overflow-hidden"
                onClick={() => setLocation(`/sessions/${session.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-6 h-6" />
                    </div>
                    <Badge variant={session.status === "ready" ? "default" : session.status === "processing" ? "secondary" : "outline"} className="capitalize">
                      {session.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2 text-foreground group-hover:text-primary transition-colors">
                    {session.title || "Untitled Session"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {session.questionCount} questions available
                  </p>
                  
                  {session.keyTopics && session.keyTopics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {session.keyTopics.slice(0, 2).map((topic, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-secondary rounded-md text-secondary-foreground font-medium">
                          {topic}
                        </span>
                      ))}
                      {session.keyTopics.length > 2 && (
                        <span className="text-xs px-2 py-1 bg-secondary rounded-md text-secondary-foreground">
                          +{session.keyTopics.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
