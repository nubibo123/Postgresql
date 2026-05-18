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
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `securebank-qr-${accountNumber}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div ref={modalRef} className="card w-full max-w-sm text-center relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition text-xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-gray-800"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Bank header */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-accent mx-auto flex items-center justify-center mb-3">
            <span className="text-white font-bold text-sm">SB</span>
          </div>
          <h2 className="text-white font-bold text-lg">SecureBank</h2>
          <p className="text-gray-500 text-sm mt-1">Scan to transfer</p>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl p-5 inline-block mb-5" ref={canvasRef}>
          <QRCodeCanvas
            value={virtual}
            size={220}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#1a1a2e"
          />
        </div>

        {/* Virtual Account Number */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 mb-4">
          <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Virtual Account</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-white font-mono text-lg font-bold tracking-wider">
              {virtual}
            </span>
            <button
              onClick={handleCopy}
              className="text-brand-accent hover:text-white transition flex-shrink-0"
              title="Copy"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h4a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H10a1 1 0 01-1-1H9a2 2 0 00-2 2v8a2 2 0 002 2h1a1 1 0 100-2H8a1 1 0 01-1-1V9a1 1 0 00-1-1H5z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2 mb-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download QR Code
        </button>

        <p className="text-gray-600 text-xs">Share this code to receive transfers</p>
      </div>
    </div>
  );
};

export default QRCodeModal;