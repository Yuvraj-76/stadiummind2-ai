"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Users,
  CheckSquare,
  Square,
  AlertOctagon,
  Languages,
  Send,
  Loader2,
  ListTodo,
  FileText,
  Clock,
  ArrowLeft,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FifaLogo } from "@/components/fifa-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  fetchTasks,
  updateTaskStatus,
  fetchIncidents,
  reportIncident,
  fetchZones,
  translateText,
  askCopilot,
  VolunteerTask,
  Incident,
  Zone,
} from "@/services/stadium";

export default function VolunteerDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [staffName, setStaffName] = useState("Staff Member");

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
      if (userSession.name) {
        setStaffName(userSession.name);
      }
      setAuthorized(true);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  // State
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Form State
  const [incTitle, setIncTitle] = useState("");
  const [incDesc, setIncDesc] = useState("");
  const [incZone, setIncZone] = useState("zone-a");
  const [incSeverity, setIncSeverity] = useState("low");
  const [isReporting, setIsReporting] = useState(false);

  // Translation State
  const [transText, setTransText] = useState("");
  const [transLang, setTransLang] = useState("es");
  const [transResult, setTransResult] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Operations Copilot active. You are assigned to **North Concourse (Zone A)**. Ask me for incident checklists, stadium manuals, or translate fan questions. 🏟️",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Check SOP checklist",
    "Translate: Where is exit?",
    "Report scanner freeze",
  ]);

  // Load Data
  const loadData = React.useCallback(async () => {
    try {
      const [tasksData, incData, zonesData] = await Promise.all([
        fetchTasks("mock-volunteer"),
        fetchIncidents(),
        fetchZones(),
      ]);
      setTasks(tasksData);
      setIncidents(incData);
      setZones(zonesData);
      setSelectedIncident((prev) => {
        if (incData.length > 0 && !prev) {
          return incData[0];
        }
        return prev;
      });
    } catch (e) {
      console.error("Failed to load volunteer data", e);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    loadData();

    // Poll every 10 seconds for tasks/incidents updates
    const interval = setInterval(loadData, 10000);
    return () => {
      clearInterval(interval);
    };
  }, [loadData, authorized]);

  // Handlers
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus: "pending" | "in_progress" | "completed" = currentStatus === "completed" ? "pending" : "completed";
    try {
      await updateTaskStatus(taskId, nextStatus);
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      );
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle || !incDesc) return;
    setIsReporting(true);

    try {
      const res = await reportIncident(incTitle, incDesc, incZone, incSeverity);
      setIncTitle("");
      setIncDesc("");
      setSelectedIncident(res);
      await loadData();
    } catch (err) {
      console.error("Failed to report incident", err);
    } finally {
      setIsReporting(false);
    }
  };

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transText) return;
    setIsTranslating(true);

    try {
      const result = await translateText(transText, transLang);
      setTransResult(result);
    } catch (err) {
      setTransResult("Translation failed. Try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setChatMessages((prev) => [...prev, { sender: "user", text }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await askCopilot({
        message: text,
        role: "volunteer",
        current_zone_id: "zone-a",
      });
      setChatMessages((prev) => [...prev, { sender: "ai", text: response.response }]);
      setSuggestions(response.suggestions);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Connection error. Please try again." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center text-sm font-semibold text-muted-foreground animate-pulse">
          Verifying Staff Accreditation...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navbar */}
      <header className="glass border-border sticky top-0 z-50 border-b bg-background/80 px-4 py-3 md:px-8">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/role-select"
              className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Change Role
            </Link>
            <div className="hidden h-4 w-px bg-border md:block" />
            <div className="flex items-center space-x-2">
              <FifaLogo className="h-7 w-7 transition-transform duration-300 hover:scale-110" />
              <span className="text-md font-bold tracking-tight text-foreground">
                StadiumOS <span className="text-amber-500">Volunteer Portal</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="rounded-lg border border-border bg-card/60 px-3 py-1 text-xs md:flex items-center hidden">
              <span className="text-muted-foreground mr-1.5">Shift Zone:</span>
              <span className="font-semibold text-foreground/90">North Concourse (Zone A)</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="container mx-auto flex flex-1 flex-col gap-6 px-4 py-6 lg:flex-row md:px-8">
        {/* Left Side: Tasks & Active Incidents SOP */}
        <div className="flex flex-1 flex-col gap-6 lg:max-w-xl">
          {/* Tasks Checklist */}
          <div className="flex flex-col rounded-2xl border border-border bg-card/25 p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <ListTodo className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-bold text-foreground">Your Task Checklist</h3>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {tasks.filter((t) => t.status !== "completed").length} Pending
              </span>
            </div>

            <div className="mt-4 space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No tasks assigned. You are currently on standby.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`border-border flex items-start justify-between rounded-xl border p-3.5 transition-colors cursor-pointer ${
                      task.status === "completed"
                        ? "bg-muted/40 opacity-60"
                        : "bg-card/40 hover:bg-secondary/40"
                    }`}
                    onClick={() => handleToggleTask(task.id, task.status)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 text-muted-foreground">
                        {task.status === "completed" ? (
                          <CheckSquare className="h-4.5 w-4.5 text-emerald-500" />
                        ) : (
                          <Square className="h-4.5 w-4.5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4
                          className={`text-xs font-bold ${
                            task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </h4>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI SOP Assistant Card */}
          <div className="flex flex-col rounded-2xl border border-border bg-card/25 p-5 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <FileText className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-bold text-foreground">Active Incident SOP Checklist</h3>
            </div>

            {/* Incident selector */}
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Select Incident:</span>
              <select
                value={selectedIncident?.id || ""}
                onChange={(e) => {
                  const inc = incidents.find((i) => i.id === e.target.value);
                  if (inc) setSelectedIncident(inc);
                }}
                className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-amber-500"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.title} ({inc.severity.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {selectedIncident ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-background/60 p-4 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {selectedIncident.title}
                    </span>
                    <span className="rounded bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                      {selectedIncident.severity} Severity
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {selectedIncident.description}
                  </p>
                  <div className="mt-3 flex items-start gap-2 border-t border-border pt-2 text-[11px] text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>AI Summary:</strong> {selectedIncident.ai_summary}
                    </span>
                  </div>
                </div>

                {/* SOP Steps */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Standard Operating Procedure Steps:
                  </h4>
                  <div className="space-y-2">
                    {selectedIncident.sop_steps?.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-lg border border-border bg-background/30 p-2 text-xs text-foreground"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No active incidents. Everything is clear!
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Translation, Reporting & AI Assistant */}
        <div className="flex flex-1 flex-col gap-6 lg:max-w-xl">
          {/* Translation Widget */}
          <div className="rounded-2xl border border-border bg-card/25 p-5 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <Languages className="h-5 w-5 text-amber-500" />
              <h3 className="text-md font-bold text-foreground">Instant Translation Assistant</h3>
            </div>

            <form onSubmit={handleTranslate} className="mt-4 space-y-3">
              <textarea
                placeholder="Type or paste fan's text in foreign language (e.g. 'Donde esta el bano?')"
                value={transText}
                onChange={(e) => setTransText(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground outline-none focus:border-amber-500 min-h-[60px] resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Translate to:</span>
                  <select
                    value={transLang}
                    onChange={(e) => setTransLang(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                  >
                    <option value="es">Spanish (es)</option>
                    <option value="fr">French (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="en">English (en)</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!transText.trim() || isTranslating}
                  className="bg-amber-600 hover:bg-amber-700 text-xs h-8"
                >
                  {isTranslating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Translate
                </Button>
              </div>
            </form>

            {transResult && (
              <div className="mt-3 rounded-lg border border-amber-900/30 bg-amber-950/10 p-3 text-xs">
                <div className="font-semibold text-amber-400 mb-1">Result:</div>
                <div className="text-muted-foreground leading-relaxed italic">&ldquo;{transResult}&rdquo;</div>
              </div>
            )}
          </div>

          {/* Incident Reporter */}
          <div className="rounded-2xl border border-border bg-card/25 p-5 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <AlertOctagon className="h-5 w-5 text-amber-500" />
              <h3 className="text-md font-bold text-foreground">Report New Incident</h3>
            </div>

            <form onSubmit={handleReportIncident} className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Broken Scanner Lane 4"
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Description</label>
                <textarea
                  placeholder="Detailed description of the issue..."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500 min-h-[60px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Zone</label>
                  <select
                    value={incZone}
                    onChange={(e) => setIncZone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-xs text-foreground outline-none"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name.split(" ")[0]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Severity</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-xs text-foreground outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!incTitle || !incDesc || isReporting}
                className="w-full bg-amber-600 hover:bg-amber-700 text-xs mt-2"
              >
                {isReporting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                Submit Incident Report (Runs GenAI SOP)
              </Button>
            </form>
          </div>

          {/* AI Knowledge Assistant Chat */}
          <div className="flex flex-col rounded-2xl border border-border bg-card/25 shadow-sm overflow-hidden min-h-[350px]">
            {/* Header */}
            <div className="border-border bg-background/60 px-4 py-3 border-b flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Operations AI Copilot
              </span>
              <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold uppercase">
                Staff Support
              </span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs max-h-[220px]">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-amber-600 text-white rounded-tr-none"
                        : "bg-secondary text-foreground border border-border rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary border border-border text-muted-foreground rounded-xl rounded-tl-none px-3.5 py-2.5 flex items-center space-x-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                    <span>Analyzing manual...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-border bg-background/30">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => handleSendMessage(sug)}
                    className="rounded-full border border-border bg-card/60 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-600 transition-all duration-200"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(chatInput);
              }}
              className="border-border bg-background/70 p-2.5 border-t flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder="Ask for SOP checklists or manuals..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2 text-xs text-foreground outline-none focus:border-amber-500"
              />
              <Button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="bg-amber-600 hover:bg-amber-700 h-8 w-8 rounded-lg"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
