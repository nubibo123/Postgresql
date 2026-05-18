import React, { useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { formatVirtualAccount } from '../utils/formatters';

const QRCodeModal = ({ accountNumber, virtualAccount, onClose }) => {
  const modalRef = useRef(null);
  const canvasRef = useRef(null);
  const virtual = virtualAccount || formatVirtualAccount(accountNumber);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(virtual).catch(() => {});
  };

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `securebank-qr-${accountNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-obsidian-deep/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div ref={modalRef} className="glass-card w-full max-w-sm text-center relative rounded-2xl p-stack-lg">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5" aria-label="Đóng">
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
          </div>
          <h2 className="text-on-surface font-headline-md text-headline-md font-bold">SecureBank</h2>
          <p className="text-on-surface-variant text-sm mt-1">Quét mã để chuyển tiền</p>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl p-5 inline-block mb-5 shadow-qr-glow" ref={canvasRef}>
          <QRCodeCanvas value={virtual} size={220} level="H" includeMargin bgColor="#ffffff" fgColor="#1a1a2e" />
        </div>

        {/* Account number */}
        <div className="bg-surface-container border border-outline-variant rounded-xl px-4 py-3 mb-4">
          <p className="text-on-surface-variant text-[10px] font-label-sm uppercase tracking-widest mb-2">Tài khoản ảo</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-primary font-label-md text-label-md font-bold font-mono tracking-wider">{virtual}</span>
            <button onClick={handleCopy} className="text-primary hover:text-white transition cursor-pointer" title="Sao chép">
              <span className="material-symbols-outlined text-lg">content_copy</span>
            </button>
          </div>
        </div>

        {/* Download */}
        <button onClick={handleDownload} className="btn-primary w-full flex justify-center items-center gap-2 mb-3 cursor-pointer">
          <span className="material-symbols-outlined">file_download</span>
          Tải mã QR (PNG)
        </button>

        <p className="text-on-surface-variant text-xs">Chia sẻ mã này để nhận tiền</p>
      </div>
    </div>
  );
};

export default QRCodeModal;