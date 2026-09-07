import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary.js";

export const uploadPdfToCloudinary = async (
  pdfBuffer: Buffer,
  publicId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: publicId,
        format: "pdf",
        folder: "veristaff/documents"
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(
            new Error(
              "Cloudinary PDF upload did not return a secure URL"
            )
          );

          return;
        }

        resolve(result.secure_url);
      }
    );

    Readable.from(pdfBuffer).pipe(uploadStream);
  });
};


export const uploadImageToCloudinary = async (
  imageBuffer: Buffer,
  publicId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          public_id: publicId,
          folder: "veristaff/branding"
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result?.secure_url) {
            reject(
              new Error(
                "Cloudinary image upload did not return a secure URL"
              )
            );

            return;
          }

          resolve(result.secure_url);
        }
      );

    Readable
      .from(imageBuffer)
      .pipe(uploadStream);
  });
};

export const deletePdfFromCloudinary = async (
  pdfUrl: string
): Promise<void> => {
  try {
    const url = new URL(pdfUrl);
    const match = url.pathname.match(
      /\/veristaff\/documents\/(.+?)\.pdf$/
    );

    if (!match) {
      return;
    }

    await cloudinary.uploader.destroy(
      `veristaff/documents/${match[1]}`,
      { resource_type: "raw" }
    );
  } catch {
    // A legacy URL or storage failure must not prevent record cleanup.
  }
};
