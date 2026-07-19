import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.session import Base, get_db
from main import app
from models.stadium import Zone, Facility, Profile, Incident, VolunteerTask, LiveAlert

from sqlalchemy.pool import StaticPool

# Set up in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed mock data for unit testing
    zone_a = Zone(
        id="zone-a",
        name="North Concourse",
        capacity=5000,
        current_crowd_count=1000,
        density_level="low",
    )
    zone_b = Zone(
        id="zone-b",
        name="East Stand",
        capacity=6000,
        current_crowd_count=5800,
        density_level="high",
    )
    db.add_all([zone_a, zone_b])
    db.commit()

    toilet = Facility(
        id="restroom-t1",
        name="Restroom Test 1",
        type="restroom",
        zone_id="zone-a",
        is_accessible=True,
        status="open",
        wait_time_minutes=3,
        location_x=10.0,
        location_y=20.0,
    )
    db.add(toilet)

    mock_profile = Profile(
        id="mock-volunteer",
        email="test-vol@stadiummind.com",
        role="volunteer",
        full_name="Test Volunteer",
    )
    db.add(mock_profile)
    db.commit()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    del app.dependency_overrides[get_db]


# ----------------------------------------------------
# API Tests
# ----------------------------------------------------
def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_list_zones(client):
    response = client.get("/api/zones")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == "zone-a"
    assert data[1]["density_level"] == "high"


def test_list_facilities(client):
    response = client.get("/api/facilities?zone_id=zone-a")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "restroom"
    assert data[0]["is_accessible"] is True


def test_report_incident(client):
    payload = {
        "title": "Scanner Freeze",
        "description": "Scanner lanes are frozen due to connection issue.",
        "zone_id": "zone-a",
        "severity": "medium",
    }
    response = client.post("/api/incidents", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Scanner Freeze"
    assert data["status"] == "reported"
    assert "ai_summary" in data
    assert len(data["sop_steps"]) > 0


def test_ai_chat_fallback(client):
    payload = {
        "message": "Where is the restroom?",
        "role": "fan",
        "current_zone_id": "zone-a",
        "accessibility_requirements": ["wheelchair"],
    }
    response = client.post("/api/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "🚻" in data["response"] or "restroom" in data["response"].lower()
    assert len(data["suggestions"]) > 0


def test_ai_translate(client):
    payload = {
        "text": "where is the restroom?",
        "target_language": "es",
    }
    response = client.post("/api/ai/translate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "¿dónde está el baño?" in data["translated_text"].lower()


def test_ai_announcement(client):
    payload = {
        "event_context": "scanner delay at gate g",
        "target_role": "all",
        "tone": "urgent",
        "language": "en",
    }
    response = client.post("/api/ai/announcement", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "ANNOUNCEMENT" in data["generated_text"]
    assert "gate g" in data["generated_text"].lower()
