"use client";

import { QRCodeCanvas } from "qrcode.react";
import { formatNumber, numberToWordsFR } from "@/lib/utils";

export interface InvoicePreviewData {
  invoiceNumber: string;
  date: string;
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
  taxGroup: string;
  paymentType: string;
  totalTTC: number;
  notes?: string;
}

function generateMCEcFCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/* ───── Inline style objects for html2canvas compatibility ───── */

const S = {
  root: {
    width: "794px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    color: "#000000",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "13px",
    lineHeight: "1.4",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,

  flagBar: { display: "flex", width: "100%", height: "16px" } as React.CSSProperties,
  flagGreen: { flex: 1, backgroundColor: "#16a34a" } as React.CSSProperties,
  flagYellow: { flex: 1, backgroundColor: "#facc15" } as React.CSSProperties,
  flagRed: { flex: 1, backgroundColor: "#ef4444" } as React.CSSProperties,

  body: { padding: "24px 36px 20px" } as React.CSSProperties,

  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } as React.CSSProperties,
  sellerName: { fontSize: "17px", fontWeight: 700, textTransform: "uppercase" as const, lineHeight: "1.25", maxWidth: "55%" } as React.CSSProperties,
  sellerIfu: { fontSize: "13px", marginTop: "4px", color: "#333" } as React.CSSProperties,

  titleBlock: { textAlign: "right" as const } as React.CSSProperties,
  titleH1: { fontSize: "26px", fontWeight: 800, lineHeight: "1.1", margin: 0 } as React.CSSProperties,
  titleMeta: { fontSize: "12px", color: "#333", marginTop: "2px" } as React.CSSProperties,

  infoRow: { display: "flex", gap: "16px", marginTop: "16px" } as React.CSSProperties,
  infoBox: { flex: 1, border: "1px solid #d1d5db", borderRadius: "5px", padding: "10px 12px" } as React.CSSProperties,

  clientLabel: {
    display: "inline-block",
    backgroundColor: "#6b8e6b",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 700,
    padding: "3px 14px",
    borderRadius: "4px",
    marginBottom: "8px",
  } as React.CSSProperties,

  tbl: { width: "100%", fontSize: "12px", borderCollapse: "collapse" as const } as React.CSSProperties,
  tdLabel: { fontWeight: 600, width: "100px", verticalAlign: "top", paddingBottom: "3px" } as React.CSSProperties,
  tdVal: { paddingLeft: "10px", paddingBottom: "3px", verticalAlign: "top" } as React.CSSProperties,

  itemsWrap: { marginTop: "16px" } as React.CSSProperties,
  itemsTbl: { width: "100%", borderCollapse: "collapse" as const, fontSize: "12px" } as React.CSSProperties,
  thStyle: { backgroundColor: "#1f2937", color: "#ffffff", padding: "6px 10px", border: "1px solid #4b5563", fontWeight: 600, textAlign: "left" as const } as React.CSSProperties,
  thRight: { backgroundColor: "#1f2937", color: "#ffffff", padding: "6px 10px", border: "1px solid #4b5563", fontWeight: 600, textAlign: "right" as const } as React.CSSProperties,
  thCenter: { backgroundColor: "#1f2937", color: "#ffffff", padding: "6px 10px", border: "1px solid #4b5563", fontWeight: 600, textAlign: "center" as const } as React.CSSProperties,
  td: { padding: "5px 10px", border: "1px solid #d1d5db" } as React.CSSProperties,
  tdRight: { padding: "5px 10px", border: "1px solid #d1d5db", textAlign: "right" as const } as React.CSSProperties,
  tdCenter: { padding: "5px 10px", border: "1px solid #d1d5db", textAlign: "center" as const } as React.CSSProperties,
  tdEmpty: { padding: "14px 10px", border: "1px solid #d1d5db", textAlign: "center" as const, color: "#9ca3af" } as React.CSSProperties,

  bottomRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "14px" } as React.CSSProperties,
  taxCol: { width: "58%" } as React.CSSProperties,
  sectionTitle: { fontSize: "11px", fontWeight: 600, color: "#555", textAlign: "center" as const, marginBottom: "6px" } as React.CSSProperties,
  subTbl: { width: "100%", borderCollapse: "collapse" as const, fontSize: "11px" } as React.CSSProperties,
  subTh: { backgroundColor: "#e5e7eb", padding: "4px 8px", border: "1px solid #d1d5db", fontWeight: 600, textAlign: "left" as const } as React.CSSProperties,
  subThR: { backgroundColor: "#e5e7eb", padding: "4px 8px", border: "1px solid #d1d5db", fontWeight: 600, textAlign: "right" as const } as React.CSSProperties,
  subTd: { padding: "4px 8px", border: "1px solid #d1d5db" } as React.CSSProperties,
  subTdR: { padding: "4px 8px", border: "1px solid #d1d5db", textAlign: "right" as const } as React.CSSProperties,
  subTdC: { padding: "4px 8px", border: "1px solid #d1d5db", textAlign: "center" as const } as React.CSSProperties,

  totalBox: {
    border: "3px solid #1f2937",
    borderRadius: "5px",
    padding: "10px 18px",
    fontSize: "17px",
    fontWeight: 800,
    textAlign: "right" as const,
  } as React.CSSProperties,

  wordsLine: { marginTop: "12px", borderTop: "1px solid #d1d5db", paddingTop: "8px", fontSize: "12px", fontStyle: "italic" } as React.CSSProperties,

  qrRow: { display: "flex", alignItems: "flex-start", gap: "16px", marginTop: "14px", border: "1px solid #d1d5db", borderRadius: "5px", padding: "12px" } as React.CSSProperties,
  qrMeta: { flex: 1, fontSize: "12px" } as React.CSSProperties,
  qrLabel: { fontWeight: 600, color: "#555", fontSize: "13px" } as React.CSSProperties,
  qrCode: { fontSize: "14px", fontWeight: 700, marginTop: "3px" } as React.CSSProperties,
  qrDetail: { marginTop: "4px" } as React.CSSProperties,
  qrDetailLabel: { color: "#777" } as React.CSSProperties,
  qrDetailVal: { fontWeight: 700 } as React.CSSProperties,
};

