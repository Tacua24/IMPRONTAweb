import React, { useEffect, useState } from 'react';
import { X, Heart, Send, Trash2 } from 'lucide-react';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No hay token, redirigir a login');
      // TODO: Redirigir a login
      setLoading(false);
      return;
    }

    fetch('http://localhost:5000/me/favorites', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          console.log('Token inválido, redirigir a login');
          // TODO: Redirigir a login
          throw new Error('No autorizado');
        }
        return res.json();
      })
      .then((data) => {
        console.log('Favoritos recibidos:', data);
        
        // Para cada favorito, obtener su imagen principal
        const favoritesWithImages = data.map(async (fav) => {
          if (fav.artwork_id) {
            try {
              const imgResponse = await fetch(`http://localhost:5000/artworks/${fav.artwork_id}/images`);
              const images = await imgResponse.json();
              
              // Buscar la imagen principal o la primera disponible
              const primaryImage = images.length > 0 ? images[0] : null;
              
              return {
                ...fav,
                image_url: primaryImage?.url || null
              };
            } catch (err) {
              console.error('Error fetching images:', err);
              return { ...fav, image_url: null };
            }
          }
          return { ...fav, image_url: null };
        });

        Promise.all(favoritesWithImages).then(favs => {
          console.log('Favoritos finales con imágenes:', favs);
          setFavorites(favs);
          setLoading(false);
        });
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  const formatPrice = (cents, currency) => {
    if (!cents) return '';
    const amount = cents / 100;
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const handleRemoveFavorite = (favoriteId, artworkId) => {
    const token = localStorage.getItem('token');
    
    if (!window.confirm('¿Eliminar de favoritos?')) return;

    fetch(`http://localhost:5000/favorites/${favoriteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Favorito eliminado:', data);
        // Actualizar la lista eliminando el favorito
        setFavorites(favorites.filter(fav => fav.id !== favoriteId));
        
        // Si el modal está abierto con esta obra, cerrarlo
        if (selectedArtwork?.artwork_id === artworkId) {
          setSelectedArtwork(null);
        }
      })
      .catch((err) => {
        console.error('Error eliminando favorito:', err);
        alert('Error al eliminar de favoritos');
      });
  };

  const handlePurchaseRequest = (artwork) => {
    console.log('Solicitud de compra:', artwork);
    // TODO: Implementar modal de solicitud de compra
    alert('Solicitud de compra enviada');
  };

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-[#111]">
      {/* TÍTULO */}
      <header className="px-6 sm:px-10 pt-8 sm:pt-12 border-b border-black/10">
        <h1
          className="font-black leading-[0.85] tracking-tight"
          style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}
        >
          MIS FAVORITOS
        </h1>
        <div className="mt-3 pb-3">
          <p className="text-sm text-neutral-600">
            Obras que has guardado para ver más tarde
          </p>
        </div>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="px-6 sm:px-10 py-16">
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 text-sm">Cargando favoritos...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-20 text-center">
            <Heart size={64} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-500 text-lg mb-2">No tienes favoritos aún</p>
            <p className="text-neutral-400 text-sm">Explora la galería y guarda las obras que te gusten</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-black/10">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-white p-6 hover:bg-neutral-50 transition-colors relative group"
              >
                {/* Botón eliminar favorito */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFavorite(favorite.id, favorite.artwork_id);
                  }}
                  className="absolute top-3 right-3 z-10 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Eliminar de favoritos"
                >
                  <Trash2 size={16} />
                </button>

                {/* Contenido clickeable */}
                <div 
                  onClick={() => setSelectedArtwork(favorite)}
                  className="cursor-pointer"
                >
                  <div className="aspect-square w-full bg-neutral-200 mb-4 flex items-center justify-center overflow-hidden">
                    {favorite.image_url ? (
                      <img 
                        src={favorite.image_url} 
                        alt={favorite.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-neutral-400 uppercase tracking-wider">
                        Sin imagen
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-neutral-900 tracking-tight">
                      {favorite.title}
                    </h3>
                    <p className="text-xs text-neutral-600 uppercase tracking-wide">
                      {favorite.stage_name || favorite.artist_name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DE OBRA EXPANDIDA */}
      {selectedArtwork && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedArtwork(null)}
        >
          <div 
            className="bg-white max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* IMAGEN */}
              <div className="relative bg-neutral-100 aspect-square md:aspect-auto">
                {selectedArtwork.image_url ? (
                  <img 
                    src={selectedArtwork.image_url} 
                    alt={selectedArtwork.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-neutral-400 uppercase tracking-wider text-sm">
                      Sin imagen
                    </span>
                  </div>
                )}
                
                {/* Botón cerrar */}
                <button
                  onClick={() => setSelectedArtwork(null)}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full transition-colors"
                >
                  <X size={20} className="text-neutral-800" />
                </button>
              </div>

              {/* INFORMACIÓN */}
              <div className="p-8 md:p-12 flex flex-col">
                <div className="flex-1">
                  {/* Título y Artista */}
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                      {selectedArtwork.title}
                    </h2>
                    <p className="text-lg text-neutral-700 uppercase tracking-wide">
                      {selectedArtwork.stage_name || selectedArtwork.artist_name}
                    </p>
                  </div>

                  {/* Estado de la obra */}
                  <div className="mb-6">
                    <span className={`inline-block px-3 py-1 text-xs uppercase tracking-wider rounded ${
                      selectedArtwork.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedArtwork.status === 'published' ? 'Disponible' : selectedArtwork.status}
                    </span>
                  </div>

                  {/* Precio */}
                  {selectedArtwork.price_cents && (
                    <div className="mb-8 pb-8 border-b border-neutral-200">
                      <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-2">
                        Precio
                      </span>
                      <span className="text-2xl font-bold text-neutral-900">
                        {formatPrice(selectedArtwork.price_cents, selectedArtwork.currency)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRemoveFavorite(selectedArtwork.id, selectedArtwork.artwork_id)}
                    className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-sm uppercase tracking-wide font-medium"
                  >
                    <Trash2 size={18} />
                    Eliminar
                  </button>
                  
                  <button
                    onClick={() => handlePurchaseRequest(selectedArtwork)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-sm uppercase tracking-wide font-medium"
                  >
                    <Send size={18} />
                    Solicitar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Favorites;
