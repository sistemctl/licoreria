'use client';

import { useEffect, useRef } from 'react';

/**
 * Custom hook to listen to barcode scanner keyboard emulation events.
 * Scanners send keys very fast (< 50ms between key presses) followed by an 'Enter'.
 * @param {Function} onScan callback function called when a barcode is scanned.
 */
export default function useBarcodeScanner(onScan) {
  const bufferRef = useRef([]);
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      
      // If Enter is pressed, trigger onScan if we have a buffer
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 3) { // Most barcodes are at least 3 digits
          const barcode = bufferRef.current.join('');
          onScan(barcode);
        }
        bufferRef.current = [];
        return;
      }

      // Ignore non-character keys (Shift, Ctrl, etc.)
      if (e.key.length > 1) {
        return;
      }

      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // If time difference between keys is too long, reset the buffer
      // and treat this key as the start of a new scan
      if (timeDiff > 50) {
        bufferRef.current = [];
      }

      bufferRef.current.push(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan]);

  return null;
}
