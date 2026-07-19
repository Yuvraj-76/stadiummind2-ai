export interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
}

export async function fetchHealthStatus(): Promise<HealthStatus> {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
  const response = await fetch(`${backendUrl}/health`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
