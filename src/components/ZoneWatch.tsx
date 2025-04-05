
import React, { useState, useRef, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import ZoneSelector from './ZoneSelector';
import Timeline, { MovementEvent } from './Timeline';
import ControlPanel from './ControlPanel';
import { detectMovement, getBoundingBoxForMovement, Zone } from '../utils/movementDetector';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Play, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ZoneWatch: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [movementEvents, setMovementEvents] = useState<MovementEvent[]>([]);
  const [currentMovementBox, setCurrentMovementBox] = useState<Zone | null>(null);
  const [sensitivityThreshold, setSensitivityThreshold] = useState(30);
  const [movementThreshold, setMovementThreshold] = useState(50);
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle time updates from video player
  const handleTimeUpdate = (time: number, videoDuration: number) => {
    setCurrentTime(time);
    setDuration(videoDuration);
    
    // Find if there's a movement event happening at the current time
    const event = movementEvents.find(
      e => time >= e.timestamp && time <= e.timestamp + 0.5
    );
    
    if (event) {
      setCurrentMovementBox(event.boundingBox);
    } else {
      setCurrentMovementBox(null);
    }
  };

  // Process video to detect movements
  const processVideo = async () => {
    if (!videoRef.current || !selectedZone) {
      toast({
        title: "Processing Error",
        description: "Please select a zone before processing",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setMovementEvents([]);
    
    const video = videoRef.current;
    video.pause();
    video.currentTime = 0;
    
    // Set up canvas for frame processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      toast({
        title: "Error",
        description: "Canvas context could not be created",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Scale the selected zone to match video dimensions if needed
    const scaleX = video.videoWidth / (containerRef.current?.clientWidth || 1);
    const scaleY = video.videoHeight / (containerRef.current?.clientHeight || 1);
    
    const scaledZone = {
      x: selectedZone.x * scaleX,
      y: selectedZone.y * scaleY,
      width: selectedZone.width * scaleX,
      height: selectedZone.height * scaleY,
    };
    
    // Process the video by iterating through frames
    const events: MovementEvent[] = [];
    let prevFrameTime = 0;
    const frameInterval = 0.5; // Process a frame every 0.5 seconds
    
    const processFrame = async () => {
      // Draw current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // If we have a previous frame, compare them
      if (prevFrameRef.current) {
        const hasMovement = detectMovement(
          prevFrameRef.current, 
          currentFrame, 
          scaledZone,
          sensitivityThreshold,
          movementThreshold
        );
        
        if (hasMovement) {
          const boundingBox = getBoundingBoxForMovement(
            prevFrameRef.current,
            currentFrame,
            scaledZone,
            sensitivityThreshold
          );
          
          if (boundingBox) {
            events.push({
              timestamp: video.currentTime,
              boundingBox: {
                x: boundingBox.x / scaleX,
                y: boundingBox.y / scaleY,
                width: boundingBox.width / scaleX,
                height: boundingBox.height / scaleY,
              },
            });
          }
        }
      }
      
      prevFrameRef.current = currentFrame;
      
      // Move to next frame interval
      prevFrameTime = video.currentTime;
      video.currentTime += frameInterval;
      
      // Check if we've reached the end of the video
      if (video.currentTime < video.duration) {
        // Wait for the video to seek to the new time
        await new Promise((resolve) => {
          const handleSeeked = () => {
            video.removeEventListener('seeked', handleSeeked);
            resolve(null);
          };
          video.addEventListener('seeked', handleSeeked);
        });
        
        // Process next frame
        processFrame();
      } else {
        // Finished processing
        setMovementEvents(events);
        setIsProcessing(false);
        video.currentTime = 0;
        toast({
          title: "Processing Complete",
          description: `Found ${events.length} movement events`,
        });
      }
    };
    
    processFrame();
  };

  // Handle real-time movement detection while playing
  const startRealTimeDetection = () => {
    if (!videoRef.current || !selectedZone) {
      toast({
        title: "Detection Error",
        description: "Please select a zone first",
        variant: "destructive",
      });
      return;
    }
    
    setIsDetectionActive(true);
    setCurrentMovementBox(null);
    
    // Set up canvas for frame processing
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvasRef.current = canvas;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Start video playback
    videoRef.current.play();
    
    // Scale the selected zone to match video dimensions
    const scaleX = videoRef.current.videoWidth / (containerRef.current?.clientWidth || 1);
    const scaleY = videoRef.current.videoHeight / (containerRef.current?.clientHeight || 1);
    
    const scaledZone = {
      x: selectedZone.x * scaleX,
      y: selectedZone.y * scaleY,
      width: selectedZone.width * scaleX,
      height: selectedZone.height * scaleY,
    };
    
    // Real-time detection loop
    const detectLoop = () => {
      if (!videoRef.current || !canvasRef.current || !isDetectionActive) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Draw current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // If we have a previous frame, compare them
      if (prevFrameRef.current) {
        const hasMovement = detectMovement(
          prevFrameRef.current, 
          currentFrame, 
          scaledZone,
          sensitivityThreshold,
          movementThreshold
        );
        
        if (hasMovement) {
          const boundingBox = getBoundingBoxForMovement(
            prevFrameRef.current,
            currentFrame,
            scaledZone,
            sensitivityThreshold
          );
          
          if (boundingBox) {
            const displayBox = {
              x: boundingBox.x / scaleX,
              y: boundingBox.y / scaleY,
              width: boundingBox.width / scaleX,
              height: boundingBox.height / scaleY,
            };
            
            setCurrentMovementBox(displayBox);
            
            // Add to events if not too close to an existing event
            const timestamp = video.currentTime;
            const tooClose = movementEvents.some(
              e => Math.abs(e.timestamp - timestamp) < 0.5
            );
            
            if (!tooClose) {
              setMovementEvents(prev => [
                ...prev, 
                { timestamp, boundingBox: displayBox }
              ]);
            }
          }
        } else {
          setCurrentMovementBox(null);
        }
      }
      
      prevFrameRef.current = currentFrame;
      
      // Continue the detection loop
      animationFrameRef.current = requestAnimationFrame(detectLoop);
    };
    
    detectLoop();
  };

  // Stop real-time detection
  const stopRealTimeDetection = () => {
    setIsDetectionActive(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Handle seeking to a specific time
  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        ZoneWatch: Movement Detector for Surveillance Videos
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div ref={containerRef} className="relative">
                <VideoPlayer 
                  videoFile={videoFile}
                  onTimeUpdate={handleTimeUpdate}
                  videoRef={videoRef}
                />
                
                {/* Zone selection overlay */}
                <div className="video-overlay">
                  {videoFile && (
                    <ZoneSelector
                      containerRef={containerRef}
                      videoRef={videoRef}
                      onZoneSelected={setSelectedZone}
                    />
                  )}
                  
                  {/* Movement highlight */}
                  {currentMovementBox && (
                    <div 
                      className="movement-highlight"
                      style={{
                        left: `${currentMovementBox.x}px`,
                        top: `${currentMovementBox.y}px`,
                        width: `${currentMovementBox.width}px`,
                        height: `${currentMovementBox.height}px`
                      }}
                    />
                  )}
                </div>
              </div>
              
              {/* Detection controls */}
              {videoFile && selectedZone && (
                <div className="flex justify-center space-x-4 mt-4">
                  <Button
                    onClick={isDetectionActive ? stopRealTimeDetection : startRealTimeDetection}
                    variant={isDetectionActive ? "destructive" : "default"}
                    disabled={isProcessing}
                  >
                    {isDetectionActive ? "Stop Detection" : "Start Live Detection"}
                    <Play className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={processVideo}
                    variant="secondary"
                    disabled={isProcessing || isDetectionActive}
                  >
                    {isProcessing ? "Processing..." : "Process Entire Video"}
                    <AlertTriangle className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <ControlPanel
            onFileSelect={setVideoFile}
            sensitivityThreshold={sensitivityThreshold}
            onSensitivityChange={setSensitivityThreshold}
            movementThreshold={movementThreshold}
            onMovementThresholdChange={setMovementThreshold}
          />
          
          {duration > 0 && (
            <Card>
              <CardContent className="p-4">
                <Timeline
                  duration={duration}
                  currentTime={currentTime}
                  events={movementEvents}
                  onSeek={handleSeek}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoneWatch;
