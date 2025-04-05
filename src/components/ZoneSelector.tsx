
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Square } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ZoneSelectorProps {
  containerRef: React.RefObject<HTMLDivElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  onZoneSelected: (zone: Zone | null) => void;
}

const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  containerRef,
  videoRef,
  onZoneSelected,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const selectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onZoneSelected(currentZone);
  }, [currentZone, onZoneSelected]);

  const startSelection = () => {
    setIsSelecting(true);
    setCurrentZone(null);
  };

  const cancelSelection = () => {
    setIsSelecting(false);
    setStartPoint(null);
  };

  const clearZone = () => {
    setCurrentZone(null);
    onZoneSelected(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPoint({ x, y });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !startPoint || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = Math.abs(x - startPoint.x);
    const height = Math.abs(y - startPoint.y);
    const zoneX = Math.min(startPoint.x, x);
    const zoneY = Math.min(startPoint.y, y);
    
    setCurrentZone({
      x: zoneX,
      y: zoneY,
      width,
      height
    });
  };

  const handleMouseUp = () => {
    if (isDragging && startPoint && currentZone) {
      setIsSelecting(false);
      setIsDragging(false);
      setStartPoint(null);
      
      // Ensure minimum size for the zone
      if (currentZone.width < 10 || currentZone.height < 10) {
        setCurrentZone(null);
        return;
      }
      
      onZoneSelected(currentZone);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2 mb-2">
        <Checkbox 
          id="zone-select"
          checked={isSelecting}
          onCheckedChange={(checked) => {
            if (checked) {
              startSelection();
            } else {
              cancelSelection();
            }
          }}
        />
        <Label htmlFor="zone-select" className="cursor-pointer">
          {isSelecting ? "Now click and drag to select zone" : "Select monitoring zone"}
        </Label>
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant={isSelecting ? "secondary" : "outline"}
          onClick={startSelection}
          disabled={isDragging}
        >
          <Square className="mr-2 h-4 w-4" />
          {isSelecting ? "Selecting Zone..." : "Select Zone"}
        </Button>
        
        {isSelecting && (
          <Button variant="outline" onClick={cancelSelection}>
            Cancel
          </Button>
        )}
        
        {currentZone && !isSelecting && (
          <Button variant="outline" onClick={clearZone}>
            Clear Zone
          </Button>
        )}
      </div>
      
      {containerRef.current && currentZone && (
        <div 
          ref={selectionRef}
          className="zone-selection"
          style={{
            left: `${currentZone.x}px`,
            top: `${currentZone.y}px`,
            width: `${currentZone.width}px`,
            height: `${currentZone.height}px`
          }}
        />
      )}
      
      {isSelecting && (
        <div 
          className="absolute top-0 left-0 w-full h-full cursor-crosshair z-10"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      )}
    </div>
  );
};

export default ZoneSelector;
