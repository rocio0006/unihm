import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

type Mode = 'signin' | 'signup'

export function Login() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/panel" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setSubmitting(false)
      if (error) setError(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/panel` },
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
    } else if (!data.session) {
      // Email confirmation is required before the account can sign in.
      setConfirmSent(true)
    }
    // If data.session exists, "Confirm email" is off in Supabase and the
    // user is already signed in — useAuth picks it up and redirects above.
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setConfirmSent(false)
  }

  async function handleGoogleSignIn() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/panel` },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-screen flex-col bg-teal px-6 py-9 text-cream">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="mb-7 flex gap-1.5">
          <span className="h-[42px] w-[26px] rounded-[3px_3px_13px_13px] bg-orange" />
          <span className="h-[42px] w-[26px] rounded-[3px_3px_13px_13px] bg-pink" />
          <span className="h-[42px] w-[26px] rounded-[3px_3px_13px_13px] bg-yellow" />
        </div>

        <h1 className="font-display text-[38px] font-extrabold leading-[1.02] tracking-tight text-cream">
          {mode === 'signin' ? (
            <>
              Entrar como
              <br />
              delegado
            </>
          ) : (
            <>
              Crear cuenta
              <br />
              de delegado
            </>
          )}
        </h1>
        <p className="mb-7 mt-3 text-[15px] leading-relaxed text-cream/85">
          {mode === 'signin'
            ? 'Correo y contraseña. Un administrador debe asignarte cursos después de entrar.'
            : 'Elige una contraseña — te mandamos un correo para confirmar que es tuyo.'}
        </p>

        {confirmSent ? (
          <div className="rounded-[18px] bg-cream p-4.5 text-[15px] font-medium text-ink">
            Revisa tu correo (<strong>{email}</strong>) y confirma tu cuenta desde ahí. Después vuelve aquí a
            iniciar sesión.
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="mb-4 flex items-center justify-center gap-2.5 rounded-full bg-cream py-4 text-[15px] font-bold text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.26h2.92c1.7-1.57 2.69-3.88 2.69-6.63z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33C2.44 15.98 5.48 18 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.97 10.72c-.18-.54-.28-1.12-.28-1.72s.1-1.18.28-1.72V4.95H.96A8.996 8.996 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
                />
              </svg>
              Continuar con Google
            </button>

            <div className="mb-4 flex items-center gap-3 text-xs font-bold text-cream/60">
              <span className="h-px flex-1 bg-cream/25" />
              O
              <span className="h-px flex-1 bg-cream/25" />
            </div>
          </>
        )}

        {!confirmSent && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-yellow">Correo</div>
              <input
                type="email"
                required
                placeholder="tu-correo@universidad.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[18px] bg-cream px-4.5 py-4 text-[16px] font-medium text-ink outline-none placeholder:text-muted-2"
              />
            </div>
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-yellow">Contraseña</div>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[18px] bg-cream px-4.5 py-4 text-[16px] font-medium text-ink outline-none placeholder:text-muted-2"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="font-display rounded-full bg-yellow py-4 text-center text-[17px] font-extrabold text-ink disabled:opacity-60"
            >
              {submitting ? 'Un momento…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
            </button>
            {error && <p className="text-sm text-cream">{error}</p>}
          </form>
        )}

        {!confirmSent && (
          <button
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="mt-4 text-center text-sm font-bold text-yellow"
          >
            {mode === 'signin' ? '¿Primera vez? Crea tu cuenta' : 'Ya tengo cuenta — entrar'}
          </button>
        )}

        <div className="mt-auto pt-6 text-center text-sm text-cream/85">
          Solo quiero ver las tareas ·{' '}
          <Link to="/" className="font-bold text-yellow no-underline">
            Entrar sin cuenta
          </Link>
        </div>
      </div>
    </div>
  )
}
