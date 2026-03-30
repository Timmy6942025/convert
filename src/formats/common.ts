import type { Category, FormatDefinition } from "../core/types.ts";

function defineFormat(
  id: string,
  name: string,
  extension: string,
  mime: string[],
  category: Category[],
  aliases: string[] = [],
): FormatDefinition {
  return {
    id,
    name,
    extension,
    extensions: [extension],
    mime,
    category,
    aliases,
  };
}

export const COMMON_FORMATS: FormatDefinition[] = [
  defineFormat("png", "Portable Network Graphics", "png", ["image/png"], ["image"]),
  defineFormat("jpeg", "JPEG Image", "jpg", ["image/jpeg"], ["image"], ["jpg"]),
  defineFormat("webp", "WebP Image", "webp", ["image/webp"], ["image"]),
  defineFormat("gif", "Graphics Interchange Format", "gif", ["image/gif"], ["image", "video"]),
  defineFormat("bmp", "Bitmap Image", "bmp", ["image/bmp"], ["image"]),
  defineFormat("tiff", "Tagged Image File Format", "tiff", ["image/tiff"], ["image"], ["tif"]),
  defineFormat("svg", "Scalable Vector Graphics", "svg", ["image/svg+xml"], ["image", "vector", "document"]),

  defineFormat("wav", "Waveform Audio", "wav", ["audio/wav"], ["audio"]),
  defineFormat("mp3", "MP3 Audio", "mp3", ["audio/mpeg"], ["audio"]),
  defineFormat("flac", "FLAC Audio", "flac", ["audio/flac"], ["audio"]),
  defineFormat("ogg", "Ogg Audio", "ogg", ["audio/ogg"], ["audio"]),

  defineFormat("mp4", "MPEG-4 Video", "mp4", ["video/mp4"], ["video"]),
  defineFormat("mov", "QuickTime MOV", "mov", ["video/quicktime"], ["video"]),
  defineFormat("webm", "WebM Video", "webm", ["video/webm"], ["video"]),
  defineFormat("wmv", "Windows Media Video", "wmv", ["video/x-ms-wmv"], ["video"]),

  defineFormat("txt", "Plain Text", "txt", ["text/plain"], ["text"]),
  defineFormat("md", "Markdown", "md", ["text/markdown"], ["text", "document"], ["markdown"]),
  defineFormat("html", "HyperText Markup Language", "html", ["text/html"], ["text", "document"]),
  defineFormat("json", "JSON", "json", ["application/json"], ["data", "text"]),
  defineFormat("xml", "XML", "xml", ["application/xml", "text/xml"], ["data", "text"]),
  defineFormat("yaml", "YAML", "yml", ["application/yaml", "text/yaml"], ["data", "text"], ["yml"]),
  defineFormat("csv", "Comma Separated Values", "csv", ["text/csv"], ["data", "text"]),
  defineFormat("css", "Cascading Style Sheets", "css", ["text/css"], ["code", "text"]),
  defineFormat("sh", "Shell Script", "sh", ["application/x-sh"], ["code", "text"]),
  defineFormat("py", "Python Script", "py", ["text/x-python"], ["code", "text"]),

  defineFormat("pdf", "Portable Document Format", "pdf", ["application/pdf"], ["document"]),
  defineFormat("docx", "Word Document", "docx", ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ["document"]),
  defineFormat("xlsx", "Excel Workbook", "xlsx", ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], ["spreadsheet", "document"]),
  defineFormat("pptx", "PowerPoint Presentation", "pptx", ["application/vnd.openxmlformats-officedocument.presentationml.presentation"], ["presentation", "document"]),

  defineFormat("zip", "ZIP Archive", "zip", ["application/zip"], ["archive"]),
  defineFormat("tar", "TAR Archive", "tar", ["application/x-tar"], ["archive"]),
  defineFormat("7z", "7-Zip Archive", "7z", ["application/x-7z-compressed"], ["archive"]),

  defineFormat("ttf", "TrueType Font", "ttf", ["font/ttf"], ["font"]),
  defineFormat("otf", "OpenType Font", "otf", ["font/otf"], ["font"]),
  defineFormat("woff", "Web Open Font Format", "woff", ["font/woff"], ["font"]),
  defineFormat("woff2", "Web Open Font Format 2", "woff2", ["font/woff2"], ["font"]),

  defineFormat("base64", "Base64 Text", "b64", ["text/plain"], ["data", "text"]),
  defineFormat("hex", "Hex Text", "hex", ["text/plain"], ["data", "text"]),
  defineFormat("bin", "Binary Blob", "bin", ["application/octet-stream"], ["binary"]),
];
