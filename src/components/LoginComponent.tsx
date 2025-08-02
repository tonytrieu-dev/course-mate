import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent, KeyboardEvent, MouseEvent, memo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { validation, ValidationResult } from "../utils/validation";

// Define comprehensive interfaces for LoginComponent
interface LoginComponentProps {
  onClose?: () => void;
}

// OAuth provider types
type OAuthProvider = 'google' | 'github' | 'discord';

// OAuth button component props
interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick: (provider: OAuthProvider) => void;
}

const LoginComponent: React.FC<LoginComponentProps> = ({ onClose }) => {
  const { login, register, loginWithProvider, authError, loading } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [emailFocused, setEmailFocused] = useState<boolean>(false);
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [capsLockOn, setCapsLockOn] = useState<boolean>(false);
  
  // Validation states
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [formValid, setFormValid] = useState<boolean>(false);

  const toggleMode = useCallback((): void => {
    setIsRegistering((prev) => !prev);
    setEmailFocused(false);
    setPasswordFocused(false);
  }, []);

  // Input validation with proper typing
  const validateEmail = useCallback((email: string): boolean => {
    const result: ValidationResult = validation.email(email);
    setEmailError(result.isValid ? "" : result.message);
    return result.isValid;
  }, []);

  const validatePassword = useCallback((password: string): boolean => {
    const result: ValidationResult = validation.password(password);
    setPasswordError(result.isValid ? "" : result.message);
    return result.isValid;
  }, []);

  useEffect(() => {
    const emailValid = email ? validateEmail(email) : true;
    const passwordValid = password ? validatePassword(password) : true;
    setFormValid(emailValid && passwordValid && !!email && !!password);
  }, [email, password, validateEmail, validatePassword]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>): Promise<void> => {
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
    
    if (onClose) {
      onClose();
    }
  }, [email, password, isRegistering, validateEmail, validatePassword, register, login, onClose]);

  const handleOAuthLogin = useCallback((provider: OAuthProvider): void => {
    loginWithProvider(provider);
  }, [loginWithProvider]);

  const handleEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      validateEmail(value);
    }
  }, [validateEmail]);

  const handlePasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      validatePassword(value);
    }
  }, [validatePassword]);

  const handleEmailBlur = useCallback((): void => {
    if (email) {
      validateEmail(email);
    }
  }, [email, validateEmail]);

  const handlePasswordFocus = useCallback((): void => {
    setPasswordFocused(true);
  }, []);

  const handlePasswordBlur = useCallback((): void => {
    setPasswordFocused(false);
  }, []);

  const handlePasswordKeyEvent = useCallback((e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  }, []);

  const togglePasswordVisibility = useCallback((): void => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  const handleCloseClick = useCallback((e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-10">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] max-w-lg relative">
        <button
          onClick={handleCloseClick}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close"
          type="button"
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
          {isRegistering ? "Sign up" : "Sign in"}
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
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
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
                onChange={handlePasswordChange}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                onKeyDown={handlePasswordKeyEvent}
                onKeyUp={handlePasswordKeyEvent}
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
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
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
                Password must be at least 6 characters
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
              className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-500 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition"
            >
              {loading ? "Loading..." : isRegistering ? "Register" : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-300">
          <p className="text-center text-gray-500 mb-4">Or sign in with:</p>
          <div className="flex justify-center gap-4">
            <OAuthButton provider="google" onClick={handleOAuthLogin} />
            <OAuthButton provider="discord" onClick={handleOAuthLogin} />
            <OAuthButton provider="github" onClick={handleOAuthLogin} />
          </div>
        </div>
      </div>
    </div>
  );
};

const OAuthButton: React.FC<OAuthButtonProps> = memo(({ provider, onClick }) => {
  const handleClick = useCallback((): void => {
    onClick(provider);
  }, [onClick, provider]);

  const renderIcon = () => {
    switch (provider) {
      case 'google':
        return (
          <svg className="h-6 w-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case 'github':
        return (
          <svg className="h-7 w-7 fill-current text-gray-700 hover:text-gray-900" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.84 9.49.5.09.68-.22.68-.485 0-.236-.013-1.02-.013-1.862-2.513.463-3.163-.613-3.363-1.175a3.636 3.636 0 0 0-1.025-1.413c-.35-.187-.85-.65-.013-.662a2 2 0 0 1 1.538 1.025 2.137 2.137 0 0 0 2.912.825 2.104 2.104 0 0 1 .638-1.338c-2.225-.25-4.55-1.112-4.55-4.937a3.892 3.892 0 0 1 1.025-2.688 3.594 3.594 0 0 1 .1-2.65s.837-.263 2.75 1.025a9.427 9.427 0 0 1 5 0c1.912-1.3 2.75-1.025 2.75-1.025a3.593 3.593 0 0 1 .1 2.65 3.869 3.869 0 0 1 1.025 2.688c0 3.837-2.338 4.687-4.563 4.937a2.368 2.368 0 0 1 .675 1.85c0 1.337-.013 2.412-.013 2.75 0 .262.188.575.688.475A10.005 10.005 0 0 0 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        );
      case 'discord':
        return (
          <svg className="h-7 w-7" viewBox="0 0 71 55" fill="none">
            <path
              d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"
              fill="#5865F2"
            />
          </svg>
        );
      default:
        return <span className="text-xl">?</span>;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-2xl p-3 w-14 h-14 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-lg group"
      aria-label={`Sign in with ${provider}`}
      type="button"
    >
      {renderIcon()}
    </button>
  );
});

// Set display name for debugging
OAuthButton.displayName = 'OAuthButton';

export default LoginComponent;