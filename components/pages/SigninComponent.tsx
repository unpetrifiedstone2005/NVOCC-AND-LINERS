"use client";
import { useState } from "react";
import { Mail, Lock, Ship, Eye, EyeOff, ArrowRight, Shield, Globe } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export  function SigninComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    console.log("Sign in attempt:", { email, password, rememberMe });
    // Add your authentication logic here

    const result = await signIn("credentials", {
    redirect: false, // manual redirect
    email,
    password,
    callbackUrl: "/" // or any other protected route
  });

  if (result?.ok) {
    router.push(result.url || "/landing");
  } else {
    alert("Invalid email or password.");
  }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Sign In Form */}
      <div className="flex-1 bg-white relative overflow-hidden">
        {/* Clean Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/40 to-cyan-50/60">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 30px 30px, rgba(59, 130, 246, 0.04) 1px, transparent 0)',
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Form Content */}
        <div className="relative z-10 flex flex-col justify-center h-full p-12">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back</h3>
              <p className="text-gray-600">
                Don't have an account? 
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800 font-semibold ml-1 hover:underline transition-colors">
                  Create account
                </Link>
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Email Field */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-lg font-medium">Email Address</span>
                </div>
                
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                  placeholder="captain@scmt.com"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span className="text-lg font-medium">Password</span>
                </div>
                
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center space-x-2 text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="text-sm">Remember me</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 space-y-4">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 text-xl flex items-center justify-center gap-2"
                >
                  Sign In 
                  <ArrowRight className="w-5 h-5" />
                </button>


                
              </div>

              {/* Support Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Need help? <a href="#" className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">Contact IT Support</a>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-gray-500 text-sm">
              <p>©2025 SCMT - Connecting Iraq to the World</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Modern Hero Section */}
      <div className="flex-1 relative overflow-hidden">
        {/* Your Custom Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
              linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
            `,
            backgroundBlendMode: 'overlay',
          }}
        >
          {/* Subtle Animated Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-900/20 to-transparent">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 50px 50px, rgba(34, 211, 238, 0.1) 1px, transparent 0)',
              backgroundSize: '100px 100px'
            }}></div>
          </div>
          
          {/* Clean floating elements */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-300/60 rounded-full animate-ping"></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/3 left-1/6 w-2.5 h-2.5 bg-cyan-400/40 rounded-full animate-ping delay-500"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-center h-full p-12 text-white">
          <div className="max-w-lg">
            {/* Clean Logo */}
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <Image
                    src="/white-logo.png"
                    width={100}
                    height={100}
                    alt="SCMT Logo"
                    className="inline-block align-middle mb-2"
                    style={{ objectFit: 'contain' }}
                  />
              </div>
              <div>
                <h1 className="text-4xl font-bold">SCMT</h1>
                <p className="text-cyan-200 text-lg">Maritime Transport</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              <div>
                <h2 className="text-5xl font-bold leading-tight mb-4">
                  Maritime
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300">
                    Excellence
                  </span>
                  <span className="block">Made Simple</span>
                </h2>
                <p className="text-xl text-cyan-100 leading-relaxed">
                  Streamline your maritime operations with our comprehensive platform designed for efficiency and reliability.
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 gap-4 py-4">
                <div className="flex items-center gap-3 text-cyan-100">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm">Trusted by Iraq's Maritime Industry</span>
                </div>
                <div className="flex items-center gap-3 text-cyan-100">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm">Connecting Local Trade to Global Markets</span>
                </div>
                <div className="flex items-center gap-3 text-cyan-100">
                  <Ship className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm">Advanced Fleet Management System</span>
                </div>
              </div>

              {/* Simple Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-300">70+</div>
                  <div className="text-sm text-cyan-200">Years of Service</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-300">24/7</div>
                  <div className="text-sm text-cyan-200">Support Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-300">1952</div>
                  <div className="text-sm text-cyan-200">Established</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}