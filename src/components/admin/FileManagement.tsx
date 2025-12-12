'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  Folder,
  File,
  Image,
  FileText,
  Trash2,
  Download,
  Copy,
  Check,
  X,
  RefreshCw,
  Search,
  Grid,
  List,
  HardDrive,
  FolderPlus,
  ChevronRight,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  path: string;
  url: string;
  bucket: string;
  created_at?: string;
  updated_at?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
    cacheControl?: string;
  };
}

interface BucketStats {
  bucket: string;
  name: string;
  totalSize: number;
  fileCount: number;
}

const BUCKET_INFO = {
  products: { label: 'Product Images', icon: Image, color: 'text-purple-400' },
  marketing: { label: 'Marketing Assets', icon: Folder, color: 'text-blue-400' },
  documents: { label: 'Documents', icon: FileText, color: 'text-green-400' },
  blog: { label: 'Blog Images', icon: Image, color: 'text-orange-400' },
};

export default function FileManagement() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentBucket, setCurrentBucket] = useState('products');
  const [currentFolder, setCurrentFolder] = useState('');
  const [buckets] = useState(Object.keys(BUCKET_INFO));
  const [stats, setStats] = useState<BucketStats[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/files?bucket=${currentBucket}&folder=${currentFolder}`
      );
      const data = await response.json();

      if (response.ok) {
        setFiles(data.files || []);
        setStats(data.stats || []);
      } else {
        console.error('Failed to fetch files:', data.error);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  }, [currentBucket, currentFolder]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (filesToUpload: FileList | File[]) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(filesToUpload).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', currentBucket);
      formData.append('folder', currentFolder);

      try {
        const response = await fetch('/api/admin/files', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }
        return { success: true, file: data.file };
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        return { success: false, error, fileName: file.name };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    if (failCount > 0) {
      alert(`${successCount} files uploaded, ${failCount} failed`);
    }

    setUploading(false);
    fetchFiles();
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(
        `/api/admin/files?bucket=${file.bucket}&path=${encodeURIComponent(file.path)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchFiles();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Delete ${selectedFiles.size} selected files? This cannot be undone.`)) return;

    const deletePromises = Array.from(selectedFiles).map(async (path) => {
      const file = files.find((f) => f.path === path);
      if (!file) return;

      return fetch(
        `/api/admin/files?bucket=${file.bucket}&path=${encodeURIComponent(file.path)}`,
        { method: 'DELETE' }
      );
    });

    await Promise.all(deletePromises);
    setSelectedFiles(new Set());
    fetchFiles();
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      alert('Failed to copy URL');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    // Create a placeholder file to establish the folder
    const placeholderBlob = new Blob([''], { type: 'text/plain' });
    const placeholderFile = new File([placeholderBlob], '.placeholder', { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', placeholderFile);
    formData.append('bucket', currentBucket);
    formData.append('folder', currentFolder ? `${currentFolder}/${newFolderName}` : newFolderName);

    try {
      await fetch('/api/admin/files', {
        method: 'POST',
        body: formData,
      });

      setNewFolderName('');
      setShowNewFolder(false);
      fetchFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: FileItem) => {
    const mimeType = file.metadata?.mimetype || '';
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('pdf')) return FileText;
    if (file.name.endsWith('/') || !file.id) return Folder;
    return File;
  };

  const isImage = (file: FileItem) => {
    const mimeType = file.metadata?.mimetype || '';
    return mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
  };

  const filteredFiles = files.filter((file) => {
    if (!searchQuery) return true;
    return file.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Separate folders and files
  const folders = filteredFiles.filter((f) => !f.id || f.name.endsWith('/'));
  const regularFiles = filteredFiles.filter((f) => f.id && !f.name.endsWith('/'));

  const currentBucketInfo = BUCKET_INFO[currentBucket as keyof typeof BUCKET_INFO];
  const CurrentBucketIcon = currentBucketInfo?.icon || Folder;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">File Management</h2>
          <p className="text-gray-400 text-sm mt-1">
            Upload and manage files for your store
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFiles}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title={viewMode === 'grid' ? 'List view' : 'Grid view'}
          >
            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const info = BUCKET_INFO[stat.bucket as keyof typeof BUCKET_INFO];
          const Icon = info?.icon || Folder;
          return (
            <div
              key={stat.bucket}
              onClick={() => setCurrentBucket(stat.bucket)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                currentBucket === stat.bucket
                  ? 'bg-purple-600/20 border border-purple-500'
                  : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-8 h-8 ${info?.color || 'text-gray-400'}`} />
                <div>
                  <p className="text-white font-medium text-sm">{info?.label || stat.bucket}</p>
                  <p className="text-gray-400 text-xs">
                    {stat.fileCount} files • {formatFileSize(stat.totalSize)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-800/50 rounded-lg p-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setCurrentFolder('')}
            className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
          >
            <CurrentBucketIcon className="w-4 h-4" />
            {currentBucketInfo?.label || currentBucket}
          </button>
          {currentFolder && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              {currentFolder.split('/').map((part, i, arr) => (
                <button
                  key={i}
                  onClick={() => setCurrentFolder(arr.slice(0, i + 1).join('/'))}
                  className="text-gray-400 hover:text-white"
                >
                  {part}
                  {i < arr.length - 1 && <ChevronRight className="w-4 h-4 inline text-gray-500" />}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowNewFolder(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="New folder"
          >
            <FolderPlus className="w-5 h-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload'}</span>
          </button>

          {selectedFiles.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete ({selectedFiles.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          dragActive
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        {dragActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg z-10">
            <div className="text-center">
              <Upload className="w-12 h-12 text-purple-400 mx-auto mb-2" />
              <p className="text-white font-medium">Drop files here to upload</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-20">
            <HardDrive className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No files in this location</p>
            <p className="text-gray-500 text-sm">
              Drag and drop files here or click Upload
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
            {/* Folders first */}
            {folders.map((folder) => (
              <div
                key={folder.path}
                onClick={() => setCurrentFolder(folder.path)}
                className="group relative bg-gray-800/50 rounded-lg p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
              >
                <Folder className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                <p className="text-white text-sm text-center truncate">{folder.name}</p>
              </div>
            ))}

            {/* Files */}
            {regularFiles.map((file) => {
              const FileIcon = getFileIcon(file);
              const isSelected = selectedFiles.has(file.path);

              return (
                <div
                  key={file.path}
                  className={`group relative bg-gray-800/50 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-purple-500' : 'hover:bg-gray-700/50'
                  }`}
                >
                  {/* Selection checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const newSelected = new Set(selectedFiles);
                      if (isSelected) {
                        newSelected.delete(file.path);
                      } else {
                        newSelected.add(file.path);
                      }
                      setSelectedFiles(newSelected);
                    }}
                    className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center z-10 transition-colors ${
                      isSelected
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-gray-500 bg-gray-800/80 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Preview */}
                  <div
                    onClick={() => setPreviewFile(file)}
                    className="aspect-square flex items-center justify-center bg-gray-900/50"
                  >
                    {isImage(file) ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <FileIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-white text-xs truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatFileSize(file.metadata?.size)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(file.url);
                      }}
                      className="p-1.5 bg-gray-800/80 rounded hover:bg-gray-700 transition-colors"
                      title="Copy URL"
                    >
                      {copiedUrl === file.url ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file);
                      }}
                      className="p-1.5 bg-gray-800/80 rounded hover:bg-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {/* List view */}
            {[...folders, ...regularFiles].map((file) => {
              const FileIcon = getFileIcon(file);
              const isFolder = !file.id || file.name.endsWith('/');
              const isSelected = selectedFiles.has(file.path);

              return (
                <div
                  key={file.path}
                  onClick={() => (isFolder ? setCurrentFolder(file.path) : setPreviewFile(file))}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-purple-600/20' : 'hover:bg-gray-800/50'
                  }`}
                >
                  {/* Selection */}
                  {!isFolder && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSelected = new Set(selectedFiles);
                        if (isSelected) {
                          newSelected.delete(file.path);
                        } else {
                          newSelected.add(file.path);
                        }
                        setSelectedFiles(newSelected);
                      }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  )}
                  {isFolder && <div className="w-5" />}

                  {/* Icon/Thumbnail */}
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    {isImage(file) && !isFolder ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <FileIcon
                        className={`w-6 h-6 ${isFolder ? 'text-yellow-400' : 'text-gray-400'}`}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{file.name}</p>
                    {!isFolder && (
                      <p className="text-gray-500 text-sm">
                        {formatFileSize(file.metadata?.size)} •{' '}
                        {file.created_at
                          ? new Date(file.created_at).toLocaleDateString()
                          : 'Unknown date'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {!isFolder && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(file.url);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Copy URL"
                      >
                        {copiedUrl === file.url ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <a
                        href={file.url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-white font-medium truncate pr-4">{previewFile.name}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            <div className="p-4 flex items-center justify-center min-h-[300px] max-h-[60vh] overflow-auto bg-gray-900/50">
              {isImage(previewFile) ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <File className="w-20 h-20 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Preview not available</p>
                </div>
              )}
            </div>

            {/* Info & Actions */}
            <div className="p-4 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Size</p>
                  <p className="text-white">{formatFileSize(previewFile.metadata?.size)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="text-white">{previewFile.metadata?.mimetype || 'Unknown'}</p>
                </div>
              </div>

              {/* URL */}
              <div className="mb-4">
                <p className="text-gray-500 text-sm mb-1">Public URL</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={previewFile.url}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(previewFile.url)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {copiedUrl === previewFile.url ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Open in New Tab
                </a>
                <a
                  href={previewFile.url}
                  download
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => {
                    handleDelete(previewFile);
                    setPreviewFile(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-300 font-medium">About File Storage</p>
          <p className="text-blue-400/80 mt-1">
            Files are stored securely in Supabase Storage. You can organize files into different
            buckets (Products, Marketing, Documents, Blog) and create folders within each bucket.
            Copy the public URL to use images in products, blog posts, or marketing materials.
          </p>
        </div>
      </div>
    </div>
  );
}

