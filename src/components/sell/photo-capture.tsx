"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { processFrame, CheckResult } from "@/lib/image-processing";
import { cn } from "@/lib/utils";

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
  const processCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasRequestedCamera, setHasRequestedCamera] = useState(false);

  // Check states
  const [tilt, setTilt] = useState<CheckResult>({ state: "idle", tip: "Waiting..." });
  const [framing, setFraming] = useState<CheckResult>({ state: "idle", tip: "Waiting..." });
  const [lighting, setLighting] = useState<CheckResult>({ state: "idle", tip: "Waiting..." });
  const [focus, setFocus] = useState<CheckResult>({ state: "idle", tip: "Waiting..." });
  const [background, setBackground] = useState<CheckResult>({ state: "idle", tip: "Waiting..." });
  const [useGyro, setUseGyro] = useState(false);
  const [frameCount, setFrameCount] = useState(0);

  const isReadyRef = useRef(false);
  const isUploadingRef = useRef(false);
  const useGyroRef = useRef(false);

  const lastProcessTime = useRef(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleDeviceOrientation = useCallback((e: DeviceOrientationEvent) => {
    let devBeta = e.beta ? Math.abs(e.beta) : 0;
    let devGamma = e.gamma ? Math.abs(e.gamma) : 0;
    
    // Deviation from nearest multiple of 90 (handles flat on table or upright on stand)
    let tiltB = Math.min(devBeta % 90, 90 - (devBeta % 90));
    let tiltG = Math.min(devGamma % 90, 90 - (devGamma % 90));
    
    let maxTilt = Math.max(tiltB, tiltG);
    
    let result: CheckResult = { state: "pass", tip: "Level" };
    if (maxTilt > 10) {
      result = { state: "fail", tip: "Phone is tilted. Hold it parallel to card." };
    } else if (maxTilt > 5) {
      result = { state: "warn", tip: "Phone slightly tilted." };
    }
    setTilt(result);
  }, []);

  const startCameraAndSensors = async () => {
    setHasRequestedCamera(true);
    
    // Request gyro permission on iOS 13+
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleDeviceOrientation);
          setUseGyro(true);
          useGyroRef.current = true;
        }
      } catch (err) {
        console.error("Gyro permission denied:", err);
      }
    } else if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
      setUseGyro(true);
      useGyroRef.current = true;
    }

    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1500 },
          height: { ideal: 2000 },
          aspectRatio: { ideal: 3 / 4 },
        },
        audio: false,
      });
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
          isReadyRef.current = true;
          requestRef.current = requestAnimationFrame(processLoop);
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(err.message || "Could not access camera.");
    }
  };

  const processLoop = (time: number) => {
    if (!videoRef.current || !processCanvasRef.current) return;
    
    // Process at ~5-8 Hz (every 150ms)
    if (time - lastProcessTime.current > 150) {
      lastProcessTime.current = time;
      
      const video = videoRef.current;
      const canvas = processCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        let cropWidth: number, cropHeight: number;
        if (sourceWidth / sourceHeight > 0.75) {
          cropHeight = sourceHeight;
          cropWidth = sourceHeight * 0.75;
        } else {
          cropWidth = sourceWidth;
          cropHeight = sourceWidth / 0.75;
        }
        const sourceX = (sourceWidth - cropWidth) / 2;
        const sourceY = (sourceHeight - cropHeight) / 2;
        
        ctx.drawImage(
          video,
          sourceX, sourceY, cropWidth, cropHeight,
          0, 0, canvas.width, canvas.height
        );
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const results = processFrame(imageData);
        
        setLighting(results.lighting);
        setBackground(results.background);
        setFraming(results.framing);
        setFocus(results.focus);
        setFrameCount(c => c + 1);
        if (!useGyroRef.current) {
          setTilt(results.tilt);
        }
      }
    }
    
    if (isReadyRef.current && !isUploadingRef.current) {
      requestRef.current = requestAnimationFrame(processLoop);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    window.removeEventListener('deviceorientation', handleDeviceOrientation);
  };

  const validateImage = (width: number, height: number, sizeBytes: number): string | null => {
    if (sizeBytes > 10 * 1024 * 1024) {
      return "File must be smaller than 10MB.";
    }
    if (width < 1200 || height < 1600) {
      return `Image resolution too low. Minimum 1200x1600px required. Got ${width}x${height}.`;
    }
    const ratio = width / height;
    if (ratio < 0.675 || ratio > 0.825) {
      return `Image aspect ratio must be approx 3:4 (portrait). Got ratio ${ratio.toFixed(2)}.`;
    }
    return null;
  };

  const uploadToSupabase = async (blob: Blob) => {
    if (!draftId) throw new Error("Draft must be saved before uploading photos.");
    const res = await fetch("/api/storage/upload", {
      method: "POST",
      body: JSON.stringify({ draftId, kind }),
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Failed to get upload URL");
    const { signedUrl, publicUrl } = await res.json();
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": "image/jpeg" }
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
    isUploadingRef.current = true;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    try {
      const url = await uploadToSupabase(blob);
      onCapture({ kind, sortOrder, url });
    } catch (err: any) {
      setValidationError(err.message || "Upload failed");
      setIsUploading(false);
      isUploadingRef.current = false;
      requestRef.current = requestAnimationFrame(processLoop);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;

    let cropWidth: number, cropHeight: number;
    if (sourceWidth / sourceHeight > 0.75) {
      cropHeight = sourceHeight;
      cropWidth = sourceHeight * 0.75;
    } else {
      cropWidth = sourceWidth;
      cropHeight = sourceWidth / 0.75;
    }
    const sourceX = (sourceWidth - cropWidth) / 2;
    const sourceY = (sourceHeight - cropHeight) / 2;

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      video,
      sourceX, sourceY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    canvas.toBlob((blob) => {
      if (blob) {
        processAndUpload(blob, cropWidth, cropHeight);
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

  const IndicatorDot = ({ label, check }: { label: string, check: CheckResult }) => {
    const colorClass = 
      check.state === 'pass' ? 'bg-green-500' :
      check.state === 'warn' ? 'bg-yellow-500' :
      check.state === 'fail' ? 'bg-red-500' : 'bg-gray-500';
      
    return (
      <div className="flex flex-col items-center group relative cursor-pointer w-16">
        <div className={cn("w-3 h-3 rounded-full mb-1 transition-colors", colorClass)} />
        <span className="text-[10px] text-white/80 uppercase tracking-wider">{label}</span>
        <div className="absolute top-full mt-2 w-32 bg-popover/90 text-popover-foreground text-xs p-2 rounded shadow-lg text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {check.tip}
        </div>
      </div>
    );
  };

  const isAnyFail = [tilt, framing, lighting, focus, background].some(c => c.state === 'fail');
  const isAnyWarn = [tilt, framing, lighting, focus, background].some(c => c.state === 'warn');
  const captureButtonClass = isAnyWarn && !isAnyFail ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-950' : 
                             !isAnyFail ? 'bg-green-500 hover:bg-green-600 text-white' : 
                             'bg-muted text-muted-foreground opacity-50 cursor-not-allowed';

  if (cameraError) {
    return (
      <div className="p-6 bg-card border border-border rounded-xl shadow-sm text-center">
        <p className="font-semibold mb-2 text-destructive">Camera Access Denied or Unsupported</p>
        <p className="text-sm text-muted-foreground mb-6">{cameraError}</p>
        
        <div className="space-y-4">
          <p className="text-sm font-medium">Upload a photo manually:</p>
          <p className="text-xs text-muted-foreground">Min 1200x1600px, ~3:4 aspect ratio (portrait).</p>
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

  if (!hasRequestedCamera) {
    return (
      <div className="p-6 bg-card border border-border rounded-xl shadow-sm text-center max-w-sm mx-auto">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Capture {kind} photo</h3>
        <p className="text-sm text-muted-foreground mb-6">
          We'll need camera and motion sensor access to help you take the perfect shot.
        </p>
        <Button onClick={startCameraAndSensors} className="w-full gap-2">
          <Play className="w-4 h-4" /> Start Camera
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto flex flex-col items-center">
      {/* Real-time Indicator Dots */}
      <div className="flex justify-center gap-1 mb-3 bg-black/80 rounded-full px-2 py-2 text-white shadow-lg w-full z-10 overflow-x-auto">
        <IndicatorDot label="Tilt" check={tilt} />
        <IndicatorDot label="Framing" check={framing} />
        <IndicatorDot label="Lighting" check={lighting} />
        <IndicatorDot label="Focus" check={focus} />
        <IndicatorDot label="Bkgnd" check={background} />
      </div>

      <div className="relative w-full aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-lg border border-border">
        {/* RAW METRICS OVERLAY (TEMPORARY FOR EMPIRICAL HARDWARE TUNING) */}
        <div className="absolute top-2 left-2 bg-black/80 text-green-400 text-[11px] p-2 rounded z-30 pointer-events-none font-mono">
          <div>FRAMES: {frameCount}</div>
          <div>TILT: {tilt.raw?.toFixed(2) ?? 'N/A'}</div>
          <div>FRAMING: {framing.raw?.toFixed(4) ?? 'N/A'}</div>
          <div>LIGHTING: {lighting.raw?.toFixed(4) ?? 'N/A'}</div>
          <div>FOCUS: {focus.raw?.toFixed(2) ?? 'N/A'}</div>
          <div>BKGND: {background.raw?.toFixed(2) ?? 'N/A'}</div>
        </div>
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
          <div className="w-full h-full border-4 border-white/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-colors duration-300"></div>
          {/* Center crosshairs */}
          <div className="absolute w-8 h-px bg-white/50"></div>
          <div className="absolute h-8 w-px bg-white/50"></div>
        </div>

        {/* Loading / Uploading state */}
        {(!isReady || isUploading) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center z-20">
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
          className={cn("rounded-full w-16 h-16 p-0 border-4 border-background shadow-xl hover:scale-105 transition-all", captureButtonClass)} 
          onClick={handleCapture}
          disabled={!isReady || isUploading || !draftId || isAnyFail}
        >
          <Camera className="w-6 h-6" />
          <span className="sr-only">Capture Photo</span>
        </Button>
        <p className="text-sm text-muted-foreground mt-2 text-center max-w-[250px] min-h-[40px]">
          {isAnyFail 
            ? [tilt, framing, lighting, focus, background].find(c => c.state === 'fail')?.tip 
            : isAnyWarn 
              ? [tilt, framing, lighting, focus, background].find(c => c.state === 'warn')?.tip 
              : "Align the card within the guide"}
        </p>
      </div>
      
      {/* Hidden canvas for extraction and processing */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={processCanvasRef} width={300} height={400} className="hidden" />
    </div>
  );
}
