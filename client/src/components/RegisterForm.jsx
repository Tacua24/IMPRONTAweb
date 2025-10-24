import React from 'react';

function RegisterForm({ 
  registerValues, 
  setRegisterValues, 
  isArtist, 
  setIsArtist, 
  onSubmit, 
  loading,
  error,
  success 
}) {
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

      {/* Toggle Artista/Visitante */}
      <div className="flex items-center gap-3 p-4 bg-neutral-50 border border-black/10">
        <input
          type="checkbox"
          id="isArtist"
          checked={isArtist}
          onChange={(e) => setIsArtist(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="isArtist" className="text-sm cursor-pointer">
          Registrarme como <strong>Artista</strong>
        </label>
      </div>

      {/* Campos básicos */}
      <div>
        <label htmlFor="full_name" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
          Nombre completo *
        </label>
        <input
          type="text"
          id="full_name"
          required
          value={registerValues.full_name}
          onChange={(e) => setRegisterValues({ ...registerValues, full_name: e.target.value })}
          className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
        />
      </div>

      <div>
        <label htmlFor="register_email" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
          Email *
        </label>
        <input
          type="email"
          id="register_email"
          required
          value={registerValues.email}
          onChange={(e) => setRegisterValues({ ...registerValues, email: e.target.value })}
          className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
        />
      </div>

      <div>
        <label htmlFor="register_password" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
          Contraseña * (mínimo 6 caracteres)
        </label>
        <input
          type="password"
          id="register_password"
          required
          minLength="6"
          value={registerValues.password}
          onChange={(e) => setRegisterValues({ ...registerValues, password: e.target.value })}
          className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
        />
      </div>

      {/* Campos adicionales para artistas */}
      {isArtist && (
        <>
          <div className="border-t border-black/10 pt-6">
            <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-4">
              Información de artista
            </h3>
          </div>

          <div>
            <label htmlFor="stage_name" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
              Nombre artístico
            </label>
            <input
              type="text"
              id="stage_name"
              value={registerValues.stage_name}
              onChange={(e) => setRegisterValues({ ...registerValues, stage_name: e.target.value })}
              className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
              Biografía
            </label>
            <textarea
              id="bio"
              rows="4"
              value={registerValues.bio}
              onChange={(e) => setRegisterValues({ ...registerValues, bio: e.target.value })}
              className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="country" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                País
              </label>
              <input
                type="text"
                id="country"
                value={registerValues.country}
                onChange={(e) => setRegisterValues({ ...registerValues, country: e.target.value })}
                className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                id="city"
                value={registerValues.city}
                onChange={(e) => setRegisterValues({ ...registerValues, city: e.target.value })}
                className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
              />
            </div>

            <div>
              <label htmlFor="birth_year" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                Año de nacimiento
              </label>
              <input
                type="number"
                id="birth_year"
                min="1900"
                max={new Date().getFullYear()}
                value={registerValues.birth_year}
                onChange={(e) => setRegisterValues({ ...registerValues, birth_year: e.target.value })}
                className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                Sitio web
              </label>
              <input
                type="url"
                id="website"
                value={registerValues.website}
                onChange={(e) => setRegisterValues({ ...registerValues, website: e.target.value })}
                placeholder="https://"
                className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="instagram" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                Instagram
              </label>
              <input
                type="text"
                id="instagram"
                value={registerValues.instagram}
                onChange={(e) => setRegisterValues({ ...registerValues, instagram: e.target.value })}
                placeholder="@usuario"
                className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
              />
            </div>
          </div>
        </>
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-black text-white text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  );
}

export default RegisterForm;
