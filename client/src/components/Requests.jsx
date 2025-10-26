import React, { useEffect, useState } from 'react';
import { Clock, Check, X as XIcon, AlertCircle, Send } from 'lucide-react';

function Requests() {
  const [myRequests, setMyRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' o 'received'
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchUserRole();
    fetchRequests();
  }, []);

  const fetchUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5000/verify-token', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserRole(data.user.role);
        }
      })
      .catch(() => {
        setUserRole(null);
      });
  };

  const fetchRequests = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No hay token, redirigir a login');
      setLoading(false);
      return;
    }

    // Obtener solicitudes enviadas
    fetch('http://localhost:5000/me/purchase-requests', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('No autorizado');
        return res.json();
      })
      .then((data) => {
        console.log('Mis solicitudes:', data);
        setMyRequests(data);
      })
      .catch((err) => {
        console.error('Error cargando mis solicitudes:', err);
      });

    // Obtener solicitudes recibidas (solo si es artista)
    fetch('http://localhost:5000/me/requests-received', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('No autorizado');
        return res.json();
      })
      .then((data) => {
        console.log('Solicitudes recibidas:', data);
        setReceivedRequests(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando solicitudes recibidas:', err);
        setLoading(false);
      });
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatPrice = (cents, currency) => {
    if (!cents) return 'N/A';
    const amount = cents / 100;
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800'
    };

    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      cancelled: 'Cancelada',
      completed: 'Completada'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs uppercase tracking-wider rounded ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'pending' && <Clock size={14} />}
        {status === 'approved' && <Check size={14} />}
        {status === 'rejected' && <XIcon size={14} />}
        {status === 'completed' && <Check size={14} />}
        {labels[status] || status}
      </span>
    );
  };

  const handleUpdateStatus = (requestId, newStatus) => {
    const token = localStorage.getItem('token');
    
    const confirmMessage = newStatus === 'accepted' 
      ? '¿Aceptar esta solicitud de compra?' 
      : '¿Rechazar esta solicitud de compra?';
    
    if (!window.confirm(confirmMessage)) return;

    fetch(`http://localhost:5000/purchase-requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showNotification(`Solicitud ${newStatus === 'accepted' ? 'aceptada' : 'rechazada'}`, 'success');
          fetchRequests(); // Recargar solicitudes
        } else {
          showNotification('Error al actualizar solicitud', 'error');
        }
      })
      .catch((err) => {
        console.error('Error:', err);
        showNotification('Error al actualizar solicitud', 'error');
      });
  };

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-[#111]">
      {/* NOTIFICACIÓN */}
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
              <XIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TÍTULO */}
      <header className="px-6 sm:px-10 pt-8 sm:pt-12 border-b border-black/10">
        <h1
          className="font-black leading-[0.85] tracking-tight"
          style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}
        >
          SOLICITUDES
        </h1>
        <div className="mt-3 pb-3">
          <p className="text-sm text-neutral-600">
            Gestiona tus solicitudes de compra
          </p>
        </div>
      </header>

      {/* TABS (solo si es artista) */}
      {userRole === 'artist' && (
        <div className="px-6 sm:px-10 pt-8 border-b border-black/10">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('sent')}
              className={`pb-3 px-4 text-sm uppercase tracking-wider font-medium transition-colors border-b-2 ${
                activeTab === 'sent'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Enviadas ({myRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`pb-3 px-4 text-sm uppercase tracking-wider font-medium transition-colors border-b-2 ${
                activeTab === 'received'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Recibidas ({receivedRequests.length})
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      <main className="px-6 sm:px-10 py-16">
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 text-sm">Cargando solicitudes...</p>
          </div>
        ) : (
          <>
            {/* SOLICITUDES ENVIADAS */}
            {(activeTab === 'sent' || userRole !== 'artist') && (
              <div>
                <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-6">
                  Mis Solicitudes Enviadas
                </h2>
                
                {myRequests.length === 0 ? (
                  <div className="bg-white p-12 border border-black/10 text-center">
                    <Send size={48} className="mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-500 text-sm">No has enviado solicitudes aún</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-white p-6 border border-black/10 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-neutral-900 mb-1">
                              {request.artwork_title}
                            </h3>
                            <p className="text-sm text-neutral-600 uppercase tracking-wide">
                              {request.stage_name || request.artist_name}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                              Precio Obra
                            </span>
                            <span className="text-neutral-900">
                              {formatPrice(request.artwork_price, request.currency)}
                            </span>
                          </div>

                          {request.offer_price_cents && (
                            <div>
                              <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                                Tu Oferta
                              </span>
                              <span className="text-neutral-900 font-medium">
                                {formatPrice(request.offer_price_cents, request.currency)}
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                              Fecha
                            </span>
                            <span className="text-neutral-900">
                              {formatDate(request.created_at)}
                            </span>
                          </div>
                        </div>

                        {request.message && (
                          <div className="mt-4 pt-4 border-t border-neutral-200">
                            <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-2">
                              Mensaje
                            </span>
                            <p className="text-sm text-neutral-700">
                              {request.message}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SOLICITUDES RECIBIDAS (solo artistas) */}
            {activeTab === 'received' && userRole === 'artist' && (
              <div>
                <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-6">
                  Solicitudes Recibidas
                </h2>
                
                {receivedRequests.length === 0 ? (
                  <div className="bg-white p-12 border border-black/10 text-center">
                    <AlertCircle size={48} className="mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-500 text-sm">No tienes solicitudes recibidas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-white p-6 border border-black/10 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-neutral-900 mb-1">
                              {request.artwork_title}
                            </h3>
                            <p className="text-sm text-neutral-600">
                              De: {request.buyer_name || request.buyer_email}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                              Precio Obra
                            </span>
                            <span className="text-neutral-900">
                              {formatPrice(request.artwork_price, request.currency)}
                            </span>
                          </div>

                          {request.offer_price_cents && (
                            <div>
                              <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                                Oferta
                              </span>
                              <span className="text-neutral-900 font-medium">
                                {formatPrice(request.offer_price_cents, request.currency)}
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                              Email
                            </span>
                            <span className="text-neutral-900 text-xs">
                              {request.buyer_email}
                            </span>
                          </div>

                          {request.buyer_phone && (
                            <div>
                              <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-1">
                                Teléfono
                              </span>
                              <span className="text-neutral-900">
                                {request.buyer_phone}
                              </span>
                            </div>
                          )}
                        </div>

                        {request.message && (
                          <div className="mb-4 pb-4 border-b border-neutral-200">
                            <span className="text-xs uppercase tracking-wider text-neutral-500 block mb-2">
                              Mensaje
                            </span>
                            <p className="text-sm text-neutral-700">
                              {request.message}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500">
                            Recibida: {formatDate(request.created_at)}
                          </span>

                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateStatus(request.id, 'rejected')}
                                className="px-4 py-2 text-sm border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors uppercase tracking-wide font-medium"
                              >
                                Rechazar
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(request.id, 'approved')}
                                className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 transition-colors uppercase tracking-wide font-medium"
                              >
                                Aceptar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

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

export default Requests;
