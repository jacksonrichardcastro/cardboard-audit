"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  color: string;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface Ray {
  y: number;
  thickness: number;
  color: string;
  speed: number;
  xOffset: number;
}

export function CosmosBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Palette drawn from cyan/teal -> magenta/pink -> cosmic purple
    const colors = [
      "rgba(45, 212, 191, 1)", // Teal
      "rgba(217, 70, 239, 1)", // Fuchsia/Magenta
      "rgba(168, 85, 247, 1)", // Purple
      "rgba(255, 255, 255, 1)", // White (sparingly)
    ];

    const stars: Star[] = [];
    const rays: Ray[] = [];
    const MAX_STARS = 80;

    const init = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      stars.length = 0;
      for (let i = 0; i < MAX_STARS; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          baseOpacity: Math.random() * 0.1 + 0.15, // 15% to 25% baseline
          color: colors[Math.floor(Math.random() * colors.length)],
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: (Math.random() * 0.005) + 0.002, // Slow: 6-8s cycle
        });
      }

      rays.length = 0;
      for (let i = 0; i < 3; i++) {
        rays.push({
          y: Math.random() * height,
          thickness: Math.random() * 150 + 50,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: (Math.random() * 0.2) + 0.1,
          xOffset: Math.random() * width,
        });
      }
    };

    // Parallax bloom tracking
    let lastScrollY = window.scrollY;
    let bloomIntensity = 0;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const delta = Math.abs(scrollY - lastScrollY);
      
      // If significant scroll occurs (entering a new row), trigger a brief bloom
      if (delta > 300) {
        bloomIntensity = 1.0;
        lastScrollY = scrollY;
      }
      
      // Slowly adapt lastScrollY to avoid triggering constantly
      if (delta <= 300) {
        lastScrollY = scrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    let lastTime = 0;

    const draw = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Decay bloom
      if (bloomIntensity > 0) {
        bloomIntensity -= 0.015; // fade over ~1-1.5s
        if (bloomIntensity < 0) bloomIntensity = 0;
      }

      if (!prefersReducedMotion) {
        // Draw Rays
        rays.forEach(ray => {
          ray.xOffset += ray.speed;
          if (ray.xOffset > width * 2) {
            ray.xOffset = -width;
            ray.y = Math.random() * height;
          }

          const gradient = ctx.createLinearGradient(
            ray.xOffset, ray.y, ray.xOffset + width, ray.y
          );
          
          // Max ray opacity is 25% (or lower)
          // Add bloom intensity to rays subtly
          const rayOpacity = Math.min(0.25, 0.05 + bloomIntensity * 0.1);
          
          const rgb = ray.color.replace('1)', `${rayOpacity})`);
          const clear = ray.color.replace('1)', '0)');
          
          gradient.addColorStop(0, clear);
          gradient.addColorStop(0.5, rgb);
          gradient.addColorStop(1, clear);

          ctx.fillStyle = gradient;
          ctx.fillRect(0, ray.y - ray.thickness / 2, width, ray.thickness);
        });
      }

      // Draw Stars
      stars.forEach(star => {
        if (!prefersReducedMotion) {
          star.twinklePhase += star.twinkleSpeed;
        }

        // Calculate opacity
        // We want opacity to fluctuate between baseOpacity and up to 35-40% max.
        const twinkleDelta = (Math.sin(star.twinklePhase) + 1) / 2; // 0 to 1
        
        let currentOpacity = star.baseOpacity;
        if (!prefersReducedMotion) {
           // Base is 15-25%. We add up to 0.15 on top, giving max 30-40%.
           currentOpacity += (twinkleDelta * 0.15) + (bloomIntensity * 0.1);
        }

        // Hard cap at 40%
        if (currentOpacity > 0.40) {
          currentOpacity = 0.40;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color.replace('1)', `${currentOpacity})`);
        ctx.fill();
        
        // Add a subtle glow for larger stars if blooming
        if (!prefersReducedMotion && star.size > 1.2 && currentOpacity > 0.3) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = star.color.replace('1)', `${currentOpacity * 0.3})`);
          ctx.fill();
        }
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    // Lazy init to avoid blocking initial paint
    const timeoutId = setTimeout(() => {
      init();
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        // Draw once for reduced motion
        draw(0);
      }
    }, 150);

    const handleResize = () => {
      init();
      if (prefersReducedMotion) {
        draw(0);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -10 }}
      aria-hidden="true"
    />
  );
}
