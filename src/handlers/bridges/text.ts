import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { ConversionHandler, ConvertRequest, HandlerContext, HandlerResult, HandlerRule } from "../base.ts";
import { toFileArtifact } from "../../artifacts/file.ts";

const TEXTISH = [
  "txt",
  "md",
  "html",
  "xhtml",
  "json",
  "xml",
  "yaml",
  "toml",
  "ini",
  "csv",
  "tsv",
  "rst",
  "adoc",
  "bbcode",
  "org",
  "tex",
  "docbook",
  "jats",
  "base64",
  "hex",
  "bin",
];

function textRules(): HandlerRule[] {
  const rules: HandlerRule[] = [];
  for (const from of TEXTISH) {
    for (const to of TEXTISH) {
      if (from === to) {
        continue;
      }
      rules.push({ from, to, cost: 60, lossless: false });
    }
  }
  rules.push({ from: "*", to: "base64", cost: 110, lossless: false });
  rules.push({ from: "*", to: "hex", cost: 110, lossless: false });
  rules.push({ from: "base64", to: "*", cost: 130, lossless: false });
  rules.push({ from: "hex", to: "*", cost: 130, lossless: false });
  return rules;
}

function decodeIfEncoded(inputFormat: string, bytes: Buffer): Buffer {
  if (inputFormat === "base64") {
    try {
      return Buffer.from(bytes.toString("utf8").trim(), "base64");
    } catch {
      return bytes;
    }
  }
  if (inputFormat === "hex") {
    const normalized = bytes.toString("utf8").replace(/\s+/g, "").trim();
    if (normalized.length % 2 !== 0) {
      return bytes;
    }
    try {
      return Buffer.from(normalized, "hex");
    } catch {
      return bytes;
    }
  }
  return bytes;
}

function htmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fromStructuredToText(inputFormat: string, text: string): string {
  if (inputFormat === "json") {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const data = parsed.data;
      if (typeof data === "string") {
        return data;
      }
    } catch {
      return text;
    }
  }

  if (inputFormat === "html" || inputFormat === "xhtml" || inputFormat === "xml") {
    return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  return text;
}

export class TextBridgeHandler implements ConversionHandler {
  readonly name = "text-bridge";
  readonly capabilities = {
    startupCost: 1,
    priority: 20,
    deterministic: true,
  };

  readonly rules: HandlerRule[] = textRules();

  async convert(_ctx: HandlerContext, request: ConvertRequest): Promise<HandlerResult> {
    const raw = Buffer.from(await readFile(request.input.path));
    const decoded = decodeIfEncoded(request.inputFormat.id, raw);
    const sourceText = fromStructuredToText(request.inputFormat.id, decoded.toString("utf8"));

    await mkdir(dirname(request.outputPath), { recursive: true });

    const target = request.outputFormat.id;
    if (target === "bin") {
      await writeFile(request.outputPath, decoded);
      return { output: await toFileArtifact(request.outputPath) };
    }

    let outputText: string;
    if (target === "base64") {
      outputText = decoded.toString("base64");
    } else if (target === "hex") {
      outputText = decoded.toString("hex");
    } else if (target === "txt") {
      outputText = sourceText;
    } else if (target === "json") {
      outputText = JSON.stringify({ data: sourceText }, null, 2);
    } else if (target === "xml") {
      outputText = `<root><data><![CDATA[${sourceText}]]></data></root>`;
    } else if (target === "html") {
      outputText = `<html><body><pre>${htmlEscape(sourceText)}</pre></body></html>`;
    } else if (target === "md") {
      outputText = `\`\`\`text\n${sourceText}\n\`\`\``;
    } else if (target === "yaml") {
      const lines = sourceText.split("\n").map((line) => `  ${line}`);
      outputText = `data: |\n${lines.join("\n")}`;
    } else if (target === "csv") {
      const escaped = sourceText.replaceAll('"', '""').replaceAll("\n", " ");
      outputText = `data\n"${escaped}"\n`;
    } else {
      outputText = sourceText;
    }

    await writeFile(request.outputPath, outputText, "utf8");
    return { output: await toFileArtifact(request.outputPath) };
  }
}
