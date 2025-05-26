import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (file: File): Promise<string> => {
  const imageURL = URL.createObjectURL(file);

  const result = await Tesseract.recognize(imageURL, 'eng', {
    logger: m => console.log(m), // Optional: logs progress
  });

  return result.data.text;
};
