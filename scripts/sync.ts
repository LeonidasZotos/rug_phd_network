import nextEnv from "@next/env";

async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const dryRun = process.argv.includes("--dry-run");
  const [{ getConfig }, { readSnapshot }, { previewSheetSync, syncSheet }] = await Promise.all([
    import("@/lib/server/config"),
    import("@/lib/server/db"),
    import("@/lib/server/sync")
  ]);
  const config = getConfig();
  if (!config.liveMode) {
    console.log("Live Google Sheets configuration is not present; demonstration data remains active.");
    return;
  }
  if (dryRun) {
    const people = await previewSheetSync();
    console.log(`Dry run complete: ${people.length} public profiles validated. The live snapshot was not replaced.`);
    return;
  }
  await syncSheet();
  const snapshot = readSnapshot();
  console.log(`Sync complete: ${snapshot?.people.length ?? 0} public profiles published to the local snapshot.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error && /^[a-z][a-z0-9_:-]{0,100}$/.test(error.message)
    ? ` (${error.message})`
    : "";
  console.error(`Sync failed${message}. No public snapshot was replaced.`);
  process.exitCode = 1;
});
