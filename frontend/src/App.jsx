
import { useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/users";

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();

    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "The server did not return JSON. Check the backend API route."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setMessage(data.message || "Registration successful!");
      setName("");
      setEmail("");
    } catch (error) {
      setIsError(true);

      if (error.message === "Failed to fetch") {
        setMessage(
          "Cannot connect to the backend. Make sure the server is running on port 5000."
        );
      } else {
        setMessage(error.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-container">
      <section className="register-card">
        <h1>Full-Stack Project</h1>
        <p className="subtitle">Create your account</p>

        <form onSubmit={handleRegister}>
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
          />

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            maxLength={254}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {message && (
          <p
            className={`message ${isError ? "error" : "success"}`}
            role="status"
          >
            {message}
          </p>
        )}
      </section>
    </main>
  );
}

export default App;

