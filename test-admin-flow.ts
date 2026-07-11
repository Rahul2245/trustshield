import axios from "axios";

async function testAdminFlow() {
  const api = axios.create({
    baseURL: "http://localhost:3000",
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  try {
    console.log("1. Logging in as admin...");
    const loginRes = await api.post("/api/v1/auth/admin-login", {
      email: "admin@trustshield.io",
      password: "Admin@Trust123"
    });
    
    console.log("Login success!", loginRes.data);
    const accessToken = loginRes.data.data.tokens.accessToken;
    console.log("Access Token:", accessToken);

    const cookies = loginRes.headers['set-cookie'];
    console.log("Set-Cookie Header:", cookies);

    console.log("2. Fetching dashboard stats...");
    const statsRes = await api.get("/api/v1/admin/stats", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log("Stats success!", statsRes.data);

    console.log("3. Testing refresh...");
    // Manually pass the cookie to the refresh endpoint since axios in node doesn't auto-send it
    const refreshRes = await api.post("/api/v1/auth/refresh", {}, {
      headers: { Cookie: cookies[0] }
    });
    console.log("Refresh success!", refreshRes.data);

  } catch (err: any) {
    console.error("Test failed:", err.response?.status, err.response?.data);
  }
}

testAdminFlow();
