/**
 * FileComponents.jsx
 * Google Drive–style file upload & preview components.
 *
 * PDF FIX for blob: URLs
 * ─────────────────────
 * <iframe> and <embed> silently refuse blob: PDF URLs in most browsers.
 * Solution: read the File object with FileReader → base64 data: URL,
 * then render <embed src="data:application/pdf;base64,…" />.
 * We store { file, name, url, dataUrl?, isLocal } per file object.
 * dataUrl is set lazily when the preview modal opens.
 *
 * Usage
 * ─────
 * import { SingleFileUpload, MultiFileUpload,
 *          DetailDocCard, DetailMultiDocGrid } from './FileComponents';
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineX, HiOutlineDownload, HiOutlineEye, HiOutlineTrash,
  HiOutlineUpload, HiOutlinePlus, HiOutlineDocumentText,
  HiOutlineDocument, HiOutlinePhotograph,
} from 'react-icons/hi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getFileExt = (url = '') =>
  (url.split('?')[0].split('.').pop() || '').toLowerCase();

export const getFileType = (url = '') => {
  const ext = getFileExt(url);
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if (ext === 'pdf')  return 'pdf';
  if (['doc','docx','xls','xlsx','ppt','pptx'].includes(ext)) return 'office';
  return 'document';
};

export const getFileName = (url = '') =>
  decodeURIComponent(url.split('?')[0].split('/').pop() || '') || 'File';

/**
 * Read a File object as base64 data: URL.
 * Works for PDF, images, anything. Returns a Promise<string>.
 */
const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ─── Type visual config ───────────────────────────────────────────────────────

