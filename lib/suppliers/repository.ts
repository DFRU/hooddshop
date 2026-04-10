import type { Supplier } from "./types";
import suppliersData from "../data/suppliers.json";

const suppliers: Supplier[] = suppliersData as Supplier[];

export function getSuppliers(): Supplier[] {
  return suppliers;
}

export function getActiveSuppliers(): Supplier[] {
  return suppliers.filter((s) => s.status === "active");
}

export function getSupplierById(id: string): Supplier | undefined {
  return suppliers.find((s) => s.id === id);
}
