/**
 * E-Signature Utilities — Qastly
 *
 * Captures a digital signature from customer (canvas) and embeds it
 * into the order record with metadata (IP, timestamp, user-agent).
 */

import type { ESignature } from '@/types';

export interface SignatureCaptureResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Capture a signature from a canvas element.
 */
export function captureSignature(canvas: HTMLCanvasElement): SignatureCaptureResult | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dataUrl = canvas.toDataURL('image/png');
  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Build a signature pad on a canvas with drawing listeners.
 * Call `cleanup()` to remove listeners.
 */
export function initSignaturePad(
  canvas: HTMLCanvasElement,
  options: { penColor?: string; lineWidth?: number } = {}
): { cleanup: () => void; clear: () => void; isEmpty: () => boolean } {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.strokeStyle = options.penColor || '#0a1628';
  ctx.lineWidth = options.lineWidth || 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let drawing = false;
  let hasDrawn = false;

  const getPos = (e: MouseEvent | TouchEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const start = (e: MouseEvent | TouchEvent) => {
    drawing = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: MouseEvent | TouchEvent) => {
    if (!drawing) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawn = true;
  };
  const end = () => {
    drawing = false;
    ctx.closePath();
  };

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: true });
  canvas.addEventListener('touchmove', move, { passive: true });
  window.addEventListener('touchend', end);

  return {
    cleanup: () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    },
    clear: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawn = false;
    },
    isEmpty: () => !hasDrawn,
  };
}

/**
 * Create an ESignature object from captured data.
 */
export function buildESignature(
  capture: SignatureCaptureResult,
  customerName: string
): ESignature {
  return {
    signatureData: capture.dataUrl,
    signedAt: new Date().toISOString(),
    signedBy: customerName,
    ipAddress: '0.0.0.0', // In production, filled server-side
    userAgent: navigator.userAgent,
  };
}

/**
 * Verify signature is present and not a blank canvas (basic heuristic).
 */
export function verifySignature(signature: ESignature | undefined): boolean {
  if (!signature || !signature.signatureData) return false;
  // A valid PNG data URL is > ~100 chars for a blank canvas; real signature is larger.
  return signature.signatureData.length > 500;
}
