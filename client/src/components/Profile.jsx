import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

function Profile() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isArtist, setIsArtist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [artistData, setArtistData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const navigate = useNavigate();

  const [loginValues, setLoginValues] = useState({
    email: '',
    password: ''
  });

  const [registerValues, setRegisterValues] = useState({
    full_name: '',
    email: '',
    password: '',
    stage_name: '',
    bio: '',
    country: '',
    city: '',
    birth_year: '',
    website: '',
    instagram: ''
  });

  const [editValues, setEditValues] = useState({
    full_name: '',
    email: '',
    stage_name: '',
    bio: '',
    country: '',
    city: '',
    birth_year: '',
    website: '',
    instagram: ''
  });

  const [passwordValues, setPasswordValues] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Verificar sesión al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoadingProfile(false);
    }
  }, []);

  // Verificar token
  const verifyToken = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/verify-token', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setIsLoggedIn(true);
        setEditValues({
          full_name: data.user.full_name,
          email: data.user.email,
          stage_name: '',
          bio: '',
          country: '',
          city: '',
          birth_year: '',
          website: '',
          instagram: ''
        });
        
        // Si es artista, obtener datos adicionales
        if (data.user.role === 'artist') {
          fetchArtistProfile(token);
        }
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Error:', err);
      localStorage.removeItem('token');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Obtener perfil de artista
  const fetchArtistProfile = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/me/artist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setArtistData(data);
        setEditValues(prev => ({
          ...prev,
          stage_name: data.stage_name || '',
          bio: data.bio || '',
          country: data.country || '',
          city: data.city || '',
          birth_year: data.birth_year || '',
          website: data.website || '',
          instagram: data.instagram || ''
        }));
      }
    } catch (err) {
      console.error('Error fetching artist profile:', err);
    }
  };

  // Manejar login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginValues)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Inicio de sesión exitoso');
        localStorage.setItem('token', data.token);
        setUserData(data.user);
        setIsLoggedIn(true);
        
        if (data.user.role === 'artist') {
          fetchArtistProfile(data.token);
        }
        
        setTimeout(() => navigate('/'), 1500);
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Manejar registro
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userData = {
        full_name: registerValues.full_name,
        email: registerValues.email,
        password: registerValues.password,
        role: isArtist ? 'artist' : 'visitor'
      };

      const userResponse = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const userResult = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(userResult.message || 'Error al crear usuario');
      }

      if (isArtist) {
        const artistData = {
          id: userResult.id,
          stage_name: registerValues.stage_name,
          bio: registerValues.bio,
          country: registerValues.country,
          city: registerValues.city,
          birth_year: registerValues.birth_year ? parseInt(registerValues.birth_year) : null,
          website: registerValues.website,
          instagram: registerValues.instagram
        };

        const artistResponse = await fetch('http://localhost:5000/artists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(artistData)
        });

        if (!artistResponse.ok) {
          const artistResult = await artistResponse.json();
          throw new Error(artistResult.message || 'Error al crear perfil de artista');
        }
      }

      setSuccess('Usuario creado exitosamente. Redirigiendo al login...');
      setRegisterValues({
        full_name: '',
        email: '',
        password: '',
        stage_name: '',
        bio: '',
        country: '',
        city: '',
        birth_year: '',
        website: '',
        instagram: ''
      });

      setTimeout(() => {
        setIsLogin(true);
        setSuccess('');
      }, 2000);

    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar perfil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');

    try {
      const userResponse = await fetch('http://localhost:5000/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: editValues.full_name,
          email: editValues.email
        })
      });

      if (!userResponse.ok) {
        const data = await userResponse.json();
        throw new Error(data.message);
      }

      if (userData.role === 'artist') {
        const artistResponse = await fetch('http://localhost:5000/me/artist', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            stage_name: editValues.stage_name,
            bio: editValues.bio,
            country: editValues.country,
            city: editValues.city,
            birth_year: editValues.birth_year ? parseInt(editValues.birth_year) : null,
            death_year: null,
            website: editValues.website,
            instagram: editValues.instagram
          })
        });

        if (!artistResponse.ok) {
          const data = await artistResponse.json();
          throw new Error(data.message);
        }
      }

      setSuccess('Perfil actualizado exitosamente');
      setEditMode(false);
      verifyToken(token);

    } catch (err) {
      setError(err.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordValues.new_password !== passwordValues.confirm_password) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (passwordValues.new_password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:5000/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordValues.current_password,
          new_password: passwordValues.new_password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar contraseña');
      }

      setSuccess('Contraseña cambiada exitosamente');
      setChangePasswordMode(false);
      setPasswordValues({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

    } catch (err) {
      setError(err.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar perfil
  const handleDeleteProfile = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:5000/users/${userData.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al eliminar perfil');
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setSuccess('Perfil eliminado exitosamente');
      setTimeout(() => navigate('/'), 2000);

    } catch (err) {
      setError(err.message || 'Error al eliminar perfil');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserData(null);
    setArtistData(null);
    navigate('/');
  };

  // Loading
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#f4f4f2] flex items-center justify-center">
        <p className="text-sm text-neutral-600">Cargando...</p>
      </div>
    );
  }

  // Vista de perfil (si está logueado)
  if (isLoggedIn && userData) {
    return (
      <div className="min-h-screen bg-[#f4f4f2] px-6 sm:px-10 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8 border-b border-black/10 pb-4">
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600">
              /Perfil de usuario
            </h2>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-neutral-600 hover:text-black uppercase tracking-wider transition-colors"
            >
              ← Volver
            </button>
          </div>

          {/* Mensajes */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Modo: Ver Perfil */}
          {!editMode && !changePasswordMode && (
            <div className="bg-white p-8 border border-black/10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Información personal</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 text-sm uppercase tracking-wider border border-black/20 hover:bg-black hover:text-white transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setChangePasswordMode(true)}
                    className="px-4 py-2 text-sm uppercase tracking-wider border border-black/20 hover:bg-black hover:text-white transition-colors"
                  >
                    Cambiar contraseña
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                    Nombre completo
                  </label>
                  <p className="text-sm">{userData.full_name}</p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                    Email
                  </label>
                  <p className="text-sm">{userData.email}</p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                    Rol
                  </label>
                  <p className="text-sm capitalize">{userData.role}</p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                    Estado
                  </label>
                  <p className="text-sm capitalize">{userData.status}</p>
                </div>
              </div>

              {/* Información de artista */}
              {userData.role === 'artist' && artistData && (
                <>
                  <div className="border-t border-black/10 pt-6 mt-6">
                    <h3 className="text-lg font-medium mb-4">Información de artista</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {artistData.stage_name && (
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          Nombre artístico
                        </label>
                        <p className="text-sm">{artistData.stage_name}</p>
                      </div>
                    )}

                    {artistData.country && (
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          País
                        </label>
                        <p className="text-sm">{artistData.country}</p>
                      </div>
                    )}

                    {artistData.city && (
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          Ciudad
                        </label>
                        <p className="text-sm">{artistData.city}</p>
                      </div>
                    )}

                    {artistData.birth_year && (
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          Año de nacimiento
                        </label>
                        <p className="text-sm">{artistData.birth_year}</p>
                      </div>
                    )}

                    {artistData.website && (
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          Sitio web
                        </label>
                        <a href={artistData.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                          {artistData.website}
                        </a>
                      </div>
                    )}

                    {artistData.instagram && (
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                          Instagram
                        </label>
                        <p className="text-sm">{artistData.instagram}</p>
                      </div>
                    )}
                  </div>

                  {artistData.bio && (
                    <div className="col-span-2">
                      <label className="block text-xs uppercase tracking-wider text-neutral-600 mb-1">
                        Biografía
                      </label>
                      <p className="text-sm leading-relaxed">{artistData.bio}</p>
                    </div>
                  )}
                </>
              )}

              <div className="border-t border-black/10 pt-6 mt-6 flex justify-between">
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-neutral-600 text-white text-sm uppercase tracking-wider hover:bg-neutral-700 transition-colors"
                >
                  Cerrar sesión
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-2 bg-red-600 text-white text-sm uppercase tracking-wider hover:bg-red-700 transition-colors"
                >
                  Eliminar perfil
                </button>
              </div>
            </div>
          )}

          {/* Modo: Editar Perfil */}
          {editMode && (
            <form onSubmit={handleUpdateProfile} className="bg-white p-8 border border-black/10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Editar perfil</h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setError('');
                  }}
                  className="text-sm text-neutral-600 hover:text-black"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    required
                    value={editValues.full_name}
                    onChange={(e) => setEditValues({ ...editValues, full_name: e.target.value })}
                    className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={editValues.email}
                    onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                    className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                  />
                </div>
              </div>

              {/* Campos de artista */}
              {userData.role === 'artist' && (
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
                      value={editValues.stage_name}
                      onChange={(e) => setEditValues({ ...editValues, stage_name: e.target.value })}
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
                      value={editValues.bio}
                      onChange={(e) => setEditValues({ ...editValues, bio: e.target.value })}
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
                        value={editValues.country}
                        onChange={(e) => setEditValues({ ...editValues, country: e.target.value })}
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
                        value={editValues.city}
                        onChange={(e) => setEditValues({ ...editValues, city: e.target.value })}
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
                        value={editValues.birth_year}
                        onChange={(e) => setEditValues({ ...editValues, birth_year: e.target.value })}
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
                        value={editValues.website}
                        onChange={(e) => setEditValues({ ...editValues, website: e.target.value })}
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
                        value={editValues.instagram}
                        onChange={(e) => setEditValues({ ...editValues, instagram: e.target.value })}
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
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}

          {/* Modo: Cambiar Contraseña */}
          {changePasswordMode && (
            <form onSubmit={handleChangePassword} className="bg-white p-8 border border-black/10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Cambiar contraseña</h3>
                <button
                  type="button"
                  onClick={() => {
                    setChangePasswordMode(false);
                    setError('');
                    setPasswordValues({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}
                  className="text-sm text-neutral-600 hover:text-black"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label htmlFor="current_password" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Contraseña actual *
                </label>
                <input
                  type="password"
                  id="current_password"
                  required
                  value={passwordValues.current_password}
                  onChange={(e) => setPasswordValues({ ...passwordValues, current_password: e.target.value })}
                  className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                />
              </div>

              <div>
                <label htmlFor="new_password" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Nueva contraseña * (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  id="new_password"
                  required
                  minLength="6"
                  value={passwordValues.new_password}
                  onChange={(e) => setPasswordValues({ ...passwordValues, new_password: e.target.value })}
                  className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                />
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Confirmar nueva contraseña *
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  required
                  minLength="6"
                  value={passwordValues.confirm_password}
                  onChange={(e) => setPasswordValues({ ...passwordValues, confirm_password: e.target.value })}
                  className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-black text-white text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          )}

          {/* Modal de confirmación de eliminación */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
              <div className="bg-white p-8 border border-black/10 max-w-md w-full mx-4">
                <h3 className="text-lg font-medium mb-4">¿Eliminar perfil?</h3>
                <p className="text-sm text-neutral-600 mb-6">
                  Esta acción es irreversible. Se eliminará toda tu información y no podrás recuperarla.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-black/20 text-sm uppercase tracking-wider hover:bg-neutral-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteProfile}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm uppercase tracking-wider hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista de login/registro
  return (
    <div className="min-h-screen bg-[#f4f4f2] px-6 sm:px-10 py-16">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-6">
          /{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>

        {/* Toggle Login/Register */}
        <div className="flex gap-4 mb-8 border-b border-black/10 pb-4">
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
              setSuccess('');
            }}
            className={`text-sm uppercase tracking-wider pb-2 transition-colors ${
              isLogin
                ? 'text-black border-b-2 border-black'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
              setSuccess('');
            }}
            className={`text-sm uppercase tracking-wider pb-2 transition-colors ${
              !isLogin
                ? 'text-black border-b-2 border-black'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Formularios */}
        {isLogin ? (
          <LoginForm
            loginValues={loginValues}
            setLoginValues={setLoginValues}
            onSubmit={handleLogin}
            loading={loading}
            error={error}
            success={success}
          />
        ) : (
          <RegisterForm
            registerValues={registerValues}
            setRegisterValues={setRegisterValues}
            isArtist={isArtist}
            setIsArtist={setIsArtist}
            onSubmit={handleRegister}
            loading={loading}
            error={error}
            success={success}
          />
        )}

        {/* Link a Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-neutral-600 hover:text-black uppercase tracking-wider transition-colors"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
