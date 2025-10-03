import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X } from 'lucide-react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const codeReader = useRef<BrowserMultiFormatReader>();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen && !codeReader.current) {
      codeReader.current = new BrowserMultiFormatReader();
    }
  }, [isOpen]);

  useEffect(() => {
    let scanning = false;

    const scanBarcode = async () => {
      if (!webcamRef.current || !codeReader.current || scanning || !isOpen) {
        return;
      }

      scanning = true;
      setIsScanning(true);

      try {
        const videoElement = webcamRef.current.video;
        if (videoElement) {
          const result = await codeReader.current.decodeOnceFromVideoDevice(undefined, videoElement);
          if (result) {
            onScan(result.getText());
            onClose();
          }
        }
      } catch (error) {
        console.log('Scanning error:', error);
      } finally {
        scanning = false;
        setIsScanning(false);
      }
    };

    if (isOpen) {
      const interval = setInterval(scanBarcode, 1000);
      return () => {
        clearInterval(interval);
        // Clean up video stream
        if (webcamRef.current?.video) {
          const stream = webcamRef.current.video.srcObject as MediaStream;
          stream?.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [isOpen, onScan, onClose]);

  const handleClose = () => {
    // Clean up video stream
    if (webcamRef.current?.video) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Barcode Scanner
          </DialogTitle>
          <DialogDescription>
            Position the barcode within the camera view to scan
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: 'environment'
              }}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay scanning frame */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                <div className="text-white text-sm text-center">
                  {isScanning ? 'Scanning...' : 'Position barcode here'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Make sure the barcode is well-lit and within the frame
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}