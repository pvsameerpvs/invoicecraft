"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Loader2, Check, X, RotateCcw } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

// Helper to center the crop initially
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: 'px',
        width: mediaWidth * 0.8, // Start with 80% width selection
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // No fixed aspect ratio to allow free cropping
  
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    // Start with a centered crop (e.g. 16:9 or just a box)
    // For free cropping, let's just center a box
    const center = centerCrop({
        unit: '%',
        width: 50,
        height: 50,
        x: 25,
        y: 25
    }, width, height);
    setCrop(center);
  }

  const createCroppedImage = async () => {
    if (!imgRef.current || !completedCrop) return;
    
    setProcessing(true);
    try {
        const image = imgRef.current;
        const crop = completedCrop;

        // Skip small/invalid crops
        if (!crop || crop.width === 0 || crop.height === 0) {
            // If they didn't touch the crop, maybe upload original? 
            // Or just return early. Let's return.
            setProcessing(false);
            return;
        }

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width * scaleX,
            crop.height * scaleY,
        );

        canvas.toBlob((blob) => {
            if (blob) {
                onCropComplete(blob);
            }
            setProcessing(false);
        }, 'image/png');

    } catch (e) {
      console.error(e);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden ring-1 ring-slate-200 max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Crop Logo</h3>
            <p className="text-xs text-slate-500">Drag corners to resize freely.</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-900/5 p-4 flex items-center justify-center">
             <ReactCrop 
                crop={crop} 
                onChange={(c) => setCrop(c)} 
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-full"
            >
                <img 
                    ref={imgRef}
                    src={imageSrc} 
                    alt="Crop source"
                    onLoad={onImageLoad}
                    className="max-w-full max-h-[60vh] object-contain shadow-lg bg-white" 
                />
            </ReactCrop>
        </div>

        <div className="p-6 bg-white space-y-4 shrink-0 border-t border-slate-100">
          <div className="flex gap-3 justify-end">
             <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createCroppedImage}
              disabled={processing || !completedCrop?.width}
              className="px-6 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:bg-brand-end shadow-lg shadow-brand-200/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Crop & Upload</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
