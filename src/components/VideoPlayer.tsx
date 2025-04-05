
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  videoFile: File | null;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoFile, 
  onTimeUpdate,
  className,
  videoRef,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoFile]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      if (onTimeUpdate) {
        onTimeUpdate(current, duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleFastForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 5;
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 5;
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="video-container bg-black rounded-md overflow-hidden">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute top-0 left-0 w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-muted-foreground">
            No video loaded
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.01}
          onValueChange={handleSeek}
          disabled={!videoUrl}
          className="w-full"
        />
        
        <div className="flex justify-center space-x-2 mt-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRewind} 
            disabled={!videoUrl}
          >
            <Rewind className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={togglePlayPause} 
            disabled={!videoUrl}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleFastForward} 
            disabled={!videoUrl}
          >
            <FastForward className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
