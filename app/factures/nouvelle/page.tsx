"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations";
import { generateInvoiceNumber } from "@/lib/utils";
import {
  InvoicePreview,
  type InvoicePreviewData,
} from "@/components/invoice-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Loader2,
  Save,
  Printer,
  Download,
  Eye,
} from "lucide-react";
// html2canvas-pro & jspdf chargés dynamiquement dans handleExportPDF

interface Client {
  id: string;
  name: string;
  ifu?: string | null;
  address: string;
  contact: string;
  email?: string | null;
}

interface Seller {
  id: string;
  name: string;
  ifu: string;
  address: string;
  contact: string;
  email: string;
}

export default function NouvelleFacturePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nextNumber, setNextNumber] = useState("EM0000000001");
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Quick add client
  const [quickClientOpen, setQuickClientOpen] = useState(false);
  const [quickClientName, setQuickClientName] = useState("");
  const [quickClientAddress, setQuickClientAddress] = useState("");
  const [quickClientContact, setQuickClientContact] = useState("");
  const [quickClientEmail, setQuickClientEmail] = useState("");
  const [quickClientIfu, setQuickClientIfu] = useState("");
  const [addingClient, setAddingClient] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: "",
      date: new Date().toISOString().split("T")[0],
      taxGroup: "A - EXONERE",
      paymentType: "AUTRE",
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedClientId = watch("clientId");
  const watchedDate = watch("date");
  const watchedTaxGroup = watch("taxGroup");
  const watchedPaymentType = watch("paymentType");

  // Auto-calculate totals
  useEffect(() => {
    watchedItems.forEach((item, idx) => {
      const total = (item.quantity || 0) * (item.unitPrice || 0);
      if (item.total !== total) {
        setValue(`items.${idx}.total`, total);
      }
    });
  }, [watchedItems, setValue]);

  const totalTTC = watchedItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );

  const loadData = useCallback(async () => {
    try {
      const [sellerRes, clientsRes] = await Promise.all([
        fetch("/api/seller"),
        fetch("/api/clients"),
      ]);
      const sellerData = await sellerRes.json();
      const clientsData = await clientsRes.json();

      if (sellerData?.id) setSeller(sellerData);
      if (Array.isArray(clientsData)) setClients(clientsData);

      // Generate next invoice number from seller prefix + counter
      if (sellerData?.id) {
        const prefix = sellerData.invoicePrefix || "EM";
        const nextNum = sellerData.invoiceNextNumber || 1;
        setNextNumber(generateInvoiceNumber(prefix, nextNum));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedClient = clients.find((c) => c.id === watchedClientId);

  const previewData: InvoicePreviewData = {
    invoiceNumber: nextNumber,
    date: watchedDate,
    seller: seller || {
      name: "",
      ifu: "",
      address: "",
      contact: "",
      email: "",
    },
    client: selectedClient || {
      name: "",
      address: "",
      contact: "",
    },
    items: watchedItems.map((item) => ({
      description: item.description,
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      total: (item.quantity || 0) * (item.unitPrice || 0),
    })),
    taxGroup: watchedTaxGroup,
    paymentType: watchedPaymentType,
    totalTTC,
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!seller) {
      alert("Veuillez d'abord configurer votre profil vendeur");
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSaved(true);
        // Reset form for next invoice
        loadData();
        setValue("clientId", "");
        setValue("items", [
          { description: "", quantity: 1, unitPrice: 0, total: 0 },
        ]);
        setValue("notes", "");
        setTimeout(() => setSaved(false), 5000);
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la création");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const quickAddClient = async () => {
    if (!quickClientName || !quickClientAddress || !quickClientContact) return;
    setAddingClient(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickClientName,
          address: quickClientAddress,
          contact: quickClientContact,
          email: quickClientEmail || undefined,
          ifu: quickClientIfu || undefined,
        }),
      });
      if (res.ok) {
        const newClient = await res.json();
        setClients((prev) => [newClient, ...prev]);
        setValue("clientId", newClient.id);
        setQuickClientOpen(false);
        setQuickClientName("");
        setQuickClientAddress("");
        setQuickClientContact("");
        setQuickClientEmail("");
        setQuickClientIfu("");
      }
    } catch {
      alert("Erreur");
    } finally {
      setAddingClient(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
      pdf.save(`facture-${nextNumber}.pdf`);
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

  if (!seller) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg text-gray-600">
          Veuillez d&apos;abord configurer votre profil vendeur
        </p>
        <a href="/profil">
          <Button>Aller au profil</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
            Nouvelle Facture
          </h1>
          <p className="text-sm text-gray-500">
            Facture N° {nextNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowPreviewMobile(!showPreviewMobile)}
          >
            <Eye className="mr-1 h-4 w-4" />
            {showPreviewMobile ? "Formulaire" : "Aperçu"}
          </Button>
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
            PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Form */}
        <div
          className={`w-full lg:w-1/2 xl:w-2/5 ${
            showPreviewMobile ? "hidden lg:block" : ""
          }`}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Client Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={watchedClientId}
                      onValueChange={(val) => setValue("clientId", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.clientId && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.clientId.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuickClientOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Date & Payment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Détails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Date de facture</Label>
                    <Input type="date" {...register("date")} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type de paiement</Label>
                    <Select
                      value={watchedPaymentType}
                      onValueChange={(val) => setValue("paymentType", val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTRE">AUTRE</SelectItem>
                        <SelectItem value="ESPECES">ESPECES</SelectItem>
                        <SelectItem value="CARTE">CARTE</SelectItem>
                        <SelectItem value="VIREMENT">VIREMENT</SelectItem>
                        <SelectItem value="CHEQUE">CHÈQUE</SelectItem>
                        <SelectItem value="MOBILE_MONEY">
                          MOBILE MONEY
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Groupe d&apos;impôt</Label>
                  <Select
                    value={watchedTaxGroup}
                    onValueChange={(val) => setValue("taxGroup", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A - EXONERE">A - EXONÉRÉ</SelectItem>
                      <SelectItem value="B - TAXABLE 18%">
                        B - TAXABLE 18%
                      </SelectItem>
                      <SelectItem value="C - EXPORTATION">
                        C - EXPORTATION
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Articles</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        description: "",
                        quantity: 1,
                        unitPrice: 0,
                        total: 0,
                      })
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-lg border bg-gray-50 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        Article {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Description du produit/service"
                        {...register(`items.${index}.description`)}
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-xs text-red-500">
                          {errors.items[index].description?.message}
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Qté</Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            {...register(`items.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Prix unit. TTC</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            {...register(`items.${index}.unitPrice`, {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Total</Label>
                          <div className="flex h-9 items-center rounded-md border bg-gray-100 px-3 text-sm font-medium">
                            {(
                              (watchedItems[index]?.quantity || 0) *
                              (watchedItems[index]?.unitPrice || 0)
                            ).toLocaleString("fr-FR")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grand Total */}
                <div className="flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3 text-white">
                  <span className="font-semibold">TOTAL TTC</span>
                  <span className="text-lg font-bold">
                    {totalTTC.toLocaleString("fr-FR")} CFA
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="pt-4">
                <Label className="text-xs">Notes (optionnel)</Label>
                <Input
                  placeholder="Notes additionnelles..."
                  {...register("notes")}
                  className="mt-1"
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Enregistrement..." : "Enregistrer la facture"}
            </Button>

            {saved && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700">
                ✓ Facture enregistrée avec succès !
              </div>
            )}
          </form>
        </div>

        {/* Preview */}
        <div
          ref={previewRef}
          className={`w-full lg:w-1/2 xl:w-3/5 ${
            !showPreviewMobile ? "hidden lg:block" : ""
          }`}
        >
          <div className="sticky top-4">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-gray-50 py-3">
                <CardTitle className="text-sm text-gray-600">
                  Aperçu en direct
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto" style={{ maxHeight: "85vh" }}>
                  <InvoicePreview data={previewData} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Quick Add Client Dialog */}
      <Dialog open={quickClientOpen} onOpenChange={setQuickClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un client rapidement</DialogTitle>
            <DialogDescription>
              Remplissez les informations du nouveau client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nom *</Label>
              <Input
                value={quickClientName}
                onChange={(e) => setQuickClientName(e.target.value)}
                placeholder="Nom du client"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">IFU</Label>
              <Input
                value={quickClientIfu}
                onChange={(e) => setQuickClientIfu(e.target.value)}
                placeholder="IFU (optionnel)"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Adresse *</Label>
              <Input
                value={quickClientAddress}
                onChange={(e) => setQuickClientAddress(e.target.value)}
                placeholder="Adresse"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Téléphone *</Label>
                <Input
                  value={quickClientContact}
                  onChange={(e) => setQuickClientContact(e.target.value)}
                  placeholder="Téléphone"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  value={quickClientEmail}
                  onChange={(e) => setQuickClientEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setQuickClientOpen(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={quickAddClient}
                disabled={
                  addingClient ||
                  !quickClientName ||
                  !quickClientAddress ||
                  !quickClientContact
                }
              >
                {addingClient && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
