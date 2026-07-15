import JSZip from "jszip";
import mammoth from "mammoth";

const MAX_FILES = 4;
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 50_000;
const MAX_ARCHIVE_UNCOMPRESSED_BYTES = 16 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set(["md", "txt", "docx", "pptx", "pdf"]);

export type ImportedSource = { name: string; type: string; characters: number };

function extension(name: string) { return name.split(".").pop()?.toLowerCase() ?? ""; }
function cleanText(value: string) { return value.replace(/\u0000/g, "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); }
function decodeXml(value: string) { return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'"); }

async function extractPptx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  assertArchiveSize(zip);
  const slides = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]));
  const text = await Promise.all(slides.map(async (name, index) => {
    const xml = await zip.files[name].async("string");
    const words = Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)).map((match) => decodeXml(match[1]));
    return words.length ? `Slide ${index + 1}: ${words.join(" ")}` : "";
  }));
  return text.filter(Boolean).join("\n\n");
}

function assertArchiveSize(zip: JSZip) {
  const size = Object.values(zip.files).reduce((total, file) => total + ((file as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0), 0);
  if (size > MAX_ARCHIVE_UNCOMPRESSED_BYTES) throw new Error("This document expands beyond the safe import limit.");
}

async function assertZipDocument(buffer: Buffer) {
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) throw new Error("The selected file is not a valid Office document.");
  assertArchiveSize(await JSZip.loadAsync(buffer));
}

async function extractPdf(buffer: Buffer) {
  // PDF.js tries to discover these through a dynamic require. Initialising them
  // explicitly makes the Node/Vercel runtime deterministic. Both dependencies
  // stay lazy so non-PDF uploads never load a native Canvas module.
  const { DOMMatrix, ImageData, Path2D } = await import("@napi-rs/canvas");
  const runtime = globalThis as Record<string, unknown>;
  runtime.DOMMatrix ??= DOMMatrix;
  runtime.ImageData ??= ImageData;
  runtime.Path2D ??= Path2D;
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

async function extractOne(file: File) {
  const type = extension(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (type === "md" || type === "txt") return new TextDecoder().decode(buffer);
  if (type === "docx") { await assertZipDocument(buffer); return (await mammoth.extractRawText({ buffer })).value; }
  if (type === "pptx") return extractPptx(buffer);
  if (type === "pdf") {
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error("The selected file is not a valid PDF.");
    return extractPdf(buffer);
  }
  throw new Error(`Unsupported file type: ${file.name}.`);
}

export async function extractSourceDocuments(files: File[]) {
  if (files.length > MAX_FILES) throw new Error(`Add up to ${MAX_FILES} documents at a time.`);
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) throw new Error("Your documents must be 4 MB or smaller in total.");
  const parts: string[] = [];
  const sources: ImportedSource[] = [];

  for (const file of files) {
    const type = extension(file.name);
    if (!SUPPORTED_EXTENSIONS.has(type)) throw new Error(`${file.name} is not a supported document type.`);
    if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than the 3 MB limit.`);
    let extracted: string;
    try {
      extracted = await extractOne(file);
    } catch (error) {
      console.error(`Document extraction failed for ${file.name}`, error);
      throw new Error(`We couldn't read ${file.name}. Please use a text-based, unprotected document, or paste the relevant text instead.`);
    }
    const text = cleanText(extracted);
    if (!text) throw new Error(`We could not read any text from ${file.name}. If it is a scanned PDF, paste its text instead.`);
    const remaining = MAX_EXTRACTED_CHARS - parts.join("\n").length;
    if (remaining <= 0) break;
    const excerpt = text.slice(0, remaining);
    parts.push(`--- Source: ${file.name} ---\n${excerpt}`);
    sources.push({ name: file.name, type, characters: excerpt.length });
  }

  return { text: parts.join("\n\n"), sources };
}
