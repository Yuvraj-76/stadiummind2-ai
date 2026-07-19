"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  HeartHandshake,
  Compass,
  Accessibility,
  AlertTriangle,
  Send,
  Loader2,
  Clock,
  MapPin,
  Flame,
  ArrowLeft,
  Info,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FifaLogo } from "@/components/fifa-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  fetchZones,
  fetchFacilities,
  fetchAlerts,
  askCopilot,
  Zone,
  Facility,
  LiveAlert,
} from "@/services/stadium";

export default function FanPortal() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [currentZoneId, setCurrentZoneId] = useState<string>("zone-a");
  const [seatLabel, setSeatLabel] = useState<string>("Section 104, Row L, Seat 12");
  const [isAccessible, setIsAccessible] = useState<boolean>(false);

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
      if (userSession.seat) {
        setSeatLabel(userSession.seat);
      }
      setAuthorized(true);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Hello! I am your StadiumAssist Copilot. I can guide you to restrooms with short lines, concession stands, or navigate you to your seat. How can I help you today? 🏆",
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Nearest restroom",
    "Where is my seat?",
    "Food wait times",
  ]);

  // Navigation map states
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    if (!authorized) return;
    async function loadData() {
      try {
        const [zonesData, facData, alertData] = await Promise.all([
          fetchZones(),
          fetchFacilities(),
          fetchAlerts("fan"),
        ]);
        setZones(zonesData);
        setFacilities(facData);
        setAlerts(alertData);
      } catch (err) {
        console.error("Failed to load stadium data", err);
      }
    }
    loadData();

    // Poll facilities every 10 seconds for wait times updates
    const interval = setInterval(async () => {
      try {
        const facData = await fetchFacilities();
        setFacilities(facData);
      } catch (e) {
        // ignore
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [authorized]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    setChatMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setInputMessage("");
    setIsChatLoading(true);

    try {
      const response = await askCopilot({
        message: textToSend,
        role: "fan",
        current_zone_id: currentZoneId,
        seat: seatLabel,
        accessibility_requirements: isAccessible ? ["wheelchair"] : [],
        preferred_language: "en",
      });

      setChatMessages((prev) => [...prev, { sender: "ai", text: response.response }]);
      setSuggestions(response.suggestions);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I'm sorry, I was unable to connect to the operations database. Please follow stadium signs or locate a volunteer.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const triggerSOS = async () => {
    const sosMsg = "SOS EMERGENCY: I need medical and exit guidance immediately.";
    handleSendMessage(sosMsg);
  };

  // Filter facilities based on accessibility mode
  const filteredFacilities = facilities.filter((f) => {
    if (isAccessible && !f.is_accessible) return false;
    return true;
  });

  const activeZone = zones.find((z) => z.id === currentZoneId);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center text-sm font-semibold text-muted-foreground animate-pulse">
          Validating Matchday Pass...
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
                StadiumOS <span className="text-blue-500 font-extrabold">Fan Assist</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Seat Label */}
            <div className="rounded-lg border border-border bg-card/60 px-3 py-1 text-xs md:flex items-center hidden">
              <span className="text-muted-foreground mr-1.5">Seat:</span>
              <span className="font-semibold text-foreground/90">{seatLabel}</span>
            </div>

            {/* Accessibility Toggle */}
            <button
              onClick={() => setIsAccessible(!isAccessible)}
              className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 ${
                isAccessible
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                  : "border-border bg-card/40 text-muted-foreground hover:border-border/80"
              }`}
              aria-label="Toggle Wheelchair Accessibility Mode"
            >
              <Accessibility className="h-4 w-4 animate-pulse" />
              <span>{isAccessible ? "Accessible Paths ON" : "Accessibility Mode"}</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="container mx-auto flex flex-1 flex-col gap-6 px-4 py-6 lg:flex-row md:px-8">
        {/* Left Side: Stadium Map & Alerts */}
        <div className="flex flex-1 flex-col gap-6 lg:max-w-3xl">
          {/* Alerts Banner */}
          {alerts.length > 0 && (
            <div className="animate-fade-in flex flex-col gap-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 shadow-sm backdrop-blur-md transition-all duration-300 ${
                    alert.severity === "critical"
                      ? "border-red-200 bg-red-50/80 text-red-800 dark:border-rose-500/30 dark:bg-rose-950/20 dark:text-rose-300"
                      : alert.severity === "warning"
                        ? "border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-300"
                        : "border-blue-200 bg-blue-50/80 text-blue-800 dark:border-blue-500/30 dark:bg-blue-950/20 dark:text-blue-300"
                  }`}
                >
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wide">
                      {alert.title}
                    </h4>
                    <p className={`mt-1 text-xs leading-relaxed ${
                      alert.severity === "critical"
                        ? "text-red-700 dark:text-rose-200/80"
                        : alert.severity === "warning"
                          ? "text-amber-700 dark:text-amber-200/80"
                          : "text-blue-700 dark:text-blue-200/80"
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Map Card */}
          <div className="flex flex-col rounded-2xl border border-border bg-card/25 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Interactive Stadium Guide</h3>
                <p className="text-xs text-muted-foreground">
                  Select a facility or gate to display navigation path from your stand.
                </p>
              </div>

              {/* Zone Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Your Stand:</span>
                <select
                  value={currentZoneId}
                  onChange={(e) => {
                    setCurrentZoneId(e.target.value);
                    setSelectedFacility(null);
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name.split(" ")[0]} ({z.density_level.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SVG Stadium Map */}
            <div className="relative aspect-[4/3] w-full rounded-xl border border-border bg-background/90 p-4">
              <svg viewBox="0 0 100 75" className="h-full w-full">
                {/* Outermost border */}
                <rect x="2" y="2" width="96" height="71" rx="8" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />

                {/* Pitch (Central Oval) */}
                <rect x="35" y="22" width="30" height="30" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.5" />
                {/* Soccer lines inside pitch */}
                <line x1="50" y1="22" x2="50" y2="52" stroke="#475569" strokeWidth="0.3" />
                <circle cx="50" cy="37" r="5" fill="none" stroke="#475569" strokeWidth="0.3" />

                {/* Stadium Stands Sections */}
                {/* Zone A: North Concourse */}
                <path
                  d="M 10,15 L 90,15 L 80,28 L 20,28 Z"
                  fill={currentZoneId === "zone-a" ? "rgba(59, 130, 246, 0.2)" : "rgba(30, 41, 59, 0.3)"}
                  stroke={currentZoneId === "zone-a" ? "#3b82f6" : "#1e293b"}
                  strokeWidth="0.8"
                  className={currentZoneId === "zone-a" ? "animate-pulse" : ""}
                />
                {/* Zone B: East Stand */}
                <path
                  d="M 90,15 L 90,60 L 77,50 L 77,25 Z"
                  fill={currentZoneId === "zone-b" ? "rgba(59, 130, 246, 0.2)" : "rgba(30, 41, 59, 0.3)"}
                  stroke={currentZoneId === "zone-b" ? "#3b82f6" : "#1e293b"}
                  strokeWidth="0.8"
                  className={currentZoneId === "zone-b" ? "animate-pulse" : ""}
                />
                {/* Zone C: South Concourse */}
                <path
                  d="M 10,60 L 90,60 L 80,47 L 20,47 Z"
                  fill={currentZoneId === "zone-c" ? "rgba(59, 130, 246, 0.2)" : "rgba(30, 41, 59, 0.3)"}
                  stroke={currentZoneId === "zone-c" ? "#3b82f6" : "#1e293b"}
                  strokeWidth="0.8"
                  className={currentZoneId === "zone-c" ? "animate-pulse" : ""}
                />
                {/* Zone D: West Stand */}
                <path
                  d="M 10,15 L 10,60 L 23,50 L 23,25 Z"
                  fill={currentZoneId === "zone-d" ? "rgba(59, 130, 246, 0.2)" : "rgba(30, 41, 59, 0.3)"}
                  stroke={currentZoneId === "zone-d" ? "#3b82f6" : "#1e293b"}
                  strokeWidth="0.8"
                  className={currentZoneId === "zone-d" ? "animate-pulse" : ""}
                />

                {/* Render Route navigation if facility selected */}
                {selectedFacility && (
                  <path
                    d={(() => {
                      // Draw line from center of current Stand zone to facility
                      const standCoords: Record<string, [number, number]> = {
                        "zone-a": [50, 21],
                        "zone-b": [83, 37],
                        "zone-c": [50, 53],
                        "zone-d": [16, 37],
                      };
                      const start = standCoords[currentZoneId] || [50, 37];
                      const end = [selectedFacility.location_x, selectedFacility.location_y];
                      return `M ${start[0]},${start[1]} Q ${(start[0] + end[0]) / 2},${(start[1] + end[1]) / 2 - 10} ${end[0]},${end[1]}`;
                    })()}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                    className="animate-[dash_2s_linear_infinite]"
                  />
                )}

                {/* Plot Facilities */}
                {filteredFacilities.map((fac) => {
                  const isSelected = selectedFacility?.id === fac.id;
                  let color = "#3b82f6"; // standard gate / blue
                  if (fac.type === "restroom") color = "#a855f7"; // restroom purple
                  if (fac.type === "food") color = "#f59e0b"; // food orange
                  if (fac.type === "first_aid") color = "#ef4444"; // medical red

                  return (
                    <g
                      key={fac.id}
                      className="cursor-pointer transition-all duration-300"
                      onClick={() => setSelectedFacility(fac)}
                    >
                      {/* Outline circle for selection */}
                      {isSelected && (
                        <circle
                          cx={fac.location_x}
                          cy={fac.location_y}
                          r="4"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="0.5"
                          className="animate-ping"
                        />
                      )}
                      {/* Inner dot pin */}
                      <circle
                        cx={fac.location_x}
                        cy={fac.location_y}
                        r="2"
                        fill={color}
                        stroke="#0f172a"
                        strokeWidth="0.4"
                      />
                      {/* Tooltip / text labels for key facilities */}
                      {isSelected && (
                        <foreignObject
                          x={fac.location_x - 15}
                          y={fac.location_y - 9}
                          width="30"
                          height="8"
                          requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                        >
                          <div className="rounded border border-emerald-500 bg-card px-1 py-0.5 text-[4px] font-bold text-foreground text-center shadow-lg">
                            {fac.name} ({fac.wait_time_minutes}m)
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Map Legend overlay */}
              <div className="absolute bottom-3 left-3 rounded-lg bg-card p-2 text-[10px] space-y-1 border border-border shadow-sm">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Entry Gates</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  <span>Restrooms</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Food / Concession</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Medical First Aid</span>
                </div>
              </div>
            </div>

            {/* Selected Route Info Card */}
            {selectedFacility && (
              <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-emerald-800 bg-emerald-950/15 p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-400">
                      Route Active: {selectedFacility.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      From your stand ({activeZone?.name.split(" ")[0]}), walk clockwise. Wait time is approx.{" "}
                      <strong>{selectedFacility.wait_time_minutes} minutes</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-border text-xs hover:bg-secondary text-muted-foreground"
                    onClick={() => {
                      const reqMsg = `How do I navigate to ${selectedFacility.name} from my stand?`;
                      handleSendMessage(reqMsg);
                    }}
                  >
                    Ask AI Route Details
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs text-white"
                    onClick={() => setSelectedFacility(null)}
                  >
                    Clear Path
                  </Button>
                </div>
              </div>
            )}

            {/* Emergency SOS card */}
            <div className="mt-4 rounded-xl border border-rose-800 bg-rose-950/10 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-500">Emergency & Exit Assistance</h4>
                  <p className="text-xs text-muted-foreground">
                    Need immediate medical assistance or emergency exit routes?
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={triggerSOS}
                className="h-9 font-bold bg-rose-600 hover:bg-rose-700 animate-pulse uppercase tracking-wider"
              >
                Trigger SOS Alert
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side: Facilities List & AI Copilot Chat */}
        <div className="flex flex-1 flex-col gap-6 lg:max-w-md">
          {/* Nearby Facilities wait times list */}
          <div className="rounded-2xl border border-border bg-card/20 p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nearby Facilities</h3>
            <p className="text-xs text-muted-foreground/80 mt-0.5">Wait times are fetched in real-time from stadium flow sensors.</p>

            <div className="mt-4 max-h-[160px] overflow-y-auto space-y-2 pr-1">
              {filteredFacilities
                .filter((f) => f.zone_id === currentZoneId)
                .map((fac) => {
                  let badgeColor = "bg-emerald-500/15 text-emerald-500 border-emerald-500/20";
                  if (fac.status === "crowded") {
                    badgeColor = "bg-amber-500/15 text-amber-400 border-amber-500/20";
                  } else if (fac.status === "closed") {
                    badgeColor = "bg-rose-500/15 text-rose-500 border-rose-500/20";
                  }

                  return (
                    <div
                      key={fac.id}
                      className="border-border bg-background/40 flex items-center justify-between rounded-lg border p-2.5 transition-all hover:bg-secondary/50 cursor-pointer"
                      onClick={() => setSelectedFacility(fac)}
                    >
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <div className="text-xs font-semibold text-foreground">{fac.name}</div>
                          <div className="text-[10px] text-muted-foreground/80 capitalize">{fac.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${badgeColor}`}>
                          {fac.status}
                        </span>
                        <div className="flex items-center text-muted-foreground text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>{fac.wait_time_minutes}m</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* AI Copilot chat container */}
          <div className="flex flex-1 flex-col rounded-2xl border border-border bg-card/20 shadow-sm overflow-hidden min-h-[400px]">
            {/* Chat header */}
            <div className="border-border bg-background/60 flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">AI Copilot Online</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Context-Aware Mode
              </span>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm max-h-[350px]">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-card text-foreground border border-border rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border text-muted-foreground rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-xs">Analyzing stadium layout...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-border bg-background/35">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => handleSendMessage(sug)}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-400 transition-all duration-200"
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
                handleSendMessage(inputMessage);
              }}
              className="border-border bg-background/70 p-3 border-t flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder={
                  isAccessible ? "Ask for wheelchair paths..." : "Ask for directions, food..."
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-xs text-foreground outline-none focus:border-blue-500 placeholder-muted-foreground/70"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputMessage.trim() || isChatLoading}
                className="bg-blue-600 hover:bg-blue-700 h-9 w-9 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
