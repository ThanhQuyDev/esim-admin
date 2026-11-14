import { apiClient } from "@/lib/api-client";

/**
 * Uploading to Cloudinary through a ticket from the API (security 15/11/2026).
 *
 * The CMS used to upload with an unsigned preset named in the public bundle,
 * which let anyone store files in our Cloudinary account. Now each upload asks
 * the backend for a signed ticket first; only staff get one for `cms`.
 */
export type CloudinaryPurpose = "cms" | "chat";

type UploadTicket =
  | {
      mode: "signed";
      cloudName: string;
      apiKey: string;
      timestamp: number;
      signature: string;
      folder: string;
    }
  | { mode: "unsigned"; cloudName: string; uploadPreset: string };

export async function cloudinaryUploadRequest(
  file: File,
  purpose: CloudinaryPurpose,
  resourceType: "auto" | "image" = "auto",
): Promise<{ endpoint: string; body: FormData }> {
  const ticket = await apiClient<UploadTicket>(
    `/files/cloudinary-signature/${purpose}`,
    {
      method: "POST",
    },
  );
  const body = new FormData();
  body.append("file", file);
  if (ticket.mode === "signed") {
    body.append("api_key", ticket.apiKey);
    body.append("timestamp", String(ticket.timestamp));
    body.append("signature", ticket.signature);
    body.append("folder", ticket.folder);
  } else {
    body.append("upload_preset", ticket.uploadPreset);
  }
  return {
    endpoint: `https://api.cloudinary.com/v1_1/${ticket.cloudName}/${resourceType}/upload`,
    body,
  };
}

/** Upload one file and return its `secure_url`. */
export async function uploadFileToCloudinary(
  file: File,
  purpose: CloudinaryPurpose,
  resourceType: "auto" | "image" = "auto",
): Promise<string> {
  const { endpoint, body } = await cloudinaryUploadRequest(
    file,
    purpose,
    resourceType,
  );
  const res = await fetch(endpoint, { method: "POST", body });
  if (!res.ok) throw new Error("Failed to upload image to Cloudinary");
  const data = await res.json();
  return data.secure_url as string;
}
