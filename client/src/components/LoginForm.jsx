import React from 'react';

function LoginForm({ loginValues, setLoginValues, onSubmit, loading, error, success }) {
  return (
    <form onSubmit={onSubmit} className="bg-white p-8 space-y-6 border border-black/10">
      {/* Mensajes */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      <div>
        <label htmlFor="login_email" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
          Email
        </label>
        <input
          type="email"
          id="login_email"
          required
          value={loginValues.email}
          onChange={(e) => setLoginValues({ ...loginValues, email: e.target.value })}
          className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
        />
      </div>

      <div>
        <label htmlFor="login_password" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
          Contraseña
        </label>
        <input
          type="password"
          id="login_password"
          required
          value={loginValues.password}
          onChange={(e) => setLoginValues({ ...loginValues, password: e.target.value })}
          className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-black text-white text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </div>
    </form>
  );
}

export default LoginForm;
