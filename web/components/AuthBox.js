import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getAuthErrorMessage, signInWithEmail, signUpWithEmail } from "../lib/authEmail";

export default function AuthBox() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    try {
      await signUpWithEmail(supabase, { email, password });
      alert("Usuario creado. Revisa tu email para confirmar la cuenta.");
    } catch (error) {
      alert(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    setLoading(true);
    try {
      await signInWithEmail(supabase, { email, password });
    } catch (error) {
      alert(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, maxWidth: 400 }}>
      <h3>Ingresar</h3>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <input
        type="password"
        placeholder="Contrasena"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
      />

      <button onClick={signIn} disabled={loading}>
        Ingresar
      </button>

      <button onClick={signUp} disabled={loading} style={{ marginLeft: 8 }}>
        Crear usuario
      </button>
    </div>
  );
}
