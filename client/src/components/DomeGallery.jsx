// NOTA: Este componente requiere instalar la dependencia:
// npm install @use-gesture/react

// Por ahora, aquí está una versión simplificada sin dependencias externas
// que puedes usar mientras instalas @use-gesture/react

import React, { useEffect, useState, useRef } from 'react';

export default function DomeGallery({
  images = [],
  overlayBlurColor = '#f4f4f2',
  imageBorderRadius = '8px',
  openedImageBorderRadius = '12px',
  openedImageWidth = '600px',
  openedImageHeight = '600px',
  grayscale = true
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    setRotation(prev => ({
      x: Math.max(-30, Math.min(30, prev.x - dy * 0.5)),
      y: prev.y + dx * 0.5
    }));
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startPos]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: overlayBlurColor }}>
      {/* Galería simplificada */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        style={{
          perspective: '1000px',
          userSelect: 'none'
        }}
      >
        <div
          className="relative"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: 'preserve-3d',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          <div className="grid grid-cols-3 gap-4">
            {images.slice(0, 9).map((img, idx) => (
              <div
                key={idx}
                className="relative cursor-pointer hover:scale-105 transition-transform"
                style={{
                  width: '200px',
                  height: '200px',
                  transform: `translateZ(${50 - (idx % 3) * 25}px)`,
                  borderRadius: imageBorderRadius,
                  overflow: 'hidden'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(img);
                }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                  style={{
                    filter: grayscale ? 'grayscale(1)' : 'none'
                  }}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative bg-white shadow-2xl"
            style={{
              width: openedImageWidth,
              height: openedImageHeight,
              borderRadius: openedImageBorderRadius,
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="w-full h-full object-cover"
              style={{
                filter: grayscale ? 'grayscale(1)' : 'none'
              }}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-neutral-500 text-center">
        <p>Arrastra para rotar • Click para ampliar</p>
      </div>
    </div>
  );
}
