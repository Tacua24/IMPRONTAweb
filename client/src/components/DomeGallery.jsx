import React, { useEffect, useMemo, useRef, useState } from 'react';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function buildItems(pool, seg) {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  if (pool.length === 0) {
    return coords.map(c => ({ ...c, src: '', alt: '' }));
  }

  const normalizedImages = pool.map(image => {
    if (typeof image === 'string') {
      return { src: image, alt: '' };
    }
    return { src: image.src || '', alt: image.alt || '' };
  });

  const usedImages = Array.from({ length: coords.length }, (_, i) => 
    normalizedImages[i % normalizedImages.length]
  );

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt
  }));
}

export default function DomeGallery({
  images = [],
  fit = 20,
  minRadius = 1000,
  overlayBlurColor = '#f4f4f2',
  segments = 35,
  imageBorderRadius = '8px',
  grayscale = true
}) {
  const rootRef = useRef(null);
  const sphereRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotationStartRef = useRef({ x: 0, y: 0 });

  const items = useMemo(() => buildItems(images, segments), [images, segments]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateRadius = () => {
      const rect = root.getBoundingClientRect();
      const minDim = Math.min(rect.width, rect.height);
      let radius = minDim * fit;
      radius = clamp(radius, minRadius, 2000);
      root.style.setProperty('--radius', `${radius}px`);
    };

    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, [fit, minRadius]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      setRotation({
        x: clamp(rotationStartRef.current.x - dy / 20, -15, 15),
        y: rotationStartRef.current.y + dx / 20
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    rotationStartRef.current = rotation;
  };

  useEffect(() => {
    const sphere = sphereRef.current;
    if (sphere) {
      sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
    }
  }, [rotation]);

  const cssStyles = `
    .sphere-root {
      --radius: 520px;
      --circ: calc(var(--radius) * 3.14);
      --rot-y: calc((360deg / var(--segments-x)) / 2);
      --rot-x: calc((360deg / var(--segments-y)) / 2);
      --item-width: calc(var(--circ) / var(--segments-x));
      --item-height: calc(var(--circ) / var(--segments-y));
    }
    .sphere, .sphere-item, .item__image { transform-style: preserve-3d; }
    .stage {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      perspective: calc(var(--radius) * 2);
    }
    .sphere {
      transition: ${isDragging ? 'none' : 'transform 0.3s ease-out'};
      position: absolute;
    }
    .sphere-item {
      width: calc(var(--item-width) * var(--item-size-x));
      height: calc(var(--item-height) * var(--item-size-y));
      position: absolute;
      top: -999px;
      bottom: -999px;
      left: -999px;
      right: -999px;
      margin: auto;
      backface-visibility: hidden;
      transform: rotateY(calc(var(--rot-y) * var(--offset-x))) 
                 rotateX(calc(var(--rot-x) * var(--offset-y))) 
                 translateZ(var(--radius));
    }
    .item__image {
      position: absolute;
      inset: 10px;
      border-radius: ${imageBorderRadius};
      overflow: hidden;
      cursor: ${isDragging ? 'grabbing' : 'grab'};
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div
        ref={rootRef}
        className="sphere-root relative w-full h-full"
        style={{
          '--segments-x': segments,
          '--segments-y': segments
        }}
      >
        <div 
          className="absolute inset-0 select-none"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="stage">
            <div ref={sphereRef} className="sphere">
              {items.map((it, i) => (
                <div
                  key={i}
                  className="sphere-item"
                  style={{
                    '--offset-x': it.x,
                    '--offset-y': it.y,
                    '--item-size-x': it.sizeX,
                    '--item-size-y': it.sizeY
                  }}
                >
                  <div className="item__image absolute bg-gray-200">
                    {it.src && (
                      <img
                        src={it.src}
                        draggable={false}
                        alt={it.alt}
                        className="w-full h-full object-cover pointer-events-none"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          filter: grayscale ? 'grayscale(1)' : 'none' 
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(rgba(235,235,235,0) 65%, ${overlayBlurColor} 100%)`
            }}
          />
          
          <div
            className="absolute left-0 right-0 top-0 h-[120px] pointer-events-none rotate-180"
            style={{
              background: `linear-gradient(to bottom, transparent, ${overlayBlurColor})`
            }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 h-[120px] pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent, ${overlayBlurColor})`
            }}
          />
        </div>
      </div>
    </>
  );
}
