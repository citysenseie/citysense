import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

interface SignupScreenProps {
  onSwitch: () => void;
}

export default function SignupScreen({ onSwitch }: SignupScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signup, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && name) {
      const ok = await signup(email, password, name);
      if (ok) onSwitch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1E1E] via-[#1A2E2D] to-[#0F1E1E] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D5A58] to-[#1E3A3A] flex items-center justify-center mb-4 shadow-lg shadow-[#2D5A5830]">
            <Shield className="w-8 h-8 text-[#E8A838]" />
          </div>
          <h1 className="text-3xl font-bold text-[#F5F3EF] tracking-tight">CitySense</h1>
          <p className="text-sm text-[#7BA3A1] mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7BA3A1]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full pl-11 pr-4 py-3.5 bg-[#1E3A3A40] border border-[#2D5A5840] rounded-xl text-[#F5F3EF] placeholder:text-[#7BA3A180] focus:outline-none focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A83830] transition-all text-sm"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7BA3A1]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-11 pr-4 py-3.5 bg-[#1E3A3A40] border border-[#2D5A5840] rounded-xl text-[#F5F3EF] placeholder:text-[#7BA3A180] focus:outline-none focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A83830] transition-all text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7BA3A1]" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-11 pr-11 py-3.5 bg-[#1E3A3A40] border border-[#2D5A5840] rounded-xl text-[#F5F3EF] placeholder:text-[#7BA3A180] focus:outline-none focus:border-[#E8A838] focus:ring-1 focus:ring-[#E8A83830] transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7BA3A1]"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#E8A838] to-[#D4962F] text-[#0F1E1E] font-bold rounded-xl shadow-lg shadow-[#E8A83820] hover:shadow-[#E8A83840] active:scale-[0.98] transition-all text-sm disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-[#7BA3A1] mt-6">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-[#E8A838] font-semibold hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
