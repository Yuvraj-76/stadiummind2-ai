import json
from typing import List, Optional
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from core.config import settings
from models.stadium import Zone, Facility, LiveAlert, Incident, VolunteerTask, Profile
from schemas.stadium import ChatRequest, ChatResponse, AnnouncementCreate, AnnouncementResponse


class AIService:
    """Orchestrates AI prompt engineering, context injection, and LLM integrations."""

    def __init__(self, db: Session):
        self.db = db
        # Handle OpenAI client initialization
        is_mock_key = (
            not settings.OPENAI_API_KEY
            or "your-openai" in settings.OPENAI_API_KEY.lower()
            or settings.OPENAI_API_KEY == ""
        )
        if is_mock_key:
            self.client = None
        else:
            try:
                self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception:
                self.client = None

    def get_stadium_context(
        self,
        role: str,
        zone_id: Optional[str] = None,
        accessibility_requirements: Optional[List[str]] = None,
    ) -> dict:
        """Queries the database for real-time stadium metrics to inject into prompts."""
        context = {
            "zone_name": "Unknown Zone",
            "density_level": "normal",
            "current_crowd": 0,
            "capacity": 0,
            "facilities_list": [],
            "alerts_list": [],
            "active_incidents": [],
        }

        # 1. Zone Information
        if zone_id:
            zone = self.db.query(Zone).filter(Zone.id == zone_id).first()
            if zone:
                context["zone_name"] = zone.name
                context["density_level"] = zone.density_level
                context["current_crowd"] = zone.current_crowd_count
                context["capacity"] = zone.capacity

                # Fetch facilities in this zone
                facilities = self.db.query(Facility).filter(Facility.zone_id == zone_id).all()
                for fac in facilities:
                    # Filter based on accessibility if user requires it
                    is_wheelchair = accessibility_requirements and "wheelchair" in accessibility_requirements
                    if is_wheelchair and not fac.is_accessible:
                        continue
                    context["facilities_list"].append(
                        f"- {fac.name} (Type: {fac.type}, Status: {fac.status}, Wait: {fac.wait_time_minutes}m, Accessible: {fac.is_accessible})"
                    )

        # 2. Live Alerts
        alerts = self.db.query(LiveAlert).filter(
            (LiveAlert.target_role == "all") | (LiveAlert.target_role == role)
        ).all()
        for alert in alerts:
            context["alerts_list"].append(f"- [{alert.severity.upper()}] {alert.title}: {alert.message}")

        # 3. Incidents (only for organizers & volunteers)
        if role in ["volunteer", "organizer"]:
            incidents = self.db.query(Incident).filter(Incident.status != "resolved").all()
            for inc in incidents:
                context["active_incidents"].append(
                    f"- Incident '{inc.title}' in {inc.zone_id} (Severity: {inc.severity}, Status: {inc.status}, AI Summary: {inc.ai_summary})"
                )

        return context

    async def chat_copilot(self, request: ChatRequest) -> ChatResponse:
        """Handles context-aware chat prompts for fans, volunteers, and organizers."""
        # 1. Gather real-time context
        context = self.get_stadium_context(
            role=request.role,
            zone_id=request.current_zone_id,
            accessibility_requirements=request.accessibility_requirements,
        )

        # 2. Select appropriate system prompt based on user role
        system_prompt = self._build_system_prompt(request, context)

        # 3. Call OpenAI or fall back to Context-Aware Mock Generator
        if self.client:
            try:
                response = await self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL_NAME,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": request.message},
                    ],
                    temperature=0.7,
                    max_tokens=600,
                )
                response_text = response.choices[0].message.content
                suggestions = self._generate_suggestions_from_llm(request, response_text)
                return ChatResponse(response=response_text, suggestions=suggestions)
            except Exception as e:
                # Log error and trigger fallback
                print(f"OpenAI API call failed: {e}. Running fallback generator.")

        # Trigger Context-Aware Fallback Engine
        return self._generate_fallback_response(request, context)

    async def generate_announcement(self, request: AnnouncementCreate) -> AnnouncementResponse:
        """AI Announcement Generator for Organizers to broadcast alerts."""
        zone_info = ""
        if request.zone_id:
            zone = self.db.query(Zone).filter(Zone.id == request.zone_id).first()
            if zone:
                zone_info = f"in {zone.name} (Crowd density: {zone.density_level})"

        prompt = (
            f"Generate a stadium announcement broadcast based on this event context:\n"
            f"Context: {request.event_context} {zone_info}\n"
            f"Target Audience: {request.target_role}\n"
            f"Tone: {request.tone}\n"
            f"Language: {request.language}\n"
            f"The announcement should be clear, authoritative, and suitable for display screens and PA systems."
        )

        if self.client:
            try:
                response = await self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL_NAME,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are the Stadium Operations AI Public Address announcer. Draft announcements that are concise and clear.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.6,
                )
                return AnnouncementResponse(generated_text=response.choices[0].message.content)
            except Exception as e:
                print(f"OpenAI API Announcement failed: {e}. Using fallback.")

        # Fallback Announcement Generator
        lang_prefix = {
            "en": "ANNOUNCEMENT: ",
            "es": "ANUNCIO: ",
            "fr": "ANNONCE: ",
        }.get(request.language.lower(), "ANNOUNCEMENT: ")

        alert_msg = f"{lang_prefix}Attention {request.target_role.upper()} in {zone_info or 'the stadium'}. {request.event_context} Please follow safety guidelines and staff instructions."
        if request.tone == "urgent":
            alert_msg = f"⚠️ URGENT: {alert_msg}"
        return AnnouncementResponse(generated_text=alert_msg)

    async def translate_text(self, text: str, target_lang: str) -> str:
        """Translates fan inquiries for volunteers."""
        if self.client:
            try:
                response = await self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL_NAME,
                    messages=[
                        {
                            "role": "system",
                            "content": f"You are a professional real-time translator for the FIFA World Cup. Translate the input text directly into language code '{target_lang}'. Output ONLY the translation, no extra comments.",
                        },
                        {"role": "user", "content": text},
                    ],
                    temperature=0.3,
                )
                return response.choices[0].message.content.strip()
            except Exception:
                pass

        # Mock translator
        translations = {
            "es": {
                "where is the restroom?": "¿Dónde está el baño?",
                "i need medical help": "Necesito ayuda médica",
                "is gate g open?": "¿Está abierta la puerta G?",
                "where is section 104?": "¿Dónde está la sección 104?",
            },
            "fr": {
                "where is the restroom?": "Où sont les toilettes?",
                "i need medical help": "J'ai besoin d'une assistance médicale",
                "is gate g open?": "Est-ce que la porte G est ouverte?",
                "where is section 104?": "Où se trouve la section 104?",
            },
        }
        text_lower = text.strip().lower()
        lang = target_lang.lower()
        if lang in translations and text_lower in translations[lang]:
            return translations[lang][text_lower]
        return f"[Translated to {target_lang}]: {text}"

    def _build_system_prompt(self, request: ChatRequest, context: dict) -> str:
        """Creates detailed, role-specific system prompts with injected context."""
        facilities_str = "\n".join(context["facilities_list"]) or "No nearby facilities listed."
        alerts_str = "\n".join(context["alerts_list"]) or "No active alerts."

        if request.role == "fan":
            return (
                f"You are StadiumAssist, the official GenAI Fan Copilot for the FIFA World Cup 2026.\n"
                f"You are helping a Fan inside the stadium.\n"
                f"=== CURRENT LIVE CONTEXT ===\n"
                f"- Stadium Zone: {context['zone_name']}\n"
                f"- Zone Crowd Density: {context['density_level']} (current crowd: {context['current_crowd']}/{context['capacity']})\n"
                f"- User Seat Location: {request.seat or 'Not set'}\n"
                f"- User Accessibility Requirements: {', '.join(request.accessibility_requirements) or 'None'}\n"
                f"- Facilities in this zone:\n{facilities_str}\n"
                f"- Live Broadcast Alerts:\n{alerts_str}\n"
                f"=============================\n"
                f"Guidelines:\n"
                f"1. Be friendly, welcoming, and respond in the requested language: {request.preferred_language}.\n"
                f"2. Always cross-reference the facilities in the context. If the user asks for a restroom or food, guide them to the one in their zone with the lowest wait time.\n"
                f"3. If they require accessibility, ONLY recommend facilities with 'Accessible: True'.\n"
                f"4. If crowd density is 'critical' or 'high', recommend quieter zones or ask them to wait or use alternative concourses.\n"
                f"5. If they ask about emergencies/SOS/fire/safety, give clear safety steps and point them to 'First Aid' locations or the nearest open gate."
            )

        elif request.role == "volunteer":
            incidents_str = "\n".join(context["active_incidents"]) or "No active incidents."
            return (
                f"You are Volunteer Intelligence Copilot for the FIFA World Cup 2026.\n"
                f"You support volunteers managing operations.\n"
                f"=== OPERATIONS CONTEXT ===\n"
                f"- Assigned Stadium Zone: {context['zone_name']}\n"
                f"- Active Incidents:\n{incidents_str}\n"
                f"- Broadcast Alerts:\n{alerts_str}\n"
                f"==========================\n"
                f"Guidelines:\n"
                f"1. Assist the volunteer with standard operating procedures (SOPs) based on reported incidents.\n"
                f"2. Keep communications professional, actionable, and clear. Help them execute tasks quickly.\n"
                f"3. Provide step-by-step guidance for tasks like crowd management, scanning failure re-routing, or incident reporting."
            )

        else:  # organizer
            incidents_str = "\n".join(context["active_incidents"]) or "No active incidents."
            return (
                f"You are the Operations Decision Support AI for FIFA World Cup 2026 organizers.\n"
                f"You are assisting tournament operations coordinators.\n"
                f"=== REAL-TIME METRICS ===\n"
                f"- Active Incidents:\n{incidents_str}\n"
                f"- Live Alerts:\n{alerts_str}\n"
                f"==========================\n"
                f"Guidelines:\n"
                f"1. Provide analytical, data-driven decisions and resource recommendations (e.g. reallocating volunteers).\n"
                f"2. Draft incident summaries and suggest crowd control rerouting options.\n"
                f"3. Help synthesize operations status reports for stadium managers."
            )

    def _generate_suggestions_from_llm(self, request: ChatRequest, response_text: str) -> List[str]:
        """Generates dynamic quick-reply suggestion chips based on LLM response."""
        suggestions = []
        response_lower = response_text.lower()

        if request.role == "fan":
            if "restroom" in response_lower or "toilet" in response_lower:
                suggestions.extend(["Show restrooms on map", "Is there a shorter wait restroom?", "Accessible toilets near me"])
            elif "food" in response_lower or "eat" in response_lower or "cafe" in response_lower:
                suggestions.extend(["Show food stands", "Fastest food option", "Any vegan food?"])
            elif "gate" in response_lower or "outage" in response_lower:
                suggestions.extend(["Find exit routes", "Show alternative gates"])
            else:
                suggestions.extend(["Nearest restroom", "F&B wait times", "My seat route"])

        elif request.role == "volunteer":
            suggestions.extend(["Check SOP checklist", "Translate customer request", "Report new incident"])

        elif request.role == "organizer":
            suggestions.extend(["Generate PA Announcement", "Recommend resource allocation", "Show incident timeline"])

        return suggestions[:3]

    def _generate_fallback_response(self, request: ChatRequest, context: dict) -> ChatResponse:
        """Context-Aware Rule-Based Fallback Generator for offline or mock API runs."""
        msg = request.message.lower()
        role = request.role
        zone_name = context["zone_name"]
        density = context["density_level"]
        alerts = context["alerts_list"]

        # Fan Fallback
        if role == "fan":
            # Emergency query
            if any(w in msg for w in ["sos", "emergency", "fire", "hurt", "police", "medical", "doctor"]):
                first_aid = "First Aid Station Gate A (Zone A, location x=15, y=20)"
                resp = (
                    f"🚨 **EMERGENCY ASSISTANCE INITIATED** 🚨\n\n"
                    f"Please remain calm. Medical and security services have been notified of your location in **{zone_name}**.\n\n"
                    f"**Immediate Instructions:**\n"
                    f"1. Walk toward the nearest exit gate. Gate A is located nearby in Zone A.\n"
                    f"2. The nearest medical assistance is at **{first_aid}**.\n"
                    f"3. Follow instructions from the stadium safety volunteers wearing bright green vests."
                )
                return ChatResponse(
                    response=resp,
                    suggestions=["I am safe now", "Call emergency number", "Show medical route"],
                )

            # Restroom query
            if "restroom" in msg or "toilet" in msg or "bathroom" in msg:
                # Find restrooms in facilities
                restrooms = [
                    f for f in self.db.query(Facility).filter(Facility.type == "restroom").all()
                    if not (request.accessibility_requirements and "wheelchair" in request.accessibility_requirements) or f.is_accessible
                ]
                if request.current_zone_id:
                    # Filter by current zone first
                    local_restrooms = [r for r in restrooms if r.zone_id == request.current_zone_id]
                    if local_restrooms:
                        best = min(local_restrooms, key=lambda r: r.wait_time_minutes)
                        resp = (
                            f"🚻 In **{zone_name}**, the nearest restroom is **{best.name}**.\n"
                            f"- **Status:** {best.status}\n"
                            f"- **Estimated Wait:** {best.wait_time_minutes} minutes\n"
                            f"- **Accessibility:** {'Wheelchair Accessible' if best.is_accessible else 'Standard only'}\n\n"
                            f"Crowd density in this stand is currently **{density}**. Let me know if you'd like a route to a restroom in a quieter zone!"
                        )
                        return ChatResponse(
                            response=resp,
                            suggestions=["Route to this restroom", "Find less crowded restroom", "Filter accessible only"],
                        )
                resp = (
                    "🚻 Standard restrooms are located across all concourse gates.\n"
                    "The East concourse restrooms currently have elevated wait times (20+ minutes) due to high stand density.\n"
                    "I recommend using the North Concourse restrooms (wait time ~3 mins) for a faster visit."
                )
                return ChatResponse(
                    response=resp,
                    suggestions=["North Restrooms Route", "Show restroom list", "F&B wait times"],
                )

            # Food/Beer query
            if any(w in msg for w in ["food", "eat", "cafe", "beer", "drink", "taco", "burger"]):
                foods = self.db.query(Facility).filter(Facility.type == "food").all()
                if request.current_zone_id:
                    local_food = [f for f in foods if f.zone_id == request.current_zone_id]
                    if local_food:
                        best = min(local_food, key=lambda f: f.wait_time_minutes)
                        resp = (
                            f"🍔 Hungry in **{zone_name}**? You can visit **{best.name}**.\n"
                            f"- **Wait Time:** ~{best.wait_time_minutes} minutes\n"
                            f"- **Status:** {best.status}\n\n"
                            f"Recommendation: Grab food now, as lines are expected to swell as halftime approaches!"
                        )
                        return ChatResponse(
                            response=resp,
                            suggestions=["Route to food", "Show all menus", "Halftime wait warnings"],
                        )
                resp = (
                    "🍔 F&B concession stands are located throughout the concourse level.\n"
                    "- *Taco Express East (Zone B)*: Wait is currently 25m (High density)\n"
                    "- *FIFA Fan Cafe North (Zone A)*: Wait is currently 8m (Low density)\n"
                    "- *Stadium Burgers South (Zone C)*: Wait is currently 12m"
                )
                return ChatResponse(
                    response=resp,
                    suggestions=["FIFA Fan Cafe Route", "Stadium Burgers Route", "Show nearby map"],
                )

            # Navigation query
            if any(w in msg for w in ["seat", "route", "navigate", "find", "map", "gate", "go to"]):
                resp = (
                    f"🗺️ **Indoor Navigational Guidance:**\n\n"
                    f"To reach your seat **{request.seat or 'Section 104'}** from your current zone **{zone_name}**:\n"
                    f"1. Walk along the main concourse toward the signs for Section 100-110.\n"
                    f"2. Proceed past concession stand *{'Taco Express' if 'East' in zone_name else 'FIFA Fan Cafe'}*.\n"
                    f"3. Enter seating tunnel 104. Volunteers at Sector entrance will scan your digital ticket.\n\n"
                    f"*Note: Your path is fully {'wheelchair accessible' if 'wheelchair' in request.accessibility_requirements else 'clear and open'}.*"
                )
                return ChatResponse(
                    response=resp,
                    suggestions=["Highlight path on map", "Nearest escalator", "Report an obstacle"],
                )

            # Default Fan Help
            alert_summary = f"Active Alert: {alerts[0]}" if alerts else "No active alerts in this zone."
            resp = (
                f"Hello! I am StadiumAssist, your FIFA World Cup 2026 operations copilot. 🏆\n"
                f"You are in **{zone_name}** (Crowd density: **{density}**).\n"
                f"Seat: {request.seat or 'Not registered'}.\n\n"
                f"How can I assist you today? You can ask me for toilet wait times, closest food, directions to your seat, or SOS help."
            )
            return ChatResponse(
                response=resp,
                suggestions=["Nearest restroom", "Where is my seat?", "Food wait times"],
            )

        # Volunteer Fallback
        elif role == "volunteer":
            if "sop" in msg or "checklist" in msg or "incident" in msg or "outage" in msg or "leak" in msg:
                # Find active incident
                incidents = self.db.query(Incident).filter(Incident.status != "resolved").all()
                if incidents:
                    inc = incidents[0]
                    steps_list = "\n".join([f"{i+1}. {step}" for i, step in enumerate(inc.sop_steps or [])])
                    resp = (
                        f"📋 **Standard Operating Procedure (SOP) Checklist**\n"
                        f"Subject: **{inc.title}** (Severity: {inc.severity})\n\n"
                        f"Please follow these operational steps immediately:\n"
                        f"{steps_list}\n\n"
                        f"Need specific task allocation? Ask me to assign resources."
                    )
                    return ChatResponse(
                        response=resp,
                        suggestions=["Mark SOP completed", "Log task progress", "Broadcast update"],
                    )
            # Default Volunteer Help
            resp = (
                f"Welcome Elena. You are supporting **{zone_name}**.\n\n"
                f"**Active Operations Dashboard Guide:**\n"
                f"- To translate a fan's question, type: `Translate: [text]`\n"
                f"- To request a standard operating checklist, type: `SOP [Incident Name]`\n"
                f"- To report a facility issue, use the reporting form on the right.\n\n"
                f"Let me know if you require incident assistance."
            )
            return ChatResponse(
                response=resp,
                suggestions=["Check active tasks", "Translate: Where is exit?", "Report scanner freeze"],
            )

        # Organizer Fallback
        else:
            if "resource" in msg or "staff" in msg or "allocate" in msg:
                resp = (
                    "📈 **Resource Optimization Recommendation**\n\n"
                    "Based on critical crowd density in the West Stand (Zone D - 7,900 fans):\n"
                    "1. **Reallocate 4 volunteers** from North Concourse (Zone A - Low density, 1,200 fans) to West Stand Gate G entrance to manage crowd queues.\n"
                    "2. **Deploy 2 crowd coordinators** with megaphones to direct external flows toward Gate H.\n"
                    "3. Dispatch maintenance crew B-3 to check scanning terminals status."
                )
                return ChatResponse(
                    response=resp,
                    suggestions=["Approve reallocation", "Generate PA Broadcast", "View volunteer locations"],
                )
            if "announcement" in msg or "generate" in msg:
                resp = (
                    "📢 **Generated PA Broadcast Draft**\n\n"
                    "**Screen Message:** 'Gate G experiencing software delays. Please use Gate H for instant entry. Volunteers are ready to assist.'\n"
                    "**PA Script:** 'Attention all incoming fans: to minimize entry wait times, please follow the signs and volunteer directions to enter through Gate H. Gate G is currently experiencing technical delays. Thank you.'\n"
                )
                return ChatResponse(
                    response=resp,
                    suggestions=["Broadcast to Fan App", "Send to PA operators", "Translate to Spanish"],
                )

            # Default Organizer Help
            resp = (
                f"Stadium Management Console Active. Operational Intelligence is online.\n\n"
                f"**Key Focus Areas:**\n"
                f"- **West Stand (Zone D)** is at **critical capacity** (98% load).\n"
                f"- Ticket scanner software outage is reported at **Gate G**.\n"
                f"- Recommended Action: Reroute external flows. Reallocate volunteer resources.\n\n"
                f"Ask me for: 'Recommend resource allocation' or 'Draft Gate G announcement'."
            )
            return ChatResponse(
                response=resp,
                suggestions=["Recommend resources", "Generate announcement", "Summarize incidents"],
            )
