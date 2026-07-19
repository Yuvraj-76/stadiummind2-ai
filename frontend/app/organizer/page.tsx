"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  ShieldAlert,
  BarChart3,
  Activity,
  Users,
  AlertTriangle,
  Megaphone,
  Plus,
  Send,
  Loader2,
  Sparkles,
  ArrowLeft,
  Settings,
  Flame,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FifaLogo } from "@/components/fifa-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  fetchZones,
  fetchIncidents,
  fetchAlerts,
  updateTaskStatus,
  updateIncident,
  generateAnnouncement,
  createAlert,
  askCopilot,
  Zone,
  Incident,
  LiveAlert,
} from "@/services/stadium";

export default function OrganizerConsole() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [commanderName, setCommanderName] = useState("Command Operator");

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
        setCommanderName(userSession.name);
      }
      setAuthorized(true);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  // State
  const [zones, setZones] = useState<Zone[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Announcement Generator State
  const [annContext, setAnnContext] = useState("");
  const [annRole, setAnnRole] = useState<"all" | "fan" | "volunteer">("all");
  const [annZone, setAnnZone] = useState("");
  const [annTone, setAnnTone] = useState<"informative" | "urgent" | "welcoming">("informative");
  const [annLang, setAnnLang] = useState("en");
  const [genText, setGenText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Alert State
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"info" | "warning" | "critical">("info");
  const [alertRole, setAlertRole] = useState<"all" | "fan" | "volunteer" | "organizer">("all");
  const [alertZone, setAlertZone] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Decision Support Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Operations Decision Support online. The stadium is currently at peak load. West Stand (Zone D) is reporting critical density (7,900 fans). Scan scanner status or ask for resource allocation updates.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Recommend resource allocation",
    "Show incident timeline",
    "Draft scanner announcement",
  ]);

  // Load Operations metrics
  const loadData = React.useCallback(async () => {
    try {
      const [zonesData, incData, alertsData] = await Promise.all([
        fetchZones(),
        fetchIncidents(),
        fetchAlerts("organizer"),
      ]);
      setZones(zonesData);
      setIncidents(incData);
      setAlerts(alertsData);
      setSelectedIncident((prev) => {
        if (incData.length > 0 && !prev) {
          return incData[0];
        }
        return prev;
      });
    } catch (e) {
      console.error("Failed to load operations metrics", e);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    loadData();
    // Poll analytics metrics every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => {
      clearInterval(interval);
    };
  }, [loadData, authorized]);

  // Handlers
  const handleUpdateIncidentStatus = async (
    status: "reported" | "investigating" | "resolved" | "escalated"
  ) => {
    if (!selectedIncident) return;
    try {
      const updated = await updateIncident(selectedIncident.id, { status });
      // Optimistic update
      setIncidents((prev) => prev.map((i) => (i.id === selectedIncident.id ? updated : i)));
      setSelectedIncident(updated);
    } catch (err) {
      console.error("Failed to update incident", err);
    }
  };

  const handleGenerateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annContext) return;
    setIsGenerating(true);

    try {
      const text = await generateAnnouncement({
        event_context: annContext,
        target_role: annRole,
        zone_id: annZone || undefined,
        tone: annTone,
        language: annLang,
      });
      setGenText(text);
      // Pre-fill the broadcast alert form
      setAlertTitle(`ALERT: ${annContext.split(".")[0]}`);
      setAlertMessage(text);
      setAlertRole(annRole);
      setAlertSeverity(annTone === "urgent" ? "warning" : "info");
      setAlertZone(annZone);
    } catch (err) {
      setGenText("Failed to generate announcement.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle || !alertMessage) return;
    setIsBroadcasting(true);

    try {
      await createAlert({
        title: alertTitle,
        message: alertMessage,
        target_role: alertRole,
        zone_id: alertZone || undefined,
        severity: alertSeverity,
      });
      // Reset forms
      setAlertTitle("");
      setAlertMessage("");
      setAnnContext("");
      setGenText("");
      await loadData();
    } catch (err) {
      console.error("Failed to create alert", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSendDecisionQuery = async (text: string) => {
    if (!text.trim()) return;

    setChatMessages((prev) => [...prev, { sender: "user", text }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await askCopilot({
        message: text,
        role: "organizer",
      });
      setChatMessages((prev) => [...prev, { sender: "ai", text: response.response }]);
      setSuggestions(response.suggestions);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Database connection failed. Please try again." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Math totals for dashboard stats cards
  const totalCrowd = zones.reduce((sum, z) => sum + z.current_crowd_count, 0);
  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalCrowd / totalCapacity) * 100) : 0;
  const criticalZonesCount = zones.filter((z) => z.density_level === "critical").length;

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center text-sm font-semibold text-muted-foreground animate-pulse">
          Validating Command Credentials...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
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
                StadiumOS <span className="text-purple-500">Organizer Console</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="rounded-lg border border-border bg-card/60 px-3 py-1 text-xs md:flex items-center hidden">
              <span className="text-muted-foreground mr-1.5">Center:</span>
              <span className="font-semibold text-foreground/90">World Cup 2026 Command Center</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Operations Grid */}
      <div className="container mx-auto space-y-6 px-4 py-6 md:px-8">
        {/* KPI Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="rounded-xl border border-border bg-card/25 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Occupancy</p>
              <h3 className="text-2xl font-black mt-1 text-foreground">{totalCrowd.toLocaleString()}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{occupancyRate}% of total capacity</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-3 text-blue-500 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-border bg-card/25 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Incidents</p>
              <h3 className="text-2xl font-black mt-1 text-foreground">
                {incidents.filter((i) => i.status !== "resolved").length}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {incidents.filter((i) => i.severity === "high" || i.severity === "critical").length} High Severity
              </p>
            </div>
            <div className="rounded-lg bg-rose-500/10 p-3 text-rose-500 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-border bg-card/25 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Congestion Risk</p>
              <h3 className="text-2xl font-black mt-1 text-foreground">{criticalZonesCount} Zones</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">At critical density limits</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-3 text-amber-500 dark:text-amber-400">
              <Activity className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-xl border border-border bg-card/25 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Command Status</p>
              <h3 className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400 animate-pulse">NOMINAL</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">All networks reporting</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-500 dark:text-emerald-400">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Panel 1: Heatmap list & Incident Timeline */}
          <div className="space-y-6 lg:col-span-2">
            {/* Stadium Heatmap List */}
            <div className="rounded-2xl border border-border bg-card/25 p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border pb-2 mb-4">
                Stadium Zone Density Heatmap
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {zones.map((zone) => {
                  const percent = Math.round((zone.current_crowd_count / zone.capacity) * 100);
                  let progressColor = "bg-emerald-500";
                  let textColor = "text-emerald-600 dark:text-emerald-400";
                  if (zone.density_level === "medium") {
                    progressColor = "bg-yellow-500";
                    textColor = "text-yellow-600 dark:text-yellow-400";
                  } else if (zone.density_level === "high") {
                    progressColor = "bg-orange-500";
                    textColor = "text-orange-600 dark:text-orange-400";
                  } else if (zone.density_level === "critical") {
                    progressColor = "bg-rose-500";
                    textColor = "text-rose-600 dark:text-rose-400";
                  }

                  return (
                    <div
                      key={zone.id}
                      className="border-border bg-background rounded-xl border p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{zone.name.split(" ")[0]}</span>
                        <span className={`font-bold ${textColor}`}>{percent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full ${progressColor}`} style={{ width: `${percent}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{zone.current_crowd_count.toLocaleString()} / {zone.capacity.toLocaleString()} fans</span>
                        <span className="capitalize font-bold">{zone.density_level} load</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Incident Timeline */}
            <div className="rounded-2xl border border-border bg-card/25 p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b border-border pb-2 mb-4">
                Live Incident Timeline & Status Check
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {incidents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">No reported incidents.</div>
                ) : (
                  incidents.map((inc) => {
                    const isSelected = selectedIncident?.id === inc.id;
                    let badgeColor = "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400";
                    if (inc.status === "investigating") {
                      badgeColor = "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
                    } else if (inc.status === "resolved") {
                      badgeColor = "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                    }

                    return (
                      <div
                        key={inc.id}
                        onClick={() => setSelectedIncident(inc)}
                        className={`border-border flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl border p-4 cursor-pointer transition-all ${
                          isSelected ? "bg-secondary border-purple-500/50 shadow-inner" : "bg-background/40 hover:bg-secondary/40"
                        }`}
                      >
                        <div className="flex items-start space-x-3.5">
                          <div className="mt-1">
                            {inc.severity === "critical" || inc.severity === "high" ? (
                              <Flame className="h-5 w-5 text-rose-500 animate-bounce" />
                            ) : (
                              <Activity className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-foreground">{inc.title}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">({inc.id})</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground max-w-lg leading-relaxed">
                              {inc.description}
                            </p>
                            <span className="mt-2 text-[10px] text-purple-600 dark:text-purple-400 font-semibold italic flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5 shrink-0" />
                              AI Summary: {inc.ai_summary}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 md:mt-0 flex items-center space-x-3 shrink-0">
                          <span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${badgeColor}`}>
                            {inc.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Incident Actions */}
              {selectedIncident && (
                <div className="mt-5 border-t border-border pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Selected Incident:</span>{" "}
                    <strong className="text-foreground">{selectedIncident.title}</strong>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateIncidentStatus("investigating")}
                      disabled={selectedIncident.status === "investigating"}
                      className="border-border text-muted-foreground text-xs hover:bg-secondary"
                    >
                      Investigate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateIncidentStatus("resolved")}
                      disabled={selectedIncident.status === "resolved"}
                      className="border-border text-emerald-600 dark:text-emerald-400 text-xs hover:bg-emerald-500/10"
                    >
                      Resolve (Clear SOP)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel 2: AI Support & Announcement Broadcaster */}
          <div className="space-y-6">
            {/* GenAI Announcement Generator */}
            <div className="rounded-2xl border border-border bg-card/25 p-5 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-border pb-2 mb-4">
                <Megaphone className="h-5 w-5 text-purple-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  AI Broadcast Announcement Generator
                </h3>
              </div>

              <form onSubmit={handleGenerateAnnouncement} className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Event Context</label>
                  <textarea
                    placeholder="Describe the operational alert context (e.g. wet floor concourse east, scan delays Gate G...)"
                    value={annContext}
                    onChange={(e) => setAnnContext(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground outline-none focus:border-purple-500 min-h-[50px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Audience</label>
                    <select
                      value={annRole}
                      onChange={(e) => setAnnRole(e.target.value as "all" | "fan" | "volunteer")}
                      className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground outline-none"
                    >
                      <option value="all">Everyone (all)</option>
                      <option value="fan">Fans Only</option>
                      <option value="volunteer">Staff Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Tone</label>
                    <select
                      value={annTone}
                      onChange={(e) => setAnnTone(e.target.value as "informative" | "urgent" | "welcoming")}
                      className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground outline-none"
                    >
                      <option value="informative">Informative</option>
                      <option value="urgent">Urgent Alert</option>
                      <option value="welcoming">Welcoming</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!annContext || isGenerating}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-xs"
                >
                  {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                  Generate PA Announcement
                </Button>
              </form>

              {/* Show Generated Text and Broadcast Button */}
              {genText && (
                <div className="mt-4 border-t border-border pt-3 space-y-3 animate-fade-in">
                  <div className="rounded-lg bg-background/60 p-3 text-xs leading-relaxed italic border border-border text-muted-foreground">
                    {genText}
                  </div>

                  <form onSubmit={handleBroadcastAlert} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Confirm Broadcast Title"
                      value={alertTitle}
                      onChange={(e) => setAlertTitle(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none"
                      required
                    />
                    <Button
                      type="submit"
                      disabled={isBroadcasting}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-xs font-bold"
                    >
                      {isBroadcasting ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                      Broadcast to Fan Screen & App
                    </Button>
                  </form>
                </div>
              )}
            </div>

            {/* AI Decision Support Console (Chat) */}
            <div className="flex flex-col rounded-2xl border border-border bg-card/25 shadow-sm overflow-hidden min-h-[350px]">
              {/* Chat Header */}
              <div className="border-border bg-background/60 px-4 py-3 border-b flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Decision Support System
                </span>
                <span className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-semibold uppercase">
                  AI Advisor
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs max-h-[220px]">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-purple-600 text-white rounded-tr-none"
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
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />
                      <span>Optimizing resources...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat suggestions */}
              {suggestions.length > 0 && (
                <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-border bg-background/30">
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => handleSendDecisionQuery(sug)}
                      className="rounded-full border border-border bg-card/60 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:border-purple-500/50 hover:bg-purple-500/5 hover:text-purple-600 transition-all duration-200"
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
                  handleSendDecisionQuery(chatInput);
                }}
                className="border-border bg-background/70 p-2.5 border-t flex items-center space-x-2"
              >
                <input
                  type="text"
                  placeholder="Ask advisor for staff reallocations..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2 text-xs text-foreground outline-none focus:border-purple-500"
                />
                <Button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-purple-600 hover:bg-purple-700 h-8 w-8 rounded-lg"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
