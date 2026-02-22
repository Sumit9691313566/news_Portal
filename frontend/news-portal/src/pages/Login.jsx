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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // 🔹 SAFE JSON PARSE
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      // ❌ LOGIN FAILED
      if (!res.ok) {
        alert(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // ✅ LOGIN SUCCESS
      if (!data.token) {
        alert("Token not received from server");
        setLoading(false);
        return;
      }

      localStorage.setItem("adminToken", data.token);
      alert("Login successful ✅");
      navigate("/admin-dashboard");
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      alert("Server error, try again");
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
          width: "320px",
          padding: "25px",
          borderRadius: "8px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
          background: "#fff",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Admin Login
        </h2>

        <input
          type="email"
          placeholder="Admin Email"
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
