"use client";
import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from "next/image";
import {
  User,
  Building,
  MapPin,
  Phone,
  Anchor,
  Waves,
  Ship,
  ArrowRight,
  Mail,
  Lock,
} from "lucide-react";

// 1. Define the error type for form fields
interface SignupErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  countryCode?: string;
  phoneNumber?: string;
  companyName?: string;
  streetAddress?: string;
  city?: string;
  country?: string;
}

export function SignupComponent() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTaxNumber, setCompanyTaxNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const router = useRouter();
  // 2. Use the error type in useState
  const [errors, setErrors] = useState<SignupErrors>({});
  const [showValidation, setShowValidation] = useState(false);

  // Enhanced email validation
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return "Email is required";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    
    // Additional email format checks
    if (email.length > 254) {
      return "Email address is too long";
    }
    
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      return "Email format is invalid";
    }
    
    return null;
  };

  // Enhanced password validation
  const validatePassword = (password: string): string | null => {
    if (!password.trim()) {
      return "Password is required";
    }
    
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    
    if (password.length > 128) {
      return "Password is too long (maximum 128 characters)";
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }
    
    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    }
    
    return null;
  };

  // 3. Type the validation function
  const validateForm = (): boolean => {
    const newErrors: SignupErrors = {};

    // Basic required field validation (unchanged)
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!countryCode) newErrors.countryCode = "Country code is required";
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!companyName.trim()) newErrors.companyName = "Company name is required";
    if (!streetAddress.trim())
      newErrors.streetAddress = "Street address is required";
    if (!city.trim()) newErrors.city = "City is required";
    if (!country) newErrors.country = "Country is required";

    // Enhanced email validation
    const emailError = validateEmail(email);
    if (emailError) {
      newErrors.email = emailError;
    }

    // Enhanced password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowValidation(true);

    if (validateForm()) {
      // Form is valid, proceed with submission
      console.log("Form submitted successfully!");
      // Add your submission logic here
      try {
        await axios.post('/api/auth/register', {
          firstName,
          lastName,
          email,
          password,
          countryCode,
          phoneNumber,
          companyName,
          companyTaxNumber,
          streetAddress,
          city,
          postalCode,
          country,
        });
        
        router.push('/auth/login');
      } catch (error) {
        console.error('Registration failed:', error);
        // Handle registration error
      }
    }
  };

  // 4. Type the props for RequiredIndicator
  const RequiredIndicator: React.FC<{ fieldName: keyof SignupErrors }> = ({
    fieldName,
  }) =>
    showValidation && errors[fieldName] ? (
      <div className="flex items-center gap-2 mt-2 text-red-600">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm font-medium">{errors[fieldName]}</span>
      </div>
    ) : null;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Section */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        {/* Animated Maritime Background */}
        <div className="absolute inset-0">
          {/* Waves Animation */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cyan-500/20 to-transparent">
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-r from-cyan-400/30 via-blue-400/30 to-cyan-400/30 animate-pulse"></div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-20 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-32 w-2 h-2 bg-blue-300 rounded-full animate-ping delay-1000"></div>
          <div className="absolute bottom-40 left-16 w-4 h-4 bg-cyan-300 rounded-full animate-ping delay-500"></div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-900/50">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, rgba(34, 211, 238, 0.1) 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            ></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-center h-full p-12 text-white">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
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
                <p className="text-cyan-200 text-md">Maritime Transport</p>
              </div>
            </div>

            {/* Main Hero Text */}
            <div className="space-y-6">
              <div>
                <h2 className="text-5xl font-bold leading-tight mb-4">
                  Welcome to
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    Iraq's Premier
                  </span>
                  <span className="block">Maritime Network</span>
                </h2>
                <p className="text-xl text-cyan-100 leading-relaxed">
                  Connect with Iraq's national shipping lifeline. Join thousands
                  of partners who trust SCMT for secure, efficient maritime
                  services.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 py-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">1,247</div>
                  <div className="text-sm text-cyan-200">Active Shipments</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">50+</div>
                  <div className="text-sm text-cyan-200">Global Routes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">99.8%</div>
                  <div className="text-sm text-cyan-200">Reliability</div>
                </div>
              </div>

              {/* Ship Illustration */}
              <div className="relative">
                <div className="flex items-center justify-center py-8">
                  <div className="relative">
                    <Ship className="w-32 h-32 text-cyan-400/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 bg-white relative overflow-hidden">
        {/* Subtle Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20px 20px, rgba(59, 130, 246, 0.05) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>

        {/* Form Content */}
        <div className="relative z-10 flex flex-col justify-center h-full p-12 overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                Create Account
              </h3>
              <p className="text-gray-600">
                Already have an account?
                <a
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-800 font-semibold ml-1 hover:underline"
                >
                  Sign in
                </a>
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Personal Information
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/70 backdrop-blur-sm ${
                        showValidation && errors.firstName
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                      placeholder="First Name"
                    />
                    <RequiredIndicator fieldName="firstName" />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/70 backdrop-blur-sm ${
                        showValidation && errors.lastName
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                      placeholder="Last Name"
                    />
                    <RequiredIndicator fieldName="lastName" />
                  </div>
                </div>
              </div>

              {/* Account Credentials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Account Credentials
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/70 backdrop-blur-sm ${
                        showValidation && errors.email
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                      placeholder="Email Address"
                    />
                    <RequiredIndicator fieldName="email" />
                  </div>

                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/70 backdrop-blur-sm ${
                        showValidation && errors.password
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                      placeholder="Password"
                    />
                    <RequiredIndicator fieldName="password" />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Contact Information
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/70 backdrop-blur-sm ${
                        showValidation && errors.countryCode
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    >
                      <option value="">Country Code</option>
                      <option value="+964">+964 (Iraq)</option>
                      <option value="+971">+971 (UAE)</option>
                      <option value="+1">+1 (USA)</option>
                      <option value="+91">+91 (India)</option>
                    </select>
                    <RequiredIndicator fieldName="countryCode" />
                  </div>

                  <div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/70 backdrop-blur-sm ${
                        showValidation && errors.phoneNumber
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                      placeholder="Phone Number"
                    />
                    <RequiredIndicator fieldName="phoneNumber" />
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Building className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Company Information
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/70 backdrop-blur-sm ${
                        showValidation && errors.companyName
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                      placeholder="Company Name"
                    />
                    <RequiredIndicator fieldName="companyName" />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={companyTaxNumber}
                      onChange={(e) => setCompanyTaxNumber(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/70 backdrop-blur-sm"
                      placeholder="VAT / Tax / Registration Number"
                    />
                  </div>
                </div>
              </div>

              {/* Address Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Address Information
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/70 backdrop-blur-sm ${
                        showValidation && errors.streetAddress
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                      placeholder="Street Address"
                    />
                    <RequiredIndicator fieldName="streetAddress" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/70 backdrop-blur-sm ${
                          showValidation && errors.city
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                        placeholder="City"
                      />
                      <RequiredIndicator fieldName="city" />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/70 backdrop-blur-sm"
                        placeholder="Postal Code"
                      />
                    </div>
                  </div>

                  <div>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/70 backdrop-blur-sm ${
                        showValidation && errors.country
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    >
                      <option value="">Select Country</option>
                      <option value="Iraq">Iraq</option>
                      <option value="UAE">UAE</option>
                      <option value="USA">USA</option>
                      <option value="India">India</option>
                    </select>
                    <RequiredIndicator fieldName="country" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 space-y-4">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </button>

              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-gray-500 text-sm">
              <p>©2025 SCMT - Connecting Iraq to the World</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}