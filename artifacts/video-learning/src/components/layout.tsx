import { Link, useLocation } from "wouter";
import { BookOpen, Home, ListVideo, LayoutDashboard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/sessions", label: "My Sessions", icon: ListVideo },
    { href: "/dashboard", label: "Insights", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background w-full">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border shrink-0 md:h-screen sticky top-0 z-10 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">
            Lumina
          </span>
        </div>
        
        <nav className="flex-1 px-4 pb-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 mx-4 mb-6 rounded-2xl bg-secondary/50 border border-secondary text-center">
          <div className="inline-flex bg-accent/20 p-2 rounded-full text-accent mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="font-semibold text-sm mb-1 text-foreground">AI Tutor Active</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your personal learning assistant is ready to analyze your videos.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden min-h-full flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
