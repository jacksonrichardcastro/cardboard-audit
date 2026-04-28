"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from "lucide-react";

export interface CapturedPhoto {
  kind: "front" | "back" | "angle";
  sortOrder: number;
  dataUrl: string; // Temporarily base64 for 5b
}

interface Props {
  onCapture: (photo: CapturedPhoto) => void;
  kind: "front" | "back" | "angle";
  sortOrder: number;
}

export function PhotoCapture({ onCapture, kind, sortOrder }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use rear camera on mobile
          width: { ideal: 1500, min: 1500 },
          height: { ideal: 2000, min: 2000 },
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
      // Fallback for laptops/webcams that don't support 1500px min
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsReady(true);
          };
        }
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || "Could not access camera.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set internal canvas dimensions to match video source exactly
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    
    onCapture({ kind, sortOrder, dataUrl });
  };

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
        <p className="font-semibold">Camera Access Denied</p>
        <p className="text-sm mt-1">{error}</p>
        <Button onClick={startCamera} variant="outline" className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </Button>
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

        {/* Loading state */}
        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <span className="text-white animate-pulse">Initializing camera...</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Button 
          size="lg" 
          className="rounded-full w-16 h-16 p-0 border-4 border-background shadow-xl hover:scale-105 transition-transform" 
          onClick={handleCapture}
          disabled={!isReady}
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
