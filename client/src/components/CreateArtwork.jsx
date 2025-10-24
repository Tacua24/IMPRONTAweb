import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateArtwork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  
  const navigate = useNavigate();

  const [artworkData, setArtworkData] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
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
          setError('Solo los artistas pueden crear obras');
          setTimeout(() => navigate('/'), 2000);
        } else {
          setUserData(data.user);
        }
      })
      .catch(() => {
        navigate('/profile');
      });
  }, [navigate]);

  // Manejar selección de imágenes
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 10) {
      setError('Máximo 10 imágenes por obra');
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Crear previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, {
          url: reader.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Eliminar imagen
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Subir imágenes al servidor
  const uploadImages = async (artworkId, token) => {
    const uploadedImages = [];
    let primaryImageId = null;

    for (let i = 0; i < images.length; i++) {
      try {
        // Por ahora, simulamos la subida y guardamos la info en la BD
        // En producción, aquí subirías a S3/Cloudinary/etc
        const imageData = {
          artwork_id: artworkId, // Ahora es INT UNSIGNED
          role: i === 0 ? 'cover' : 'detail',
          storage_provider: 'local',
          bucket: 'artworks',
          object_key: `artworks/${artworkId}/${Date.now()}-${images[i].name}`,
          url: previewImages[i].url, // En producción sería la URL real
          mime: images[i].type,
          width: null,
          height: null,
          size_bytes: images[i].size,
          checksum_sha256: null,
          sort_order: i
        };

        const response = await fetch('http://localhost:5000/images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(imageData)
        });

        if (response.ok) {
          const result = await response.json();
          uploadedImages.push(result);
          
          // La primera imagen será la imagen principal
          if (i === 0 && result.id) {
            primaryImageId = result.id;
          }
        }
      } catch (err) {
        console.error('Error uploading image:', err);
      }
    }

    // Actualizar la obra con la imagen principal
    if (primaryImageId) {
      try {
        await fetch(`http://localhost:5000/artworks/${artworkId}/primary-image`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image_id: primaryImageId })
        });
      } catch (err) {
        console.error('Error setting primary image:', err);
      }
    }

    return uploadedImages;
  };

  // Crear obra
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

      const response = await fetch('http://localhost:5000/artworks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la obra');
      }

      // Subir imágenes si hay
      if (images.length > 0) {
        await uploadImages(data.id, token);
      }

      setSuccess('Obra creada exitosamente!');
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      setError(err.message || 'Error al crear la obra');
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-black/10 pb-4">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600">
            /Crear nueva obra
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
                  placeholder="Describe tu obra, técnica, inspiración..."
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
                    placeholder="Pintura, Escultura..."
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
                    placeholder="Óleo, Acrílico..."
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

          {/* Edición */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-4 pb-2 border-b border-black/10">
              Edición (opcional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label htmlFor="edition_name" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Nombre de edición
                </label>
                <input
                  type="text"
                  id="edition_name"
                  maxLength="100"
                  value={artworkData.edition_name}
                  onChange={(e) => setArtworkData({ ...artworkData, edition_name: e.target.value })}
                  className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                  placeholder="Ej: Edición limitada"
                />
              </div>

              <div>
                <label htmlFor="edition_size" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Tamaño de edición
                </label>
                <input
                  type="number"
                  id="edition_size"
                  min="1"
                  value={artworkData.edition_size}
                  onChange={(e) => setArtworkData({ ...artworkData, edition_size: e.target.value })}
                  className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                  placeholder="Total de copias"
                />
              </div>

              <div>
                <label htmlFor="edition_number" className="block text-xs uppercase tracking-wider text-neutral-600 mb-2">
                  Número de edición
                </label>
                <input
                  type="number"
                  id="edition_number"
                  min="1"
                  value={artworkData.edition_number}
                  onChange={(e) => setArtworkData({ ...artworkData, edition_number: e.target.value })}
                  className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition"
                  placeholder="Esta copia"
                />
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
                      placeholder="0.00"
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

          {/* Imágenes */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-neutral-600 mb-4 pb-2 border-b border-black/10">
              Imágenes (máximo 10)
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block w-full border-2 border-dashed border-black/20 p-8 text-center cursor-pointer hover:border-black/40 transition">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <span className="text-sm text-neutral-600">
                    Click para seleccionar imágenes o arrastra aquí
                  </span>
                </label>
              </div>

              {previewImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {previewImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full aspect-square object-cover border border-black/10"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 text-xs bg-black text-white px-2 py-1 rounded">
                          Portada
                        </span>
                      )}
                    </div>
                  ))}
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
              </select>
            </div>
          </section>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-3 border border-black/20 text-sm uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-black text-white text-sm uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear obra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateArtwork;
