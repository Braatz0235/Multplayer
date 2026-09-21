"use client";

import { useRef, useState } from "react";

export default function ImageUploader({
  label,
  value,
  onChange,
  aspect = "square",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: "square" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha no upload.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Erro de conexão ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gold">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <div
          className={`overflow-hidden border border-gold/25 bg-ink-soft ${
            aspect === "square"
              ? "h-20 w-20 rounded-full"
              : "h-20 w-36 rounded-xl"
          }`}
        >
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10 disabled:opacity-50"
          >
            {uploading ? "Enviando..." : "Trocar imagem"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
