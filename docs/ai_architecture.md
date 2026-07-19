# Generative AI & Prompt Engineering Design — StadiumMind AI 🧠

This document explains the architecture of the Generative AI layer in **StadiumMind AI**, detailing prompt formatting, context injection, role-specific guidelines, and the rule-based local fallback mechanism.

---

## 1. Context-Aware AI Injection Architecture

Rather than acting as a standard, isolated chatbot, StadiumMind AI dynamically queries the active database to compile real-time stadium facts before calling the LLM. 

```
┌─────────────────┐      1. User Context      ┌──────────────────┐
│  React Frontend  │ ───────────────────────> │ FastAPI Backend  │
└─────────────────┘                           └──────────────────┘
                                                       │
                                                       │ 2. Fetch live metrics
                                                       ▼
┌─────────────────┐                           ┌──────────────────┐
│   OpenAI LLM    │ <──────────────────────── │  Database (SQL)  │
└─────────────────┘    3. Compile Context     └──────────────────┘
                            & Prompt
```

### Context variables gathered on every request:
1. **User Role**: `fan` | `volunteer` | `organizer`
2. **Current Stadium Zone**: e.g., North Concourse, East Stand.
3. **Crowd Metrics**: Current crowd count vs capacity and density level (`low`, `medium`, `high`, `critical`).
4. **Nearby Facilities**: Lists restrooms, food concessions, first-aid tents, and entry gates with wait times, open/closed status, and accessibility support.
5. **Active Alerts**: Critical safety and informational alerts broadcasted by stadium command.
6. **Active Incidents**: High-priority events (e.g. scanner failures, leakage) requiring operations staff attention.

---

## 2. Role-Specific System Prompts

The backend builds a customized system prompt according to the user's role:

### A. Fan Assistant Prompt (`stadium_assist`)
The AI acts as a friendly venue concierge:
- **Crowd Routing**: Guides spectators away from "critical" density stands.
- **F&B Recommendations**: Compares wait times across concession stands and guides the fan to the fastest choice.
- **Accessibility Filtering**: If the fan requires wheelchair accessibility, it only suggests facilities marked `is_accessible = True` and details elevator/ramp paths.
- **Emergency Guidance**: Detects trigger phrases (e.g., `sos`, `hurt`, `fire`) and provides immediate exit paths and coordinates of the closest medical first-aid tent.

### B. Volunteer Dashboard Assistant (`volunteer_intelligence`)
The AI supports staff managing operations:
- **SOP Guide**: Explains standard operating checklists for reported incidents.
- **Micro-tasks**: Assigns action checklists to resolve issues quickly.
- **Direct Translation**: Translates spectator queries to help volunteers communicate with international fans.

### C. Organizer Console Assistant (`operations_command`)
The AI acts as a strategic operations advisor:
- **Resource Reallocations**: Identifies capacity bottlenecks (e.g., critical density at Gate G) and recommends moving staff from low-density concourses.
- **Public PA Broadcasts**: Automatically generates clear public address script translations (English/Spanish/French) tailored to emergency contexts.

---

## 3. Intelligent Local Fallback Engine

To guarantee that the application remains functional during hackathon reviews without requiring active OpenAI API Keys, the backend implements an **Offline Context-Aware Fallback Engine** (`backend/services/ai_service.py`):

1. **API Key Verification**: On bootstrap, `AIService` checks for a valid, non-placeholder `OPENAI_API_KEY`. If invalid, it enters **Fallback Mode**.
2. **Message Parser**: The fallback engine uses keyword matching (`restroom`, `food`, `sos`, `route`) to classify user intent.
3. **Live Context Merging**: It fetches live SQL metrics from the database (e.g., nearest restrooms and their current wait times) and constructs a natural-sounding, highly detailed response.
4. **Mock Suggestions**: It provides appropriate next-step action suggestion chips (e.g., "Show restroom route", "Find less crowded area").