export function InvoicePreview({ data }: { data: InvoicePreviewData }) {
  const {
    invoiceNumber,
    date,
    seller,
    client,
    items,
    taxGroup,
    paymentType,
    totalTTC,
  } = data;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  const formattedDateTime = date
    ? new Date(date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  const totalInWords =
    totalTTC > 0 ? numberToWordsFR(Math.round(totalTTC)) : "zéro";
  const mecefCode = generateMCEcFCode();

  // Format INV QR: F + NIM + CodeINV + IFU + DateTimeYYYYMMDDHHmmss
  const now = new Date();
  const pad2 = (n: number) => n.toString().padStart(2, "0");
  const qrDateTime =
    now.getFullYear().toString() +
    pad2(now.getMonth() + 1) +
    pad2(now.getDate()) +
    pad2(now.getHours()) +
    pad2(now.getMinutes()) +
    pad2(now.getSeconds());
  const qrData = [
    "F",
    invoiceNumber,
    mecefCode,
    seller.ifu,
    qrDateTime,
  ].join("\n");

  return (
    <div id="invoice-preview" style={S.root}>
      {/* ── Benin Flag ── */}
      <div style={S.flagBar}>
        <div style={S.flagGreen} />
        <div style={S.flagYellow} />
        <div style={S.flagRed} />
      </div>

      <div style={S.body}>
        {/* ── Header ── */}
        <div style={S.headerRow}>
          <div>
            <div style={S.sellerName}>
              {seller.name || "NOM DU VENDEUR"}
            </div>
            <div style={S.sellerIfu}>
              IFU : {seller.ifu || "0000000000000"}
            </div>
          </div>
          <div style={S.titleBlock}>
            <h1 style={S.titleH1}>
              FACTURE DE<br />VENTE
            </h1>
            <div style={S.titleMeta}>
              Facture # {invoiceNumber || "EM0000000000"}
            </div>
            <div style={S.titleMeta}>Date : {formattedDate}</div>
            {/* <div style={S.titleMeta}>Vendeur : SFE en ligne</div> */}
          </div>
        </div>

        {/* ── Seller & Client Blocks ── */}
        <div style={S.infoRow}>
          {/* Seller */}
          <div style={S.infoBox}>
            <table style={S.tbl}>
              <tbody>
                <tr>
                  <td style={S.tdLabel}>Adresse</td>
                  <td style={S.tdVal}>{seller.address || "—"}</td>
                </tr>
                <tr>
                  <td style={S.tdLabel}>Contact</td>
                  <td style={S.tdVal}>
                    {seller.contact || "—"}
                    <br />
                    {seller.email || ""}
                  </td>
                </tr>
                <tr>
                  <td style={S.tdLabel}>VMCF</td>
                  <td style={S.tdVal}>{invoiceNumber || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Client */}
          <div style={{ flex: 1 }}>
            <div style={S.clientLabel}>CLIENT</div>
            <div style={S.infoBox}>
              <table style={S.tbl}>
                <tbody>
                  <tr>
                    <td style={S.tdLabel}>Nom</td>
                    <td style={S.tdVal}>{client.name || "—"}</td>
                  </tr>
                  <tr>
                    <td style={S.tdLabel}>IFU</td>
                    <td style={S.tdVal}>{client.ifu || ""}</td>
                  </tr>
                  <tr>
                    <td style={S.tdLabel}>Adresse</td>
                    <td style={S.tdVal}>{client.address || "—"}</td>
                  </tr>
                  <tr>
                    <td style={S.tdLabel}>Contact Tél</td>
                    <td style={S.tdVal}>{client.contact || "—"}</td>
                  </tr>
                  <tr>
                    <td style={S.tdLabel}>Courriel</td>
                    <td style={S.tdVal}>{client.email || ""}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Items Table ── */}
        <div style={S.itemsWrap}>
          <table style={S.itemsTbl}>
            <thead>
              <tr>
                <th style={{ ...S.thCenter, width: "32px" }}>#</th>
                <th style={S.thStyle}>Nom</th>
                <th style={{ ...S.thRight, width: "110px" }}>Prix Unitaire</th>
                <th style={{ ...S.thCenter, width: "80px" }}>Quantité</th>
                <th style={{ ...S.thRight, width: "120px" }}>Montant T.T.C</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={S.tdEmpty}>
                    Aucun article
                  </td>
                </tr>
              ) : (
                items.map((item, i) => (
                  <tr key={i}>
                    <td style={S.tdCenter}>{i + 1}</td>
                    <td style={S.td}>{item.description}</td>
                    <td style={S.tdRight}>{formatNumber(item.unitPrice)}</td>
                    <td style={S.tdCenter}>{item.quantity}</td>
                    <td style={S.tdRight}>
                      {formatNumber(item.total)}[{taxGroup?.charAt(0) || "A"}]
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Total + Tax ── */}
        <div style={S.bottomRow}>
          <div style={S.taxCol}>
            <div style={S.sectionTitle}>— VENTILATION DES IMPOTS —</div>
            <table style={S.subTbl}>
              <thead>
                <tr>
                  <th style={S.subTh}>Groupe</th>
                  <th style={S.subThR}>Total</th>
                  <th style={S.subThR}>Imposable</th>
                  <th style={S.subThR}>Impôts</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={S.subTd}>{taxGroup || "A - EXONERE"}</td>
                  <td style={S.subTdR}>{formatNumber(totalTTC)}</td>
                  <td style={S.subTdC}>-</td>
                  <td style={S.subTdC}>-</td>
                </tr>
              </tbody>
            </table>

            <div style={{ ...S.sectionTitle, marginTop: "10px" }}>
              — RÉPARTITION DES PAIEMENTS —
            </div>
            <table style={S.subTbl}>
              <thead>
                <tr>
                  <th style={S.subTh}>Type de paiement</th>
                  <th style={S.subThR}>Payé</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={S.subTd}>{paymentType || "AUTRE"}</td>
                  <td style={S.subTdR}>{formatNumber(totalTTC)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div style={S.totalBox}>TOTAL : {formatNumber(totalTTC)}</div>
          </div>
        </div>

        {/* ── Amount in words ── */}
        <div style={S.wordsLine}>
          Arrêté la présente facture à la somme de {totalInWords}{" "}
          {totalTTC === 1 ? "franc" : "francs"} CFA TTC
        </div>

        {/* ── QR Code + INV ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          marginTop: "14px",
          border: "1px solid #b0c4b0",
          borderRadius: "5px",
          padding: "14px 20px",
          backgroundColor: "#f8faf8",
        }}>
          <QRCodeCanvas value={qrData} size={100} level="M" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "12px", color: "#555", fontWeight: 600 }}>Code INV</div>
            <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px" }}>{mecefCode}</div>
            <div style={{ marginTop: "6px", fontSize: "12px", display: "flex", gap: "8px" }}>
              <span style={{ color: "#555" }}>INV NIM :</span>
              <span style={{ fontWeight: 700 }}>{invoiceNumber}</span>
            </div>
            <div style={{ marginTop: "3px", fontSize: "12px", display: "flex", gap: "8px" }}>
              <span style={{ color: "#555" }}>INV Compteurs :</span>
              <span style={{ fontWeight: 700 }}>26/30 FV</span>
            </div>
            <div style={{ marginTop: "3px", fontSize: "12px", display: "flex", gap: "8px" }}>
              <span style={{ color: "#555" }}>INV Heure :</span>
              <span style={{ fontWeight: 700 }}>{formattedDateTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
