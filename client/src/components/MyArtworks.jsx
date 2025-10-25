import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyArtworks() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [userData, setUserData] = useState(null);
  
  const navigate = useNavigate();

  // Verificar que el usuario sea artista
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/profile');
      return;
    }

    fetch('http://localhost:5000/verify-token', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user.role !== 'artist') {
          setError('Solo los artistas pueden ver esta página');
          setTimeout(() => navigate('/'), 2000);
        } else {
          setUserData(data.user);
          fetchMyArtworks(token);
        }
      })
      .catch(() => {
        navigate('/profile');
      });
  }, [navigate]);

  // Obtener mis obras
  const fetchMyArtworks = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/me/artworks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      // Para cada obra, obtener su imagen principal
      const worksWithImages = await Promise.all(
        data.map(async (work) => {
          if (work.primary_image_id) {
            try {
              const imgResponse = await fetch(`http://localhost:5000/artworks/${work.id}/images`);
              const images = await imgResponse.json();
              const primaryImage = images.find(img => img.id === work.primary_image_id);
              return {
                ...work,
                image_url: primaryImage?.url || null
              };
            } catch (err) {
              return { ...work, image_url: null };
            }
          }
          return { ...work, image_url: null };
        })
      );

      setArtworks(worksWithImages);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar las obras');
      setLoading(false);
    }
  };

  // Eliminar obra
  const handleDelete = async (artworkId) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:5000/artworks/${artworkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Obra eliminada exitosamente');
        setArtworks(artworks.filter(a => a.id !== artworkId));
        setDeleteConfirm(null);
      } else {
        setError(data.message || 'Error al eliminar la obra');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents, currency) => {
    if (!cents) return 'Sin precio';
    const amount = cents / 100;
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-700',
      reserved: 'bg-yellow-100 text-yellow-700',
      sold: 'bg-blue-100 text-blue-700',
      archived: 'bg-red-100 text-red-700'
    };

    const labels = {
      draft: 'Borrador',
      published: 'Publicada',
      reserved: 'Reservada',
      sold: 'Vendida',
      archived: 'Archivada'
    };

    return (
      <span className={`px-2 py-1 text-xs uppercase tracking-wider rounded ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#f4f4f2] flex items-center justify-center">
        <p className="text-sm text-neutral-600">Verificando permisos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f2] px-6 sm:px-10 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-black/10 pb-4">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600">
            /Mis obras
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/create-artwork')}
              className="px-4 py-2 bg-black text-white text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              + Nueva obra
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-neutral-600 hover:text-black uppercase tracking-wider transition-colors"
            >
              ← Volver
            </button>
          </div>
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

        {/* Lista de obras */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-sm">Cargando obras...</p>
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-sm mb-4">No tienes obras creadas</p>
            <button
              onClick={() => navigate('/create-artwork')}
              className="px-6 py-3 bg-black text-white text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              Crear mi primera obra
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {artworks.map((artwork) => (
              <div key={artwork.id} className="bg-white border border-black/10 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-6 p-6">
                  {/* Imagen */}
                  <div className="aspect-square w-full md:w-[200px] bg-neutral-200 flex items-center justify-center overflow-hidden">
                    {artwork.image_url ? (
                      <img 
                        src={artwork.image_url} 
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-neutral-400 uppercase tracking-wider">
                        Sin imagen
                      </span>
                    )}
                  </div>

                  {/* Información */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-medium mb-2">{artwork.title}</h3>
                          {getStatusBadge(artwork.status)}
                        </div>
                      </div>

                      {artwork.description && (
                        <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                          {artwork.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        {artwork.year && (
                          <div>
                            <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                              Año
                            </span>
                            <span className="text-neutral-900">{artwork.year}</span>
                          </div>
                        )}

                        {artwork.category_name && (
                          <div>
                            <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                              Categoría
                            </span>
                            <span className="text-neutral-900">{artwork.category_name}</span>
                          </div>
                        )}

                        {artwork.medium_name && (
                          <div>
                            <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                              Técnica
                            </span>
                            <span className="text-neutral-900">{artwork.medium_name}</span>
                          </div>
                        )}

                        {(artwork.width_cm || artwork.height_cm) && (
                          <div>
                            <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                              Dimensiones
                            </span>
                            <span className="text-neutral-900">
                              {artwork.width_cm && `${artwork.width_cm}cm`}
                              {artwork.width_cm && artwork.height_cm && ' × '}
                              {artwork.height_cm && `${artwork.height_cm}cm`}
                              {artwork.depth_cm && ` × ${artwork.depth_cm}cm`}
                            </span>
                          </div>
                        )}

                        {artwork.is_for_sale && (
                          <div>
                            <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                              Precio
                            </span>
                            <span className="text-neutral-900 font-medium">
                              {formatPrice(artwork.price_cents, artwork.currency)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => navigate(`/edit-artwork/${artwork.id}`)}
                        className="flex-1 px-4 py-2 border border-black/20 text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(artwork.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm uppercase tracking-wider hover:bg-red-700 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white p-8 border border-black/10 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">¿Eliminar obra?</h3>
              <p className="text-sm text-neutral-600 mb-6">
                Esta acción es irreversible. Se eliminarán todas las imágenes asociadas y no podrás recuperarlas.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-black/20 text-sm uppercase tracking-wider hover:bg-neutral-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm uppercase tracking-wider hover:bg-red-700 transition-colors disabled:bg-red-400"
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

export default MyArtworks;
