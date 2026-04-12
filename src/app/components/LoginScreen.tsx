import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { signInWithGoogle } from '../../lib/auth';

type Mode = 'login' | 'register' | 'forgot';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch {
      setError('Error al conectar con Google');
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message);
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setMessage('Revisa tu email para confirmar tu cuenta');
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError('Ingresa tu email'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) setError(error.message);
    else setMessage('Te enviamos un link para restablecer tu contraseña');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold text-white tracking-tight">eventio</h1>
        <p className="text-neutral-400 mt-2 text-sm">Descubre lo que pasa cerca de ti</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
      >
        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-white text-neutral-900 font-medium hover:bg-neutral-100 transition-colors mb-4 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-neutral-500 text-xs">o con email</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        {/* Email */}
        <div className="relative mb-3">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Password */}
        {mode !== 'forgot' && (
          <div className="relative mb-4">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleEmailLogin() : handleRegister())}
              className="w-full pl-11 pr-11 py-3 rounded-2xl bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        )}

        {/* Error / Message */}
        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}
        {message && <p className="text-green-400 text-sm mb-3 text-center">{message}</p>}

        {/* Action button */}
        <button
          onClick={mode === 'login' ? handleEmailLogin : mode === 'register' ? handleRegister : handleForgot}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Enviar link'}
          {!loading && <ArrowRight size={16} />}
        </button>

        {/* Links */}
        <div className="flex justify-between mt-4 text-sm">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} className="text-neutral-500 hover:text-neutral-300">
                ¿Olvidaste tu contraseña?
              </button>
              <button onClick={() => { setMode('register'); setError(''); setMessage(''); }} className="text-purple-400 hover:text-purple-300">
                Crear cuenta
              </button>
            </>
          )}
          {mode === 'register' && (
            <button onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-neutral-500 hover:text-neutral-300 mx-auto">
              Ya tengo cuenta
            </button>
          )}
          {mode === 'forgot' && (
            <button onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-neutral-500 hover:text-neutral-300 mx-auto">
              Volver al inicio
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
