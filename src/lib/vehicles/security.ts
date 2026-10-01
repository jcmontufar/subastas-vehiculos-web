import type { VehicleImage } from "@/types/domain";

export function vehicleImagesBelongToUser(
  images: VehicleImage[],
  userId: string,
  expectedBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
) {
  const prefix = `vehicles/${userId}/`;

  return images.every((image) => {
    if (!image.storagePath.startsWith(prefix)) return false;

    try {
      const url = new URL(image.url);
      const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "firebasestorage.googleapis.com" ||
        !match
      ) {
        return false;
      }

      const [, bucket, encodedPath] = match;
      return (
        (!expectedBucket || bucket === expectedBucket) &&
        decodeURIComponent(encodedPath) === image.storagePath
      );
    } catch {
      return false;
    }
  });
}
