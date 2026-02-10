import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login({ email, password });
      toast.success('Login successful');
      navigate('/');
    } catch (err) {
      toast.error('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-secondary-100">
        <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-600/20">
          <LogIn className="text-white" size={24} />
        </div>

        <h1 className="text-2xl font-bold text-secondary-900 mb-2 text-center">
          Welcome back
        </h1>
        <p className="text-secondary-500 text-center mb-8">
          Please enter your details to sign in
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-secondary-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-secondary-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-medium hover:bg-brand-700 focus:ring-4 focus:ring-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-600/20 active:scale-[0.98]"
          >
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-secondary-600 text-center mt-8">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-600 font-medium hover:text-brand-700 transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
