import React, { useEffect, useState } from 'react';
import { X, Heart, Send } from 'lucide-react';

function Home() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [notification, setNotification] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    message: '',
    offer_price_cents: ''
  });

  useEffect(() => {
    fetchArtworks();
    fetchFavorites();
  }, []);

  const fetchArtworks = () => {
    fetch('http://localhost:5000/artworks')
      .then((res) => res.json())
      .then((data) => {
        const publishedWorks = data.filter(work => work.status === 'published');
        
        const worksWithImages = publishedWorks.map(async (work) => {
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
              console.error('Error fetching images:', err);
              return { ...work, image_url: null };
            }
          }
          return { ...work, image_url: null };
        });

        Promise.all(worksWithImages).then(works => {
          setArtworks(works);
          setLoading(false);
        });
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  const fetchFavorites = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5000/me/favorites', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        const favoriteIds = new Set(data.map(fav => fav.artwork_id));
        setFavorites(favoriteIds);
      })
      .catch((err) => {
        console.log('No se pudieron cargar favoritos:', err);
      });
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatPrice = (cents, currency) => {
    if (!cents) return '';
    const amount = cents / 100;
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const handleAddToFavorites = (artwork) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      showNotification('Debes iniciar sesión para agregar favoritos', 'error');
      return;
    }

    const isFavorite = favorites.has(artwork.id);

    if (isFavorite) {
      fetch(`http://localhost:5000/favorites/artwork/${artwork.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFavorites(prev => {
              const newSet = new Set(prev);
              newSet.delete(artwork.id);
              return newSet;
            });
            showNotification('Eliminado de favoritos', 'success');
          } else {
            showNotification('Error al eliminar de favoritos', 'error');
          }
        })
        .catch((err) => {
          console.error('Error:', err);
          showNotification('Error al eliminar de favoritos', 'error');
        });
    } else {
      fetch('http://localhost:5000/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          artwork_id: artwork.id
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFavorites(prev => new Set([...prev, artwork.id]));
            showNotification('Agregado a favoritos', 'success');
          } else if (data.message && data.message.includes('ya está en favoritos')) {
            showNotification('Esta obra ya está en tus favoritos', 'info');
          } else {
            showNotification('Error al agregar a favoritos', 'error');
          }
        })
        .catch((err) => {
          console.error('Error:', err);
          showNotification('Error al agregar a favoritos', 'error');
        });
    }
  };

  const handlePurchaseRequest = (artwork) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      showNotification('Debes iniciar sesión para enviar una solicitud', 'error');
      return;
    }

    fetch('http://localhost:5000/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((user) => {
        setRequestForm({
          buyer_name: user.full_name || '',
          buyer_email: user.email || '',
          buyer_phone: '',
          message: '',
          offer_price_cents: ''
        });
        setSelectedArtwork(artwork);
        setShowRequestModal(true);
      })
      .catch((err) => {
        console.error('Error obteniendo datos del usuario:', err);
        setRequestForm({
          buyer_name: '',
          buyer_email: '',
          buyer_phone: '',
          message: '',
          offer_price_cents: ''
        });
        setSelectedArtwork(artwork);
        setShowRequestModal(true);
      });
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      showNotification('Debes iniciar sesión', 'error');
      return;
    }

    if (!requestForm.buyer_name || !requestForm.buyer_email) {
      showNotification('Nombre y email son requeridos', 'error');
      return;
    }

    fetch('http://localhost:5000/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((user) => {
        const requestData = {
          artwork_id: selectedArtwork.id,
          buyer_user_id: user.id,
          buyer_name: requestForm.buyer_name,
          buyer_email: requestForm.buyer_email,
          buyer_phone: requestForm.buyer_phone || null,
          message: requestForm.message || null,
          offer_price_cents: requestForm.offer_price_cents ? parseInt(requestForm.offer_price_cents) * 100 : null,
          currency: selectedArtwork.currency || 'USD'
        };

        return fetch('http://localhost:5000/purchase-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestData)
        });
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showNotification('Solicitud enviada exitosamente', 'success');
          setShowRequestModal(false);
          setSelectedArtwork(null);
          setRequestForm({
            buyer_name: '',
            buyer_email: '',
            buyer_phone: '',
            message: '',
            offer_price_cents: ''
          });
        } else {
          showNotification(data.message || 'Error al enviar solicitud', 'error');
        }
      })
      .catch((err) => {
        console.error('Error:', err);
        showNotification('Error al enviar solicitud', 'error');
      });
  };

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-[#111]">
      {notification && (
        <div className="fixed top-4 right-4 z-[60] animate-slide-in">
          <div className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-600 text-white' :
            notification.type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
          }`}>
            <span className="text-sm font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-80"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <header className="px-6 sm:px-10 pt-8 sm:pt-12 border-b border-black/10">
        <h1
          className="font-black leading-[0.85] tracking-tight"
          style={{ fontSize: "clamp(4rem, 12vw, 12rem)" }}
        >
          IMPRONTA
        </h1>
        <div className="mt-3 pb-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] uppercase tracking-wide text-neutral-700">
          <div>Arte Contemporáneo</div>
          <div className="text-center">Galería en línea</div>
          <div className="text-center">Guatemala</div>
          <div className="text-right">Disponible globalmente</div>
        </div>
      </header>

      <main className="px-6 sm:px-10">
        <section className="py-16 border-b border-black/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-6">
              /02 Introducción
            </h2>
            <p className="text-lg sm:text-xl leading-relaxed text-neutral-800 font-light">
              Impronta es un espacio dedicado a la simplicidad visual, la luz y la
              forma. Curamos obra contemporánea con una mirada esencialista: menos
              ruido, más presencia. Un puente entre artistas emergentes y
              coleccionistas que valoran la autenticidad.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mb-8">
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-6 text-center">
              /03 Obras disponibles
            </h2>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <p className="text-neutral-500 text-sm">Cargando obras...</p>
            </div>
          ) : artworks.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-neutral-500 text-sm">No se encontraron obras</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-black/10">
              {artworks.map((artwork) => (
                <div
                  key={artwork.id}
                  onClick={() => setSelectedArtwork(artwork)}
                  className="bg-white p-6 hover:bg-neutral-50 transition-colors cursor-pointer relative group"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToFavorites(artwork);
                    }}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-all"
                  >
                    <Heart 
                      size={20} 
                      className={`transition-all ${
                        favorites.has(artwork.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-neutral-400 hover:text-red-500'
                      }`}
                    />
                  </button>

                  <div className="aspect-square w-full bg-neutral-200 mb-4 flex items-center justify-center overflow-hidden">
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
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-neutral-900 tracking-tight">
                      {artwork.title}
                    </h3>
                    <p className="text-xs text-neutral-600 uppercase tracking-wide">
                      {artwork.stage_name || artwork.artist_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="px-6 sm:px-10 py-4 border-t border-black/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] uppercase tracking-wide text-neutral-700">
          <div>© 2025 Impronta</div>
          <div className="text-center">Términos</div>
          <div className="text-center">Privacidad</div>
          <div className="text-right">Contacto</div>
        </div>
      </footer>

      {selectedArtwork && !showRequestModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedArtwork(null)}
        >
          <div 
            className="bg-white max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 gap-0">
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
                
                <button
                  onClick={() => setSelectedArtwork(null)}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full transition-colors"
                >
                  <X size={20} className="text-neutral-800" />
                </button>
              </div>

              <div className="p-8 md:p-12 flex flex-col">
                <div className="flex-1">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                      {selectedArtwork.title}
                    </h2>
                    <p className="text-lg text-neutral-700 uppercase tracking-wide">
                      {selectedArtwork.stage_name || selectedArtwork.artist_name}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {selectedArtwork.year && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-wider text-neutral-500 w-24">
                          Año
                        </span>
                        <span className="text-sm text-neutral-900">
                          {selectedArtwork.year}
                        </span>
                      </div>
                    )}

                    {selectedArtwork.category_name && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-wider text-neutral-500 w-24">
                          Categoría
                        </span>
                        <span className="text-sm text-neutral-900">
                          {selectedArtwork.category_name}
                        </span>
                      </div>
                    )}

                    {selectedArtwork.medium && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-wider text-neutral-500 w-24">
                          Técnica
                        </span>
                        <span className="text-sm text-neutral-900">
                          {selectedArtwork.medium}
                        </span>
                      </div>
                    )}

                    {(selectedArtwork.width || selectedArtwork.height) && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-wider text-neutral-500 w-24">
                          Dimensiones
                        </span>
                        <span className="text-sm text-neutral-900">
                          {selectedArtwork.width} × {selectedArtwork.height} cm
                        </span>
                      </div>
                    )}

                    {selectedArtwork.description && (
                      <div className="pt-4 border-t border-neutral-200">
                        <p className="text-sm text-neutral-700 leading-relaxed">
                          {selectedArtwork.description}
                        </p>
                      </div>
                    )}

                    {selectedArtwork.is_for_sale && selectedArtwork.price_cents && (
                      <div className="pt-4 border-t border-neutral-200">
                        <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-2">
                          Precio
                        </span>
                        <span className="text-2xl font-bold text-neutral-900">
                          {formatPrice(selectedArtwork.price_cents, selectedArtwork.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button
                    onClick={() => handleAddToFavorites(selectedArtwork)}
                    className={`flex items-center justify-center gap-2 px-6 py-3 border-2 transition-colors text-sm uppercase tracking-wide font-medium ${
                      favorites.has(selectedArtwork.id)
                        ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
                        : 'border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white'
                    }`}
                  >
                    <Heart 
                      size={18} 
                      className={favorites.has(selectedArtwork.id) ? 'fill-current' : ''}
                    />
                    {favorites.has(selectedArtwork.id) ? 'En Favoritos' : 'Favoritos'}
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

      {showRequestModal && selectedArtwork && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowRequestModal(false);
            setSelectedArtwork(null);
          }}
        >
          <div 
            className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Solicitud de Compra
                  </h2>
                  <p className="text-sm text-neutral-600">
                    {selectedArtwork.title} - {selectedArtwork.stage_name || selectedArtwork.artist_name}
                  </p>
                  {selectedArtwork.price_cents && (
                    <p className="text-lg font-medium text-neutral-900 mt-2">
                      Precio: {formatPrice(selectedArtwork.price_cents, selectedArtwork.currency)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedArtwork(null);
                  }}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-neutral-800" />
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={requestForm.buyer_name}
                    onChange={(e) => setRequestForm({ ...requestForm, buyer_name: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 focus:border-neutral-900 focus:outline-none transition-colors"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={requestForm.buyer_email}
                    onChange={(e) => setRequestForm({ ...requestForm, buyer_email: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 focus:border-neutral-900 focus:outline-none transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={requestForm.buyer_phone}
                    onChange={(e) => setRequestForm({ ...requestForm, buyer_phone: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 focus:border-neutral-900 focus:outline-none transition-colors"
                    placeholder="+502 1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
                    Tu Oferta (opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                      {selectedArtwork.currency === 'GTQ' ? 'Q' : '$'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={requestForm.offer_price_cents}
                      onChange={(e) => setRequestForm({ ...requestForm, offer_price_cents: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-neutral-300 focus:border-neutral-900 focus:outline-none transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Deja en blanco para aceptar el precio publicado
                  </p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    value={requestForm.message}
                    onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 focus:border-neutral-900 focus:outline-none transition-colors resize-none"
                    placeholder="Escribe un mensaje al artista..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequestModal(false);
                      setSelectedArtwork(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors text-sm uppercase tracking-wide font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-sm uppercase tracking-wide font-medium flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Enviar Solicitud
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Home;
