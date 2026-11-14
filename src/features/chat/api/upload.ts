import { cloudinaryUploadRequest } from '@/lib/cloudinary-upload';

// ─── Cloudinary upload for chat attachments (image/* + video/*) ─────────────

export interface ChatUploadResult {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export const CHAT_FILE_MAX_SIZE = 25 * 1024 * 1024; // 25 MB

export const CHAT_FILE_ACCEPT = 'image/*,video/*';

export function isAcceptedChatFile(file: File): boolean {
  return file.type.startsWith('image/') || file.type.startsWith('video/');
}

/**
 * Upload an image or video to Cloudinary with a ticket signed by the API.
 * Returns the metadata required by the `sendMessage` WebSocket event.
 *
 * Uses XMLHttpRequest (instead of fetch) so we can report upload progress
 * back to the UI.
 */
export async function uploadChatFileToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ChatUploadResult> {
  if (!isAcceptedChatFile(file)) {
    throw new Error('Chỉ hỗ trợ tệp hình ảnh hoặc video');
  }

  if (file.size > CHAT_FILE_MAX_SIZE) {
    throw new Error('Tệp vượt quá 25MB');
  }

  // Signed by the API (security 15/11/2026) — no public upload preset.
  // `auto` resource type lets Cloudinary route image vs video automatically.
  const { endpoint, body: formData } = await cloudinaryUploadRequest(file, 'chat');

  return new Promise<ChatUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { secure_url?: string };
          if (!data.secure_url) {
            reject(new Error('Phản hồi tải lên không hợp lệ'));
            return;
          }
          resolve({
            fileUrl: data.secure_url,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          });
        } catch {
          reject(new Error('Không thể đọc phản hồi từ Cloudinary'));
        }
      } else {
        reject(new Error('Tải tệp lên Cloudinary thất bại'));
      }
    };

    xhr.onerror = () => reject(new Error('Lỗi mạng khi tải tệp lên'));
    xhr.onabort = () => reject(new Error('Đã hủy tải lên'));

    xhr.send(formData);
  });
}
