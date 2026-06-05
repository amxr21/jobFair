import { useState } from "react";
import { useLogin } from "../Hooks/useLogin";
import { AuthFormOverlay, Input } from "../components";

const LoginFunc = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { login, error, isLoading } = useLogin("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      setIsRedirecting(true);
    }
  };

  const handleShowingPass = (e) => {
    e.preventDefault();
    setIsVisible((p) => !p);
  };

  return (
    <div className="w-full h-full bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="w-8/10 px-6 mx-auto py-6 border-b border-gray-100 shrink-0 transition-all duration-300 ease-in-out">
        <h2 className="text-2xl font-semibold text-gray-800 text-center transition-all duration-300 ease-in-out">Log in to your account</h2>
        <p className="text-sm text-gray-500 text-center mt-1 transition-all duration-300 ease-in-out">Enter your credentials to access your dashboard</p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <div className="flex-1 flex flex-col justify-center px-6 py-5 max-w-md mx-auto w-full transition-all duration-300 ease-in-out">
          <div className="flex flex-col gap-4 transition-all duration-300 ease-in-out">
            {/* Email Field */}
            <Input
              Id="email"
              Name="Email"
              Type="email"
              Value={email}
              handleChange={(e) => setEmail(e.target.value)}
              placeholder="company@example.com"
            />

            {/* Password Field with Toggle */}
            <div className="w-full transition-all duration-300 ease-in-out">
              <label htmlFor="password" className="text-xs text-gray-600 ml-1 block mb-0.5 transition-all duration-300 ease-in-out">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative transition-all duration-300 ease-in-out">
                <input
                  id="password"
                  type={isVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full px-2.5 py-1.5 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ease-in-out ${
                    password.length > 0 && password.length < 6
                      ? "border-red-400 focus:ring-red-400"
                      : password.length >= 6
                      ? "border-green-400 focus:ring-green-400"
                      : "border-gray-300 focus:ring-[#0E7F41] hover:border-gray-400"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={handleShowingPass}
                  className="absolute flex items-center justify-center right-1 inset-y-1 w-8 hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out"
                >
                  {isVisible ? (
                    <svg className="opacity-40 size-5 transition-all duration-300 ease-in-out" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  ) : (
                    <svg className="opacity-40 size-5 transition-all duration-300 ease-in-out" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
              {password.length > 0 && password.length < 6 && (
                <p className="text-xs text-red-500 mt-0.5 ml-1 transition-all duration-300 ease-in-out animate-fadeIn">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 transition-all duration-300 ease-in-out animate-fadeIn">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button and Link */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 transition-all duration-300 ease-in-out">
          <div className="max-w-md mx-auto transition-all duration-300 ease-in-out">
            <button
              disabled={isLoading}
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#0E7F41] hover:bg-[#0a5f31] text-white font-medium h-10 rounded-lg transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            >
              {isLoading ? "Logging in..." : "Log In"}
            </button>
            <div className="text-center mt-4 text-sm text-gray-600 transition-all duration-300 ease-in-out">
              <span>Don't have an account? </span>
              <a href="/signup" className="text-[#0E7F41] hover:underline font-medium transition-all duration-300 ease-in-out">
                Sign up here
              </a>
            </div>
          </div>
        </div>
      </form>

      {/* Loading Overlay */}
      {isLoading && !isRedirecting && (
        <AuthFormOverlay type="loading" message="Logging in..." />
      )}

      {/* Redirect Overlay */}
      {isRedirecting && (
        <AuthFormOverlay type="redirect" message="Login successful!" />
      )}
    </div>
  );
};

export default LoginFunc;
