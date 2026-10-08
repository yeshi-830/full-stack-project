
import { useState } from "react";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

   const text = await response.text();

let data;

try {
  data = JSON.parse(text);
} catch {
  throw new Error(
    "The server returned HTML instead of JSON. Check the API URL and backend route."
  );
}

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setMessage(data.message);
      setName("");
      setEmail("");
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that your server is running."
          : error.message
      );
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
            required
          />

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {message && (
          <p className="message" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}

export default App;
