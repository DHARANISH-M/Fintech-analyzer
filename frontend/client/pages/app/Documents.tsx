import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Loader2, ShieldCheck, Trash2, UploadCloud } from "lucide-react";

import { DocumentRecord } from "@shared/api";
import { buildUserId, deleteDocument, fetchDocuments, downloadDocumentSpreadsheet } from "@/lib/finance-api";
import Loader from "@/components/Loader";

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }

  return btoa(binary);
}

const statusTone: Record<DocumentRecord["extractionStatus"], string> = {
  uploaded: "timeline-pill-read",
  processing: "timeline-pill-thinking",
  completed: "timeline-pill-done",
  failed: "text-destructive bg-destructive/10 border-destructive/20 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border",
};

export default function Documents() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processedCount = useMemo(
    () => documents.filter((document) => document.extractionStatus === "completed").length,
    [documents],
  );

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetchDocuments();
      setDocuments(response.documents);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load uploaded documents.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const handleUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF bank statement file.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const payload = {
        fileName: file.name,
        fileType: file.type || "application/pdf",
        userId: buildUserId(),
        fileSize: file.size,
        fileContentBase64: await fileToBase64(file),
      };

      const response = await fetch(`/api/users/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "The PDF upload or extraction request failed.");
      }

      await loadDocuments();
      window.dispatchEvent(new Event("document-change"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The PDF upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (document: DocumentRecord) => {
    const confirmed = window.confirm(`Delete "${document.fileName}" and its extracted transactions?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(document.id);
    setError("");

    try {
      await deleteDocument(document.id);
      setDocuments((current) => current.filter((entry) => entry.id !== document.id));
      window.dispatchEvent(new Event("document-change"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete the uploaded document.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-8 relative">
      {isUploading && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader size="lg" />
          <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mt-4 animate-pulse">
            Uploading and parsing PDF statement...
          </p>
        </div>
      )}
      {/* <section className="cursor-card p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">FILE REPOSITORY</p>
            <h1 className="mt-2 text-3xl font-heading font-normal tracking-tight text-foreground">Documents</h1>
            <p className="mt-2 text-sm leading-relaxed text-card-foreground font-light">
              Upload statement PDFs to extract transaction details locally into memory.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 border border-sub-border bg-sub-card px-4 py-2 text-xs font-semibold text-foreground rounded-md shadow-sm">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {processedCount} ANALYZED
          </div>
        </div>
      </section> */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(event) => {
          void handleUpload(event.target.files);
        }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-sub-border bg-sub-card/30 px-6 py-12 text-center transition-colors hover:border-primary hover:bg-sub-card/60 rounded-lg shadow-sm"
      >
        <div className="grid h-12 w-12 place-items-center bg-card border border-border text-primary rounded-md shadow-sm">
          {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground tracking-normal">
            {isUploading ? "Uploading and extracting..." : "Upload statement PDF"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-light">Files are processed in-browser. Select bank-statement PDF to start.</p>
        </div>
      </button>

      {error && (
        <div className="border border-destructive/25 bg-destructive/5 px-6 py-4 text-xs font-bold text-destructive uppercase tracking-wide rounded-md">
          {error}
        </div>
      )}

      <div className="cursor-card overflow-hidden">
        <div className="border-b border-border bg-sub-card px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Uploaded Documents
        </div>
        <div className="space-y-3 p-6 bg-card">
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader size="md" />
              <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mt-4">Loading documents...</p>
            </div>
          )}
          {!isLoading && documents.length === 0 && (
            <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">No PDFs uploaded yet.</p>
          )}
          {documents.map((document) => (
            <div
              key={document.id}
              className="border border-sub-border bg-sub-card/50 p-4 rounded-md shadow-sm hover:border-sub-border hover:bg-sub-card/70 transition-all duration-150"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="truncate font-semibold text-foreground text-sm">{document.fileName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-light">
                    Uploaded {new Date(document.uploadedAt).toLocaleString()} • {formatSize(document.fileSize)}
                  </p>
                  <p className="text-xs text-muted-foreground font-light">
                    Transactions extracted: {document.transactionCount}
                    {document.statementStartDate && document.statementEndDate
                      ? ` • Window ${document.statementStartDate} to ${document.statementEndDate}`
                      : ""}
                  </p>
                  {document.extractionError && (
                    <p className="text-xs text-destructive font-semibold">{document.extractionError}</p>
                  )}
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold">
                    <a
                      href={document.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Open PDF →
                    </a>
                    {document.extractionStatus === "completed" && document.transactionCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void downloadDocumentSpreadsheet(document.id, document.fileName)}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download spreadsheet →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        void handleDelete(document);
                      }}
                      disabled={deletingId === document.id}
                      className="inline-flex items-center gap-1.5 text-destructive hover:text-destructive/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === document.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete file
                    </button>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className={`capitalize ${statusTone[document.extractionStatus] || statusTone.uploaded}`}>
                    {document.extractionStatus}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
