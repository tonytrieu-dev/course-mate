import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { validation } from "../utils/validation";

const LoginComponent = ({ onClose }) => {
  const { login, register, loginWithProvider, authError, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
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
  const validateEmail = (email) => {
    const result = validation.email(email);
    setEmailError(result.isValid ? "" : result.message);
    return result.isValid;
  };

  const validatePassword = (password) => {
    const result = validation.password(password);
    setPasswordError(result.isValid ? "" : result.message);
    return result.isValid;
  };

  useEffect(() => {
    const emailValid = email ? validateEmail(email) : true;
    const passwordValid = password ? validatePassword(password) : true;
    setFormValid(emailValid && passwordValid && email && password);
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation before submission
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);
    
    if (!emailValid || !passwordValid) {
      return;
    }
    
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
                setEmail(e.target.value);
                if (e.target.value) validateEmail(e.target.value);
              }}
              onBlur={() => {
                if (email) validateEmail(email);
              }}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password:</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value) validatePassword(e.target.value);
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onKeyDown={(e) => {
                  if (e.getModifierState) {
                    setCapsLockOn(e.getModifierState('CapsLock'));
                  }
                }}
                onKeyUp={(e) => {
                  if (e.getModifierState) {
                    setCapsLockOn(e.getModifierState('CapsLock'));
                  }
                }}
                className="w-full p-2 pr-20 border border-gray-300 rounded"
                required
                minLength={6}
              />
              {capsLockOn && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-medium px-1.5 py-0.5 bg-gray-100 rounded" title="Caps Lock is ON">
                  CAPS
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Show password" : "Hide password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            {isRegistering && !passwordError && (
              <p className="text-gray-500 text-sm mt-1">
                Password must have uppercase, lowercase, numbers, and be 6+ characters
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
