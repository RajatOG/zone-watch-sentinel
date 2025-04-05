
import { pipeline, RawImage } from '@huggingface/transformers';

export interface Detection {
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  label: string;
  score: number;
}

export interface DetectedObject {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

let detector: any = null;
let isLoading = false;

// Initialize the YOLO detector
export const initializeDetector = async () => {
  if (detector || isLoading) return;
  
  try {
    isLoading = true;
    console.log("Loading YOLO model...");
    // Using YOLOv8n which is smaller and faster for browser environments
    detector = await pipeline('object-detection', 'Xenova/yolov8n');
    console.log("YOLO model loaded successfully");
    isLoading = false;
    return detector;
  } catch (error) {
    console.error("Error loading YOLO model:", error);
    isLoading = false;
    throw error;
  }
};

// Detect objects in a video frame
export const detectObjects = async (
  videoElement: HTMLVideoElement,
  containerWidth: number,
  containerHeight: number
): Promise<DetectedObject[]> => {
  if (!detector) {
    await initializeDetector();
  }
  
  if (!detector) {
    throw new Error("Failed to initialize detector");
  }
  
  try {
    // Run detection on the current video frame
    const detections = await detector(videoElement, {
      threshold: 0.5,  // Confidence threshold
      imageSize: 416,  // Input size for the model
    });
    
    // Convert detections to our format and scale to container dimensions
    return detections.map((detection: Detection) => {
      const { box, label, score } = detection;
      const { xmin, ymin, xmax, ymax } = box;
      
      // Calculate display coordinates (scaled to container size)
      const x = xmin * (containerWidth / videoElement.videoWidth);
      const y = ymin * (containerHeight / videoElement.videoHeight);
      const width = (xmax - xmin) * (containerWidth / videoElement.videoWidth);
      const height = (ymax - ymin) * (containerHeight / videoElement.videoHeight);
      
      return {
        x,
        y,
        width,
        height,
        label,
        confidence: score,
      };
    });
  } catch (error) {
    console.error("Error detecting objects:", error);
    return [];
  }
};

// Find person objects from detections (useful for surveillance)
export const findPersonDetections = (objects: DetectedObject[]): DetectedObject[] => {
  return objects.filter(obj => obj.label.toLowerCase() === 'person');
};
