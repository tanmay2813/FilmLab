<!DOCTYPE html>
<html lang="en" class="h-full bg-[#0a0a0a]">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Film Lab - Analog Darkroom Simulator</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- React & React DOM -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  
  <!-- Babel Standalone for JSX compilation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <!-- Google Font - Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    /* Custom Scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(24, 24, 27, 0.5);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(63, 63, 70, 0.8);
      border-radius: 9999px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(249, 115, 22, 0.8);
    }
    /* Hide scrollbar utility */
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -8px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  </style>
</head>
<body class="h-full bg-[#0a0a0a] text-zinc-100 overflow-hidden antialiased select-none">
  <div id="root" class="h-full w-full"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef, useCallback, useMemo } = React;

    // Helper component to render Lucide Icons dynamically in UMD build
    const Icon = ({ name, className = "w-4 h-4", ...props }) => {
      const iconRef = useRef(null);

      useEffect(() => {
        if (iconRef.current) {
          iconRef.current.innerHTML = '';
          if (window.lucide && window.lucide.icons[name]) {
            const svg = window.lucide.createLucideIcon(name, {
              class: className,
              ...props
            });
            iconRef.current.appendChild(svg);
          }
        }
      }, [name, className]);

      return <span ref={iconRef} class="inline-flex items-center justify-center shrink-0" {...props} />;
    };

    const DEFAULT_ADJUSTMENTS = {
      // LIGHT
      exposure: 0,       // -100 to +100
      contrast: 0,       // -100 to +100
      highlights: 0,     // -100 to +100
      shadows: 0,        // -100 to +100
      fade: 0,           // 0 to 100

      // COLOR
      temperature: 0,    // -100 (cool/blue) to +100 (warm/yellow)
      tint: 0,           // -100 (green) to +100 (magenta)
      saturation: 0,     // -100 to +100
      shadowTintHue: 0,  // 0 to 360
      shadowTintAmount: 0, // 0 to 100
      highlightTintHue: 0, // 0 to 360
      highlightTintAmount: 0, // 0 to 100

      // EFFECTS
      warp: 0,           // 0 to 100
      warpReach: 50,     // 0 to 100
      border: 'none',    // 'none', 'black', 'white', 'kodak', 'film35'
      vignette: 0,       // 0 to 100
      grainAmount: 0,    // 0 to 100
      grainSize: 1,      // 1 to 3
      bloom: 0,          // 0 to 100
      halation: 0,       // 0 to 100
      dustScratches: 0,  // 0 to 100
      chromaticAberration: 0, // 0 to 100

      // VHS & VIDEO
      scanlines: 0,      // 0 to 100
      trackingDistortion: 0, // 0 to 100
      timestamp: 'off',  // 'off', 'yellow_vhs', 'red_lcd', 'white_digital'
      timestampText: "'95 10 24",
    };

    const PRESETS = [
      {
        id: 'original',
        name: 'ORIGINAL',
        category: 'NONE',
        adjustments: { ...DEFAULT_ADJUSTMENTS }
      },
      {
        id: 'warm_35',
        name: 'WARM 35',
        category: 'ANALOG FILM',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          temperature: 28,
          exposure: 5,
          contrast: 12,
          fade: 8,
          vignette: 22,
          grainAmount: 18,
          saturation: 8
        }
      },
      {
        id: 'faded_200',
        name: 'FADED 200',
        category: 'ANALOG FILM',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          fade: 28,
          exposure: 8,
          contrast: -12,
          saturation: -18,
          temperature: 12,
          grainAmount: 22
        }
      },
      {
        id: 'disposable_flash',
        name: 'DISPOSABLE FLASH',
        category: 'ANALOG FILM',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          exposure: 15,
          contrast: 28,
          highlights: 35,
          shadows: -22,
          saturation: 12,
          halation: 35,
          vignette: 45,
          grainAmount: 25
        }
      },
      {
        id: 'night_800',
        name: 'NIGHT 800',
        category: 'ANALOG FILM',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          exposure: 12,
          temperature: -18,
          shadows: 22,
          grainAmount: 45,
          halation: 40,
          chromaticAberration: 18
        }
      },
      {
        id: 'camcorder',
        name: 'CAMCORDER',
        category: 'OLD SCHOOL VHS',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          temperature: -10,
          saturation: -12,
          scanlines: 45,
          trackingDistortion: 35,
          timestamp: 'yellow_vhs',
          chromaticAberration: 28,
          grainAmount: 20
        }
      },
      {
        id: 'vhs_1995',
        name: '1995',
        category: 'OLD SCHOOL VHS',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          temperature: 18,
          saturation: 15,
          contrast: 18,
          fade: 14,
          timestamp: 'red_lcd',
          grainAmount: 22,
          vignette: 30,
          scanlines: 25
        }
      },
      {
        id: 'tape_damage',
        name: 'TAPE DAMAGE',
        category: 'OLD SCHOOL VHS',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          scanlines: 65,
          trackingDistortion: 60,
          chromaticAberration: 50,
          dustScratches: 40,
          grainAmount: 38,
          saturation: -20
        }
      },
      {
        id: 'soft_chrome',
        name: 'SOFT CHROME',
        category: 'FUJI FILM LOOKS',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          contrast: -15,
          fade: 18,
          saturation: -12,
          temperature: 6,
          highlightTintHue: 40,
          highlightTintAmount: 12
        }
      },
      {
        id: 'classic_negative',
        name: 'CLASSIC NEGATIVE',
        category: 'FUJI FILM LOOKS',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          contrast: 26,
          fade: 14,
          shadows: -16,
          saturation: -16,
          temperature: -6,
          shadowTintHue: 200,
          shadowTintAmount: 14,
          grainAmount: 18
        }
      },
      {
        id: 'cinema_500',
        name: 'CINEMA 500',
        category: 'FUJI FILM LOOKS',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          temperature: 12,
          contrast: 10,
          fade: 12,
          shadowTintHue: 190,
          shadowTintAmount: 22,
          highlightTintHue: 42,
          highlightTintAmount: 16,
          grainAmount: 25
        }
      },
      {
        id: 'acros_bw',
        name: 'ACROS B&W',
        category: 'FUJI FILM LOOKS',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          saturation: -100,
          contrast: 28,
          grainAmount: 32,
          highlights: 12,
          shadows: -10
        }
      },
      {
        id: 'portra_400',
        name: 'PORTRA 400',
        category: 'KODAK FILM LOOKS',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          temperature: 14,
          tint: 6,
          exposure: 4,
          contrast: -6,
          shadows: 14,
          highlights: -12,
          saturation: 6,
          grainAmount: 14
        }
      },
      {
        id: 'gold_200',
        name: 'GOLD 200',
        category: 'KODAK FILM LOOKS',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          temperature: 32,
          tint: 8,
          exposure: 6,
          shadows: 12,
          saturation: 16,
          grainAmount: 20
        }
      },
      {
        id: 'tri_x_400',
        name: 'TRI-X 400 B&W',
        category: 'KODAK FILM LOOKS',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          saturation: -100,
          contrast: 38,
          grainAmount: 52,
          fade: 12,
          shadows: -16
        }
      },
      {
        id: 'kodachrome_64',
        name: 'KODACHROME 64',
        category: 'KODAK FILM LOOKS',
        adjustments: {
          ...DEFAULT_ADJUSTMENTS,
          temperature: 20,
          contrast: 24,
          saturation: 22,
          shadows: -14,
          vignette: 22,
          border: 'kodak'
        }
      }
    ];

    const SAMPLE_IMAGES = [
      {
        id: 'street',
        title: 'Tokyo Street',
        draw: (ctx, w, h) => {
          const grad = ctx.createLinearGradient(0, 0, w, h);
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(0.5, '#1e1b4b');
          grad.addColorStop(1, '#020617');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          ctx.fillStyle = '#ff007f';
          ctx.globalAlpha = 0.6;
          ctx.fillRect(w * 0.1, h * 0.2, w * 0.2, h * 0.6);

          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(w * 0.7, h * 0.15, w * 0.2, h * 0.7);

          const streetGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
          streetGrad.addColorStop(0, '#111827');
          streetGrad.addColorStop(1, '#030712');
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = streetGrad;
          ctx.fillRect(0, h * 0.65, w, h * 0.35);

          for (let i = 0; i < 20; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ff007f' : '#00f0ff';
            ctx.globalAlpha = 0.25;
            const x = (Math.sin(i * 123.4) * 0.5 + 0.5) * w;
            const y = h * 0.7 + (i / 20) * (h * 0.25);
            ctx.fillRect(x, y, w * 0.12, 4);
          }
        }
      },
      {
        id: 'portrait',
        title: 'Golden Portrait',
        draw: (ctx, w, h) => {
          const grad = ctx.createRadialGradient(w * 0.5, h * 0.3, w * 0.1, w * 0.5, h * 0.5, w * 0.8);
          grad.addColorStop(0, '#fdba74');
          grad.addColorStop(0.4, '#ea580c');
          grad.addColorStop(0.8, '#451a03');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.ellipse(w * 0.5, h * 0.45, w * 0.22, h * 0.28, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    ];

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function getBlendedAdjustments(base, preset, intensity) {
      if (intensity >= 100) return preset;
      if (intensity <= 0) return base;

      const factor = intensity / 100;
      const blended = { ...base };

      Object.keys(preset).forEach(key => {
        if (typeof preset[key] === 'number') {
          blended[key] = lerp(base[key] ?? 0, preset[key], factor);
        } else if (factor > 0.5) {
          blended[key] = preset[key];
        }
      });

      return blended;
    }

    function renderProcessedImage(sourceImage, canvas, adj, options = {}) {
      if (!sourceImage || !canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const w = options.width || sourceImage.width || 800;
      const h = options.height || sourceImage.height || 600;

      canvas.width = w;
      canvas.height = h;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

      tempCtx.drawImage(sourceImage, 0, 0, w, h);

      const imgData = tempCtx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const numPixels = data.length;

      const expFactor = Math.pow(2, (adj.exposure || 0) / 50);
      const contrastFactor = ((adj.contrast || 0) + 100) / 100;
      const cFactorSq = contrastFactor * contrastFactor;
      const satFactor = ((adj.saturation || 0) + 100) / 100;
      const tempShift = (adj.temperature || 0) * 0.8;
      const tintShift = (adj.tint || 0) * 0.8;
      const fadeVal = (adj.fade || 0) * 1.8;
      const highlightsVal = (adj.highlights || 0) * 0.7;
      const shadowsVal = (adj.shadows || 0) * 0.7;

      const hasShadowTint = adj.shadowTintAmount > 0;
      const hasHighlightTint = adj.highlightTintAmount > 0;

      const shadowHueRad = ((adj.shadowTintHue || 0) * Math.PI) / 180;
      const shadowR = (Math.cos(shadowHueRad) * 0.5 + 0.5) * (adj.shadowTintAmount || 0) * 0.5;
      const shadowG = (Math.cos(shadowHueRad - (Math.PI * 2) / 3) * 0.5 + 0.5) * (adj.shadowTintAmount || 0) * 0.5;
      const shadowB = (Math.cos(shadowHueRad - (Math.PI * 4) / 3) * 0.5 + 0.5) * (adj.shadowTintAmount || 0) * 0.5;

      const hlHueRad = ((adj.highlightTintHue || 0) * Math.PI) / 180;
      const hlR = (Math.cos(hlHueRad) * 0.5 + 0.5) * (adj.highlightTintAmount || 0) * 0.5;
      const hlG = (Math.cos(hlHueRad - (Math.PI * 2) / 3) * 0.5 + 0.5) * (adj.highlightTintAmount || 0) * 0.5;
      const hlB = (Math.cos(hlHueRad - (Math.PI * 4) / 3) * 0.5 + 0.5) * (adj.highlightTintAmount || 0) * 0.5;

      for (let i = 0; i < numPixels; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        r += tempShift;
        b -= tempShift;
        g -= tintShift;
        r += tintShift * 0.5;

        r *= expFactor;
        g *= expFactor;
        b *= expFactor;

        r = (r - 128) * cFactorSq + 128;
        g = (g - 128) * cFactorSq + 128;
        b = (b - 128) * cFactorSq + 128;

        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const normLum = Math.max(0, Math.min(1, luminance / 255));

        const shadowWeight = Math.pow(1 - normLum, 2);
        const hlWeight = Math.pow(normLum, 2);

        r += shadowsVal * shadowWeight;
        g += shadowsVal * shadowWeight;
        b += shadowsVal * shadowWeight;

        r += highlightsVal * hlWeight;
        g += highlightsVal * hlWeight;
        b += highlightsVal * hlWeight;

        if (hasShadowTint) {
          r += shadowR * shadowWeight;
          g += shadowG * shadowWeight;
          b += shadowB * shadowWeight;
        }
        if (hasHighlightTint) {
          r += hlR * hlWeight;
          g += hlG * hlWeight;
          b += hlB * hlWeight;
        }

        if (adj.saturation !== 0) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray + (r - gray) * satFactor;
          g = gray + (g - gray) * satFactor;
          b = gray + (b - gray) * satFactor;
        }

        if (fadeVal > 0) {
          r = r * (1 - fadeVal / 255) + fadeVal;
          g = g * (1 - fadeVal / 255) + fadeVal;
          b = b * (1 - fadeVal / 255) + fadeVal;
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      tempCtx.putImageData(imgData, 0, 0);

      ctx.clearRect(0, 0, w, h);

      if (adj.warp > 0) {
        const warpAmount = (adj.warp / 100) * 0.4;
        ctx.save();
        const cx = w / 2;
        const cy = h / 2;
        ctx.translate(cx, cy);
        const scale = 1 + warpAmount * 0.5;
        ctx.scale(scale, scale);
        ctx.drawImage(tempCanvas, -cx, -cy);
        ctx.restore();
      } else {
        ctx.drawImage(tempCanvas, 0, 0);
      }

      if (adj.bloom > 0 || adj.halation > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        if (adj.bloom > 0) {
          ctx.globalAlpha = (adj.bloom / 100) * 0.5;
          ctx.filter = `blur(${Math.max(4, (adj.bloom / 100) * (w * 0.03))}px)`;
          ctx.drawImage(canvas, 0, 0);
        }

        if (adj.halation > 0) {
          ctx.globalCompositeOperation = 'lighten';
          ctx.globalAlpha = (adj.halation / 100) * 0.4;
          ctx.filter = `blur(${Math.max(3, (adj.halation / 100) * (w * 0.02))}px) sepia(100%) hue-rotate(-50deg) saturate(300%)`;
          ctx.drawImage(canvas, 0, 0);
        }

        ctx.restore();
        ctx.filter = 'none';
      }

      if (adj.chromaticAberration > 0) {
        const offset = Math.max(1, (adj.chromaticAberration / 100) * (w * 0.012));
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.5;
        ctx.drawImage(canvas, -offset, 0);
        ctx.drawImage(canvas, offset, 0);
        ctx.restore();
      }

      if (adj.grainAmount > 0) {
        const grainCanvas = document.createElement('canvas');
        const gSize = Math.max(1, Math.round(adj.grainSize || 1));
        grainCanvas.width = Math.ceil(w / gSize);
        grainCanvas.height = Math.ceil(h / gSize);

        const gCtx = grainCanvas.getContext('2d');
        if (gCtx) {
          const gImgData = gCtx.createImageData(grainCanvas.width, grainCanvas.height);
          const gData = gImgData.data;
          const opacity = (adj.grainAmount / 100) * 0.35;

          for (let k = 0; k < gData.length; k += 4) {
            const val = Math.random() * 255;
            gData[k] = val;
            gData[k + 1] = val;
            gData[k + 2] = val;
            gData[k + 3] = val * opacity;
          }
          gCtx.putImageData(gImgData, 0, 0);

          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.globalCompositeOperation = 'overlay';
          ctx.drawImage(grainCanvas, 0, 0, w, h);
          ctx.restore();
        }
      }

      if (adj.dustScratches > 0) {
        ctx.save();
        const count = Math.floor((adj.dustScratches / 100) * 35);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

        for (let d = 0; d < count; d++) {
          const dx = Math.random() * w;
          const dy = Math.random() * h;
          const size = Math.random() * 2 + 0.5;

          ctx.beginPath();
          ctx.arc(dx, dy, size, 0, Math.PI * 2);
          ctx.fill();

          if (d % 4 === 0) {
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(dx, dy);
            ctx.lineTo(dx + (Math.random() - 0.5) * 15, dy + Math.random() * 40 + 10);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      if (adj.vignette > 0) {
        ctx.save();
        const rad = Math.max(w, h) * 0.75;
        const vigGrad = ctx.createRadialGradient(w / 2, h / 2, rad * 0.3, w / 2, h / 2, rad);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(1, `rgba(0,0,0,${(adj.vignette / 100) * 0.85})`);

        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      if (adj.scanlines > 0 || adj.trackingDistortion > 0) {
        ctx.save();

        if (adj.scanlines > 0) {
          const lineSpacing = 4;
          ctx.fillStyle = `rgba(0, 0, 0, ${(adj.scanlines / 100) * 0.4})`;
          for (let y = 0; y < h; y += lineSpacing) {
            ctx.fillRect(0, y, w, 1.5);
          }
        }

        if (adj.trackingDistortion > 0) {
          const barHeight = (adj.trackingDistortion / 100) * (h * 0.12);
          const startY = h - barHeight - (Math.random() * 10);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(0, startY, w, barHeight);

          ctx.drawImage(
            canvas,
            0, Math.max(0, startY), w, barHeight,
            (Math.random() - 0.5) * 15, Math.max(0, startY), w, barHeight
          );
        }

        ctx.restore();
      }

      if (adj.border && adj.border !== 'none') {
        ctx.save();

        if (adj.border === 'black') {
          const bw = Math.round(w * 0.04);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = bw;
          ctx.strokeRect(bw / 2, bw / 2, w - bw, h - bw);
        } else if (adj.border === 'white') {
          const bw = Math.round(w * 0.05);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, bw);
          ctx.fillRect(0, h - bw, w, bw);
          ctx.fillRect(0, 0, bw, h);
          ctx.fillRect(w - bw, 0, bw, h);
        } else if (adj.border === 'kodak') {
          const bw = Math.round(w * 0.08);
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(0, 0, w, h);

          const innerW = w - bw * 2;
          const innerH = h - bw * 2;
          ctx.drawImage(tempCanvas, bw, bw, innerW, innerH);

          ctx.fillStyle = '#78350f';
          ctx.font = `bold ${Math.max(12, Math.round(w * 0.022))}px sans-serif`;
          ctx.fillText('KODACHROME SLIDE', bw, h - bw * 0.35);
        } else if (adj.border === 'film35') {
          const bw = Math.round(w * 0.08);
          ctx.fillStyle = '#09090b';
          ctx.fillRect(0, 0, w, bw);
          ctx.fillRect(0, h - bw, w, bw);

          ctx.fillStyle = '#ffffff';
          const holeW = Math.round(bw * 0.5);
          const holeH = Math.round(bw * 0.6);
          const spacing = holeW * 1.8;

          for (let x = spacing / 2; x < w; x += spacing) {
            ctx.fillRect(x, (bw - holeH) / 2, holeW, holeH);
            ctx.fillRect(x, h - bw + (bw - holeH) / 2, holeW, holeH);
          }
        }

        ctx.restore();
      }

      if (adj.timestamp && adj.timestamp !== 'off') {
        ctx.save();
        const dateStr = adj.timestampText || "'95 10 24";
        const fontSize = Math.max(16, Math.round(w * 0.035));

        ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
        ctx.textAlign = 'right';

        const tx = w - fontSize * 1.2;
        const ty = h - fontSize * 1.2;

        if (adj.timestamp === 'yellow_vhs') {
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 4;
          ctx.fillText(dateStr, tx, ty);
        } else if (adj.timestamp === 'red_lcd') {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#7f1d1d';
          ctx.shadowBlur = 6;
          ctx.fillText(dateStr, tx, ty);
        } else if (adj.timestamp === 'white_digital') {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 3;
          ctx.fillText(dateStr, tx, ty);
        }

        ctx.restore();
      }
    }

    function AdjustmentSlider({ label, value, min, max, defaultValue, unit = '', onChange }) {
      const isModified = value !== defaultValue;
      return (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className={isModified ? 'text-orange-400 font-medium' : 'text-zinc-300'}>{label}</span>
            <span className="font-mono text-[11px] text-zinc-400">{value > 0 && '+'}{Math.round(value)}{unit}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>
      );
    }

    function LightControls({ adjustments, updateAdjustment }) {
      return (
        <div className="space-y-4">
          <AdjustmentSlider label="Exposure" value={adjustments.exposure} min={-100} max={100} defaultValue={0} onChange={(v) => updateAdjustment('exposure', v)} />
          <AdjustmentSlider label="Contrast" value={adjustments.contrast} min={-100} max={100} defaultValue={0} onChange={(v) => updateAdjustment('contrast', v)} />
          <AdjustmentSlider label="Highlights" value={adjustments.highlights} min={-100} max={100} defaultValue={0} onChange={(v) => updateAdjustment('highlights', v)} />
          <AdjustmentSlider label="Shadows" value={adjustments.shadows} min={-100} max={100} defaultValue={0} onChange={(v) => updateAdjustment('shadows', v)} />
          <AdjustmentSlider label="Fade (Blacks)" value={adjustments.fade} min={0} max={100} defaultValue={0} onChange={(v) => updateAdjustment('fade', v)} />
        </div>
      );
    }

    function ColorControls({ adjustments, updateAdjustment }) {
      return (
        <div className="space-y-4">
          <AdjustmentSlider label="Temperature" value={adjustments.temperature} min={-100} max={100} defaultValue={0} onChange={(v) => updateAdjustment('temperature', v)} />
          <AdjustmentSlider label="Tint" value={adjustments.tint} min={-100} max={100} defaultValue={0} onChange={(v) => updateAdjustment('tint', v)} />
          <AdjustmentSlider label="Saturation" value={adjustments.saturation} min={-100} max={100} defaultValue={0} onChange={(v) => updateAdjustment('saturation', v)} />
          <div className="pt-2 border-t border-zinc-800 space-y-3">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Split Toning</span>
            <AdjustmentSlider label="Shadow Tint Hue" value={adjustments.shadowTintHue} min={0} max={360} defaultValue={0} unit="°" onChange={(v) => updateAdjustment('shadowTintHue', v)} />
            <AdjustmentSlider label="Shadow Tint Amount" value={adjustments.shadowTintAmount} min={0} max={100} defaultValue={0} onChange={(v) => updateAdjustment('shadowTintAmount', v)} />
          </div>
        </div>
      );
    }

    function EffectsControls({ adjustments, updateAdjustment }) {
      return (
        <div className="space-y-4">
          <AdjustmentSlider label="Lens Warp / Fisheye" value={adjustments.warp} min={0} max={100} defaultValue={0} onChange={(v) => updateAdjustment('warp', v)} />
          <AdjustmentSlider label="Vignette" value={adjustments.vignette} min={0} max={100} defaultValue={0} onChange={(v) => updateAdjustment('vignette', v)} />
          <AdjustmentSlider label="Grain Amount" value={adjustments.grainAmount} min={0} max={100} defaultValue={0} onChange={(v) => updateAdjustment('grainAmount', v)} />
          <AdjustmentSlider label="Bloom Glow" value={adjustments.bloom} min={0} max={100} defaultValue={0} onChange={(v) => updateAdjustment('bloom', v)} />
          <AdjustmentSlider label="Halation Fringe" value={adjustments.halation} min={0} max={100} defaultValue={0} onChange={(v) => updateAdjustment('halation', v)} />
          <AdjustmentSlider label="Dust & Scratches" value={adjustments.dustScratches} min={0} max={100} defaultValue={0} onChange={(v) => updateAdjustment('dustScratches', v)} />
        </div>
      );
    }

    function VHSControls({ adjustments, updateAdjustment }) {
      return (
        <div className="space-y-4">
          <AdjustmentSlider label="Scanlines Overlay" value={adjustments.scanlines} min={0} max={100} defaultValue={0} onChange={(v) => updateAdjustment('scanlines', v)} />
          <AdjustmentSlider label="Tracking Distortion" value={adjustments.trackingDistortion} min={0} max={100} defaultValue={0} onChange={(v) => updateAdjustment('trackingDistortion', v)} />
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <span className="text-xs font-medium text-zinc-300 block">Date Stamp</span>
            <div className="grid grid-cols-2 gap-1.5">
              {['off', 'yellow_vhs', 'red_lcd', 'white_digital'].map((ts) => (
                <button
                  key={ts}
                  onClick={() => updateAdjustment('timestamp', ts)}
                  className={`py-1.5 px-2 rounded text-[11px] font-mono border ${
                    adjustments.timestamp === ts ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {ts.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    function PresetThumbnailCanvas({ thumbImage, preset }) {
      const canvasRef = useRef(null);

      useEffect(() => {
        if (!thumbImage || !canvasRef.current) return;
        renderProcessedImage(thumbImage, canvasRef.current, preset.adjustments, { width: 120, height: 120 });
      }, [thumbImage, preset]);

      if (!thumbImage) return <div className="absolute inset-0 bg-zinc-800/80 animate-pulse" />;

      return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />;
    }

    function FilmLabApp() {
      const [sourceImage, setSourceImage] = useState(null);
      const [imageName, setImageName] = useState('photo.jpg');

      const [adjustments, setAdjustments] = useState(DEFAULT_ADJUSTMENTS);
      const [activePreset, setActivePreset] = useState('original');
      const [presetCategory, setPresetCategory] = useState('ALL');
      const [presetIntensity, setPresetIntensity] = useState(100);

      // Viewport / Zoom State
      const [zoomLevel, setZoomLevel] = useState(1);
      const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
      const [isDragging, setIsDragging] = useState(false);
      const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

      // Touch gesture states
      const touchStartDistRef = useRef(null);
      const lastTouchTapRef = useRef(0);

      // Responsive mobile drawer states
      const [activeTab, setActiveTab] = useState('PRESETS');
      const [mobileTrayOpen, setMobileTrayOpen] = useState(false);
      const [showMobileMenu, setShowMobileMenu] = useState(false);

      // Comparison & View Modes
      const [isSplitView, setIsSplitView] = useState(false);
      const [splitPos, setSplitPos] = useState(50);
      const [showOriginal, setShowOriginal] = useState(false);

      const [showRecipeModal, setShowRecipeModal] = useState(false);
      const [showSavedDrawer, setShowSavedDrawer] = useState(false);

      const [savedRecipes, setSavedRecipes] = useState(() => {
        try {
          const local = localStorage.getItem('filmlab_recipes');
          return local ? JSON.parse(local) : [
            {
              id: 'rec_gold_90s',
              name: '90s Summer Memories',
              date: '2026-09-27',
              adjustments: { ...PRESETS.find(p => p.id === 'gold_200').adjustments, grainAmount: 30, vignette: 25 }
            }
          ];
        } catch (e) {
          return [];
        }
      });
      const [newRecipeName, setNewRecipeName] = useState('');
      const [toastMessage, setToastMessage] = useState('');

      const mainCanvasRef = useRef(null);
      const originalCanvasRef = useRef(null);
      const fileInputRef = useRef(null);
      const [thumbImage, setThumbImage] = useState(null);

      const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
      };

      const loadSampleImage = (sample) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 900;
        const ctx = canvas.getContext('2d');
        sample.draw(ctx, 1200, 900);

        const img = new Image();
        img.onload = () => {
          setSourceImage(img);
          setImageName(`${sample.id}_sample.jpg`);
          resetAllAdjustments();
          createThumbnailImage(img);
          showToast(`Loaded "${sample.title}" sample`);
        };
        img.src = canvas.toDataURL('image/jpeg', 0.95);
      };

      const createThumbnailImage = (img) => {
        const tCanvas = document.createElement('canvas');
        tCanvas.width = 120;
        tCanvas.height = 120;
        const tCtx = tCanvas.getContext('2d');

        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        tCtx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 120, 120);

        const thumbImg = new Image();
        thumbImg.onload = () => setThumbImage(thumbImg);
        thumbImg.src = tCanvas.toDataURL();
      };

      const handleFileUpload = (file) => {
        if (!file) return;

        if (!file.type.startsWith('image/') && !file.name.match(/\.(dng|cr2|cr3|nef|arw|orf|rw2|raf)$/i)) {
          showToast('Please upload an image file');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            setSourceImage(img);
            setImageName(file.name);
            resetAllAdjustments();
            createThumbnailImage(img);
            showToast('Photo loaded successfully');
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      };

      const effectiveAdjustments = useMemo(() => {
        if (activePreset === 'original') return adjustments;
        const presetObj = PRESETS.find(p => p.id === activePreset);
        if (!presetObj) return adjustments;

        return getBlendedAdjustments(DEFAULT_ADJUSTMENTS, presetObj.adjustments, presetIntensity);
      }, [adjustments, activePreset, presetIntensity]);

      const selectPreset = (presetId) => {
        setActivePreset(presetId);
        setPresetIntensity(100);
        const p = PRESETS.find(x => x.id === presetId);
        if (p) {
          setAdjustments({ ...p.adjustments });
        }
      };

      const updateAdjustment = (key, value) => {
        setAdjustments(prev => ({ ...prev, [key]: value }));
      };

      const resetAllAdjustments = () => {
        setAdjustments(DEFAULT_ADJUSTMENTS);
        setActivePreset('original');
        setPresetIntensity(100);
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
        showToast('Reset all adjustments');
      };

      const handleShuffle = () => {
        const randomPreset = PRESETS[Math.floor(Math.random() * (PRESETS.length - 1)) + 1];
        const shuffled = { ...randomPreset.adjustments };

        shuffled.temperature += (Math.random() - 0.5) * 30;
        shuffled.contrast += (Math.random() - 0.5) * 20;
        shuffled.vignette = Math.random() > 0.4 ? Math.floor(Math.random() * 50) : 0;
        shuffled.grainAmount = Math.random() > 0.3 ? Math.floor(Math.random() * 40) : 0;

        setActivePreset('custom');
        setAdjustments(shuffled);
        showToast(`Shuffled: ${randomPreset.name} style`);
      };

      const handleSaveRecipe = () => {
        if (!newRecipeName.trim()) return;

        const newRecipe = {
          id: `rec_${Date.now()}`,
          name: newRecipeName.trim(),
          date: new Date().toISOString().split('T')[0],
          adjustments: { ...effectiveAdjustments }
        };

        const updated = [newRecipe, ...savedRecipes];
        setSavedRecipes(updated);
        try {
          localStorage.setItem('filmlab_recipes', JSON.stringify(updated));
        } catch (e) {}

        setNewRecipeName('');
        setShowRecipeModal(false);
        showToast(`Saved recipe "${newRecipe.name}"`);
      };

      const applyRecipe = (recipe) => {
        setAdjustments(recipe.adjustments);
        setActivePreset('custom');
        setShowSavedDrawer(false);
        showToast(`Applied "${recipe.name}"`);
      };

      const deleteRecipe = (recipeId) => {
        const updated = savedRecipes.filter(r => r.id !== recipeId);
        setSavedRecipes(updated);
        try {
          localStorage.setItem('filmlab_recipes', JSON.stringify(updated));
        } catch (e) {}
        showToast('Recipe deleted');
      };

      const handleDownload = () => {
        if (!sourceImage) return;

        showToast('Processing export...');
        setTimeout(() => {
          const exportCanvas = document.createElement('canvas');
          renderProcessedImage(sourceImage, exportCanvas, effectiveAdjustments, {
            width: sourceImage.width,
            height: sourceImage.height
          });

          const link = document.createElement('a');
          link.download = `FilmLab_${imageName.replace(/\.[^/.]+$/, '')}.jpg`;
          link.href = exportCanvas.toDataURL('image/jpeg', 0.95);
          link.click();
          showToast('Export downloaded!');
        }, 100);
      };

      useEffect(() => {
        if (!sourceImage || !mainCanvasRef.current) return;

        const activeAdj = showOriginal ? DEFAULT_ADJUSTMENTS : effectiveAdjustments;
        renderProcessedImage(sourceImage, mainCanvasRef.current, activeAdj);

        if (isSplitView && originalCanvasRef.current) {
          renderProcessedImage(sourceImage, originalCanvasRef.current, DEFAULT_ADJUSTMENTS);
        }
      }, [sourceImage, effectiveAdjustments, showOriginal, isSplitView]);

      // Touch & Mouse Canvas Controls
      const handleMouseDown = (e) => {
        if (zoomLevel <= 1) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      };

      const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPanOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      };

      const handleMouseUp = () => setIsDragging(false);

      const handleTouchStart = (e) => {
        const now = Date.now();

        if (e.touches.length === 1) {
          if (now - lastTouchTapRef.current < 300) {
            setZoomLevel(prev => (prev > 1.2 ? 1 : 2));
            setPanOffset({ x: 0, y: 0 });
          }
          lastTouchTapRef.current = now;

          if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y });
          }
        } else if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          touchStartDistRef.current = dist;
        }
      };

      const handleTouchMove = (e) => {
        if (e.touches.length === 2 && touchStartDistRef.current) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const delta = (dist - touchStartDistRef.current) * 0.005;
          setZoomLevel(prev => Math.min(3, Math.max(0.8, prev + delta)));
          touchStartDistRef.current = dist;
        } else if (e.touches.length === 1 && isDragging) {
          setPanOffset({
            x: e.touches[0].clientX - dragStart.x,
            y: e.touches[0].clientY - dragStart.y
          });
        }
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        touchStartDistRef.current = null;
      };

      const filteredPresets = useMemo(() => {
        if (presetCategory === 'ALL') return PRESETS;
        return PRESETS.filter(p => p.category === presetCategory || p.id === 'original');
      }, [presetCategory]);

      if (!sourceImage) {
        return (
          <div
            className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 select-none font-sans"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
          >
            <div className="flex items-center justify-between max-w-5xl w-full mx-auto pt-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="font-semibold tracking-tight text-base sm:text-lg">Film Lab</span>
              </div>
              <div className="text-[11px] sm:text-xs text-zinc-500 flex items-center space-x-1">
                <Icon name="shield-check" className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% Private</span>
              </div>
            </div>

            <div className="max-w-xl w-full mx-auto my-auto text-center space-y-6 sm:space-y-8 py-6">
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white font-mono">
                  Film Lab
                </h1>
                <p className="text-zinc-400 text-xs sm:text-base font-mono">
                  “A pocket analog darkroom.”
                </p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-zinc-800 hover:border-orange-500/60 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-2xl p-8 sm:p-14 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-4 shadow-2xl active:scale-98"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-800/80 group-hover:bg-orange-500/10 group-hover:text-orange-500 text-zinc-400 flex items-center justify-center transition-colors">
                  <Icon name="upload" className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                <p className="font-mono text-xs text-zinc-400 tracking-wider">
                  TAP OR DRAG PHOTO HERE
                </p>

                <button
                  type="button"
                  className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                >
                  Select Photo
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.dng,.cr2,.cr3,.nef,.arw,.orf,.rw2,.raf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono">
                  Or test with sample photo
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {SAMPLE_IMAGES.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => loadSampleImage(sample)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 transition-all flex items-center space-x-1.5 active:scale-95"
                    >
                      <Icon name="sparkles" className="w-3.5 h-3.5 text-orange-400" />
                      <span>{sample.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] sm:text-xs text-zinc-600 font-mono pb-2">
              Analog Film Simulation · Touch Pinch Zoom · Mobile Optimized
            </div>
          </div>
        );
      }

      return (
        <div className="h-screen w-screen bg-[#0a0a0a] text-zinc-100 flex flex-col overflow-hidden select-none font-sans">
          {/* Toast Floating Notification */}
          {toastMessage && (
            <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-xs px-4 py-2 rounded-full backdrop-blur-md shadow-2xl flex items-center space-x-2 animate-fade-in">
              <Icon name="sparkles" className="w-3.5 h-3.5 text-orange-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* TOP COMPACT NAVIGATION BAR */}
          <header className="h-12 sm:h-14 border-b border-zinc-800/80 bg-zinc-950 px-3 sm:px-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span className="font-semibold text-xs sm:text-sm tracking-tight hidden sm:inline">Film Lab</span>
              </div>

              <button
                onClick={() => setSourceImage(null)}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors flex items-center space-x-1"
                title="Open New Photo"
              >
                <Icon name="plus" className="w-4 h-4" />
                <span className="hidden sm:inline">New Photo</span>
              </button>
            </div>

            {/* Center Viewport Actions */}
            <div className="flex items-center space-x-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80">
              <button
                onClick={() => setIsSplitView(!isSplitView)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isSplitView ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Toggle Split View"
              >
                <Icon name="split-square-vertical" className="w-4 h-4" />
              </button>

              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  showOriginal ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Hold to preview original"
              >
                <Icon name="eye" className="w-4 h-4" />
              </button>

              <button
                onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200"
                title="Fit Canvas"
              >
                <Icon name="maximize2" className="w-4 h-4" />
              </button>

              <button
                onClick={resetAllAdjustments}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400"
                title="Reset All Adjustments"
              >
                <Icon name="rotate-ccw" className="w-4 h-4" />
              </button>
            </div>

            {/* Right Action Menu & Export */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                onClick={handleShuffle}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center space-x-1"
                title="Shuffle Parameters"
              >
                <Icon name="shuffle" className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden md:inline">Shuffle</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs transition-all shadow-md shadow-orange-500/20 flex items-center space-x-1 active:scale-95"
              >
                <Icon name="download" className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 md:hidden"
              >
                <Icon name="menu" className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* MOBILE EXPANDABLE MENU MODAL */}
          {showMobileMenu && (
            <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden flex flex-col justify-end">
              <div className="bg-zinc-950 border-t border-zinc-800 p-4 space-y-3 rounded-t-2xl animate-slide-up">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <span className="text-xs font-mono text-zinc-400">TOOLS & RECIPES</span>
                  <button onClick={() => setShowMobileMenu(false)} className="text-zinc-400">
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => { setShowRecipeModal(true); setShowMobileMenu(false); }}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 text-xs font-mono text-zinc-200 flex items-center space-x-2"
                >
                  <Icon name="bookmark" className="w-4 h-4 text-orange-400" />
                  <span>Save Current Recipe</span>
                </button>

                <button
                  onClick={() => { setShowSavedDrawer(true); setShowMobileMenu(false); }}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 text-xs font-mono text-zinc-200 flex items-center space-x-2"
                >
                  <Icon name="layers" className="w-4 h-4 text-orange-400" />
                  <span>Saved Recipe Library ({savedRecipes.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* MAIN VIEWPORT WORKSPACE */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

            {/* CANVAS DISPLAY */}
            <main
              className="flex-1 relative bg-[#050505] overflow-hidden flex items-center justify-center p-2 sm:p-4 touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="relative transition-transform duration-75 ease-out flex items-center justify-center max-w-full max-h-full"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`
                }}
              >
                {isSplitView ? (
                  <div className="relative overflow-hidden flex items-center justify-center">
                    <canvas ref={mainCanvasRef} className="max-w-full max-h-[60vh] md:max-h-[75vh] object-contain block rounded-sm shadow-2xl" />

                    <div
                      className="absolute top-0 left-0 bottom-0 overflow-hidden border-r-2 border-orange-500 shadow-xl"
                      style={{ width: `${splitPos}%` }}
                    >
                      <canvas ref={originalCanvasRef} className="max-w-none max-h-[60vh] md:max-h-[75vh] object-contain block rounded-sm" />
                      <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-zinc-300">
                        ORIGINAL
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={splitPos}
                      onChange={(e) => setSplitPos(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <canvas ref={mainCanvasRef} className="max-w-full max-h-[60vh] md:max-h-[75vh] object-contain block rounded-sm shadow-2xl" />
                    {showOriginal && (
                      <span className="absolute top-2 left-2 bg-orange-500/90 text-white backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono tracking-wider shadow-lg">
                        ORIGINAL
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Floating Preset Intensity Bar */}
              {activePreset !== 'original' && !showOriginal && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/90 border border-zinc-800 rounded-full px-4 py-1.5 backdrop-blur-md flex items-center space-x-2 shadow-2xl min-w-[220px]">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider shrink-0">
                    INTENSITY
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={presetIntensity}
                    onChange={(e) => setPresetIntensity(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-orange-400 w-7 text-right shrink-0">
                    {presetIntensity}%
                  </span>
                </div>
              )}
            </main>

            {/* DESKTOP RIGHT SIDEBAR (>= md screens) */}
            <aside className="hidden md:flex w-80 border-l border-zinc-800/80 bg-zinc-950 flex-col shrink-0 z-20">
              <div className="grid grid-cols-4 border-b border-zinc-800/80 bg-zinc-900/50 p-1 gap-1 shrink-0 text-xs font-mono">
                {[
                  { id: 'LIGHT', icon: 'sun', label: 'LIGHT' },
                  { id: 'COLOR', icon: 'palette', label: 'COLOR' },
                  { id: 'EFFECTS', icon: 'wand2', label: 'FX' },
                  { id: 'VHS', icon: 'tv', label: 'VHS' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-zinc-800 text-orange-400 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon name={tab.icon} className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                {activeTab === 'LIGHT' && <LightControls adjustments={adjustments} updateAdjustment={updateAdjustment} />}
                {activeTab === 'COLOR' && <ColorControls adjustments={adjustments} updateAdjustment={updateAdjustment} />}
                {activeTab === 'EFFECTS' && <EffectsControls adjustments={adjustments} updateAdjustment={updateAdjustment} />}
                {activeTab === 'VHS' && <VHSControls adjustments={adjustments} updateAdjustment={updateAdjustment} />}
              </div>
            </aside>
          </div>

          {/* MOBILE BOTTOM CONTROLS / TRAY (< md screens) */}
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950 flex flex-col shrink-0 z-30">
            {/* Mobile Tray Content (Sliding Sheet) */}
            {mobileTrayOpen && (
              <div className="max-h-[38vh] overflow-y-auto p-4 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-lg animate-slide-up">
                <div className="flex justify-between items-center mb-3 pb-1 border-b border-zinc-800/80">
                  <span className="text-xs font-mono text-orange-400 font-semibold">{activeTab} CONTROLS</span>
                  <button
                    onClick={() => setMobileTrayOpen(false)}
                    className="p-1 rounded bg-zinc-800 text-zinc-400"
                  >
                    <Icon name="chevron-down" className="w-4 h-4" />
                  </button>
                </div>

                {activeTab === 'PRESETS' && (
                  <div className="space-y-3">
                    <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px] font-mono">
                      {['ALL', 'NONE', 'ANALOG FILM', 'OLD SCHOOL VHS', 'FUJI FILM LOOKS', 'KODAK FILM LOOKS'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPresetCategory(cat)}
                          className={`px-2.5 py-1 rounded-full whitespace-nowrap ${
                            presetCategory === cat ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {filteredPresets.map(p => (
                        <button
                          key={p.id}
                          onClick={() => selectPreset(p.id)}
                          className={`p-2 rounded-xl text-left border text-xs font-mono ${
                            activePreset === p.id ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-zinc-800 bg-zinc-900 text-zinc-300'
                          }`}
                        >
                          <div className="truncate font-semibold">{p.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'LIGHT' && <LightControls adjustments={adjustments} updateAdjustment={updateAdjustment} />}
                {activeTab === 'COLOR' && <ColorControls adjustments={adjustments} updateAdjustment={updateAdjustment} />}
                {activeTab === 'EFFECTS' && <EffectsControls adjustments={adjustments} updateAdjustment={updateAdjustment} />}
                {activeTab === 'VHS' && <VHSControls adjustments={adjustments} updateAdjustment={updateAdjustment} />}
              </div>
            )}

            {/* Mobile Horizontal Preset Strip (When Tray Closed) */}
            {!mobileTrayOpen && (
              <div className="p-2 border-b border-zinc-800/80 bg-zinc-950 flex items-center space-x-2 overflow-x-auto no-scrollbar">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => selectPreset(preset.id)}
                    className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border p-1.5 flex flex-col justify-end text-left transition-all ${
                      activePreset === preset.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-zinc-800 bg-zinc-900'
                    }`}
                  >
                    <span className={`text-[10px] font-mono truncate ${
                      activePreset === preset.id ? 'text-orange-400 font-semibold' : 'text-zinc-400'
                    }`}>
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Mobile Bottom Navigation Bar */}
            <div className="grid grid-cols-5 p-1.5 gap-1 bg-zinc-950 font-mono text-[10px]">
              {[
                { id: 'PRESETS', icon: 'sliders-horizontal', label: 'PRESETS' },
                { id: 'LIGHT', icon: 'sun', label: 'LIGHT' },
                { id: 'COLOR', icon: 'palette', label: 'COLOR' },
                { id: 'EFFECTS', icon: 'wand2', label: 'FX' },
                { id: 'VHS', icon: 'tv', label: 'VHS' }
              ].map((tab) => {
                const isActive = activeTab === tab.id && mobileTrayOpen;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (activeTab === tab.id) {
                        setMobileTrayOpen(!mobileTrayOpen);
                      } else {
                        setActiveTab(tab.id);
                        setMobileTrayOpen(true);
                      }
                    }}
                    className={`py-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${
                      isActive ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon name={tab.icon} className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESKTOP BOTTOM PRESET STRIP (>= md) */}
          <footer className="hidden md:flex h-28 border-t border-zinc-800/80 bg-zinc-950 p-3 flex-col shrink-0 z-20 space-y-2">
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0 text-xs font-mono">
              {['ALL', 'NONE', 'ANALOG FILM', 'OLD SCHOOL VHS', 'FUJI FILM LOOKS', 'KODAK FILM LOOKS'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPresetCategory(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                    presetCategory === cat ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 flex items-center space-x-3 overflow-x-auto custom-scrollbar">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset.id)}
                  className={`group relative shrink-0 w-24 h-16 rounded-xl overflow-hidden border p-2 text-left flex flex-col justify-end transition-all ${
                    activePreset === preset.id ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900'
                  }`}
                >
                  <PresetThumbnailCanvas thumbImage={thumbImage} preset={preset} />
                  <span className={`relative z-10 text-[10px] font-mono truncate ${
                    activePreset === preset.id ? 'text-orange-400 font-semibold' : 'text-zinc-300'
                  }`}>
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </footer>

          {/* MODAL: Save Recipe */}
          {showRecipeModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white font-mono">Save Custom Recipe</h3>
                  <button onClick={() => setShowRecipeModal(false)} className="text-zinc-400">
                    <Icon name="x" className="w-5 h-5" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="e.g., Summer Kodachrome '92"
                  value={newRecipeName}
                  onChange={(e) => setNewRecipeName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-orange-500 focus:outline-none font-mono"
                />

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setShowRecipeModal(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-xs font-medium text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRecipe}
                    disabled={!newRecipeName.trim()}
                    className="px-4 py-2 rounded-lg bg-orange-500 disabled:opacity-50 text-xs font-medium text-white shadow-lg shadow-orange-500/20"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DRAWER: Saved Recipes */}
          {showSavedDrawer && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
              <div className="bg-zinc-950 border-l border-zinc-800 w-80 h-full p-6 flex flex-col space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="bookmark" className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white font-mono">Saved Recipes</h3>
                  </div>
                  <button onClick={() => setShowSavedDrawer(false)} className="text-zinc-400">
                    <Icon name="x" className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {savedRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-zinc-200 font-mono">{recipe.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{recipe.date}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => applyRecipe(recipe)}
                          className="px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 text-[11px] font-mono"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => deleteRecipe(recipe.id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400"
                        >
                          <Icon name="trash2" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Mount Application
    const container = document.getElementById('root');
    const root = ReactDOM.createRoot(container);
    root.render(<FilmLabApp />);
  </script>
</body>
</html>
