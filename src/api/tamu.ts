import { Tamu } from "../types";

// Client-side API functions for Tamu (Guest) Module
// These functions communicate with our Express full-stack backend,
// which proxies requests to the Google Apps Script spreadsheet DB.

export async function getTamuList(): Promise<Tamu[]> {
  try {
    const response = await fetch("/api/tamu");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result && result.success && Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch tamu from API, returning empty:", error);
    return [];
  }
}

export async function createTamu(data: Omit<Tamu, "idTamu">): Promise<Tamu> {
  const response = await fetch("/api/tamu", {
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
    // If database was simulated or direct, return result data
    const created = result.data || { 
      idTamu: `T-${Date.now()}`, 
      tanggal: new Date().toISOString().split("T")[0],
      ...data 
    };
    return created;
  }
  
  throw new Error(result.error || "Gagal menyimpan data tamu");
}

export async function updateTamu(id: string, data: Partial<Tamu>): Promise<Tamu> {
  const response = await fetch(`/api/tamu/${id}`, {
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
    return result.data || { idTamu: id, ...data } as Tamu;
  }

  throw new Error(result.error || "Gagal memperbarui data tamu");
}

export async function deleteTamuFromApi(id: string): Promise<boolean> {
  const response = await fetch(`/api/tamu/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.success;
}
