import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import "../styles/AuthForm.css";
import logoImage from "../assets/logo_transparent.png";

export default function AuthForm() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");

  return (
    <div className="auth-hero-container">
      <div className="auth-hero-content">
        {/* Hero Header */}
        <div className="auth-hero-header">
          <img src={logoImage} alt="DillyDally" className="auth-hero-logo" />
          <h1 className="auth-hero-title">DillyDally</h1>
          <p className="auth-hero-tagline">
            Track your focus, boost your productivity
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">{step === "signIn" ? "Sign in" : "Sign up"}</h2>
            <p className="auth-form-subtitle">
              {step === "signIn" ? "Welcome back! Sign in to continue." : "Create an account to get started."}
            </p>
          </div>
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              void signIn("password", formData);
            }}>
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-form-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                placeholder="Enter your email"
                type="email"
                className="auth-form-input"
                required
              />
            </div>
            <div className="auth-form-group">
              <label htmlFor="password" className="auth-form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                placeholder="Enter your password"
                type="password"
                className="auth-form-input"
                required
              />
            </div>
            <input name="flow" type="hidden" value={step} />
            <div className="auth-form-buttons">
              <button type="submit" className="auth-form-primary-btn">
                {step === "signIn" ? "Sign in" : "Sign up"}
              </button>
              <button
                type="button"
                onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
                className="auth-form-secondary-btn">
                {step === "signIn" ? "Sign up instead" : "Sign in instead"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
