
export interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MovementEvent {
  timestamp: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Simple function to detect movement between frames using pixel difference
export const detectMovement = (
  prevFrame: ImageData,
  currentFrame: ImageData,
  zone: Zone | null,
  sensitivityThreshold: number = 30,
  movementThreshold: number = 50
): boolean => {
  const { data: prevData } = prevFrame;
  const { data: currData } = currentFrame;
  const width = prevFrame.width;
  
  let diffPixelCount = 0;
  
  // If no zone is selected, check the entire frame
  if (!zone) {
    for (let i = 0; i < prevData.length; i += 4) {
      const rDiff = Math.abs(prevData[i] - currData[i]);
      const gDiff = Math.abs(prevData[i + 1] - currData[i + 1]);
      const bDiff = Math.abs(prevData[i + 2] - currData[i + 2]);
      
      const diff = (rDiff + gDiff + bDiff) / 3;
      
      if (diff > sensitivityThreshold) {
        diffPixelCount++;
      }
    }
  } else {
    // Only check pixels within the selected zone
    const { x, y, width: zoneWidth, height: zoneHeight } = zone;
    
    for (let yPos = y; yPos < y + zoneHeight; yPos++) {
      for (let xPos = x; xPos < x + zoneWidth; xPos++) {
        const i = (yPos * width + xPos) * 4;
        
        // Make sure the pixel is in bounds
        if (i >= 0 && i < prevData.length - 3) {
          const rDiff = Math.abs(prevData[i] - currData[i]);
          const gDiff = Math.abs(prevData[i + 1] - currData[i + 1]);
          const bDiff = Math.abs(prevData[i + 2] - currData[i + 2]);
          
          const diff = (rDiff + gDiff + bDiff) / 3;
          
          if (diff > sensitivityThreshold) {
            diffPixelCount++;
          }
        }
      }
    }
  }
  
  // Determine if enough pixels changed to consider it movement
  return diffPixelCount > movementThreshold;
};

// Function to extract a rectangular region from video frame for movement analysis
export const getBoundingBoxForMovement = (
  prevFrame: ImageData,
  currentFrame: ImageData,
  zone: Zone | null,
  sensitivityThreshold: number = 30
): Zone | null => {
  if (!zone) return null;
  
  const { data: prevData } = prevFrame;
  const { data: currData } = currentFrame;
  const width = prevFrame.width;
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  let hasMovement = false;
  
  const { x, y, width: zoneWidth, height: zoneHeight } = zone;
  
  for (let yPos = y; yPos < y + zoneHeight; yPos++) {
    for (let xPos = x; xPos < x + zoneWidth; xPos++) {
      const i = (yPos * width + xPos) * 4;
      
      // Make sure the pixel is in bounds
      if (i >= 0 && i < prevData.length - 3) {
        const rDiff = Math.abs(prevData[i] - currData[i]);
        const gDiff = Math.abs(prevData[i + 1] - currData[i + 1]);
        const bDiff = Math.abs(prevData[i + 2] - currData[i + 2]);
        
        const diff = (rDiff + gDiff + bDiff) / 3;
        
        if (diff > sensitivityThreshold) {
          minX = Math.min(minX, xPos);
          minY = Math.min(minY, yPos);
          maxX = Math.max(maxX, xPos);
          maxY = Math.max(maxY, yPos);
          hasMovement = true;
        }
      }
    }
  }
  
  if (!hasMovement) return null;
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};
