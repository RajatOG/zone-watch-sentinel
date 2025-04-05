
import React from 'react';

interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MovementDisplayProps {
  containerRef: React.RefObject<HTMLDivElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  currentMovementBox: Zone | null;
}

const MovementDisplay: React.FC<MovementDisplayProps> = ({
  containerRef,
  currentMovementBox,
}) => {
  return (
    <div className="flex flex-col space-y-2">
      {containerRef.current && currentMovementBox && (
        <div 
          className="movement-highlight"
          style={{
            left: `${currentMovementBox.x}px`,
            top: `${currentMovementBox.y}px`,
            width: `${currentMovementBox.width}px`,
            height: `${currentMovementBox.height}px`,
            position: 'absolute',
            border: '2px solid red',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            zIndex: 20
          }}
        />
      )}
    </div>
  );
};

export default MovementDisplay;
