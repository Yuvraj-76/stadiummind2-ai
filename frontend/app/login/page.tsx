"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { FifaLogo } from "@/components/fifa-logo";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  Shield,
  Fingerprint,
  QrCode,
  ScanLine,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"fan" | "staff">("fan");
  const [ticketId, setTicketId] = useState("");
  const [seat, setSeat] = useState("Section 104, Row L, Seat 12");
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState("");

  // Clear errors when toggling tabs
  useEffect(() => {
    setError("");
  }, [activeTab]);

  const handleGenerateTicket = () => {
    setTicketId("FIFA-2026-FAN");
    setSeat("Section 204, Row K, Seat 18");
    setError("");
  };

  const handleGenerateStaffCredentials = (role: "volunteer" | "organizer") => {
    if (role === "volunteer") {
      setStaffId("STAFF-VOL-482");
      setPin("VOL-2026");
    } else {
      setStaffId("STAFF-CMD-001");
      setPin("ORG-2026");
    }
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Simple mock validations
    if (activeTab === "fan") {
      if (!ticketId.trim()) {
        setError("Please enter a valid Ticket ID.");
        return;
      }
      setIsLoading(true);
      simulateScan(() => {
        const userSession = {
          name: "Spectator",
          role: "fan",
          ticketId: ticketId.trim(),
          seat: seat.trim() || "General Admission",
          authenticated: true,
        };
        localStorage.setItem("stadiumos_user", JSON.stringify(userSession));
        router.push("/role-select");
      });
    } else {
      if (!staffId.trim() || !pin.trim()) {
        setError("Staff ID and Security Pin are required.");
        return;
      }

      // Check for predefined pins
      if (pin === "VOL-2026") {
        setIsLoading(true);
        simulateScan(() => {
          const userSession = {
            name: staffId.trim(),
            role: "volunteer",
            authenticated: true,
          };
          localStorage.setItem("stadiumos_user", JSON.stringify(userSession));
          router.push("/role-select");
        });
      } else if (pin === "ORG-2026") {
        setIsLoading(true);
        simulateScan(() => {
          const userSession = {
            name: staffId.trim(),
            role: "organizer",
            authenticated: true,
          };
          localStorage.setItem("stadiumos_user", JSON.stringify(userSession));
          router.push("/role-select");
        });
      } else {
        setError("Invalid Security Pin. (Use 'VOL-2026' or 'ORG-2026')");
      }
    }
  };

  const simulateScan = (callback: () => void) => {
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            callback();
          }, 300);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Background glow graphics */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[550px] w-[550px] translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />

      {/* Header bar */}
      <header className="glass border-border sticky top-0 z-50 border-b bg-background/70 px-4 py-3 md:px-8">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <FifaLogo className="h-8 w-8 transition-transform duration-300 hover:scale-110" />
            <span className="from-foreground via-foreground/90 to-muted-foreground bg-gradient-to-r bg-clip-text text-xl font-bold tracking-tight text-transparent">
              StadiumOS
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground md:inline">
              World Cup 2026 Entry Gates
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Central Login Container */}
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Headline */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Matchday Portal
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Scan your ticket or validate credentials to access StadiumOS
            </p>
          </div>

          {/* Form Card */}
          <div className="relative rounded-2xl border border-border bg-card/25 p-6 shadow-xl backdrop-blur-md overflow-hidden">
            {/* Holographic scanning animation line */}
            {isLoading && (
              <div 
                className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 z-20 animate-[bounce_2s_infinite]"
                style={{ top: `${scanProgress}%` }}
              />
            )}

            {/* Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary/50 p-1 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("fan")}
                className={`flex items-center justify-center space-x-2 rounded-lg py-2 text-xs font-bold transition-all ${
                  activeTab === "fan"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Ticket className="h-4 w-4" />
                <span>Spectator Pass</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("staff")}
                className={`flex items-center justify-center space-x-2 rounded-lg py-2 text-xs font-bold transition-all ${
                  activeTab === "staff"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>Accreditation</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "fan" ? (
                /* Spectator ticket entry view */
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Match Ticket ID</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        placeholder="e.g. FIFA-2026-FAN"
                        value={ticketId}
                        onChange={(e) => setTicketId(e.target.value)}
                        disabled={isLoading}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary pr-9"
                      />
                      <QrCode className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Gate / Seat Assignment</label>
                    <input
                      type="text"
                      placeholder="e.g. Section 104, Row L, Seat 12"
                      value={seat}
                      onChange={(e) => setSeat(e.target.value)}
                      disabled={isLoading}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  {/* Helper mock generate */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleGenerateTicket}
                      disabled={isLoading}
                      className="flex items-center text-[10px] font-semibold text-primary hover:underline gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      Generate Test Ticket
                    </button>
                  </div>
                </div>
              ) : (
                /* Staff accreditation pass entry view */
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Staff ID Card</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        placeholder="e.g. STAFF-VOL-482"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        disabled={isLoading}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary pr-9"
                      />
                      <Fingerprint className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Security Pin</label>
                    <input
                      type="password"
                      placeholder="Enter security access code"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      disabled={isLoading}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  {/* Helpers to generate mock staff pins */}
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-muted-foreground">Generate:</span>
                    <div className="flex gap-3 font-semibold">
                      <button
                        type="button"
                        onClick={() => handleGenerateStaffCredentials("volunteer")}
                        disabled={isLoading}
                        className="text-primary hover:underline"
                      >
                        Volunteer PIN
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateStaffCredentials("organizer")}
                        disabled={isLoading}
                        className="text-primary hover:underline"
                      >
                        Command PIN
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Box */}
              {error && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-[11px] text-rose-600 dark:text-rose-400 flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 font-bold text-xs h-10 mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <ScanLine className="h-4 w-4 animate-bounce" />
                    <span>SCANNING PASS ({scanProgress}%)...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>{activeTab === "fan" ? "Scan Ticket & Enter" : "Validate Accreditation"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </div>

          {/* Quick instructions/hints */}
          <div className="mt-6 rounded-xl border border-border bg-card/10 p-3.5 text-[10px] text-muted-foreground/80 space-y-1.5">
            <div className="font-semibold text-foreground">💡 Quick Tester Information:</div>
            <div>• **Fans**: Click **Generate Test Ticket** then click **Scan Ticket** to log in.</div>
            <div>• **Volunteers**: Click **Volunteer PIN** to auto-fill passcode `VOL-2026`.</div>
            <div>• **Commanders**: Click **Command PIN** to auto-fill passcode `ORG-2026`.</div>
          </div>
        </div>
      </main>
    </div>
  );
}
