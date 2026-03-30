import { BundleResolver } from "../../bundle/resolve.ts";
import { runDoctor } from "../../diagnostics/doctor.ts";

export async function runDoctorCommand(json: boolean): Promise<void> {
  const bundle = new BundleResolver();
  const checks = await runDoctor(bundle);

  if (json) {
    console.log(JSON.stringify({ ok: checks.every((item) => item.ok), checks }, null, 2));
    return;
  }

  for (const check of checks) {
    console.log(`${check.ok ? "ok " : "err"} ${check.name.padEnd(16)} ${check.detail}`);
  }
}
