import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export default function AuthForm() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");

  return (
    <div style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>{step === "signIn" ? "Sign in" : "Sign up"}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          void signIn("password", formData);
        }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <input name="email" placeholder="Email" type="text" style={{ width: "100%", padding: "0.5rem" }} />
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <input name="password" placeholder="Password" type="password" style={{ width: "100%", padding: "0.5rem" }} />
        </div>
        <input name="flow" type="hidden" value={step} />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" style={{ padding: "0.5rem 1rem" }}>
            {step === "signIn" ? "Sign in" : "Sign up"}
          </button>
          <button
            type="submit"
            onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
            style={{ padding: "0.5rem 1rem" }}>
            {step === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
    </div>
  );
}
