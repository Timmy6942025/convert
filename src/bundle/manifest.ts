export interface PlatformManifest {
  bins: Record<string, string>;
  wasm?: string[];
  libs?: string[];
}

export interface BundleManifest {
  version: string;
  platforms: Record<string, PlatformManifest>;
}
