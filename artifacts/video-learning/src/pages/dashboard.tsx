import { useGetDashboardSummary, useGetTopicAnalysis, useGetRecentActivity } from "@workspace/api-client-react";
import { BarChart, Activity, Target, Zap, CheckCircle2, TrendingUp, Clock, BookOpen, AlertCircle, PlayCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: topicAnalysis, isLoading: loadingTopics } = useGetTopicAnalysis();
  const { data: recentActivity, isLoading: loadingActivity } = useGetRecentActivity();

  // Fetch mistakes manually since it's a new endpoint
  const { data: mistakes, isLoading: loadingMistakes } = useQuery({
    queryKey: ['/api/dashboard/mistakes'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/mistakes');
      if (!res.ok) throw new Error('Failed to fetch mistakes');
      return res.json();
    }
  });

  const accuracyData = [
    { name: "Correct", value: summary?.overallAccuracy || 0, color: "#10b981" },
    { name: "Incorrect", value: 100 - (summary?.overallAccuracy || 0), color: "#f43f5e" }
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" /> Learning Insights
          </h1>
          <p className="text-muted-foreground">Track your progress and identify areas for improvement.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            Level 1 Explorer
          </Badge>
        </div>
      </header>

      {/* Top Stats & Accuracy Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            title="Total Sessions" 
            value={summary?.totalSessions} 
            icon={BookOpen} 
            loading={loadingSummary} 
            color="text-blue-500" 
            bg="bg-blue-500/10"
          />
          <StatCard 
            title="Quizzes Taken" 
            value={summary?.totalQuizzesTaken} 
            icon={Target} 
            loading={loadingSummary}
            color="text-accent"
            bg="bg-accent/10"
          />
          <StatCard 
            title="Average Score" 
            value={summary?.averageScore ? `${Math.round(summary.averageScore)}%` : "0%"} 
            icon={TrendingUp} 
            loading={loadingSummary}
            color="text-green-500"
            bg="bg-green-500/10"
          />
        </div>
        
        <Card className="rounded-2xl border-border/50 shadow-sm bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center p-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={accuracyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {accuracyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold">{Math.round(summary?.overallAccuracy || 0)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Topic Analysis */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card">
            <CardHeader className="border-b border-border/50 bg-secondary/20 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" /> Topic Mastery
              </CardTitle>
              <CardDescription>Performance breakdown by specific topics</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTopics ? (
                <div className="p-6 space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : topicAnalysis?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Not enough data yet. Complete some quizzes!</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {topicAnalysis?.map((topic, idx) => (
                    <div key={idx} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-secondary/10 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-foreground truncate pr-4">{topic.topic}</h4>
                          <span className="text-sm font-bold">{Math.round(topic.accuracy)}%</span>
                        </div>
                        <Progress value={topic.accuracy} className={
                          topic.status === 'strong' ? '[&>div]:bg-green-500' :
                          topic.status === 'moderate' ? '[&>div]:bg-accent' : '[&>div]:bg-destructive'
                        } />
                      </div>
                      <div className="sm:w-32 flex flex-col items-start sm:items-end shrink-0">
                        <Badge variant="outline" className={
                          topic.status === 'strong' ? 'border-green-500 text-green-600' :
                          topic.status === 'moderate' ? 'border-accent text-accent' : 'border-destructive text-destructive'
                        }>
                          {topic.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground mt-1">
                          {topic.correctAnswers}/{topic.totalQuestions} correct
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mistakes & Reinforcement */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden bg-card">
            <CardHeader className="border-b border-border/50 bg-destructive/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" /> Revision Required
              </CardTitle>
              <CardDescription>Topics where you made mistakes recently</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingMistakes ? (
                <div className="p-6 space-y-4">
                  {[1,2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : !mistakes || mistakes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No mistakes recorded yet. Keep up the good work!</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {mistakes.map((mistake: any, idx: number) => (
                    <div key={idx} className="p-6 hover:bg-secondary/10 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-foreground mb-1">{mistake.questionText}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">From: {mistake.sessionTitle}</p>
                        </div>
                        {mistake.youtubeUrl && (
                          <a 
                            href={`${mistake.youtubeUrl}${mistake.youtubeUrl.includes('?') ? '&' : '?'}t=${mistake.timestamp || 0}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Watch {mistake.timestamp ? `${Math.floor(mistake.timestamp / 60)}:${String(mistake.timestamp % 60).padStart(2, '0')}` : '0:00'}
                          </a>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                          <p className="text-[10px] uppercase font-bold text-destructive mb-0.5">Your Answer</p>
                          <p className="text-sm font-medium">{mistake.userAnswer}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                          <p className="text-[10px] uppercase font-bold text-green-600 mb-0.5">Correct Answer</p>
                          <p className="text-sm font-medium">{mistake.correctOption}</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-secondary/30 rounded-lg text-xs italic text-muted-foreground">
                        {mistake.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-border/50 shadow-sm bg-card h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <div className="space-y-6 mt-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No recent activity.</div>
              ) : (
                <div className="relative border-l-2 border-border/50 ml-4 space-y-8 mt-2">
                  {recentActivity?.map((activity, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center" />
                      
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground mb-1">
                          {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                        </span>
                        
                        <div className="text-sm text-foreground">
                          {activity.type === 'session_created' && <span>Added new session </span>}
                          {activity.type === 'analysis_done' && <span>Analysis complete for </span>}
                          {activity.type === 'quiz_completed' && <span>Completed quiz on </span>}
                          
                          <Link href={`/sessions/${activity.sessionId}`} className="font-semibold hover:text-primary transition-colors">
                            {activity.sessionTitle}
                          </Link>
                        </div>
                        
                        {activity.type === 'quiz_completed' && activity.percentage !== null && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary rounded-md text-xs font-medium w-fit">
                            Score: <span className={activity.percentage >= 70 ? "text-green-600" : "text-destructive"}>{activity.percentage}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading, color, bg }: any) {
  return (
    <Card className="rounded-2xl border-border/50 shadow-sm bg-card overflow-hidden relative group">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl transition-opacity group-hover:opacity-70 opacity-30 ${bg}`} />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <h3 className="text-3xl font-bold text-foreground">{value || 0}</h3>
            )}
          </div>
          <div className={`p-3 rounded-xl ${bg} ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
