"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  Eye,
  Trash2,
  FilePlus,
  Download,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  totalTTC: number;
  paymentType: string;
  taxGroup: string;
  client: { name: string };
  seller: { name: string };
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
}

export default function FacturesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (Array.isArray(data)) setInvoices(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const deleteInvoice = async (id: string) => {
    if (!confirm("Supprimer cette facture ?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      loadInvoices();
    } catch {
      alert("Erreur");
    } finally {
      setDeleting(null);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Numéro",
      "Date",
      "Client",
      "Total TTC",
      "Paiement",
      "Groupe",
    ];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      new Date(inv.date).toLocaleDateString("fr-FR"),
      inv.client.name,
      inv.totalTTC.toString(),
      inv.paymentType,
      inv.taxGroup,
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => r.join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `factures-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.client.name.toLowerCase().includes(search.toLowerCase()) ||
      new Date(inv.date)
        .toLocaleDateString("fr-FR")
        .includes(search)
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Factures</h1>
          <p className="mt-1 text-gray-500">
            Historique de vos factures ({invoices.length})
          </p>
        </div>
        <div className="flex gap-2">
          {invoices.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="mr-1 h-4 w-4" />
              Export CSV
            </Button>
          )}
          <Link href="/factures/nouvelle">
            <Button size="sm">
              <FilePlus className="mr-1 h-4 w-4" />
              Nouvelle facture
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Rechercher par numéro, client, date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des factures</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400">
                {search
                  ? "Aucune facture trouvée"
                  : "Aucune facture. Créez votre première facture !"}
              </p>
              {!search && (
                <Link href="/factures/nouvelle">
                  <Button className="mt-4" variant="outline">
                    <FilePlus className="mr-2 h-4 w-4" />
                    Créer une facture
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Total TTC</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {new Date(inv.date).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>{inv.client.name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(inv.totalTTC)} CFA
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{inv.paymentType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{inv.taxGroup}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/factures/${inv.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteInvoice(inv.id)}
                            disabled={deleting === inv.id}
                          >
                            {deleting === inv.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
