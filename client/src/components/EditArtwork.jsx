import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function EditArtwork() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const [artworkData, setArtworkData] = useState({
    title: '',
    description: '',
    year: '',
    category_name: '',
    medium_name: '',
    width_cm: '',
    height_cm: '',
    depth_cm: '',
    framed: false,
    edition_name: '',
    edition_size: '',
    edition_number: '',
    is_for_sale: true,
    price_cents: '',
    currency: 'USD',
    status: 'draft'
  });

  // Cargar datos de la obra
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/profile');
      return;
    }

    // Verificar permisos y cargar obra
    fetch('http://localhost:5000/verify-token', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user.role !== 'artist') {
          setError('Solo los artistas pueden editar obras');
          setTimeout(() => navigate('/'), 2000);
          return;
        }
        
        // Cargar la obra
        return fetch(`http://localhost:5000/artworks/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      })
      .then(res => res.json())
      .then(artwork => {
        // Convertir precio de centavos a formato decimal
        const priceInDecimal = artwork.price_cents ? (artwork.price_cents / 100).toFixed(2) : '';
        
        setArtworkData({
          title: artwork.title || '',
          description: artwork.description || '',
          year: artwork.year || '',
          category_name: artwork.category_name || '',
          medium_name: artwork.medium_name || '',
          width_cm: artwork.width_cm || '',
          height_cm: artwork.height_cm || '',
          depth_cm: artwork.depth_cm || '',
          framed: artwork.framed === 1,
          edition_name: artwork.edition_name || '',
          edition_size: artwork.edition_size || '',
          edition_number: artwork.edition_number || '',
          is_for_sale: artwork.is_for_sale === 1,
          price_cents: priceInDecimal,
          currency: artwork.currency || 'USD',
          status: artwork.status || 'draft'
        });
        setLoadingData(false);
      })
      .catch(err => {
        setError('Error al cargar la obra');
        setLoadingData(false);
      });
  }, [id, navigate]);

  // Actualizar obra
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');

    try {
      // Convertir precio a centavos
      const priceInCents = artworkData.price_cents 
        ? Math.round(parseFloat(artworkData.price_cents) * 100)
        : null;

      const payload = {
        ...artworkData,
        year: artworkData.year ? parseInt(artworkData.year) : null,
        width_cm: artworkData.width_cm ? parseFloat(artworkData.width_cm) : null,
        height_cm: artworkData.height_cm ? parseFloat(artworkData.height_cm) : null,
        depth_cm: artworkData.depth_cm ? parseFloat(artworkData.depth_cm) : null,
        edition_size: artworkData.edition_size ? parseInt(artworkData.edition_size) : null,
        edition_number: artworkData.edition_number ? parseInt(artworkData.edition_number) : null,
        price_cents: priceInCents,
        framed: artworkData.framed ? 1 : 0,
        is_for_sale: artworkData.is_for_sale ? 1 : 0
      };

      const response = await fetch(`http://localhost:5000/artworks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar la obra');
      }

      setSuccess('Obra actualizada exitosamente!');
      setTimeout(() => {
        navigate('/my-artworks');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Error al actualizar la obra');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#f4f4f2] flex items-center justify-center">
        <p className="text-sm text-neutral-600">Cargando obra...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f2] px-6 sm:px-10 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-black/10 pb-4">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600">
            /Editar obra
          </h2>
          <button
            onClick={() => navigate('/my-artworks')}
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

        <form onSubmit={handleSubmit} className="bg-white p-8 border border-black/10 space-y-8">
          {/* Información básica */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-4 pb-2 border-b border-black/10">
              Información básica
            </h3>

            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Título de la obra *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  maxLength="200"
                  value={artworkData.title}
                  onChange={(e) => setArtworkData({ ...artworkData, title: e.target.value })}
                  className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Descripción
                </label>
                <textarea
                  id="description"
                  rows="4"
                  value={artworkData.description}
                  onChange={(e) => setArtworkData({ ...artworkData, description: e.target.value })}
                  className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="year" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    id="year"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={artworkData.year}
                    onChange={(e) => setArtworkData({ ...artworkData, year: e.target.value })}
                    className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                  />
                </div>

                <div>
                  <label htmlFor="category_name" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                    Categoría
                  </label>
                  <input
                    type="text"
                    id="category_name"
                    maxLength="100"
                    value={artworkData.category_name}
                    onChange={(e) => setArtworkData({ ...artworkData, category_name: e.target.value })}
                    className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                  />
                </div>

                <div>
                  <label htmlFor="medium_name" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                    Medio/Técnica
                  </label>
                  <input
                    type="text"
                    id="medium_name"
                    maxLength="100"
                    value={artworkData.medium_name}
                    onChange={(e) => setArtworkData({ ...artworkData, medium_name: e.target.value })}
                    className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Dimensiones */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-4 pb-2 border-b border-black/10">
              Dimensiones (cm)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <label htmlFor="width_cm" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Ancho
                </label>
                <input
                  type="number"
                  id="width_cm"
                  step="0.01"
                  min="0"
                  value={artworkData.width_cm}
                  onChange={(e) => setArtworkData({ ...artworkData, width_cm: e.target.value })}
                  className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                />
              </div>

              <div>
                <label htmlFor="height_cm" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Alto
                </label>
                <input
                  type="number"
                  id="height_cm"
                  step="0.01"
                  min="0"
                  value={artworkData.height_cm}
                  onChange={(e) => setArtworkData({ ...artworkData, height_cm: e.target.value })}
                  className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                />
              </div>

              <div>
                <label htmlFor="depth_cm" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Profundidad
                </label>
                <input
                  type="number"
                  id="depth_cm"
                  step="0.01"
                  min="0"
                  value={artworkData.depth_cm}
                  onChange={(e) => setArtworkData({ ...artworkData, depth_cm: e.target.value })}
                  className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={artworkData.framed}
                    onChange={(e) => setArtworkData({ ...artworkData, framed: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-xs uppercase tracking-wider text-neutral-600">Enmarcada</span>
                </label>
              </div>
            </div>
          </section>

          {/* Venta */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-4 pb-2 border-b border-black/10">
              Información de venta
            </h3>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_for_sale"
                  checked={artworkData.is_for_sale}
                  onChange={(e) => setArtworkData({ ...artworkData, is_for_sale: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_for_sale" className="text-sm cursor-pointer">
                  Esta obra está disponible para la venta
                </label>
              </div>

              {artworkData.is_for_sale && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="price_cents" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                      Precio
                    </label>
                    <input
                      type="number"
                      id="price_cents"
                      step="0.01"
                      min="0"
                      value={artworkData.price_cents}
                      onChange={(e) => setArtworkData({ ...artworkData, price_cents: e.target.value })}
                      className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="currency" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                      Moneda
                    </label>
                    <select
                      id="currency"
                      value={artworkData.currency}
                      onChange={(e) => setArtworkData({ ...artworkData, currency: e.target.value })}
                      className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                    >
                      <option value="USD">USD - Dólar</option>
                      <option value="GTQ">GTQ - Quetzal</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="MXN">MXN - Peso Mexicano</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Estado */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-4 pb-2 border-b border-black/10">
              Estado de publicación
            </h3>

            <div>
              <select
                value={artworkData.status}
                onChange={(e) => setArtworkData({ ...artworkData, status: e.target.value })}
                className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
              >
                <option value="draft">Borrador (no visible)</option>
                <option value="published">Publicada (visible para todos)</option>
                <option value="reserved">Reservada</option>
                <option value="sold">Vendida</option>
                <option value="archived">Archivada</option>
              </select>
            </div>
          </section>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/my-artworks')}
              className="flex-1 px-6 py-3 border border-black/20 text-sm uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-black text-white text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditArtwork;
