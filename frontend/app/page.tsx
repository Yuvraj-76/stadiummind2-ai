"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { FifaLogo } from "@/components/fifa-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  Sparkles,
  Users,
  Zap,
  HeartHandshake,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Home() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden transition-colors duration-300">
      {/* Background Glows */}
      <div className="bg-primary/10 pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-[40%] right-1/4 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

      {/* Navigation */}
      <header className="glass border-border/50 sticky top-0 z-50 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="group focus-ring flex items-center space-x-2 rounded-lg p-1"
              aria-label="StadiumOS Logo Home"
            >
              <FifaLogo className="h-8 w-8 transition-transform duration-300 group-hover:scale-110" />
              <span className="from-foreground via-foreground/90 to-muted-foreground bg-gradient-to-r bg-clip-text text-xl font-bold tracking-tight text-transparent">
                StadiumOS
              </span>
            </Link>
          </div>

          <nav
            className="hidden items-center space-x-8 md:flex"
            aria-label="Main Navigation"
          >
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground focus-ring rounded text-sm font-medium transition-colors duration-200"
            >
              Features
            </Link>
            <Link
              href="#architecture"
              className="text-muted-foreground hover:text-foreground focus-ring rounded text-sm font-medium transition-colors duration-200"
            >
              Architecture
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="glow" size="sm" asChild>
              <Link href="/login">Launch App</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto flex flex-col items-center px-4 py-20 text-center md:px-8 md:py-32">
        {/* Glow Badge */}
        <div className="border-primary/30 bg-primary/5 text-primary mb-8 inline-flex animate-pulse items-center space-x-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          <span>FIFA World Cup 2026 Edition</span>
        </div>

        <h1 className="mb-6 max-w-5xl text-4xl leading-[1.1] font-extrabold tracking-tight md:text-6xl lg:text-7xl">
          GenAI-Powered Intelligence for{" "}
          <span className="from-primary bg-gradient-to-r via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Stadium Operations
          </span>
        </h1>

        <p className="text-muted-foreground mb-10 max-w-3xl text-lg leading-relaxed md:text-xl">
          StadiumOS streamlines operations and transforms the matchday
          experience for Fans, Volunteers, and Organizers at the World Cup 2026.
          Scalable, secure, and production-ready.
        </p>

        <div className="flex w-full max-w-md flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            variant="glow"
            size="lg"
            className="h-12 w-full text-base font-semibold sm:w-auto"
            asChild
          >
            <Link href="/login">Launch Platform</Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="border-border/50 relative z-10 container mx-auto scroll-mt-16 border-t px-4 py-20 md:px-8"
      >
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Designed for Every Matchday Role
          </h2>
          <p className="text-muted-foreground">
            A unified foundation optimized to solve real-world tournament
            operational bottlenecks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Card 1: Fans */}
          <Card className="bg-card/50 border-border/60 hover:border-primary/40 flex h-full flex-col backdrop-blur transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Intelligent Fan Hub
              </CardTitle>
              <CardDescription>
                Improving the global fan matchday journey
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul
                className="text-muted-foreground space-y-3 text-sm"
                aria-label="Fan features list"
              >
                <li className="flex items-start">
                  <Zap className="text-primary mt-0.5 mr-2 h-4 w-4 shrink-0" />
                  <span>Real-time stadium transit and entry queue times.</span>
                </li>
                <li className="flex items-start">
                  <Zap className="text-primary mt-0.5 mr-2 h-4 w-4 shrink-0" />
                  <span>
                    Smart waypoint guides mapping seat gates and concessions.
                  </span>
                </li>
                <li className="flex items-start">
                  <Zap className="text-primary mt-0.5 mr-2 h-4 w-4 shrink-0" />
                  <span>
                    Multi-lingual assistant offering dynamic tournament FAQs.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Card 2: Volunteers */}
          <Card className="bg-card/50 border-border/60 hover:border-primary/40 flex h-full flex-col backdrop-blur transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Volunteer Planner
              </CardTitle>
              <CardDescription>
                Real-time updates for on-ground assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul
                className="text-muted-foreground space-y-3 text-sm"
                aria-label="Volunteer features list"
              >
                <li className="flex items-start">
                  <Zap className="text-primary mt-0.5 mr-2 h-4 w-4 shrink-0" />
                  <span>Personalized tasks with automated localization.</span>
                </li>
                <li className="flex items-start">
                  <Zap className="text-primary mt-0.5 mr-2 h-4 w-4 shrink-0" />
                  <span>
                    Interactive checklists for arena readiness checklists.
                  </span>
                </li>
                <li className="flex items-start">
                  <Zap className="text-primary mt-0.5 mr-2 h-4 w-4 shrink-0" />
                  <span>
                    Incident report templates for security or crowd concerns.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Card 3: Organizers */}
          <Card className="bg-card/50 border-border/60 hover:border-primary/40 flex h-full flex-col backdrop-blur transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20">
                <Shield className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Operations Dashboard
              </CardTitle>
              <CardDescription>
                Holistic arena overview for organizers
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul
                className="text-muted-foreground space-y-3 text-sm"
                aria-label="Organizer features list"
              >
                <li className="flex items-start">
                  <Zap className="text-primary mt-0.5 mr-2 h-4 w-4 shrink-0" />
                  <span>
                    Unified metrics panel reflecting stadium fill percentage.
                  </span>
                </li>
                <li className="flex items-start">
                  <Zap className="text-primary mt-0.5 mr-2 h-4 w-4 shrink-0" />
                  <span>
                    Dynamic resource dispatcher linking zones and staffing
                    levels.
                  </span>
                </li>
                <li className="flex items-start">
                  <Zap className="text-primary mt-0.5 mr-2 h-4 w-4 shrink-0" />
                  <span>Predictive models monitoring egress bottlenecks.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border/50 bg-card/20 relative z-10 mt-auto border-t py-8">
        <div className="text-muted-foreground container mx-auto flex flex-col items-center justify-between px-4 text-sm md:flex-row md:px-8">
          <p>
            © 2026 StadiumOS. Prepared for FIFA World Cup 2026 stadium
            operations.
          </p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <Link
              href="#features"
              className="hover:text-foreground focus-ring rounded transition-colors"
            >
              Features
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground focus-ring rounded transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
