"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sellerSchema, type SellerFormData } from "@/lib/validations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, CheckCircle2 } from "lucide-react";

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SellerFormData>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      invoicePrefix: "EM",
      invoiceNextNumber: 1,
    },
  });

  useEffect(() => {
    fetch("/api/seller")
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          reset(data);
        }
      })
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: SellerFormData) => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mon Profil Vendeur</h1>
        <p className="mt-1 text-gray-500">
          Ces informations apparaîtront sur toutes vos factures
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informations du vendeur</CardTitle>
          <CardDescription>
            Renseignez votre raison sociale, IFU et coordonnées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom / Raison sociale *</Label>
              <Input
                id="name"
                placeholder="Ex: OLOUWASHEGUN SYLVERE AKAMBI"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifu">IFU (Identifiant Fiscal Unique) *</Label>
              <Input
                id="ifu"
                placeholder="Ex: 0202289335483"
                {...register("ifu")}
              />
              {errors.ifu && (
                <p className="text-sm text-red-500">{errors.ifu.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète *</Label>
              <Input
                id="address"
                placeholder="Ex: AKPAKPA Avotrou"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact">Téléphone *</Label>
                <Input
                  id="contact"
                  placeholder="Ex: 01 67 46 82 59"
                  {...register("contact")}
                />
                {errors.contact && (
                  <p className="text-sm text-red-500">
                    {errors.contact.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ex: akambi.sylv@gmail.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Invoice Numbering Section */}
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Numérotation des factures
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Préfixe *</Label>
                  <Input
                    id="invoicePrefix"
                    placeholder="Ex: EM, FAC, INV"
                    {...register("invoicePrefix")}
                  />
                  {errors.invoicePrefix && (
                    <p className="text-sm text-red-500">
                      {errors.invoicePrefix.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNextNumber">
                    Prochain numéro *
                  </Label>
                  <Input
                    id="invoiceNextNumber"
                    type="number"
                    min={1}
                    placeholder="Ex: 1"
                    {...register("invoiceNextNumber", { valueAsNumber: true })}
                  />
                  {errors.invoiceNextNumber && (
                    <p className="text-sm text-red-500">
                      {errors.invoiceNextNumber.message}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Aperçu : {watch("invoicePrefix") || "EM"}
                {(watch("invoiceNextNumber") || 1)
                  .toString()
                  .padStart(10, "0")}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Profil sauvegardé avec succès
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
