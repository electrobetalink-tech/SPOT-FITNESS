"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ScanResult } from "@/lib/scan/types";

type Detector = {
  detect: (input: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): Detector;
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

export default function AdminScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const frameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningLockRef = useRef(false);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedValue, setLastScannedValue] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const isBarcodeSupported = useMemo(() => typeof window !== "undefined" && !!window.BarcodeDetector, []);

  const verifyQrCode = useCallback(async (qrData: string) => {
    if (scanningLockRef.current || qrData === lastScannedValue) {
      return;
    }

    scanningLockRef.current = true;

    try {
      const response = await fetch("/api/admin/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ qrData })
      });

      const payload = (await response.json()) as ScanResult | { error: string };

      if (!response.ok) {
        setResult(null);
        setError("error" in payload ? payload.error : "Erreur lors de la vérification.");
      } else {
        setError(null);
        setResult(payload as ScanResult);
        setLastScannedValue(qrData);
      }
    } catch {
      setError("Impossible de vérifier le QR code pour le moment.");
      setResult(null);
    } finally {
      setTimeout(() => {
        scanningLockRef.current = false;
      }, 1000);
    }
  }, [lastScannedValue]);

  const scanLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;

    if (!video || !canvas || !detector || video.readyState < 2) {
      frameRef.current = window.requestAnimationFrame(scanLoop);
      return;
    }

    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      setError("Impossible de lire le flux vidéo.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const qrCodes = await detector.detect(canvas);
      const value = qrCodes.find((code) => !!code.rawValue)?.rawValue;

      if (value) {
        await verifyQrCode(value);
      }
    } catch {
      // Ignore intermittent detector errors to keep the scanner running.
    }

    frameRef.current = window.requestAnimationFrame(scanLoop);
  }, [verifyQrCode]);

  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      if (!isBarcodeSupported) {
        setError("Ce navigateur ne supporte pas BarcodeDetector pour les QR codes.");
        return;
      }

      try {
        if (!window.BarcodeDetector) {
          setError("Détecteur QR indisponible.");
          return;
        }

        detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });

        if (!detectorRef.current) {
          setError("Détecteur QR indisponible.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;

        if (!video) {
          return;
        }

        video.srcObject = stream;
        await video.play();

        setIsCameraReady(true);
        setError(null);
        frameRef.current = window.requestAnimationFrame(scanLoop);
      } catch {
        setError("Permission caméra refusée ou caméra indisponible.");
        setIsCameraReady(false);
      }
    }

    void initCamera();

    return () => {
      mounted = false;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [isBarcodeSupported, scanLoop]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Scan QR anti-fraude</h1>
      <p className="mt-1 text-slate-600">Scannez le QR code du membre pour vérifier son accès en temps réel.</p>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Caméra</h2>
          <video ref={videoRef} className="h-72 w-full rounded-lg bg-slate-100 object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
          <p className="mt-3 text-sm text-slate-600">
            {isCameraReady ? "Lecture du QR code en continu..." : "Initialisation caméra..."}
          </p>
          {lastScannedValue && <p className="mt-2 text-xs text-slate-500">Dernier QR lu: {lastScannedValue}</p>}
          {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
        </article>

        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Résultat</h2>

          {!result && !error && <p className="text-sm text-slate-500">Aucun membre scanné pour le moment.</p>}

          {result && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-lg font-semibold text-slate-900">{result.user.name}</p>
                <p className="text-slate-600">{result.user.email}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p>
                  <span className="font-medium">Statut:</span> {result.subscription.status}
                </p>
                <p>
                  <span className="font-medium">Fin d'abonnement:</span> {new Date(result.subscription.end_date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Jours restants:</span> {result.subscription.days_remaining}
                </p>
                <p>
                  <span className="font-medium">Accès aujourd'hui:</span>{" "}
                  {result.subscription.can_access_today ? "Autorisé" : "Déjà entré aujourd'hui"}
                </p>
                {result.last_check_in && (
                  <p>
                    <span className="font-medium">Dernier passage:</span>{" "}
                    {new Date(result.last_check_in).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
