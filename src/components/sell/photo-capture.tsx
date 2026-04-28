"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, UploadCloud, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface CapturedPhoto {
  kind: "front" | "back" | "angle";
  sortOrder: number;
  url: string;
}

interface Props {
  onCapture: (photo: CapturedPhoto) => void;
  kind: "front" | "back" | "angle";
  sortOrder: number;
  draftId: number | null;
}

export function PhotoCapture({ onCapture, kind, sortOrder, draftId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use rear camera on mobile
          width: { min: 1500 },
          height: { min: 1500 },
        },
        audio: false,
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(err.message || "Could not access camera or device does not meet resolution requirements.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const validateImage = (width: number, height: number, sizeBytes: number): string | null => {
    if (sizeBytes > 10 * 1024 * 1024) {
      return "File must be smaller than 10MB.";
    }
    if (width < 1500 || height < 1500) {
      return `Image resolution too low. Minimum 1500x1500px required. Got ${width}x${height}.`;
    }
    const ratio = width / height;
    // 3:4 aspect ratio = 0.75. Accept within 10% (0.675 - 0.825)
    if (ratio < 0.675 || ratio > 0.825) {
      return `Image aspect ratio must be approx 3:4 (portrait). Got ratio ${ratio.toFixed(2)}.`;
    }
    return null;
  };

  const uploadToSupabase = async (blob: Blob) => {
    if (!draftId) throw new Error("Draft must be saved before uploading photos.");
    
    // Get signed URL
    const res = await fetch("/api/storage/upload", {
      method: "POST",
      body: JSON.stringify({ draftId, kind }),
      headers: { "Content-Type": "application/json" }
    });
    
    if (!res.ok) throw new Error("Failed to get upload URL");
    
    const { signedUrl, publicUrl } = await res.json();

    // Upload directly to Supabase via signed URL
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": "image/jpeg"
      }
    });

    if (!uploadRes.ok) throw new Error("Failed to upload image");

    return publicUrl;
  };

  const processAndUpload = async (blob: Blob, width: number, height: number) => {
    setValidationError(null);
    const vError = validateImage(width, height, blob.size);
    if (vError) {
      setValidationError(vError);
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadToSupabase(blob);
      onCapture({ kind, sortOrder, url });
    } catch (err: any) {
      setValidationError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        processAndUpload(blob, canvas.width, canvas.height);
      }
    }, "image/jpeg", 0.9);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      processAndUpload(file, img.width, img.height);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setValidationError("Failed to read image file.");
    };
    img.src = objectUrl;
  };

  if (cameraError) {
    return (
      <div className="p-6 bg-card border border-border rounded-xl shadow-sm text-center">
        <p className="font-semibold mb-2 text-destructive">Camera Access Denied or Unsupported</p>
        <p className="text-sm text-muted-foreground mb-6">{cameraError}</p>
        
        <div className="space-y-4">
          <p className="text-sm font-medium">Upload a photo manually:</p>
          <p className="text-xs text-muted-foreground">Min 1500x1500px, ~3:4 aspect ratio (portrait).</p>
          <Input 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload}
            disabled={isUploading || !draftId}
            className="max-w-xs mx-auto"
          />
          {validationError && (
            <p className="text-sm text-destructive font-medium mt-2">{validationError}</p>
          )}
          {isUploading && (
            <p className="text-sm text-primary flex items-center justify-center gap-2 mt-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading to secure bucket...
            </p>
          )}
          {!draftId && <p className="text-xs text-destructive mt-2">Saving draft state... Please wait.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto flex flex-col items-center">
      <div className="relative w-full aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-lg border border-border">
        {/* Live video feed */}
        <video 
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          autoPlay
          muted
        />
        
        {/* 3:4 Overlay Guide */}
        <div className="absolute inset-0 pointer-events-none p-4 flex items-center justify-center">
          <div className="w-full h-full border-4 border-white/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
          {/* Center crosshairs */}
          <div className="absolute w-8 h-px bg-white/50"></div>
          <div className="absolute h-8 w-px bg-white/50"></div>
        </div>

        {/* Loading / Uploading state */}
        {(!isReady || isUploading) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <span>Uploading...</span>
              </>
            ) : (
              <span className="animate-pulse">Initializing camera...</span>
            )}
          </div>
        )}
      </div>

      {validationError && (
        <p className="text-sm text-destructive font-medium mt-4 text-center">{validationError}</p>
      )}
      {!draftId && (
        <p className="text-xs text-muted-foreground mt-4 text-center animate-pulse">Initializing draft state, please wait...</p>
      )}

      <div className="mt-6 flex flex-col items-center gap-2">
        <Button 
          size="lg" 
          className="rounded-full w-16 h-16 p-0 border-4 border-background shadow-xl hover:scale-105 transition-transform" 
          onClick={handleCapture}
          disabled={!isReady || isUploading || !draftId}
        >
          <Camera className="w-6 h-6" />
          <span className="sr-only">Capture Photo</span>
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Align the card within the guide
        </p>
      </div>
      
      {/* Hidden canvas for extraction */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
