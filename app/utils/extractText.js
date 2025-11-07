// utils/extractTextFromPDF.js
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import fs from "fs";

export async function extractTextFromPDF(filePath) {
  // Read the PDF file as bytes
  const data = new Uint8Array(fs.readFileSync(filePath));

  // Load the PDF
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let extractedText = "";

  // Loop through all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    extractedText += strings.join(" ") + "\n";
  }

  return extractedText;
}
