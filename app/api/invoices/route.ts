import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { invoiceSchema } from "@/lib/validations";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { client: true, seller: true, items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = invoiceSchema.parse(body);

    // Get seller
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seller = await prisma.seller.findFirst() as any;
    if (!seller) {
      return NextResponse.json(
        { error: "Veuillez d'abord configurer votre profil vendeur" },
        { status: 400 }
      );
    }

    // Generate invoice number from seller prefix + counter
    const invoiceNumber = generateInvoiceNumber(
      seller.invoicePrefix,
      seller.invoiceNextNumber
    );

    // Increment the seller's counter
    await (prisma.seller as any).update({
      where: { id: seller.id },
      data: { invoiceNextNumber: seller.invoiceNextNumber + 1 },
    });

    // Calculate totals
    const totalTTC = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        date: new Date(data.date),
        sellerId: seller.id,
        clientId: data.clientId,
        totalTTC,
        taxGroup: data.taxGroup,
        taxableAmount: totalTTC,
        taxAmount: 0,
        paymentType: data.paymentType,
        paymentReceived: totalTTC,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { client: true, seller: true, items: true },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Invoice creation error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
