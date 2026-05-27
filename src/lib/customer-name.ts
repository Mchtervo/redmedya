import type { CustomerInfo } from "@/stores/package-store";

/** Ad/soyad birleşik veya tek alanda yazılmış isimleri kayıt için düzenler */
export function normalizeCustomerName(customer: CustomerInfo): CustomerInfo {
  let first = customer.firstName?.trim() ?? "";
  let last = customer.lastName?.trim() ?? "";

  if (!first && last) {
    const parts = last.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      first = parts[0];
      last = parts.slice(1).join(" ");
    } else {
      first = last;
      last = "";
    }
  } else if (first && !last && first.includes(" ")) {
    const parts = first.split(/\s+/).filter(Boolean);
    first = parts[0];
    last = parts.slice(1).join(" ");
  }

  return {
    ...customer,
    firstName: first,
    lastName: last,
  };
}

export function customerHasName(customer: CustomerInfo): boolean {
  const n = normalizeCustomerName(customer);
  return Boolean(n.firstName?.trim() || n.lastName?.trim());
}

export function formatCustomerName(customer: CustomerInfo): string {
  const n = normalizeCustomerName(customer);
  return [n.firstName, n.lastName].filter(Boolean).join(" ").trim();
}
