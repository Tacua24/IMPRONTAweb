import React, { useEffect, useState, useRef } from 'react';

function Home() {
  const [artworks, setArtworks] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => closeBtnRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    fetch('http://localhost:5000/artworks')
      .then((res) => res.json())
      .then((data) => {
        const publishedWorks = data.filter(work => work.status === 'published');
        setArtworks(publishedWorks);
        setFilteredArtworks(publishedWorks);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const filtered = artworks.filter(artwork =>
      artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artwork.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (artwork.stage_name && artwork.stage_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (artwork.category_name && artwork.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredArtworks(filtered);
  }, [searchQuery, artworks]);

  const formatPrice = (cents, currency) => {
    if (!cents) return '';
    const amount = cents / 100;
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-[#111] overflow-x-hidden">
      {/* BARRA SUPERIOR */}
      <div className="w-full text-[10px] uppercase tracking-wide text-neutral-600 flex items-center justify-between px-6 py-2 border-b border-black/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-2 py-1 rounded hover:bg-black/5"
          >
            Menú
          </button>
          <span>|</span>
          <span>/01 Intro</span>
        </div>
        <div>Galería Impronta</div>
        <div className="flex gap-2 items-center">
          <span>Estado</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" />
        </div>
      </div>

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
          <div className="max-w-4xl">
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
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-6">
              /03 Obras disponibles
            </h2>
            <div className="max-w-md">
              <input
                type="text"
                placeholder="Buscar por título, artista o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-black/20 px-4 py-2 text-sm outline-none focus:border-black/40 transition placeholder:text-neutral-400 bg-white"
              />
            </div>
          </div>

          {/* GALERÍA CUADRICULADA */}
          {loading ? (
            <div className="py-20">
              <p className="text-neutral-500 text-sm">Cargando obras...</p>
            </div>
          ) : filteredArtworks.length === 0 ? (
            <div className="py-20">
              <p className="text-neutral-500 text-sm">No se encontraron obras</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-black/10">
              {filteredArtworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="bg-white p-6 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <div className="aspect-square w-full bg-neutral-200 mb-4 flex items-center justify-center">
                    <span className="text-xs text-neutral-400 uppercase tracking-wider">
                      Sin imagen
                    </span>
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

      {/* OVERLAY + MENÚ LATERAL */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          aria-label="Cerrar menú"
        />
        <aside
          role="dialog"
          aria-label="Menú de navegación"
          className={`absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white text-[#111] shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 transform transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/10">
            <span className="text-[10px] uppercase tracking-widest text-neutral-600">Menú principal</span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setOpen(false)}
              className="text-lg px-2 py-1 rounded hover:bg-black/5"
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-1 text-sm">
            <a
              href="/"
              className="block w-full px-4 py-3 rounded hover:bg-black/5 transition-colors"
            >
              Home
            </a>
            <a
              href="/favorites"
              className="block w-full px-4 py-3 rounded hover:bg-black/5 transition-colors"
            >
              Favoritos
            </a>
            <a
              href="/requests"
              className="block w-full px-4 py-3 rounded hover:bg-black/5 transition-colors"
            >
              Solicitudes
            </a>
            <a
              href="/profile"
              className="block w-full px-4 py-3 rounded hover:bg-black/5 transition-colors"
            >
              Perfil
            </a>
            
            <div className="border-t border-black/10 my-4"></div>
            
            <button
              className="block w-full px-4 py-3 rounded hover:bg-red-50 transition-colors text-left text-red-600"
            >
              Cerrar sesión
            </button>
          </nav>
        </aside>
      </div>
    </div>
  );
}

export default Home;
