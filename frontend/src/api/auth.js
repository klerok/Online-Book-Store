const API_BASE = "http://localhost:3000";

export async function register(
  username,
  email,
  password,
  password_confirmation
) {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ username, email, password, password_confirmation }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Failed to register");
  }

  return response.json();
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Failed to login");
  }

  return response.json();
}

export async function me() {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 401) return null;
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error || data.message || "Failed to fetch current user"
    );
  }
  return response.json();
}

export async function logout() {
  const response = await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Failed to logout");
  }

  return response.json();
}

export async function logoutAll() {
  const response = await fetch(`${API_BASE}/api/auth/logout-all`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error || data.message || "Failed to logout from all devices"
    );
  }

  return response.json();
}
