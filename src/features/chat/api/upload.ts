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
 * Upload an image or video to Cloudinary using an unsigned upload preset.
 * Returns the metadata required by the `sendMessage` WebSocket event.
 *
 * Uses XMLHttpRequest (instead of fetch) so we can report upload progress
 * back to the UI.
 */
export function uploadChatFileToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ChatUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return Promise.reject(new Error('Cloudinary configuration is missing'));
  }

  if (!isAcceptedChatFile(file)) {
    return Promise.reject(new Error('Chỉ hỗ trợ tệp hình ảnh hoặc video'));
  }

  if (file.size > CHAT_FILE_MAX_SIZE) {
    return Promise.reject(new Error('Tệp vượt quá 25MB'));
  }

  // `auto` resource type lets Cloudinary route image vs video automatically
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

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
