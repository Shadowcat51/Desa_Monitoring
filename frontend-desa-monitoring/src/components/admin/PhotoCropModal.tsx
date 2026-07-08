import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { getCroppedImg } from '../../utils/cropImage';

interface PhotoCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

export default function PhotoCropModal({ imageSrc, onClose, onCropComplete }: PhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      if (!croppedAreaPixels) return;
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImageBlob) {
        onCropComplete(croppedImageBlob);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">Sesuaikan Foto Profil</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-80 bg-slate-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Zoom Controls */}
        <div className="px-6 py-4 flex items-center gap-4 border-b border-slate-100">
          <ZoomOut size={20} className="text-slate-400" />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <ZoomIn size={20} className="text-slate-400" />
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Check size={18} /> Terapkan Foto
          </button>
        </div>
      </div>
    </div>
  );
}
