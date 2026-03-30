import { FormatRegistry } from "../../formats/registry.ts";

export async function runFormatsCommand(json: boolean): Promise<void> {
  const registry = new FormatRegistry();
  const formats = registry.all().map((format) => ({
    id: format.id,
    extension: format.extension,
    category: format.category,
    name: format.name,
  }));

  if (json) {
    console.log(JSON.stringify({ ok: true, formats }, null, 2));
    return;
  }

  for (const format of formats) {
    console.log(`${format.id.padEnd(8)} .${format.extension.padEnd(6)} ${format.category.join(",")}`);
  }
}
