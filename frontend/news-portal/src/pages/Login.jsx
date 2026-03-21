import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithTimeout } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Email aur password dono bharo");
      return;
    }

    try {
      setLoading(true);
      const res = await fetchWithTimeout("auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        const msg = data?.message || res.statusText || "Login failed";
        alert(`Login failed: ${msg}`);
        return;
      }

      if (!data?.token) {
        alert("Token not received from server");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminRole", data?.admin?.role || "sub-admin");
      localStorage.setItem("adminName", data?.admin?.name || "Admin");
      localStorage.setItem("adminEmail", data?.admin?.email || "");

      if (data?.admin?.role === "main-admin") {
        navigate("/main-admin", { replace: true });
      } else if (data?.admin?.role === "reporter") {
        navigate("/reporter-dashboard", { replace: true });
      } else {
        navigate("/admin-dashboard", { replace: true });
      }
    } catch (error) {
      alert(`Server error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "340px",
          padding: "25px",
          borderRadius: "8px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
          background: "#fff",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Portal Login
        </h2>
        <p style={{ textAlign: "center", marginBottom: "16px", color: "#555" }}>
         
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            background: "#f1f1f1",
            color: "#222",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Back to Home
        </button>

        <input
          type="text"
          placeholder="Admin ID or Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            background: "#0073e6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Backend status removed from UI per request */}
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};
