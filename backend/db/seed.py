import json
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.session import Base, engine
from models.stadium import Profile, Zone, Facility, Incident, VolunteerTask, LiveAlert

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def seed_db():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Zone).first() is not None:
            print("Database already contains data. Skipping seeding.")
            return

        print("Seeding database with Stadium Operations context...")

        # 1. Zones
        zones = [
            Zone(
                id="zone-a",
                name="North Concourse (Gate A & B)",
                capacity=8000,
                current_crowd_count=1200,
                density_level="low",
            ),
            Zone(
                id="zone-b",
                name="East Stand (Gate C & D)",
                capacity=9000,
                current_crowd_count=7800,
                density_level="high",
            ),
            Zone(
                id="zone-c",
                name="South Concourse (Gate E & F)",
                capacity=8000,
                current_crowd_count=3200,
                density_level="medium",
            ),
            Zone(
                id="zone-d",
                name="West Stand (Gate G & H)",
                capacity=8000,
                current_crowd_count=7900,
                density_level="critical",
            ),
            Zone(
                id="zone-vip",
                name="VIP & Executive Suites",
                capacity=2000,
                current_crowd_count=600,
                density_level="low",
            ),
            Zone(
                id="zone-press",
                name="Press Center & Media Zone",
                capacity=1000,
                current_crowd_count=400,
                density_level="low",
            ),
            Zone(
                id="zone-field",
                name="Field & Player Tunnels",
                capacity=500,
                current_crowd_count=150,
                density_level="low",
            ),
            Zone(
                id="zone-transit",
                name="External Transit Hub & Plaza",
                capacity=15000,
                current_crowd_count=6500,
                density_level="medium",
            ),
        ]
        db.add_all(zones)
        db.commit()
        print(f"Added {len(zones)} stadium zones.")

        # 2. Facilities
        facilities = [
            # Restrooms
            Facility(
                id="restroom-a1",
                name="Restroom Block North A",
                type="restroom",
                zone_id="zone-a",
                is_accessible=True,
                status="open",
                wait_time_minutes=3,
                location_x=25.0,
                location_y=15.0,
            ),
            Facility(
                id="restroom-b1",
                name="Restroom Block East B",
                type="restroom",
                zone_id="zone-b",
                is_accessible=True,
                status="crowded",
                wait_time_minutes=22,
                location_x=75.0,
                location_y=45.0,
            ),
            Facility(
                id="restroom-c1",
                name="Restroom Block South C",
                type="restroom",
                zone_id="zone-c",
                is_accessible=True,
                status="open",
                wait_time_minutes=8,
                location_x=45.0,
                location_y=85.0,
            ),
            Facility(
                id="restroom-d1",
                name="Restroom Block West D (No Ramps)",
                type="restroom",
                zone_id="zone-d",
                is_accessible=False,
                status="crowded",
                wait_time_minutes=35,
                location_x=15.0,
                location_y=55.0,
            ),
            # Food
            Facility(
                id="food-a1",
                name="FIFA Fan Cafe North",
                type="food",
                zone_id="zone-a",
                is_accessible=True,
                status="open",
                wait_time_minutes=8,
                location_x=30.0,
                location_y=25.0,
            ),
            Facility(
                id="food-b1",
                name="Taco Express East",
                type="food",
                zone_id="zone-b",
                is_accessible=True,
                status="crowded",
                wait_time_minutes=25,
                location_x=80.0,
                location_y=50.0,
            ),
            Facility(
                id="food-c1",
                name="Stadium Burgers South",
                type="food",
                zone_id="zone-c",
                is_accessible=True,
                status="open",
                wait_time_minutes=12,
                location_x=50.0,
                location_y=75.0,
            ),
            Facility(
                id="food-d1",
                name="Pretzel & Beer West",
                type="food",
                zone_id="zone-d",
                is_accessible=True,
                status="open",
                wait_time_minutes=15,
                location_x=10.0,
                location_y=45.0,
            ),
            # First Aid
            Facility(
                id="medical-a1",
                name="First Aid Station Gate A",
                type="first_aid",
                zone_id="zone-a",
                is_accessible=True,
                status="open",
                wait_time_minutes=0,
                location_x=15.0,
                location_y=20.0,
            ),
            Facility(
                id="medical-c1",
                name="First Aid Station Gate E",
                type="first_aid",
                zone_id="zone-c",
                is_accessible=True,
                status="open",
                wait_time_minutes=0,
                location_x=40.0,
                location_y=90.0,
            ),
            # Gates
            Facility(
                id="gate-a",
                name="Gate A (Entry/Exit)",
                type="gate",
                zone_id="zone-a",
                is_accessible=True,
                status="open",
                wait_time_minutes=2,
                location_x=20.0,
                location_y=5.0,
            ),
            Facility(
                id="gate-c",
                name="Gate C (Entry/Exit)",
                type="gate",
                zone_id="zone-b",
                is_accessible=True,
                status="open",
                wait_time_minutes=15,
                location_x=90.0,
                location_y=40.0,
            ),
            Facility(
                id="gate-e",
                name="Gate E (Entry/Exit)",
                type="gate",
                zone_id="zone-c",
                is_accessible=True,
                status="open",
                wait_time_minutes=5,
                location_x=50.0,
                location_y=95.0,
            ),
            Facility(
                id="gate-g",
                name="Gate G (Entry/Exit)",
                type="gate",
                zone_id="zone-d",
                is_accessible=True,
                status="open",
                wait_time_minutes=40,
                location_x=5.0,
                location_y=50.0,
            ),
        ]
        db.add_all(facilities)
        db.commit()
        print(f"Added {len(facilities)} facilities.")

        # 3. Profiles
        profiles = [
            Profile(
                id="mock-fan",
                email="fan@stadiummind.com",
                full_name="Yuvraj Singh",
                role="fan",
                preferences={
                    "seat_label": "Section 104, Row L, Seat 12",
                    "accessible_needs": ["wheelchair"],
                    "preferred_language": "en",
                },
            ),
            Profile(
                id="mock-volunteer",
                email="volunteer@stadiummind.com",
                full_name="Elena Rostova",
                role="volunteer",
                preferences={
                    "assigned_zone": "zone-a",
                    "languages": ["en", "es", "ru"],
                    "shift_start": "18:00",
                },
            ),
            Profile(
                id="mock-organizer",
                email="organizer@stadiummind.com",
                full_name="Gianni Infantino",
                role="organizer",
                preferences={
                    "department": "Tournament Operations",
                    "security_clearance": "level-3",
                },
            ),
        ]
        db.add_all(profiles)
        db.commit()
        print(f"Added {len(profiles)} profiles.")

        # 4. Incidents
        incidents = [
            Incident(
                id="incident-1",
                reporter_id="mock-volunteer",
                title="Water Leakage Near Gate C",
                description="A major pipe leak is causing wet floors and slowing down foot traffic in Zone B near Gate C.",
                zone_id="zone-b",
                severity="medium",
                status="investigating",
                ai_summary="Water pipe leak detected in Zone B (East Concourse) near Gate C. Maintenance notified. Wet floor signs requested.",
                sop_steps=[
                    "Locate and close water main control valve in Sector B.",
                    "Deploy high-visibility wet floor signs around affected concourse area.",
                    "Coordinate with crowd control to redirect fan queue away from the leak.",
                    "Verify pipe repair work is complete before reopening the walkway.",
                ],
                created_at=datetime.now() - timedelta(minutes=45),
            ),
            Incident(
                id="incident-2",
                reporter_id="mock-volunteer",
                title="Congestion Spike at Gate G Entrance",
                description="Ticket scanner terminal software freeze causing major queue build-ups and fan frustration at Gate G.",
                zone_id="zone-d",
                severity="high",
                status="reported",
                ai_summary="Ticket scanner software failure at Gate G. Peak queue length reached 300+ fans. Average entry wait time is now 40 minutes.",
                sop_steps=[
                    "Instruct IT Support to reboot Gate G network scanner terminals.",
                    "Deploy 3 volunteer coordinators with megaphones to direct tail of queue to Gate H.",
                    "Switch affected entry lanes to manual barcode/ID inspection.",
                    "Broadcast alert notification on the Stadium Fan App to avoid Gate G.",
                ],
                created_at=datetime.now() - timedelta(minutes=20),
            ),
        ]
        db.add_all(incidents)
        db.commit()
        print(f"Added {len(incidents)} active incidents.")

        # 5. Volunteer Tasks
        tasks = [
            VolunteerTask(
                id="task-1",
                title="Deploy wet floor signs near Gate C",
                description="Take two yellow warning signs from maintenance room B-12 and place them at the start of the Gate C concourse walkway.",
                assigned_to="mock-volunteer",
                incident_id="incident-1",
                status="in_progress",
                created_at=datetime.now() - timedelta(minutes=30),
            ),
            VolunteerTask(
                id="task-2",
                title="Redirect Queue Tail at Gate G",
                description="Navigate to Gate G and stand at the queue split point. Use a megaphone to guide incoming fans to the under-capacity Gate H.",
                assigned_to="mock-volunteer",
                incident_id="incident-2",
                status="pending",
                created_at=datetime.now() - timedelta(minutes=15),
            ),
        ]
        db.add_all(tasks)
        db.commit()
        print(f"Added {len(tasks)} volunteer tasks.")

        # 6. Live Alerts
        alerts = [
            LiveAlert(
                id="alert-1",
                title="Gate G Technical Outage",
                message="Entrance Gate G is experiencing technical delays. Please route to Gate H for expedited stadium entry.",
                target_role="all",
                zone_id="zone-d",
                severity="warning",
                created_at=datetime.now() - timedelta(minutes=18),
                expires_at=datetime.now() + timedelta(hours=2),
            ),
            LiveAlert(
                id="alert-2",
                title="East Concourse Peak Capacity",
                message="East Stand Concourse (Zone B) is currently experiencing very high density. F&B vendors have long wait times. Consider using South Concourse.",
                target_role="all",
                zone_id="zone-b",
                severity="info",
                created_at=datetime.now() - timedelta(minutes=10),
                expires_at=datetime.now() + timedelta(hours=1),
            ),
            LiveAlert(
                id="alert-3",
                title="High Crowd Density Warning: West Stand",
                message="West Stand (Zone D) is reporting critical density. Standing room limits reached. Prepare to close Gate G and direct flows.",
                target_role="organizer",
                zone_id="zone-d",
                severity="critical",
                created_at=datetime.now() - timedelta(minutes=5),
            ),
        ]
        db.add_all(alerts)
        db.commit()
        print(f"Added {len(alerts)} active alerts.")

        print("Database successfully seeded!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
