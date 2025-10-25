import React, { useEffect, useState } from 'react';

function Home() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/artworks')
      .then((res) => res.json())
      .then((data) => {
        console.log('Artworks recibidos:', data);
        const publishedWorks = data.filter(work => work.status === 'published');
        console.log('Obras publicadas:', publishedWorks);
        
        // Para cada obra, obtener su imagen principal
        const worksWithImages = publishedWorks.map(async (work) => {
          console.log(`Procesando obra ${work.id}, primary_image_id:`, work.primary_image_id);
          
          if (work.primary_image_id) {
            try {
              const imgResponse = await fetch(`http://localhost:5000/artworks/${work.id}/images`);
              const images = await imgResponse.json();
              console.log(`Imágenes de obra ${work.id}:`, images);
              
              const primaryImage = images.find(img => img.id === work.primary_image_id);
              console.log(`Imagen principal de obra ${work.id}:`, primaryImage);
              
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
          console.log('Obras finales con imágenes:', works);
          setArtworks(works);
          setLoading(false);
        });
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const formatPrice = (cents, currency) => {
    if (!cents) return '';
    const amount = cents / 100;
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-[#111]">
      {/* TÍTULO GRANDE */}
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

      {/* CUERPO PRINCIPAL */}
      <main className="px-6 sm:px-10">
        {/* SECCIÓN INTRODUCCIÓN */}
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

        {/* SECCIÓN OBRAS */}
        <section className="py-16">
          <div className="mb-8">
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-6 text-center">
              /03 Obras disponibles
            </h2>
          </div>

          {/* GALERÍA CUADRICULADA */}
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
                  className="bg-white p-6 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
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
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 uppercase tracking-wider pt-1">
                      {artwork.year && <span>{artwork.year}</span>}
                      {artwork.year && artwork.category_name && <span>·</span>}
                      {artwork.category_name && <span>{artwork.category_name}</span>}
                    </div>
                    {artwork.is_for_sale && artwork.price_cents && (
                      <p className="text-xs font-medium text-neutral-900 pt-2">
                        {formatPrice(artwork.price_cents, artwork.currency)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="px-6 sm:px-10 py-4 border-t border-black/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] uppercase tracking-wide text-neutral-700">
          <div>© 2025 Impronta</div>
          <div className="text-center">Términos</div>
          <div className="text-center">Privacidad</div>
          <div className="text-right">Contacto</div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
