import React, { useState, useRef, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import MovementDisplay from './MovementDisplay';
import Timeline, { MovementEvent } from './Timeline';
import ControlPanel from './ControlPanel';
import { Zone } from '../utils/movementDetector';
import { initializeDetector, detectObjects, findPersonDetections, DetectedObject } from '../utils/yoloDetector';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Play, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ZoneWatch: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [movementEvents, setMovementEvents] = useState<MovementEvent[]>([]);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[] | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [personDetectionOnly, setPersonDetectionOnly] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        await initializeDetector();
        setIsModelLoading(false);
        toast({
          title: "Detection Model Loaded",
          description: "Object detection model loaded successfully",
        });
      } catch (error) {
        setIsModelLoading(false);
        toast({
          title: "Model Loading Error",
          description: "Failed to load object detection model. Try refreshing the page.",
          variant: "destructive",
        });
      }
    };
    
    loadModel();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleTimeUpdate = (time: number, videoDuration: number) => {
    setCurrentTime(time);
    setDuration(videoDuration);
    
    const event = movementEvents.find(
      e => time >= e.timestamp && time <= e.timestamp + 0.5
    );
    
    if (event && event.detectedObjects) {
      setDetectedObjects(event.detectedObjects);
    } else if (!isDetectionActive) {
      setDetectedObjects(null);
    }
  };

  const processVideo = async () => {
    if (!videoRef.current) {
      toast({
        title: "Processing Error",
        description: "Please upload a video before processing",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setMovementEvents([]);
    
    const video = videoRef.current;
    video.pause();
    video.currentTime = 0;
    
    const events: MovementEvent[] = [];
    let prevFrameTime = 0;
    const frameInterval = 0.5;
    
    const processFrame = async () => {
      if (!containerRef.current) return;
      
      try {
        const objects = await detectObjects(
          video, 
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
        
        const relevantObjects = personDetectionOnly ? findPersonDetections(objects) : objects;
        
        if (relevantObjects.length > 0) {
          events.push({
            timestamp: video.currentTime,
            detectedObjects: relevantObjects,
            boundingBox: relevantObjects.length > 0 ? {
              x: relevantObjects[0].x,
              y: relevantObjects[0].y,
              width: relevantObjects[0].width,
              height: relevantObjects[0].height
            } : null
          });
        }
      } catch (error) {
        console.error("Error in frame processing:", error);
      }
      
      prevFrameTime = video.currentTime;
      video.currentTime += frameInterval;
      
      if (video.currentTime < video.duration) {
        await new Promise((resolve) => {
          const handleSeeked = () => {
            video.removeEventListener('seeked', handleSeeked);
            resolve(null);
          };
          video.addEventListener('seeked', handleSeeked);
        });
        
        processFrame();
      } else {
        setMovementEvents(events);
        setIsProcessing(false);
        video.currentTime = 0;
        
        const objectTypes = new Set();
        events.forEach(event => {
          if (event.detectedObjects) {
            event.detectedObjects.forEach(obj => objectTypes.add(obj.label));
          }
        });
        
        toast({
          title: "Processing Complete",
          description: `Found ${events.length} detection events with ${objectTypes.size} different object types`,
        });
      }
    };
    
    processFrame();
  };

  const startRealTimeDetection = () => {
    if (!videoRef.current) {
      toast({
        title: "Detection Error",
        description: "Please upload a video first",
        variant: "destructive",
      });
      return;
    }
    
    setIsDetectionActive(true);
    setDetectedObjects(null);
    
    videoRef.current.play();
    
    const detectLoop = async () => {
      if (!videoRef.current || !containerRef.current || !isDetectionActive) return;
      
      try {
        const objects = await detectObjects(
          videoRef.current,
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
        
        const relevantObjects = personDetectionOnly ? findPersonDetections(objects) : objects;
        
        setDetectedObjects(relevantObjects);
        
        if (relevantObjects.length > 0) {
          const timestamp = videoRef.current.currentTime;
          const tooClose = movementEvents.some(
            e => Math.abs(e.timestamp - timestamp) < 0.5
          );
          
          if (!tooClose) {
            setMovementEvents(prev => [
              ...prev, 
              { 
                timestamp,
                detectedObjects: relevantObjects,
                boundingBox: relevantObjects.length > 0 ? {
                  x: relevantObjects[0].x,
                  y: relevantObjects[0].y,
                  width: relevantObjects[0].width,
                  height: relevantObjects[0].height
                } : null
              }
            ]);
          }
        }
      } catch (error) {
        console.error("Error in real-time detection:", error);
      }
      
      animationFrameRef.current = requestAnimationFrame(detectLoop);
    };
    
    detectLoop();
  };

  const stopRealTimeDetection = () => {
    setIsDetectionActive(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const togglePersonDetection = () => {
    setPersonDetectionOnly(!personDetectionOnly);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        ZoneWatch: TensorFlow-powered Object Detection for Surveillance Videos
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
                
                <div className="video-overlay">
                  <MovementDisplay
                    containerRef={containerRef}
                    videoRef={videoRef}
                    detectedObjects={detectedObjects}
                  />
                </div>
              </div>
              
              {isModelLoading && (
                <div className="mt-2 text-center text-amber-500">
                  <AlertTriangle className="inline-block mr-1 h-4 w-4" />
                  Loading TensorFlow.js object detection model...
                </div>
              )}
              
              {videoFile && (
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
                  <Button
                    onClick={isDetectionActive ? stopRealTimeDetection : startRealTimeDetection}
                    variant={isDetectionActive ? "destructive" : "default"}
                    disabled={isProcessing || isModelLoading}
                  >
                    {isDetectionActive ? "Stop Detection" : "Start Live Detection"}
                    <Play className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={processVideo}
                    variant="secondary"
                    disabled={isProcessing || isDetectionActive || isModelLoading}
                  >
                    {isProcessing ? "Processing..." : "Process Entire Video"}
                    <AlertTriangle className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={togglePersonDetection}
                    variant={personDetectionOnly ? "default" : "outline"}
                    disabled={isProcessing || isModelLoading}
                  >
                    {personDetectionOnly ? "People Only" : "All Objects"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <ControlPanel
            onFileSelect={setVideoFile}
            sensitivityThreshold={0}
            onSensitivityChange={() => {}}
            movementThreshold={0}
            onMovementThresholdChange={() => {}}
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
