import React from 'react';
import { Camera, CameraOff, Aperture, FlipHorizontal } from 'lucide-react';
import Button from '../ui/Button';

export default function WebcamControls({ isActive, onStart, onStop, onCapture, onFlip, capturing, disabled }) {
  return (
    <div className="flex items-center gap-2">
      {!isActive ? (
        <Button onClick={onStart} size="sm">
          <Camera size={15} />
          Bật Camera
        </Button>
      ) : (
        <>
          <Button onClick={onStop} variant="secondary" size="sm">
            <CameraOff size={15} />
            Tắt
          </Button>
          {onFlip && (
            <Button onClick={onFlip} variant="ghost" size="sm" title="Lật camera">
              <FlipHorizontal size={15} />
            </Button>
          )}
          <Button onClick={onCapture} loading={capturing} disabled={disabled} size="sm">
            <Aperture size={15} />
            Chụp
          </Button>
        </>
      )}
    </div>
  );
}
