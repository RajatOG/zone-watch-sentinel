
import React, { useState } from 'react';
import { Slider } from './ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface ControlPanelProps {
  onFileSelect: (file: File) => void;
  sensitivityThreshold: number;
  onSensitivityChange: (value: number) => void;
  movementThreshold: number;
  onMovementThresholdChange: (value: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onFileSelect,
  sensitivityThreshold,
  onSensitivityChange,
  movementThreshold,
  onMovementThresholdChange,
}) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>ZoneWatch Controls</CardTitle>
        <CardDescription>
          Upload a video and adjust detection settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="video-upload">Upload Surveillance Video</Label>
          <div className="flex gap-2">
            <Input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
            />
            <Button onClick={handleUpload} disabled={!file}>
              Load
            </Button>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="sensitivity">Sensitivity Threshold</Label>
              <span className="text-sm text-muted-foreground">{sensitivityThreshold}</span>
            </div>
            <Slider
              id="sensitivity"
              min={5}
              max={50}
              step={1}
              value={[sensitivityThreshold]}
              onValueChange={(values) => onSensitivityChange(values[0])}
            />
            <p className="text-xs text-muted-foreground">
              Lower values detect smaller changes in pixel values
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="movement-threshold">Movement Threshold</Label>
              <span className="text-sm text-muted-foreground">{movementThreshold}</span>
            </div>
            <Slider
              id="movement-threshold"
              min={10}
              max={200}
              step={5}
              value={[movementThreshold]}
              onValueChange={(values) => onMovementThresholdChange(values[0])}
            />
            <p className="text-xs text-muted-foreground">
              Minimum number of changed pixels to trigger movement detection
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
