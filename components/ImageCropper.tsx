"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Loader2, Check, X, Maximize, Square } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Initialize crop when image loads
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    
    let initialCrop: Crop;
    
    if (aspect) {
        initialCrop = centerCrop(
            makeAspectCrop(
                { unit: '%', width: 90 },
                aspect,
                width,
                height
            ),
            width,
            height
        );
    } else {
        initialCrop = {
            unit: '%',
            x: 5,
            y: 5,
            width: 90,
            height: 90
        };
    }
    
    setCrop(initialCrop);
    
    const pixelCrop: PixelCrop = {
        unit: 'px',
        x: (width - (width * 0.9)) / 2,
        y: (height - (height * 0.9)) / 2,
        width: width * 0.9,
        height: height * 0.9
    };
    setCompletedCrop(pixelCrop);
  }

  // Handle aspect ratio toggle
  const toggleAspect = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (imgRef.current) {
        const { width, height } = imgRef.current;
        let newCrop: Crop;
        
        if (newAspect) {
            newCrop = centerCrop(
                makeAspectCrop(
                    { unit: '%', width: 90 },
                    newAspect,
                    width,
                    height
                ),
                width,
                height
            );
        } else {
            newCrop = {
                unit: '%',
                x: 5,
                y: 5,
                width: 90,
                height: 90
            };
        }
        setCrop(newCrop);
    }
  };

  const createCroppedImage = async () => {
    if (!imgRef.current || !completedCrop) return;
    
    setProcessing(true);
    try {
        const image = imgRef.current;
        const crop = completedCrop;

        if (crop.width === 0 || crop.height === 0) {
            setProcessing(false);
            return;
        }

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setProcessing(false);
            return;
        }

        // Use maximum quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

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
            } else {
                setProcessing(false);
            }
        }, 'image/png', 1.0);

    } catch (e) {
      console.error("Crop error:", e);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden ring-1 ring-slate-200 max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Adjust Logo</h3>
            <p className="text-sm text-slate-500 font-medium">Drag corners to resize freely.</p>
          </div>
          <button
            onClick={onCancel}
            className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-4 sm:p-8 flex items-center justify-center min-h-[300px] sm:min-h-[450px]">
             <div className="relative inline-block shadow-2xl rounded-2xl overflow-hidden bg-white group">
                {/* Checkerboard background for transparency visibility */}
                <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'conic-gradient(#000 0.25turn, #fff 0.25turn 0.5turn, #000 0.5turn 0.75turn, #fff 0.75turn)', backgroundSize: '20px 20px' }} />
                
                <div className="relative z-10">
                    <ReactCrop 
                        crop={crop} 
                        onChange={(c) => setCrop(c)} 
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspect}
                        className="max-w-full"
                    >
                        <img 
                            ref={imgRef}
                            src={imageSrc} 
                            alt="Crop source"
                            onLoad={onImageLoad}
                            style={{ 
                                display: 'block', 
                                maxWidth: '100%', 
                                maxHeight: '60vh',
                                minWidth: '150px', // Ensure extremely small images are visible
                                minHeight: '50px', // Ensure extremely flat images are visible
                                width: 'auto'
                            }}
                            className="transition-opacity duration-300"
                        />
                    </ReactCrop>
                </div>
             </div>
        </div>

        <div className="p-8 bg-white space-y-6 shrink-0 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
                <button 
                   type="button"
                   onClick={() => toggleAspect(undefined)}
                   className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${!aspect ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    <Maximize className="w-3.5 h-3.5" />
                    Freely
                </button>
                <button 
                   type="button"
                   onClick={() => toggleAspect(1)}
                   className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${aspect === 1 ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    <Square className="w-3.5 h-3.5" />
                    Square
                </button>
            </div>
            
            <div className="flex gap-3">
                <button
                onClick={onCancel}
                className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
                >
                Cancel
                </button>
                <button
                onClick={createCroppedImage}
                disabled={processing || !completedCrop?.width}
                className="px-8 py-3 rounded-2xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-end shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 hover:translate-y-[-2px] disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
                >
                {processing ? (
                    <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                    </>
                ) : (
                    <>
                    <Check className="w-4 h-4" />
                    <span>Save Selection</span>
                    </>
                )}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

