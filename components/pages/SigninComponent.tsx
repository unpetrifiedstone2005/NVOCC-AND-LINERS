"use client";

import { useState } from "react";
import { Mail, Lock, Ship } from "lucide-react";

// Button component
const Button = ({ children, type = "button", className = "", ...props }: {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Input component
const Input = ({ className = "", ...props }: {
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
}) => {
  return (
    <input
      className={`flex h-12 w-full rounded-md border bg-transparent px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

// Label component
const Label = ({ children, htmlFor, className = "" }: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    >
      {children}
    </label>
  );
};

// Card components (FIXED style prop below)
const Card = ({ children, className = "", style }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <div className={`rounded-lg border shadow-sm ${className}`} style={style}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "" }: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-8 ${className}`}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = "" }: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
};

const CardDescription = ({ children, className = "" }: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p className={`text-sm ${className}`}>
      {children}
    </p>
  );
};

const CardContent = ({ children, className = "" }: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`p-8 pt-0 ${className}`}>
      {children}
    </div>
  );
};

export function SigninComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sign in attempt:", { email, password });
    // Add your authentication logic here
  };

  return (
    <div className="min-h-screen container-texture-bg flex items-center justify-center p-4 relative">
      {/* Header matching the reference style */}
      <div className="absolute top-0 left-0 right-0 third-container-texture-bg flex items-center justify-between px-6 py-4 shadow-[0px_16px_0px_0px_rgba(0,0,0,0.8)] border-b-4 border-black">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-white rounded-full border-4 border-[#2D4D8B] flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <Ship className="w-8 h-8 text-[#1e3a8a]" />
          </div>
          <div className="font-bold text-4xl text-[#1e3a8a] ml-4">SCMT</div>
        </div>
        <div className="text-[#1e3a8a] font-bold text-lg uppercase">Maritime Transport Solutions</div>
      </div>

      <Card
        className="w-full max-w-md mt-24"
        style={{
          backgroundImage: `
            linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
            linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
          `,
          backgroundBlendMode: 'overlay',
        }}>
        <div className="bg-[#0A1A2F] rounded-lg border-4 border-black shadow-[20px_20px_0px_rgba(0,0,0,1)]">
          <CardHeader className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-white rounded-full border-4 border-[#2D4D8B] flex items-center justify-center shadow-[8px_8px_0px_rgba(0,0,0,1)]">
              <Ship className="w-10 h-10 text-[#1e3a8a]" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-[#00FFFF] mb-2 uppercase tracking-wide">
                LOG IN
              </CardTitle>
              <CardDescription className="text-white/90 text-base font-bold uppercase">
                Access your SCMT dashboard
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-white font-bold text-base uppercase">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-[#00FFFF]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 bg-[#2D4D8B]/80 border-4 border-black text-white placeholder:text-white/70 focus:border-[#00FFFF] h-14 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-white font-bold text-base uppercase">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-[#00FFFF]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 bg-[#2D4D8B]/80 border-4 border-black text-white placeholder:text-white/70 focus:border-[#00FFFF] h-14 rounded-xl font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <label className="flex items-center space-x-3 text-white font-bold">
                  <input type="checkbox" className="rounded border-4 border-black bg-[#2D4D8B] w-4 h-4" />
                  <span className="uppercase">Remember me</span>
                </label>
                <a href="#" className="text-[#00FFFF] hover:text-white font-bold uppercase">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#2D4D8B] hover:bg-[#1A2F4E] text-white hover:text-[#00FFFF] font-bold py-4 text-base uppercase tracking-wide rounded-xl border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)]"
              >
                LOG IN
              </Button>
            </form>

            <div className="text-center text-sm text-white/90 pt-4 border-t-2 border-[#2D4D8B] font-bold">
              <span className="uppercase">Need access to your account?</span>{" "}
              <a href="#" className="text-[#00FFFF] hover:text-white font-bold uppercase">
                Contact Administrator
              </a>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
