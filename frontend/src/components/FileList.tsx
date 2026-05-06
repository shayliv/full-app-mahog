import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface Attachment {
  id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

interface FileListProps {
  entityType: string;
  entityId: number;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('text')) return '📃';
  return '📎';
};

export const FileList: React.FC<FileListProps> = ({ entityType, entityId, className = '' }) => {
  const queryClient = useQueryClient();

  const { data: attachments, isLoading } = useQuery<Attachment[]>({
    queryKey: ['attachments', entityType, entityId],
    queryFn: async () => {
      const response = await api.get(`/attachments/${entityType}/${entityId}`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      await api.delete(`/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to delete file';
      alert(message);
    },
  });

  const handleDownload = async (attachmentId: number, fileName: string) => {
    try {
      const response = await api.get(`/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to download file';
      alert(message);
    }
  };

  const handleDelete = (attachmentId: number, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteMutation.mutate(attachmentId);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading attachments...</div>;
  }

  if (!attachments || attachments.length === 0) {
    return <div className="text-sm text-slate-500">No attachments</div>;
  }

  return (
    <div className={`file-list space-y-2 ${className}`}>
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="text-2xl">{getFileIcon(attachment.mime_type)}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">
                {attachment.file_name}
              </div>
              <div className="text-xs text-slate-500">
                {formatFileSize(attachment.file_size)} • {formatDate(attachment.uploaded_at)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => handleDownload(attachment.id, attachment.file_name)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Download"
            >
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(attachment.id, attachment.file_name)}
              disabled={deleteMutation.isPending}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              title="Delete"
            >
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileList;
