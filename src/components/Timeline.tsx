
import React from 'react';
import { cn } from '@/lib/utils';

export interface MovementEvent {
  timestamp: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface TimelineProps {
  duration: number;
  currentTime: number;
  events: MovementEvent[];
  onSeek: (time: number) => void;
  className?: string;
}

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  events,
  onSeek,
  className
}) => {
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentageClicked = clickPosition / rect.width;
    const newTime = percentageClicked * duration;
    onSeek(newTime);
  };

  return (
    <div className={cn("w-full flex flex-col space-y-2", className)}>
      <div className="text-sm font-medium">Movement Timeline</div>
      
      <div 
        className="relative h-8 bg-secondary rounded cursor-pointer"
        onClick={handleClick}
      >
        {/* Timeline markers for movement events */}
        {events.map((event, index) => {
          const position = (event.timestamp / duration) * 100;
          return (
            <div
              key={index}
              className="timeline-marker absolute top-0 cursor-pointer"
              style={{ left: `${position}%` }}
              title={`Movement at ${formatTime(event.timestamp)}`}
            />
          );
        })}
        
        {/* Current time indicator */}
        <div 
          className="absolute top-0 h-full w-0.5 bg-primary z-10"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      
      {/* List of movement events with timestamps */}
      <div className="mt-4">
        <div className="text-sm font-medium mb-2">Movement Events</div>
        <div className="bg-card rounded-md p-2 max-h-40 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-muted-foreground text-sm">No movement detected yet</div>
          ) : (
            <div className="space-y-1">
              {events.map((event, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center px-2 py-1 text-sm hover:bg-secondary rounded cursor-pointer"
                  onClick={() => onSeek(event.timestamp)}
                >
                  <span>Movement detected</span>
                  <span className="text-muted-foreground">{formatTime(event.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
