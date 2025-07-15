import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const LoginComponent = ({ onClose }) => {
  const { login, register, loginWithProvider, authError, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  // Validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formValid, setFormValid] = useState(false);
  

  const toggleMode = () => {
    setIsRegistering((prev) => !prev);
    setEmailFocused(false);
    setPasswordFocused(false);
  };

  // Input validation
  const validatePassword = (password) => {
    const isValid = password.length >= 6;
    setPasswordError(isValid ? "" : "Password must be at least 6 characters.");
  };

  useEffect(() => {
    validatePassword(password);
    setFormValid(!passwordError && password);
  }, [password, passwordError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValid) return;
    if (isRegistering) {
      await register(email, password);
    } else {
      await login(email, password);
    }
    if (onClose) onClose();
  };

  const handleOAuthLogin = (provider) => {
    loginWithProvider(provider);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-10">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-xl font-semibold mb-4 text-blue-600">
          {isRegistering ? "Sign up" : "Log in"}
        </h3>

        {authError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);;
              }}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className="w-full p-2 border border-gray-300 rounded"
              required
              minLength={6}
            />
            {passwordFocused && passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            {isRegistering && !passwordError && (
              <p className="text-gray-500 text-sm mt-1">
                Your password must be at least 6 characters
              </p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-800"
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "Need an account? Register"}
            </button>

            <button
              type="submit"
              disabled={loading || !formValid}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition ${
                loading || !formValid ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Loading..." : isRegistering ? "Register" : "Log in"}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-300">
          <p className="text-center text-gray-500 mb-4">Or sign in with:</p>
          <div className="flex justify-center gap-4">
            <OAuthButton provider="google" onClick={handleOAuthLogin} />
            <OAuthButton provider="github" onClick={handleOAuthLogin} />
          </div>
        </div>
      </div>
    </div>
  );
};

const OAuthButton = ({ provider, onClick }) => {
  const providerLogos = {
    google: {
      src: "https://developers.google.com/identity/images/g-logo.png",
      alt: "Sign in with Google",
    },
    github: {
      src: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
      alt: "Sign in with GitHub",
    },
  };

  const logo = providerLogos[provider];

  return (
    <button
      onClick={() => onClick(provider)}
      className="bg-gray-100 hover:bg-blue-500 rounded p-2 w-10 h-10 flex items-center justify-center"
      aria-label={logo?.alt || `Sign in with ${provider}`}
    >
      {logo ? (
        <img src={logo.src} alt={logo.alt} className="h-6 w-6 object-contain" />
      ) : (
        <span className="text-xl">?</span>
      )}
    </button>
  );
};

export default LoginComponent;
