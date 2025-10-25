import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Home from './components/Home';
import Profile from './components/Profile';
import CreateArtwork from './components/CreateArtwork';

function App() {
    const [open, setOpen] = useState(false);
    const closeBtnRef = useRef(null);

    // Cambiar título de la pestaña
    useEffect(() => {
        document.title = 'IMPRONTA';
    }, []);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        if (open) setTimeout(() => closeBtnRef.current?.focus(), 0);
    }, [open]);

    return (
        <Router>
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

                {/* RUTAS */}
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/create-artwork" element={<CreateArtwork />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>

                {/* OVERLAY + MENÚ LATERAL */}
                <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
                        aria-label="Cerrar menú"
                    />
                    <aside
                        id="side-menu"
                        role="dialog"
                        aria-label="Menú de navegación"
                        className={`absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white text-[#111] shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-5 transform transition-transform duration-300 ${
open ? "translate-x-0" : "-translate-x-full"
}`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-xs uppercase tracking-widest text-neutral-600">Menú</span>
                            <button
                                ref={closeBtnRef}
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-sm px-2 py-1 rounded hover:bg-black/5"
                                aria-label="Cerrar menú"
                            >
                                ✕
                            </button>
                        </div>

                        <nav className="space-y-2 text-sm">
                            <NavLink
                                to="/"
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `block w-full px-3 py-2 rounded ${isActive ? "bg-black/10 font-medium" : "hover:bg-black/5"}`
                                }
                                end
                            >
                                Home
                            </NavLink>
                            <NavLink
                                to="/profile"
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `block w-full px-3 py-2 rounded ${isActive ? "bg-black/10 font-medium" : "hover:bg-black/5"}`
                                }
                            >
                                Perfil
                            </NavLink>
                                                        <NavLink
                                to="/create-artwork"
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `block w-full px-3 py-2 rounded ${isActive ? "bg-black/10 font-medium" : "hover:bg-black/5"}`
                                }
                            >
                                Crear Obra
                            </NavLink>
                            <NavLink
                                to="/favorites"
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `block w-full px-3 py-2 rounded ${isActive ? "bg-black/10 font-medium" : "hover:bg-black/5"}`
                                }
                            >
                                Favoritos
                            </NavLink>
                            <NavLink
                                to="/requests"
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `block w-full px-3 py-2 rounded ${isActive ? "bg-black/10 font-medium" : "hover:bg-black/5"}`
                                }
                            >
                                Solicitudes
                            </NavLink>
                        </nav>
                    </aside>
                </div>
            </div>
        </Router>
    );
}

// Componente temporal para Favoritos
function Favorites() {
    return (
        <div className="min-h-screen bg-[#f4f4f2] px-6 sm:px-10 py-16">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-6">
                    /Favoritos
                </h2>
                <div className="bg-white p-8 border border-black/10">
                    <p className="text-sm text-neutral-600">Próximamente...</p>
                </div>
            </div>
        </div>
    );
}

// Componente temporal para Solicitudes
function Requests() {
    return (
        <div className="min-h-screen bg-[#f4f4f2] px-6 sm:px-10 py-16">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mb-6">
                    /Solicitudes de compra
                </h2>
                <div className="bg-white p-8 border border-black/10">
                    <p className="text-sm text-neutral-600">Próximamente...</p>
                </div>
            </div>
        </div>
    );
}

// Componente 404
function NotFound() {
    return (
        <div className="min-h-screen bg-[#f4f4f2] px-6 sm:px-10 py-16 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-4xl font-bold mb-4">404</h2>
                <p className="text-sm text-neutral-600 mb-6">Página no encontrada</p>
                <a href="/" className="text-sm uppercase tracking-wider hover:underline">
                    ← Volver al inicio
                </a>
            </div>
        </div>
    );
}

export default App;
