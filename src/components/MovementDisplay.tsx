
import React from 'react';

interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  confidence?: number;
}

interface MovementDisplayProps {
  containerRef: React.RefObject<HTMLDivElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  detectedObjects: Zone[] | null;
}

const MovementDisplay: React.FC<MovementDisplayProps> = ({
  containerRef,
  detectedObjects,
}) => {
  return (
    <div className="flex flex-col space-y-2">
      {containerRef.current && detectedObjects && detectedObjects.map((object, index) => (
        <div 
          key={index}
          className="movement-highlight"
          style={{
            left: `${object.x}px`,
            top: `${object.y}px`,
            width: `${object.width}px`,
            height: `${object.height}px`,
            position: 'absolute',
            border: '2px solid red',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            zIndex: 20
          }}
        >
          {object.label && (
            <div className="absolute -top-6 left-0 bg-black/70 text-white px-2 py-0.5 text-xs rounded">
              {object.label} {object.confidence && `(${Math.round(object.confidence * 100)}%)`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MovementDisplay;
