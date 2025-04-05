
import * as tf from '@tensorflow/tfjs';

export interface DetectedObject {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

// COCO dataset classes that COCO-SSD model can detect
const CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
  'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
  'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

let detector: any = null;
let isLoading = false;

// Initialize the detector
export const initializeDetector = async () => {
  if (detector || isLoading) return;
  
  try {
    isLoading = true;
    console.log("Loading TensorFlow.js COCO-SSD model...");
    
    // Make sure TensorFlow.js is initialized
    await tf.ready();
    
    // Import COCO-SSD model dynamically
    const cocoSsd = await import('@tensorflow-models/coco-ssd');
    
    // Load the COCO-SSD model
    detector = await cocoSsd.load({
      base: 'lite_mobilenet_v2' // Using a lightweight model for better performance
    });
    
    console.log("TensorFlow.js COCO-SSD model loaded successfully");
    isLoading = false;
    return detector;
  } catch (error) {
    console.error("Error loading detection model:", error);
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
    const predictions = await detector.detect(videoElement);
    
    // Convert detections to our format and scale to container dimensions
    return predictions.map((prediction: any) => {
      const [x, y, width, height] = prediction.bbox;
      
      // Calculate display coordinates (scaled to container size)
      const scaledX = x * (containerWidth / videoElement.videoWidth);
      const scaledY = y * (containerHeight / videoElement.videoHeight);
      const scaledWidth = width * (containerWidth / videoElement.videoWidth);
      const scaledHeight = height * (containerHeight / videoElement.videoHeight);
      
      return {
        x: scaledX,
        y: scaledY,
        width: scaledWidth,
        height: scaledHeight,
        label: prediction.class,
        confidence: prediction.score,
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
