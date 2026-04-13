import { useState } from "react";
import api from "../lib/api";
import { labels } from "../lib/i18n-he";

type ImportResult = {
  message: string;
  imported_count: number;
  errors?: string[] | null;
};

type Props = {
  endpoint: string;
  title: string;
  description: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ImportModal({ endpoint, title, description, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<ImportResult>(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
      if (response.data.imported_count > 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "שגיאה בייבוא הקובץ");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={isUploading}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-slate-600">
              {description}
            </p>
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-sm text-emerald-600 hover:text-emerald-700"
              >
                {file ? file.name : labels.import.selectFile}
              </label>
            </div>
          </div>

          {result && (
            <div
              className={`rounded-lg p-3 ${
                result.errors && result.errors.length > 0
                  ? "bg-yellow-50 text-yellow-800"
                  : "bg-green-50 text-green-800"
              }`}
            >
              <p className="font-medium">{result.message}</p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                  <p className="font-medium">שגיאות:</p>
                  <ul className="list-inside list-disc">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {labels.import.cancel}
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isUploading ? labels.import.uploading : labels.import.upload}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
