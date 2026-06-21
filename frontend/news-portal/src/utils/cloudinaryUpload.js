import { fetchWithTimeout } from "../services/api";

const toCloudinaryPortraitImage = (url = "") => {
  const cleanUrl = String(url || "").trim();
  if (!cleanUrl.includes("/upload/")) return cleanUrl;
  return cleanUrl.replace(
    "/upload/",
    "/upload/f_auto,q_auto,c_fill,w_1080,h_1920,g_auto/"
  );
};

export const uploadMediaDirectToCloudinary = async (
  file,
  resourceType,
  token,
  options = {}
) => {
  if (!file) return null;

  const signatureResponse = await fetchWithTimeout(
    "news/upload-signature",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
    30000
  );

  if (!signatureResponse.ok) {
    const errorData = await signatureResponse.json().catch(() => ({}));
    throw new Error(errorData.message || "Upload signature create nahi ho payi");
  }

  const signatureData = await signatureResponse.json();
  const cloudName = signatureData.cloudName;
  const uploadResourceType = resourceType === "video" ? "video" : "image";
  if (!cloudName || !signatureData.apiKey || !signatureData.signature) {
    throw new Error("Cloudinary upload config missing hai");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", signatureData.timestamp);
  formData.append("folder", signatureData.folder);
  formData.append("signature", signatureData.signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${uploadResourceType}/upload`;
  const controller = new AbortController();
  const timer = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs || 600000
  );

  try {
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    const uploadData = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok) {
      throw new Error(uploadData.error?.message || "Cloudinary upload failed");
    }

    const secureUrl = uploadData.secure_url || "";
    return {
      url:
        uploadResourceType === "image" && options.portraitImage
          ? toCloudinaryPortraitImage(secureUrl)
          : secureUrl,
      publicId: uploadData.public_id || "",
      resourceType: uploadResourceType,
    };
  } finally {
    window.clearTimeout(timer);
  }
};
