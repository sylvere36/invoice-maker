import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sellerSchema } from "@/lib/validations";

export async function GET() {
  try {
    const seller = await prisma.seller.findFirst();
    return NextResponse.json(seller);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = sellerSchema.parse(body);

    const existing = await prisma.seller.findFirst();

    let seller;
    if (existing) {
      seller = await prisma.seller.update({
        where: { id: existing.id },
        data,
      });
    } else {
      seller = await prisma.seller.create({ data });
    }

    return NextResponse.json(seller);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
