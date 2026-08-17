import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  callback
) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    callback(
      new Error(
        "Only JPG, PNG and WEBP images are allowed"
      )
    );

    return;
  }

  callback(null, true);
};

export const uploadImage = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter
});