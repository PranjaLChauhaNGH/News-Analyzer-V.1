import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from './utils/cropImage';

const ImageCropper = ({ imageFile, onCropped, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const imageUrl = URL.createObjectURL(imageFile);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels, rotation);
    onCropped(croppedImage);
  };

  return (
    <div className="cropper-wrapper">
      <div className="cropper-container">
        <div className="cropper-header">
          <h3>Crop Image</h3>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>
        
        <div className="crop-area">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>
        
        <div className="cropper-controls">
          <label>
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <span>{zoom.toFixed(1)}x</span>
          </label>
          
          <label>
            Rotation
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
            />
            <span>{rotation}°</span>
          </label>
        </div>
        
        <div className="cropper-actions">
          <button onClick={handleCrop} className="crop-btn">
            Crop & Save
          </button>
          <button onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
