
import React from 'react';
import type { Document } from '../types';
import { XIcon, ExcelIcon, WordIcon, FileIcon } from './common/icons';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ isOpen, onClose, document }) => {
  if (!isOpen || !document) return null;

  const isImage = document.fileType.startsWith('image/');
  const isPdf = document.fileType === 'application/pdf';
  const isExcel = document.fileType.includes('spreadsheet') || document.fileType.includes('excel');
  const isWord = document.fileType.includes('wordprocessing') || document.fileType.includes('word');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate pr-4">{document.fileName}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><XIcon /></button>
        </div>
        <div className="p-4 flex-grow overflow-auto bg-slate-100 dark:bg-slate-900">
          {isImage ? (
            <div className="flex items-center justify-center h-full">
                <img src={document.url} alt={document.fileName} className="max-w-full max-h-full object-contain" />
            </div>
          ) : isPdf ? (
            <iframe src={document.url} className="w-full h-full border-0" title={document.fileName}></iframe>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                {isExcel && <ExcelIcon className="w-24 h-24 text-green-500 mb-4" />}
                {isWord && <WordIcon className="w-24 h-24 text-blue-500 mb-4" />}
                {!isExcel && !isWord && <FileIcon className="w-24 h-24 text-slate-400 mb-4" />}
                <p className="text-lg font-semibold">Preview not available</p>
                <p>Direct preview is not supported for this file type ({document.fileType}).</p>
                <a href={document.url} download={document.fileName} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Download File to view
                </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
