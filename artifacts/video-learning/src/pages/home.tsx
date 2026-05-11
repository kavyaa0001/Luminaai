import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Youtube, Upload, ArrowRight, PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { saveSession, getSessions } from "../lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL").refine(
    (url) => url.includes("youtube.com") || url.includes("youtu.be"),
    { message: "Must be a valid YouTube URL" }
  ),
  questionCount: z.number().min(10).max(40).default(10),
  videoType: z.enum(["short", "tutorial"]).default("short"),
});

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const sessions = getSessions();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      url: "",
      questionCount: 10,
      videoType: "short"
    },
  });

  const videoType = form.watch("videoType");
  const currentCount = form.watch("questionCount");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsProcessing(true);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: values.url,
          questionCount: values.videoType === "short" ? 10 : values.questionCount,
        })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error("Server took too long to respond or returned an invalid response.");
      }
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze video");
      }
      
      const newSession = saveSession({
        youtubeUrl: data.data.youtubeUrl,
        summary: data.data.summary,
        keyTopics: data.data.keyTopics,
        questions: data.data.questions
      });
      
      toast({
        title: "Video submitted!",
        description: `Analysis complete. Generated ${data.data.questions.length} questions.`,
      });
      
      setLocation(`/sessions/${newSession.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Please check your URL and try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const recentSessions = sessions.slice(0, 3);

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
        <div className="bg-card p-6 rounded-2xl shadow-xl border border-border/50 max-w-2xl mx-auto relative overflow-hidden text-left">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-sm font-semibold mb-2 block">YouTube Link</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <FormField
                  control={form.control}
                  name="videoType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <Label className="text-sm font-semibold">Video Length</Label>
                      <FormControl>
                        <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 rounded-xl">
                            <TabsTrigger value="short" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Short (10-30m)</TabsTrigger>
                            <TabsTrigger value="tutorial" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Tutorial (Long)</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {videoType === "tutorial" && (
                  <FormField
                    control={form.control}
                    name="questionCount"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <div className="flex justify-between">
                          <Label className="text-sm font-semibold">Questions: {currentCount}</Label>
                          <span className="text-xs text-muted-foreground">Max 40</span>
                        </div>
                        <FormControl>
                          <Slider
                            min={10}
                            max={40}
                            step={5}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="py-2"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                {videoType === "short" && (
                  <div className="bg-secondary/20 rounded-xl p-4 border border-border/50">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Optimized for quick learning. We'll generate <strong>10 high-impact MCQs</strong> covering the most important concepts.
                    </p>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full py-7 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-bold text-lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Analyzing Video...</>
                ) : (
                  <><ArrowRight className="mr-2 h-6 w-6" /> Start Learning</>
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
                    <Badge variant="default" className="capitalize">
                      Ready
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2 text-foreground group-hover:text-primary transition-colors">
                    {session.title || "Untitled Session"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {session.questions?.length || 10} questions available
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
