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
      // 1. Registrar usuario
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

      // 2. Si es artista, crear perfil
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
      
      // Limpiar formulario
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserData(null);
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

          <div className="bg-white p-8 border border-black/10 space-y-6">
            <h3 className="text-lg font-medium">Información personal</h3>

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

            <div className="border-t border-black/10 pt-6 mt-6">
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 text-white text-sm uppercase tracking-wider hover:bg-red-700 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
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
