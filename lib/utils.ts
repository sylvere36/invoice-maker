import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with space as thousands separator (Benin style)
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).replace(/\u202F/g, " ");
}

/**
 * Convert a number to French words for CFA invoices
 */
export function numberToWordsFR(n: number): string {
  if (n === 0) return "zéro";

  const units = [
    "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
    "dix-sept", "dix-huit", "dix-neuf",
  ];

  const tens = [
    "", "", "vingt", "trente", "quarante", "cinquante", "soixante",
    "soixante", "quatre-vingt", "quatre-vingt",
  ];

  function convertHundreds(num: number): string {
    let result = "";

    if (num >= 100) {
      const h = Math.floor(num / 100);
      if (h === 1) {
        result += "cent";
      } else {
        result += units[h] + " cent";
      }
      num %= 100;
      if (num === 0) {
        if (h > 1) result += "s";
        return result;
      }
      result += " ";
    }

    if (num < 20) {
      result += units[num];
    } else {
      const t = Math.floor(num / 10);
      const u = num % 10;

      if (t === 7 || t === 9) {
        // 70-79: soixante-dix..., 90-99: quatre-vingt-dix...
        const sub = (t === 7 ? 10 : 10) + u;
        result += tens[t];
        if (sub === 11 && t === 7) {
          result += " et onze";
        } else {
          result += "-" + units[sub];
        }
      } else if (t === 8) {
        result += tens[t];
        if (u === 0) {
          result += "s";
        } else {
          result += "-" + units[u];
        }
      } else {
        result += tens[t];
        if (u === 1 && t !== 8) {
          result += " et un";
        } else if (u > 0) {
          result += "-" + units[u];
        }
      }
    }

    return result;
  }

  let result = "";
  const billion = Math.floor(n / 1000000000);
  const million = Math.floor((n % 1000000000) / 1000000);
  const thousand = Math.floor((n % 1000000) / 1000);
  const remainder = n % 1000;

  if (billion > 0) {
    result += convertHundreds(billion) + " milliard";
    if (billion > 1) result += "s";
    result += " ";
  }

  if (million > 0) {
    result += convertHundreds(million) + " million";
    if (million > 1) result += "s";
    result += " ";
  }

  if (thousand > 0) {
    if (thousand === 1) {
      result += "mille ";
    } else {
      result += convertHundreds(thousand) + " mille ";
    }
  }

  if (remainder > 0) {
    result += convertHundreds(remainder);
  }

  return result.trim();
}

/**
 * Generate the next invoice number in format EM + 10 digits
 */
export function generateInvoiceNumber(prefix: string, nextNumber: number): string {
  return prefix + nextNumber.toString().padStart(10, "0");
}
