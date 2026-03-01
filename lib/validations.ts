import { z } from "zod";

export const sellerSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  ifu: z.string().min(1, "L'IFU est requis"),
  address: z.string().min(1, "L'adresse est requise"),
  contact: z.string().min(1, "Le contact est requis"),
  email: z.string().email("Email invalide"),
  invoicePrefix: z.string().min(1, "Le préfixe est requis"),
  invoiceNextNumber: z.number().int().min(1, "Le numéro doit être >= 1"),
});

export type SellerFormData = z.infer<typeof sellerSchema>;

export const clientSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  ifu: z.string().optional().or(z.literal("")),
  address: z.string().min(1, "L'adresse est requise"),
  contact: z.string().min(1, "Le contact est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  quantity: z.number().min(0.01, "Quantité > 0"),
  unitPrice: z.number().min(0, "Prix >= 0"),
  total: z.number(),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Sélectionnez un client"),
  date: z.string().min(1, "La date est requise"),
  taxGroup: z.string().min(1),
  paymentType: z.string().min(1),
  items: z.array(invoiceItemSchema).min(1, "Ajoutez au moins un article"),
  notes: z.string().optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
