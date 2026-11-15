import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  twinkle: number;
}

export function Starfield({ density = 150 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: Star[] = [];
    let animId = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      stars = [];
      for (let i = 0; i < density; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random(),
          size: Math.random() * 1.8 + 0.3,
          twinkle: Math.random() * Math.PI * 2,
        });
      }
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    const draw = () => {
      ctx.fillStyle = '#02030a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebula glow
      const grad = ctx.createRadialGradient(
        canvas.width * 0.3,
        canvas.height * 0.2,
        0,
        canvas.width * 0.3,
        canvas.height * 0.2,
        canvas.width * 0.5
      );
      grad.addColorStop(0, 'rgba(59,130,246,0.05)');
      grad.addColorStop(1, 'rgba(2,3,10,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grad2 = ctx.createRadialGradient(
        canvas.width * 0.75,
        canvas.height * 0.6,
        0,
        canvas.width * 0.75,
        canvas.height * 0.6,
        canvas.width * 0.4
      );
      grad2.addColorStop(0, 'rgba(16,185,129,0.04)');
      grad2.addColorStop(1, 'rgba(2,3,10,0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      for (const star of stars) {
        star.twinkle += 0.02;
        const alpha = 0.3 + Math.abs(Math.sin(star.twinkle)) * 0.7;
        const brightness = 180 + Math.floor(star.z * 75);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${brightness},${brightness},${255},${alpha})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Drift slowly
        star.y += 0.05 * star.z;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      }

      time += 0.016;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
