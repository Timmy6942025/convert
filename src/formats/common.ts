import type { Category, FormatDefinition } from "../core/types.ts";

interface FormatSeed {
  id: string;
  name: string;
  extension: string;
  mime: string[];
  category: Category[];
  aliases?: string[];
  extraExtensions?: string[];
}

function defineFormat(seed: FormatSeed): FormatDefinition {
  const aliases = (seed.aliases ?? []).map((value) => value.toLowerCase());
  const extensions = [seed.extension, ...(seed.extraExtensions ?? [])].map((value) => value.toLowerCase());
  return {
    id: seed.id.toLowerCase(),
    name: seed.name,
    extension: seed.extension.toLowerCase(),
    extensions,
    mime: seed.mime,
    category: seed.category,
    aliases,
  };
}

export const COMMON_FORMATS: FormatDefinition[] = [
  defineFormat({ id: "png", name: "Portable Network Graphics", extension: "png", mime: ["image/png"], category: ["image"] }),
  defineFormat({ id: "jpeg", name: "JPEG Image", extension: "jpg", extraExtensions: ["jpeg", "jpe"], mime: ["image/jpeg"], category: ["image"], aliases: ["jpg", "jpeg"] }),
  defineFormat({ id: "webp", name: "WebP Image", extension: "webp", mime: ["image/webp"], category: ["image"] }),
  defineFormat({ id: "gif", name: "Graphics Interchange Format", extension: "gif", mime: ["image/gif"], category: ["image", "video"] }),
  defineFormat({ id: "bmp", name: "Bitmap Image", extension: "bmp", mime: ["image/bmp"], category: ["image"] }),
  defineFormat({ id: "tiff", name: "Tagged Image File Format", extension: "tiff", extraExtensions: ["tif"], mime: ["image/tiff"], category: ["image"], aliases: ["tif"] }),
  defineFormat({ id: "svg", name: "Scalable Vector Graphics", extension: "svg", mime: ["image/svg+xml"], category: ["image", "vector", "document"] }),
  defineFormat({ id: "avif", name: "AVIF Image", extension: "avif", mime: ["image/avif"], category: ["image"] }),
  defineFormat({ id: "heic", name: "HEIC Image", extension: "heic", extraExtensions: ["heif"], mime: ["image/heic"], category: ["image"], aliases: ["heif"] }),
  defineFormat({ id: "ico", name: "Icon Image", extension: "ico", mime: ["image/x-icon"], category: ["image"] }),
  defineFormat({ id: "jp2", name: "JPEG 2000", extension: "jp2", extraExtensions: ["j2k"], mime: ["image/jp2"], category: ["image"], aliases: ["j2k"] }),
  defineFormat({ id: "psd", name: "Photoshop Document", extension: "psd", mime: ["image/vnd.adobe.photoshop"], category: ["image", "document"] }),
  defineFormat({ id: "tga", name: "Targa Image", extension: "tga", mime: ["image/x-tga"], category: ["image"] }),
  defineFormat({ id: "dds", name: "DirectDraw Surface", extension: "dds", mime: ["image/vnd.ms-dds"], category: ["image"] }),
  defineFormat({ id: "hdr", name: "Radiance HDR", extension: "hdr", mime: ["image/vnd.radiance"], category: ["image"] }),
  defineFormat({ id: "exr", name: "OpenEXR", extension: "exr", mime: ["image/aces"], category: ["image"] }),
  defineFormat({ id: "pnm", name: "Portable Anymap", extension: "pnm", mime: ["image/x-portable-anymap"], category: ["image"] }),
  defineFormat({ id: "pbm", name: "Portable Bitmap", extension: "pbm", mime: ["image/x-portable-bitmap"], category: ["image"] }),
  defineFormat({ id: "pgm", name: "Portable Graymap", extension: "pgm", mime: ["image/x-portable-graymap"], category: ["image"] }),
  defineFormat({ id: "ppm", name: "Portable Pixmap", extension: "ppm", mime: ["image/x-portable-pixmap"], category: ["image"] }),
  defineFormat({ id: "apng", name: "Animated PNG", extension: "apng", mime: ["image/apng"], category: ["image", "video"] }),

  defineFormat({ id: "wav", name: "Waveform Audio", extension: "wav", mime: ["audio/wav"], category: ["audio"] }),
  defineFormat({ id: "mp3", name: "MP3 Audio", extension: "mp3", mime: ["audio/mpeg"], category: ["audio"] }),
  defineFormat({ id: "flac", name: "FLAC Audio", extension: "flac", mime: ["audio/flac"], category: ["audio"] }),
  defineFormat({ id: "ogg", name: "Ogg Audio", extension: "ogg", extraExtensions: ["oga"], mime: ["audio/ogg"], category: ["audio"], aliases: ["oga"] }),
  defineFormat({ id: "aac", name: "AAC Audio", extension: "aac", mime: ["audio/aac"], category: ["audio"] }),
  defineFormat({ id: "m4a", name: "MPEG-4 Audio", extension: "m4a", mime: ["audio/mp4"], category: ["audio"] }),
  defineFormat({ id: "wma", name: "Windows Media Audio", extension: "wma", mime: ["audio/x-ms-wma"], category: ["audio"] }),
  defineFormat({ id: "aiff", name: "Audio Interchange File Format", extension: "aiff", extraExtensions: ["aif"], mime: ["audio/aiff"], category: ["audio"], aliases: ["aif"] }),
  defineFormat({ id: "opus", name: "Opus Audio", extension: "opus", mime: ["audio/opus"], category: ["audio"] }),
  defineFormat({ id: "amr", name: "AMR Audio", extension: "amr", mime: ["audio/amr"], category: ["audio"] }),
  defineFormat({ id: "ac3", name: "Dolby Digital AC-3", extension: "ac3", mime: ["audio/ac3"], category: ["audio"] }),
  defineFormat({ id: "dts", name: "Digital Theater Systems Audio", extension: "dts", mime: ["audio/vnd.dts"], category: ["audio"] }),
  defineFormat({ id: "mka", name: "Matroska Audio", extension: "mka", mime: ["audio/x-matroska"], category: ["audio"] }),
  defineFormat({ id: "mid", name: "MIDI Sequence", extension: "mid", extraExtensions: ["midi"], mime: ["audio/midi"], category: ["audio"], aliases: ["midi"] }),

  defineFormat({ id: "mp4", name: "MPEG-4 Video", extension: "mp4", mime: ["video/mp4"], category: ["video"] }),
  defineFormat({ id: "m4v", name: "MPEG-4 Video", extension: "m4v", mime: ["video/x-m4v"], category: ["video"] }),
  defineFormat({ id: "mov", name: "QuickTime MOV", extension: "mov", mime: ["video/quicktime"], category: ["video"] }),
  defineFormat({ id: "webm", name: "WebM Video", extension: "webm", mime: ["video/webm"], category: ["video"] }),
  defineFormat({ id: "wmv", name: "Windows Media Video", extension: "wmv", mime: ["video/x-ms-wmv"], category: ["video"] }),
  defineFormat({ id: "mkv", name: "Matroska Video", extension: "mkv", mime: ["video/x-matroska"], category: ["video"] }),
  defineFormat({ id: "avi", name: "Audio Video Interleave", extension: "avi", mime: ["video/x-msvideo"], category: ["video"] }),
  defineFormat({ id: "mpeg", name: "MPEG Video", extension: "mpeg", extraExtensions: ["mpg"], mime: ["video/mpeg"], category: ["video"], aliases: ["mpg"] }),
  defineFormat({ id: "3gp", name: "3GPP Video", extension: "3gp", mime: ["video/3gpp"], category: ["video"] }),
  defineFormat({ id: "3g2", name: "3GPP2 Video", extension: "3g2", mime: ["video/3gpp2"], category: ["video"] }),
  defineFormat({ id: "flv", name: "Flash Video", extension: "flv", extraExtensions: ["f4v"], mime: ["video/x-flv"], category: ["video"], aliases: ["f4v"] }),
  defineFormat({ id: "ts", name: "MPEG Transport Stream", extension: "ts", extraExtensions: ["m2ts", "mts"], mime: ["video/mp2t"], category: ["video"], aliases: ["m2ts", "mts"] }),
  defineFormat({ id: "vob", name: "DVD Video Object", extension: "vob", mime: ["video/dvd"], category: ["video"] }),
  defineFormat({ id: "ogv", name: "Ogg Video", extension: "ogv", mime: ["video/ogg"], category: ["video"] }),
  defineFormat({ id: "asf", name: "Advanced Systems Format", extension: "asf", mime: ["video/x-ms-asf"], category: ["video"] }),

  defineFormat({ id: "txt", name: "Plain Text", extension: "txt", mime: ["text/plain"], category: ["text"] }),
  defineFormat({ id: "md", name: "Markdown", extension: "md", extraExtensions: ["markdown"], mime: ["text/markdown"], category: ["text", "document"], aliases: ["markdown"] }),
  defineFormat({ id: "html", name: "HyperText Markup Language", extension: "html", extraExtensions: ["htm"], mime: ["text/html"], category: ["text", "document"], aliases: ["htm"] }),
  defineFormat({ id: "xhtml", name: "XHTML", extension: "xhtml", mime: ["application/xhtml+xml"], category: ["text", "document"] }),
  defineFormat({ id: "json", name: "JSON", extension: "json", extraExtensions: ["jsonl", "ndjson"], mime: ["application/json"], category: ["data", "text"], aliases: ["jsonl", "ndjson"] }),
  defineFormat({ id: "xml", name: "XML", extension: "xml", mime: ["application/xml", "text/xml"], category: ["data", "text"] }),
  defineFormat({ id: "yaml", name: "YAML", extension: "yml", extraExtensions: ["yaml"], mime: ["application/yaml", "text/yaml"], category: ["data", "text"], aliases: ["yaml"] }),
  defineFormat({ id: "toml", name: "TOML", extension: "toml", mime: ["application/toml"], category: ["data", "text"] }),
  defineFormat({ id: "ini", name: "INI Config", extension: "ini", mime: ["text/plain"], category: ["data", "text"] }),
  defineFormat({ id: "csv", name: "Comma Separated Values", extension: "csv", mime: ["text/csv"], category: ["data", "text"] }),
  defineFormat({ id: "tsv", name: "Tab Separated Values", extension: "tsv", mime: ["text/tab-separated-values"], category: ["data", "text"] }),
  defineFormat({ id: "css", name: "Cascading Style Sheets", extension: "css", mime: ["text/css"], category: ["code", "text"] }),
  defineFormat({ id: "js", name: "JavaScript", extension: "js", mime: ["text/javascript"], category: ["code", "text"] }),
  defineFormat({ id: "py", name: "Python Script", extension: "py", mime: ["text/x-python"], category: ["code", "text"] }),
  defineFormat({ id: "sh", name: "Shell Script", extension: "sh", mime: ["application/x-sh"], category: ["code", "text"] }),
  defineFormat({ id: "bat", name: "Batch Script", extension: "bat", mime: ["application/x-bat"], category: ["code", "text"] }),
  defineFormat({ id: "ps1", name: "PowerShell Script", extension: "ps1", mime: ["text/plain"], category: ["code", "text"] }),
  defineFormat({ id: "rst", name: "reStructuredText", extension: "rst", mime: ["text/x-rst"], category: ["text", "document"] }),
  defineFormat({ id: "tex", name: "LaTeX", extension: "tex", mime: ["application/x-tex"], category: ["text", "document"] }),
  defineFormat({ id: "adoc", name: "AsciiDoc", extension: "adoc", extraExtensions: ["asciidoc"], mime: ["text/plain"], category: ["text", "document"], aliases: ["asciidoc"] }),
  defineFormat({ id: "bbcode", name: "BBCode", extension: "bbcode", mime: ["text/plain"], category: ["text", "document"] }),
  defineFormat({ id: "org", name: "Org Mode", extension: "org", mime: ["text/plain"], category: ["text", "document"] }),

  defineFormat({ id: "pdf", name: "Portable Document Format", extension: "pdf", mime: ["application/pdf"], category: ["document"] }),
  defineFormat({ id: "docx", name: "Word Document", extension: "docx", mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], category: ["document"] }),
  defineFormat({ id: "odt", name: "OpenDocument Text", extension: "odt", mime: ["application/vnd.oasis.opendocument.text"], category: ["document"] }),
  defineFormat({ id: "rtf", name: "Rich Text Format", extension: "rtf", mime: ["application/rtf"], category: ["document", "text"] }),
  defineFormat({ id: "epub", name: "EPUB eBook", extension: "epub", mime: ["application/epub+zip"], category: ["document"] }),
  defineFormat({ id: "fb2", name: "FictionBook", extension: "fb2", mime: ["application/x-fictionbook+xml"], category: ["document", "text"] }),
  defineFormat({ id: "pptx", name: "PowerPoint Presentation", extension: "pptx", mime: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"], category: ["presentation", "document"] }),
  defineFormat({ id: "xlsx", name: "Excel Workbook", extension: "xlsx", mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], category: ["spreadsheet", "document"] }),
  defineFormat({ id: "ods", name: "OpenDocument Spreadsheet", extension: "ods", mime: ["application/vnd.oasis.opendocument.spreadsheet"], category: ["spreadsheet", "document"] }),
  defineFormat({ id: "odp", name: "OpenDocument Presentation", extension: "odp", mime: ["application/vnd.oasis.opendocument.presentation"], category: ["presentation", "document"] }),
  defineFormat({ id: "docbook", name: "DocBook", extension: "docbook", mime: ["application/xml"], category: ["document", "text"] }),
  defineFormat({ id: "jats", name: "JATS XML", extension: "jats", mime: ["application/xml"], category: ["document", "text"] }),
  defineFormat({ id: "texinfo", name: "Texinfo", extension: "texi", extraExtensions: ["texinfo"], mime: ["text/plain"], category: ["document", "text"], aliases: ["texi"] }),
  defineFormat({ id: "eps", name: "Encapsulated PostScript", extension: "eps", mime: ["application/postscript"], category: ["vector", "document"] }),
  defineFormat({ id: "ps", name: "PostScript", extension: "ps", mime: ["application/postscript"], category: ["vector", "document"] }),

  defineFormat({ id: "zip", name: "ZIP Archive", extension: "zip", mime: ["application/zip"], category: ["archive"] }),
  defineFormat({ id: "tar", name: "TAR Archive", extension: "tar", mime: ["application/x-tar"], category: ["archive"] }),
  defineFormat({ id: "7z", name: "7-Zip Archive", extension: "7z", mime: ["application/x-7z-compressed"], category: ["archive"] }),
  defineFormat({ id: "gz", name: "Gzip Archive", extension: "gz", mime: ["application/gzip"], category: ["archive"] }),
  defineFormat({ id: "bz2", name: "Bzip2 Archive", extension: "bz2", mime: ["application/x-bzip2"], category: ["archive"] }),
  defineFormat({ id: "xz", name: "XZ Archive", extension: "xz", mime: ["application/x-xz"], category: ["archive"] }),
  defineFormat({ id: "rar", name: "RAR Archive", extension: "rar", mime: ["application/vnd.rar"], category: ["archive"] }),
  defineFormat({ id: "cab", name: "Cabinet Archive", extension: "cab", mime: ["application/vnd.ms-cab-compressed"], category: ["archive"] }),
  defineFormat({ id: "iso", name: "ISO Disk Image", extension: "iso", mime: ["application/x-iso9660-image"], category: ["archive", "binary"] }),

  defineFormat({ id: "ttf", name: "TrueType Font", extension: "ttf", mime: ["font/ttf"], category: ["font"] }),
  defineFormat({ id: "otf", name: "OpenType Font", extension: "otf", mime: ["font/otf"], category: ["font"] }),
  defineFormat({ id: "woff", name: "Web Open Font Format", extension: "woff", mime: ["font/woff"], category: ["font"] }),
  defineFormat({ id: "woff2", name: "Web Open Font Format 2", extension: "woff2", mime: ["font/woff2"], category: ["font"] }),
  defineFormat({ id: "eot", name: "Embedded OpenType", extension: "eot", mime: ["application/vnd.ms-fontobject"], category: ["font"] }),

  defineFormat({ id: "base64", name: "Base64 Text", extension: "b64", mime: ["text/plain"], category: ["data", "text"] }),
  defineFormat({ id: "hex", name: "Hex Text", extension: "hex", mime: ["text/plain"], category: ["data", "text"] }),
  defineFormat({ id: "bin", name: "Binary Blob", extension: "bin", mime: ["application/octet-stream"], category: ["binary"] }),
];
