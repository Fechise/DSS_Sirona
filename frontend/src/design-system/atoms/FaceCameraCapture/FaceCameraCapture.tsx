import React, { useRef, useState, useEffect } from 'react';
import styles from './FaceCameraCapture.module.scss';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../Button/Button';

type FaceCameraCaptureProps = {
  onCapture: (file: File) => void;
  onClear?: () => void;
  disabled?: boolean;
};

export const FaceCameraCapture: React.FC<FaceCameraCaptureProps> = ({
  onCapture,
  onClear,
  disabled = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      setIsStreaming(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'face-capture.jpg', { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        onCapture(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    onClear?.();
    startCamera();
  };

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        <Camera size={16} />
        <span>Captura facial en vivo</span>
      </div>

      <div className={styles.cameraFrame}>
        {error && (
          <div className={styles.error}>
            <XCircle size={24} />
            <p>{error}</p>
            <Button variant="outlined" color="primary" onClick={startCamera}>
              Reintentar
            </Button>
          </div>
        )}

        {!error && !capturedImage && (
          <>
            <video
              ref={videoRef}
              className={styles.video}
              autoPlay
              playsInline
              muted
            />
            <div className={styles.overlay}>
              <div className={styles.faceGuide} />
            </div>
            {!isStreaming && (
              <div className={styles.loading}>
                <Camera size={48} />
                <p>Iniciando cámara...</p>
              </div>
            )}
          </>
        )}

        {capturedImage && (
          <div className={styles.preview}>
            <img src={capturedImage} alt="Captura facial" className={styles.capturedImage} />
            <div className={styles.captureSuccess}>
              <CheckCircle size={24} />
              <span>Rostro capturado</span>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div className={styles.actions}>
        {!capturedImage && isStreaming && (
          <Button
            type="button"
            variant="filled"
            color="primary"
            onClick={capturePhoto}
            disabled={disabled || !isStreaming}
            fullWidth
          >
            <Camera size={18} />
            Capturar rostro
          </Button>
        )}

        {capturedImage && (
          <Button
            type="button"
            variant="outlined"
            color="primary"
            onClick={retakePhoto}
            disabled={disabled}
            fullWidth
          >
            Tomar otra foto
          </Button>
        )}
      </div>

      <p className={styles.hint}>
        Se requiere prueba de vida (movimiento/cierre de ojos) y coincidencia con la plantilla biométrica almacenada.
      </p>
    </div>
  );
};
