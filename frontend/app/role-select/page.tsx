"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FifaLogo } from "@/components/fifa-logo";
import { Trophy, Users, ShieldAlert, HeartHandshake, ArrowRight } from "lucide-react";

export default function RoleSelect() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const userSessionStr = localStorage.getItem("stadiumos_user");
    if (!userSessionStr) {
      router.push("/login");
      return;
    }
    try {
      const userSession = JSON.parse(userSessionStr);
      if (!userSession || !userSession.authenticated) {
        router.push("/login");
        return;
      }
      setAuthorized(true);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  const roles = [
    {
      title: "Fan Portal",
      description: "Access stadium assistance, interactive maps, crowd-aware route planning, seat guides, and food recommendations.",
      icon: HeartHandshake,
      href: "/fan",
      badge: "Fans & Spectators",
      themeColor: "from-blue-600 to-emerald-500",
      textColor: "text-blue-400",
      buttonText: "Enter Fan Copilot",
    },
    {
      title: "Volunteer Dashboard",
      description: "Manage assigned tasks, access standard operating procedures (SOPs), report incidents, and utilize translation tools.",
      icon: Users,
      href: "/volunteer",
      badge: "Venue Staff & Volunteers",
      themeColor: "from-amber-500 to-orange-600",
      textColor: "text-amber-400",
      buttonText: "Access Tasks",
    },
    {
      title: "Organizer Console",
      description: "View live stadium analytics, track crowd density heatmaps, manage incidents, and generate broadcast announcements.",
      icon: ShieldAlert,
      href: "/organizer",
      badge: "Stadium Operations Command",
      themeColor: "from-purple-600 to-rose-600",
      textColor: "text-purple-400",
      buttonText: "Launch Console",
    },
  ];

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center text-sm font-semibold text-muted-foreground animate-pulse">
          Validating Accreditation Pass...
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-rose-500/10 blur-[120px]" />

      {/* Header */}
      <header className="glass border-border sticky top-0 z-50 border-b bg-background/70">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <FifaLogo className="h-8 w-8 transition-transform duration-300 hover:scale-110" />
            <span className="from-foreground via-foreground/90 to-muted-foreground bg-gradient-to-r bg-clip-text text-xl font-bold tracking-tight text-transparent">
              StadiumOS
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground md:inline">
              FIFA World Cup 2026 Operations
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-12 md:px-8">
        <div className="mb-12 text-center max-w-2xl">
          <div className="mb-3 inline-flex items-center rounded-full border border-border bg-card/85 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="mr-1.5 flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Unified Stadium Platform
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Choose Your Experience
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            StadiumOS bridges the gap between spectators, field staff, and stadium command. Choose a role below to access the platform.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.title}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/30 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card/70"
              >
                {/* Glow behind card */}
                <div
                  className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-tr ${role.themeColor} opacity-[0.03] dark:opacity-5 blur-[50px] transition-all duration-300 group-hover:scale-125`}
                />

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {role.badge}
                  </span>
                  <div className="mt-4 flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-sm group-hover:scale-105 transition-transform duration-300 border border-border">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      {role.title}
                    </h2>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {role.description}
                  </p>
                </div>

                <div className="mt-8">
                  <Link
                    href={role.href}
                    className="flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow transition-all duration-300 hover:bg-primary/90 hover:shadow-lg"
                  >
                    <span>{role.buttonText}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs text-muted-foreground/60">
          Authorized users only. Subject to monitoring under FIFA safety guidelines.
        </div>
      </main>
    </div>
  );
}
