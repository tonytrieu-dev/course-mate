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
  const [ageVerified, setAgeVerified] = useState<boolean>(false);
  
  // Validation states
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [ageError, setAgeError] = useState<string>("");
  const [formValid, setFormValid] = useState<boolean>(false);

  const toggleMode = useCallback((): void => {
    setIsRegistering((prev) => !prev);
    // SECURITY FIX: Clear all form fields when switching modes
    setEmail("");
    setPassword("");
    setEmailFocused(false);
    setPasswordFocused(false);
    setShowPassword(false);
    setAgeVerified(false);
    // Clear all validation errors
    setEmailError("");
    setPasswordError("");
    setAgeError("");
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

  const validateAge = useCallback((verified: boolean): boolean => {
    if (!verified) {
      setAgeError("You must be 18 or older to create an account");
      return false;
    }
    setAgeError("");
    return true;
  }, []);

  useEffect(() => {
    const emailValid = email ? validateEmail(email) : true;
    const passwordValid = password ? validatePassword(password) : true;
    const ageValid = isRegistering ? validateAge(ageVerified) : true;
    setFormValid(emailValid && passwordValid && ageValid && !!email && !!password);
  }, [email, password, ageVerified, isRegistering, validateEmail, validatePassword, validateAge]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    // Final validation before submission
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);
    const ageValid = isRegistering ? validateAge(ageVerified) : true;
    
    if (!emailValid || !passwordValid || !ageValid) {
      return;
    }
    
    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      
      // Only close if registration/login was successful (no error thrown)
      if (onClose) {
        onClose();
      }
    } catch (error) {
      // Error handling is managed by the AuthContext and displayed via authError
      // The authError state will be updated by the auth context, so no need to handle here
      console.error('Authentication error:', error);
    }
  }, [email, password, ageVerified, isRegistering, validateEmail, validatePassword, validateAge, register, login, onClose]);

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

  const handleAgeCheckChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    const checked = e.target.checked;
    setAgeVerified(checked);
    validateAge(checked);
  }, [validateAge]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md relative border border-gray-100/50 animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={handleCloseClick}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-full p-1 transition-all duration-200 hover:bg-gray-50"
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

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isRegistering ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-gray-600 text-sm">
            {isRegistering 
              ? "Join thousands of students managing their academic life" 
              : "Sign in to continue to your dashboard"}
          </p>
        </div>

        {/* Error Display */}
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <span>{authError}</span>
              {isRegistering && (authError.toLowerCase().includes('user') || authError.toLowerCase().includes('email') || authError.toLowerCase().includes('exists')) && (
                <div className="mt-1 text-xs">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="underline hover:no-underline font-medium"
                  >
                    Sign in instead
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                className={`w-full px-4 py-3 pl-11 border rounded-xl text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400 ${
                  emailError 
                    ? 'border-red-300 focus:ring-red-500/20' 
                    : email && !emailError
                    ? 'border-green-300 focus:ring-blue-500/20'
                    : 'border-gray-200 focus:ring-blue-500/20 hover:border-gray-300'
                }`}
                placeholder="Enter your email"
                required
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              {email && !emailError && (
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {emailError && (
              <p className="text-red-500 text-xs flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{emailError}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                onKeyDown={handlePasswordKeyEvent}
                onKeyUp={handlePasswordKeyEvent}
                className={`w-full px-4 py-3 pl-11 pr-24 border rounded-xl text-gray-900 bg-white/70 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400 ${
                  passwordError 
                    ? 'border-red-300 focus:ring-red-500/20' 
                    : password && !passwordError
                    ? 'border-green-300 focus:ring-blue-500/20'
                    : 'border-gray-200 focus:ring-blue-500/20 hover:border-gray-300'
                }`}
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              
              {capsLockOn && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2 text-amber-600 text-xs font-medium px-2 py-1 bg-amber-50 rounded-md border border-amber-200" title="Caps Lock is ON">
                  CAPS
                </div>
              )}
              
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded p-1 transition-colors duration-200"
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
            
            {passwordError && (
              <p className="text-red-500 text-xs flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{passwordError}</span>
              </p>
            )}
            
            {isRegistering && !passwordError && password && (
              <p className="text-gray-500 text-xs flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Password must be at least 6 characters</span>
              </p>
            )}
          </div>

          {/* Age Verification for Registration */}
          {isRegistering && (
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <input
                  type="checkbox"
                  id="ageVerification"
                  checked={ageVerified}
                  onChange={handleAgeCheckChange}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  required
                />
                <label htmlFor="ageVerification" className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-medium text-gray-900">
                    <span className="text-red-500">*</span> I confirm that I am 18 years of age or older
                  </span>
                  <span className="block text-xs text-gray-600 mt-1">
                    ScheduleBud is exclusively for adult users (18+). By checking this box, you certify that you meet this age requirement.
                  </span>
                </label>
              </div>
              {ageError && (
                <p className="text-red-500 text-xs flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{ageError}</span>
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading || !formValid}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                loading || !formValid
                  ? 'bg-gray-400 cursor-not-allowed shadow-sm hover:shadow-sm hover:transform-none'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Please wait...</span>
                </span>
              ) : (
                isRegistering ? "Create Account" : "Sign In"
              )}
            </button>

            {/* Toggle Mode */}
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                {isRegistering
                  ? "Already have an account? Sign in"
                  : "Need an account? Create one"}
              </button>
            </div>
          </div>
        </form>

        {/* OAuth Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>
          
          {isRegistering && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-amber-800 text-sm font-medium">
                  <strong>Age Requirement:</strong> By using social login, you confirm you are 18+ years old.
                </p>
              </div>
            </div>
          )}
          
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
      className="bg-white/80 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-4 w-16 h-16 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl group backdrop-blur-sm"
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