const TYPE_CFG = {
  pdf:      { bg: 'bg-red-50',    border: 'border-red-100',    badge: 'bg-red-100 text-red-700',     label: 'PDF'  },
  image:    { bg: 'bg-blue-50',   border: 'border-blue-100',   badge: 'bg-blue-100 text-blue-700',   label: 'IMG'  },
  office:   { bg: 'bg-green-50',  border: 'border-green-100',  badge: 'bg-green-100 text-green-700', label: 'DOC'  },
  document: { bg: 'bg-gray-50',   border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-600',   label: 'FILE' },
};

// ─── Full-screen Preview Modal ────────────────────────────────────────────────

export const FilePreviewModal = ({ file, onClose }) => {
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState(false);

  const type   = file ? getFileType(file.url) : null;
  const ext    = file ? getFileExt(file.url).toUpperCase() : '';
  const isBlob = file?.url?.startsWith('blob:');

  useEffect(() => {
    if (!file) return;
    setResolvedUrl(null); setError(false); setLoading(true);

    if (type === 'image' || type === 'pdf') {
      if (isBlob && file.file) {
        // LOCAL file: convert File → data: URL so embed/img actually work
        fileToDataUrl(file.file)
          .then(dataUrl => { setResolvedUrl(dataUrl); setLoading(false); })
          .catch(()    => { setError(true);            setLoading(false); });
      } else {
        // Remote URL: use directly
        setResolvedUrl(file.url);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [file?.url]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 bg-black/75 z-[90] flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: '94vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_CFG[type]?.bg || 'bg-gray-50'}`}>
              {type === 'image'  && <HiOutlinePhotograph className="w-5 h-5 text-blue-500" />}
              {type === 'pdf'    && <span className="text-[11px] font-black text-red-600">PDF</span>}
              {(type === 'office' || type === 'document') && <HiOutlineDocumentText className="w-5 h-5 text-gray-500" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate max-w-xs md:max-w-md">{file.label || file.name}</p>
              <p className="text-xs text-gray-400">{ext} file</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
            {!isBlob && (
              <>
                <a href={file.url} target="_blank" rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                  title="Buka di tab baru">↗</a>
                <a href={file.url} download
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Download"><HiOutlineDownload className="w-5 h-5" /></a>
              </>
            )}
            <button onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-1">
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4" style={{ minHeight: 200 }}>

          {loading && (
            <div className="flex flex-col items-center text-gray-400 py-16">
              <svg className="animate-spin w-10 h-10 mb-3 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-sm">Memuat preview…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center text-gray-400 py-16">
              <p className="text-sm font-medium text-gray-600 mb-4">Gagal memuat file</p>
              {!isBlob && (
                <a href={file.url} target="_blank" rel="noopener noreferrer"
                  className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700">
                  Buka di tab baru
                </a>
              )}
            </div>
          )}

          {/* IMAGE */}
          {!loading && !error && type === 'image' && resolvedUrl && (
            <img src={resolvedUrl} alt={file.label || file.name}
              className="max-w-full object-contain rounded-xl shadow-lg"
              style={{ maxHeight: '75vh' }} />
          )}

          {/* PDF — embed + data: URL fixes blob: issue */}
          {!loading && !error && type === 'pdf' && resolvedUrl && (
            <div className="w-full rounded-xl overflow-hidden shadow border border-gray-200" style={{ height: '75vh' }}>
              <embed
                src={resolvedUrl}
                type="application/pdf"
                width="100%"
                height="100%"
              />
            </div>
          )}

          {/* OFFICE / UNSUPPORTED */}
          {!loading && !error && (type === 'office' || type === 'document') && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 shadow flex items-center justify-center mb-4">
                <HiOutlineDocumentText className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium mb-1">Preview tidak tersedia</p>
              <p className="text-sm text-gray-400 mb-6">Format {ext} tidak dapat ditampilkan di browser</p>
              {!isBlob && (
                <a href={file.url} download
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium shadow">
                  Download File
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Google Drive–style card ──────────────────────────────────────────────────

export const DriveCard = ({ fileObj, onPreview, onRemove, isExisting = false, index = null }) => {
  const type   = getFileType(fileObj.url);
  const cfg    = TYPE_CFG[type] || TYPE_CFG.document;
  const ext    = getFileExt(fileObj.url).toUpperCase();

  return (
    <div
      className="group relative flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer
                 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 select-none"
      onClick={() => onPreview(fileObj)}
    >
      {/* Thumbnail area */}
      <div className={`relative flex items-center justify-center overflow-hidden ${cfg.bg} border-b ${cfg.border}`}
           style={{ height: 112 }}>

        {type === 'image' ? (
          <img src={fileObj.url} alt={fileObj.name}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display='none'; }} />
        ) : type === 'pdf' ? (
          <div className="flex flex-col items-center justify-center">
            <div className="w-11 h-14 bg-white rounded-lg shadow border border-red-200 flex flex-col items-center overflow-hidden">
              <div className="w-full h-3 bg-red-500 flex-shrink-0" />
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[11px] font-black text-red-500 tracking-tight">PDF</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <HiOutlineDocumentText className="w-10 h-10 text-gray-400" />
            <span className={`mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${cfg.badge}`}>{ext}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors duration-150
                        flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center
                          opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-150">
            <HiOutlineEye className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        {/* Badges */}
        {isExisting && (
          <span className="absolute top-1.5 left-1.5 text-[8px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full shadow tracking-wide z-10">
            SAVED
          </span>
        )}
        {index !== null && (
          <span className="absolute top-1.5 right-6 text-[8px] font-bold bg-black/40 text-white px-1.5 py-0.5 rounded-full z-10">
            #{index + 1}
          </span>
        )}

        {/* Delete */}
        {onRemove && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-white/90 border border-gray-200
                       hover:border-red-300 hover:bg-red-50 flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-all shadow"
          >
            <HiOutlineTrash className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-2.5 py-2 bg-white">
        <p className="text-[11px] font-medium text-gray-700 truncate leading-snug">{fileObj.name}</p>
        <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">{ext}</p>
      </div>
    </div>
  );
};

// ─── Single file upload slot ──────────────────────────────────────────────────

export const SingleFileUpload = ({
  fileObj, existingUrl,
  onChange, onRemove,
  label, icon: Icon = HiOutlineDocument,
}) => {
  const [preview, setPreview] = useState(null);

  const display = fileObj
    || (existingUrl ? { name: getFileName(existingUrl), url: existingUrl, isLocal: false } : null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Icon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
        </div>
        <label className="cursor-pointer flex items-center space-x-1 text-xs font-medium text-indigo-600
                          hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">
          <HiOutlineUpload className="w-3.5 h-3.5" />
          <span>{display ? 'Ganti' : 'Upload'}</span>
          <input type="file" className="hidden"
            onChange={e => e.target.files[0] && onChange(e.target.files[0])} />
        </label>
      </div>

      {display ? (
        <DriveCard
          fileObj={display}
          onPreview={f => setPreview(f)}
          onRemove={fileObj ? onRemove : undefined}
          isExisting={!fileObj && !!existingUrl}
        />
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200
                          rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-all group"
               style={{ height: 112 }}>
          <HiOutlineUpload className="w-7 h-7 text-gray-300 group-hover:text-indigo-400 mb-1 transition-colors" />
          <span className="text-xs text-gray-400 group-hover:text-indigo-500 transition-colors">Klik untuk upload</span>
          <input type="file" className="hidden"
            onChange={e => e.target.files[0] && onChange(e.target.files[0])} />
        </label>
      )}

      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
};

// ─── Multi file upload slot (max N, Drive grid) ───────────────────────────────

export const MultiFileUpload = ({
  files, onChange,
  maxFiles = 3,
  label, icon: Icon = HiOutlineDocument,
}) => {
  const [preview, setPreview] = useState(null);

  const handleAdd = (e) => {
    const incoming  = Array.from(e.target.files);
    const remaining = maxFiles - files.length;
    const toAdd = incoming.slice(0, remaining).map(f => ({
      file: f, name: f.name,
      url: URL.createObjectURL(f), isLocal: true,
    }));
    onChange([...files, ...toAdd]);
    e.target.value = '';
  };

  const handleRemove = (idx) => onChange(files.filter((_, i) => i !== idx));

  const cols = files.length <= 1 ? 'grid-cols-1'
             : files.length === 2 ? 'grid-cols-2'
             : 'grid-cols-3';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Icon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {files.length}/{maxFiles}
          </span>
        </div>
        {files.length < maxFiles && (
          <label className="cursor-pointer flex items-center space-x-1 text-xs font-medium text-indigo-600
                            hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">
            <HiOutlinePlus className="w-3.5 h-3.5" />
            <span>Tambah</span>
            <input type="file" className="hidden" multiple onChange={handleAdd} />
          </label>
        )}
      </div>

      {files.length === 0 ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200
                          rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-all group"
               style={{ height: 112 }}>
          <HiOutlineUpload className="w-7 h-7 text-gray-300 group-hover:text-indigo-400 mb-1 transition-colors" />
          <span className="text-xs text-gray-400 group-hover:text-indigo-500">Upload (max {maxFiles} file)</span>
          <input type="file" className="hidden" multiple onChange={handleAdd} />
        </label>
      ) : (
        <div className={`grid gap-2 ${cols}`}>
          {files.map((f, i) => (
            <DriveCard
              key={i}
              fileObj={f}
              onPreview={f2 => setPreview(f2)}
              onRemove={() => handleRemove(i)}
              isExisting={!f.isLocal}
              index={files.length > 1 ? i : null}
            />
          ))}
        </div>
      )}

      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
};

// ─── Read-only card for Detail modal ─────────────────────────────────────────

export const DetailDocCard = ({ label, url }) => {
  const [preview, setPreview] = useState(null);
  if (!url) return null;
  const fo = { name: getFileName(url), url, isLocal: false };
  return (
    <>
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <DriveCard fileObj={fo} onPreview={f => setPreview({ ...f, label })} isExisting />
      </div>
      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </>
  );
};

// ─── Read-only multi-doc grid for Detail modal ────────────────────────────────

export const DetailMultiDocGrid = ({ label, urlStr }) => {
  const [preview, setPreview] = useState(null);
  if (!urlStr) return null;

  const items = urlStr.split(',').filter(Boolean).map(u => ({
    name: getFileName(u.trim()), url: u.trim(), isLocal: false,
  }));
  if (!items.length) return null;

  const cols = items.length <= 1 ? 'grid-cols-1'
             : items.length === 2 ? 'grid-cols-2'
             : 'grid-cols-3';

  return (
    <>
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {label} <span className="font-normal normal-case">({items.length} file)</span>
        </p>
        <div className={`grid gap-2 ${cols}`}>
          {items.map((item, i) => (
            <DriveCard
              key={i}
              fileObj={item}
              onPreview={f => setPreview({ ...f, label: `${label} #${i + 1}` })}
              isExisting
              index={items.length > 1 ? i : null}
            />
          ))}
        </div>
      </div>
      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </>
  );
};
