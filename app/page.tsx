"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus, Users, FileText, User, ArrowRight } from "lucide-react";

interface Stats {
  clients: number;
  invoices: number;
  totalRevenue: number;
  hasSeller: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    clients: 0,
    invoices: 0,
    totalRevenue: 0,
    hasSeller: false,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [sellerRes, clientsRes, invoicesRes] = await Promise.all([
          fetch("/api/seller"),
          fetch("/api/clients"),
          fetch("/api/invoices"),
        ]);
        const seller = await sellerRes.json();
        const clients = await clientsRes.json();
        const invoices = await invoicesRes.json();

        setStats({
          hasSeller: !!seller?.id,
          clients: Array.isArray(clients) ? clients.length : 0,
          invoices: Array.isArray(invoices) ? invoices.length : 0,
          totalRevenue: Array.isArray(invoices)
            ? invoices.reduce(
                (sum: number, inv: { totalTTC: number }) => sum + inv.totalTTC,
                0
              )
            : 0,
        });
      } catch {
        // silent
      }
    }
    loadStats();
  }, []);

  const formatCurrency = (n: number) =>
    n.toLocaleString("fr-FR") + " CFA";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-gray-500">
          Bienvenue sur votre espace de gestion de factures
        </p>
      </div>

      {!stats.hasSeller && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">
                Profil vendeur non configuré
              </p>
              <p className="text-sm text-amber-600">
                Configurez vos informations pour commencer à créer des factures.
              </p>
            </div>
            <Link href="/profil" className="ml-auto">
              <Button size="sm" variant="outline">
                Configurer <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Clients
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Factures
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoices}</div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Chiffre d&apos;affaires total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Actions rapides
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/factures/nouvelle">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-green-100 p-3">
                <FilePlus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Nouvelle Facture</p>
                <p className="text-sm text-gray-500">
                  Créer une facture de vente
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/clients">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">Gérer les Clients</p>
                <p className="text-sm text-gray-500">
                  Ajouter ou modifier des clients
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/factures">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-purple-100 p-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">Historique</p>
                <p className="text-sm text-gray-500">
                  Consulter les factures
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
