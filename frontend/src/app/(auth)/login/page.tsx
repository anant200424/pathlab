'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, FlaskConical } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/lib/services/auth.service';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@labcarepro.internal',
      password: 'Admin@LabCarePro2026!',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const user = await authService.login({
        email: data.email.trim(),
        password: data.password.trim(),
        rememberMe: data.rememberMe ?? false,
      });
      setUser(user);
      toast.success(`Welcome back, ${user.firstName}!`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; error?: { message?: string } } };
        message?: string;
      };
      const msg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error?.message ||
        axiosErr.message ||
        'Invalid email or password';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Sign in to your account</h2>
        <p className="text-sm text-slate-500 mt-1">Access your lab management dashboard</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`w-full px-3.5 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
              errors.email ? 'border-red-400' : 'border-slate-200'
            }`}
            placeholder="you@labcarepro.com"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-10 ${
                errors.password ? 'border-red-400' : 'border-slate-200'
              }`}
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            {...register('rememberMe')}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
          />
          <label htmlFor="rememberMe" className="text-sm text-slate-600">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit */}
        <button
          id="login-submit-btn"
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-sm shadow-indigo-200"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <FlaskConical size={16} />
              Sign in
            </>
          )}
        </button>
      </form>

      {/* Interactive 1-Tap Demo Login Widget */}
      <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Demo Admin Account</span>
          <span className="text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full font-bold">1-TAP FILL</span>
        </div>
        <div className="space-y-1 mb-3 text-xs font-mono text-teal-900">
          <p><span className="text-teal-600 font-sans">Email:</span> admin@labcarepro.internal</p>
          <p><span className="text-teal-600 font-sans">Password:</span> admin123 <span className="text-slate-400 font-sans">or</span> Admin@LabCarePro2026!</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setValue('email', 'admin@labcarepro.internal');
              setValue('password', 'admin123');
              toast.success('Filled with admin123! Click Sign in.');
            }}
            className="w-full py-2 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm text-center"
          >
            ⚡ Fill Simple (admin123)
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('email', 'admin@labcarepro.internal');
              setValue('password', 'Admin@LabCarePro2026!');
              toast.success('Filled default credentials! Click Sign in.');
            }}
            className="w-full py-2 px-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-sm text-center"
          >
            ⚡ Fill Default
          </button>
        </div>
      </div>
    </div>
  );
}
