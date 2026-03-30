import { access } from "node:fs/promises";
import { join } from "node:path";
import type { BundleResolver } from "../bundle/resolve.ts";
import type { DoctorCheck } from "../core/types.ts";

async function checkBinary(bundle: BundleResolver, name: string): Promise<DoctorCheck> {
  const resolved = await bundle.resolveBinary(name);
  if (!resolved) {
    return {
      name,
      ok: false,
      detail: "missing",
    };
  }
  return {
    name,
    ok: true,
    detail: resolved,
  };
}

export async function runDoctor(bundle: BundleResolver): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];

  const manifestPath = join(bundle.assetsDir, "manifest.json");
  try {
    await access(manifestPath);
    checks.push({ name: "bundle-manifest", ok: true, detail: manifestPath });
  } catch {
    checks.push({ name: "bundle-manifest", ok: false, detail: `not found at ${manifestPath}` });
  }

  checks.push(await checkBinary(bundle, "ffmpeg"));
  checks.push(await checkBinary(bundle, "pandoc"));
  checks.push(await checkBinary(bundle, "magick"));

  const sevenZip = (await checkBinary(bundle, "7zz")).ok
    ? await checkBinary(bundle, "7zz")
    : await checkBinary(bundle, "7z");
  checks.push({ name: "7zip", ok: sevenZip.ok, detail: sevenZip.detail });

  return checks;
}
