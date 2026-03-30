import type { FileFormat, FormatDefinition } from "../core/types.ts";
import { COMMON_FORMATS } from "./common.ts";
import { FORMAT_ALIASES } from "./aliases.ts";

export class FormatRegistry {
  private readonly byId = new Map<string, FileFormat>();
  private readonly byAlias = new Map<string, string>();
  private readonly byExtension = new Map<string, string>();

  constructor(definitions: FormatDefinition[] = COMMON_FORMATS) {
    for (const definition of definitions) {
      this.register(definition);
    }

    for (const [alias, id] of Object.entries(FORMAT_ALIASES)) {
      this.byAlias.set(alias.toLowerCase(), id.toLowerCase());
    }
  }

  private register(definition: FormatDefinition): void {
    const id = definition.id.toLowerCase();
    const aliases = (definition.aliases ?? []).map((value) => value.toLowerCase());

    const fileFormat: FileFormat = {
      id,
      name: definition.name,
      extension: definition.extension.toLowerCase(),
      mime: definition.mime[0] ?? "application/octet-stream",
      category: [...definition.category],
      aliases,
    };

    this.byId.set(id, fileFormat);
    this.byExtension.set(fileFormat.extension, id);
    this.byAlias.set(id, id);

    for (const extension of definition.extensions) {
      this.byExtension.set(extension.toLowerCase(), id);
    }

    for (const alias of aliases) {
      this.byAlias.set(alias, id);
    }
  }

  getById(idOrAlias: string): FileFormat | undefined {
    const normalized = idOrAlias.toLowerCase();
    const resolved = this.byAlias.get(normalized) ?? normalized;
    return this.byId.get(resolved);
  }

  getByExtension(extension: string): FileFormat | undefined {
    const normalized = extension.toLowerCase();
    const id = this.byExtension.get(normalized);
    if (!id) {
      return undefined;
    }
    return this.byId.get(id);
  }

  all(): FileFormat[] {
    return [...this.byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  }
}
