import path from "path";
import fs from "fs/promises";
import multer from "multer";


export const uploadImage = async (
  file: Express.Multer.File,
  uploadDir: string,
  filename: string
): Promise<string> => {
  try {
    const fileExtension = path.extname(file.originalname);
    const newFilename = `${filename}${fileExtension}`;
    const filePath = path.join(uploadDir, newFilename);

    // Crea carpeta si no existe
    await fs.mkdir(uploadDir, { recursive: true });

    // Guarda el archivo desde buffer
    await fs.writeFile(filePath, file.buffer);

    return `/uploads/products/${newFilename}`; // URL pública
  } catch (error) {
    console.error("Error al guardar la imagen:", error);
    throw error;
  }
};

// Function to delete an image from the file system
export const deleteImage = async (
  imageUrl: string,
  uploadDir: string
): Promise<void> => {
  try {
    const filename = path.basename(imageUrl);
    const filePath = path.join(uploadDir, filename);

    await fs.unlink(filePath);
  } catch (error) {

    if (error instanceof Error && 'code' in error && error.code !== "ENOENT") {
      console.error(`Error al eliminar la imagen ${imageUrl}:`, error);
      throw error;
    } else {
      console.log(`Imagen no encontrada al intentar eliminar`);
    }
  }
};
