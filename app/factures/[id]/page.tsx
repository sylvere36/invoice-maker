"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  InvoicePreview,
  type InvoicePreviewData,
} from "@/components/invoice-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Printer,
  Download,
} from "lucide-react";
// html2canvas-pro & jspdf chargés dynamiquement dans handleExportPDF

interface InvoiceFull {
  id: string;
  invoiceNumber: string;
  date: string;
  totalTTC: number;
  taxGroup: string;
  paymentType: string;
  seller: {
    name: string;
    ifu: string;
    address: string;
    contact: string;
    email: string;
  };
  client: {
    name: string;
    ifu?: string | null;
    address: string;
    contact: string;
    email?: string | null;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export default function FactureViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) setInvoice(data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    const el = document.getElementById("invoice-preview");
    if (!el) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        windowWidth: 794,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      // Scale to fit exactly 1 page
      if (imgHeight > pdfPageHeight) {
        const ratio = pdfPageHeight / imgHeight;
        const scaledWidth = pdfWidth * ratio;
        const offsetX = (pdfWidth - scaledWidth) / 2;
        pdf.addImage(imgData, "PNG", offsetX, 0, scaledWidth, pdfPageHeight);
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
      }
      pdf.save(`facture-${invoice?.invoiceNumber || "export"}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-600">Facture introuvable</p>
        <Button variant="outline" onClick={() => router.push("/factures")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux factures
        </Button>
      </div>
    );
  }

  const previewData: InvoicePreviewData = {
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.date,
    seller: invoice.seller,
    client: invoice.client,
    items: invoice.items,
    taxGroup: invoice.taxGroup,
    paymentType: invoice.paymentType,
    totalTTC: invoice.totalTTC,
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/factures")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Facture {invoice.invoiceNumber}
            </h1>
            <p className="text-sm text-gray-500">
              {new Date(invoice.date).toLocaleDateString("fr-FR")} —{" "}
              {invoice.client.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1 h-4 w-4" />
            Imprimer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1 h-4 w-4" />
            )}
            Télécharger PDF
          </Button>
        </div>
      </div>

      <Card className="mx-auto max-w-4xl overflow-hidden">
        <CardHeader className="border-b bg-gray-50 py-3">
          <CardTitle className="text-sm text-gray-500">
            Aperçu de la facture
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <InvoicePreview data={previewData} />
        </CardContent>
      </Card>
    </div>
  );
}
