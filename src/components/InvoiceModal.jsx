"use client";

import { useRef, useState } from "react";
import { X, Copy, Download, FileDown, Share2, Check, AlertCircle } from "lucide-react";
import ShipmentInvoice, { buildInvoiceData } from "./ShipmentInvoice";

// Renders the invoice ref node to a canvas at a higher scale for crisp images/PDFs.
async function renderToCanvas(node) {
  const html2canvas = (await import("html2canvas-pro")).default;
  return html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
}

export default function InvoiceModal({ shipment, products, onClose }) {
  const invoiceRef = useRef(null);
  const [busy, setBusy] = useState(null); // "copy" | "png" | "pdf" | "share" | null
  const [feedback, setFeedback] = useState(null); // { type: "success" | "error", message }

  const invoiceData = buildInvoiceData(shipment, products);
  const fileBase = `invoice-${invoiceData.code || "shipment"}`;

  const flash = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleCopy = async () => {
    if (!invoiceRef.current) return;
    setBusy("copy");
    try {
      const canvas = await renderToCanvas(invoiceRef.current);
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error("Could not generate image");

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
        flash("success", "Invoice copied to clipboard as an image — paste it anywhere.");
      } else {
        throw new Error("Clipboard image copy isn't supported in this browser");
      }
    } catch (err) {
      console.error("Copy invoice failed:", err);
      flash("error", err.message || "Failed to copy invoice image.");
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadPng = async () => {
    if (!invoiceRef.current) return;
    setBusy("png");
    try {
      const canvas = await renderToCanvas(invoiceRef.current);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBase}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      flash("success", "Invoice image downloaded.");
    } catch (err) {
      console.error("Download PNG failed:", err);
      flash("error", "Failed to download invoice image.");
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setBusy("pdf");
    try {
      const canvas = await renderToCanvas(invoiceRef.current);
      const { jsPDF } = await import("jspdf");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If the invoice is taller than one page, scale it down to fit a single page
      const finalHeight = Math.min(imgHeight, pageHeight);
      const finalWidth = finalHeight === imgHeight ? imgWidth : (canvas.width * finalHeight) / canvas.height;

      pdf.addImage(imgData, "PNG", (pageWidth - finalWidth) / 2, 0, finalWidth, finalHeight);
      pdf.save(`${fileBase}.pdf`);
      flash("success", "Invoice PDF downloaded.");
    } catch (err) {
      console.error("Download PDF failed:", err);
      flash("error", "Failed to generate invoice PDF.");
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    if (!invoiceRef.current) return;
    setBusy("share");
    try {
      const canvas = await renderToCanvas(invoiceRef.current);
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error("Could not generate image");

      const file = new File([blob], `${fileBase}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoiceData.code}`,
          text: `Invoice for shipment ${invoiceData.code}`,
        });
        flash("success", "Share sheet opened.");
      } else {
        throw new Error("Sharing isn't supported on this device/browser — use Copy or Download instead.");
      }
    } catch (err) {
      // AbortError happens when the user just closes the share sheet — not a real error
      if (err.name !== "AbortError") {
        console.error("Share invoice failed:", err);
        flash("error", err.message || "Failed to share invoice.");
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Shipment Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div
            className={`flex items-center gap-2 px-6 py-2 text-sm font-medium ${
              feedback.type === "success"
                ? "bg-green-50 text-green-700 border-b border-green-200"
                : "bg-red-50 text-red-700 border-b border-red-200"
            }`}
          >
            {feedback.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {feedback.message}
          </div>
        )}

        {/* Scrollable invoice preview */}
        <div className="overflow-y-auto flex-1 bg-gray-100 p-4">
          <ShipmentInvoice ref={invoiceRef} data={invoiceData} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleCopy}
            disabled={busy !== null}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            {busy === "copy" ? "Copying…" : "Copy Image"}
          </button>
          <button
            onClick={handleDownloadPng}
            disabled={busy !== null}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-gray-900 transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {busy === "png" ? "Preparing…" : "Download PNG"}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={busy !== null}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-gray-900 transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            {busy === "pdf" ? "Preparing…" : "Download PDF"}
          </button>
          <button
            onClick={handleShare}
            disabled={busy !== null}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white px-4 py-2.5 rounded-lg hover:shadow-lg transition font-medium disabled:opacity-60 disabled:cursor-not-allowed ml-auto"
          >
            <Share2 className="w-4 h-4" />
            {busy === "share" ? "Opening…" : "Share / Send to Client"}
          </button>
        </div>
      </div>
    </div>
  );
}
