import { Permasalahan } from "../types";

// Client-side API functions for Permasalahan Module
// Communicates with our Express backend, which proxies requests to the Google Apps Script spreadsheet DB.

export async function getPermasalahanList(): Promise<Permasalahan[]> {
  try {
    const response = await fetch("/api/permasalahan");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result && result.success && Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch permasalahan from API, returning empty:", error);
    return [];
  }
}

export async function createPermasalahan(data: Omit<Permasalahan, "idKasus">): Promise<Permasalahan> {
  const response = await fetch("/api/permasalahan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (result.success) {
    const created = result.data || { 
      idKasus: `KS-${Date.now().toString().slice(-4)}`, 
      tanggal: new Date().toISOString().split("T")[0],
      ...data 
    };
    return created;
  }
  
  throw new Error(result.error || "Gagal menyimpan data permasalahan");
}

export async function updatePermasalahan(id: string, data: Partial<Permasalahan>): Promise<Permasalahan> {
  const response = await fetch(`/api/permasalahan/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (result.success) {
    return result.data || { idKasus: id, ...data } as Permasalahan;
  }

  throw new Error(result.error || "Gagal memperbarui data permasalahan");
}

export async function deletePermasalahanFromApi(id: string): Promise<boolean> {
  const response = await fetch(`/api/permasalahan/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.success;
}
