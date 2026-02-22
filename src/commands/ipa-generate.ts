import { resolveIpaArtifact, type IpaSource } from "../ipa/artifact.js";
import { verifyIpa } from "../ipa/preflight.js";

export async function ipaGenerateCommand(command: {
  readonly outputIpaPath: string;
  readonly ipaSource: Exclude<IpaSource, { kind: "prebuilt" }>;
  readonly json: boolean;
}): Promise<number> {
  const artifact = await resolveIpaArtifact(command.ipaSource);

  try {
    const report = await verifyIpa({ ipaPath: artifact.ipaPath });

    if (command.json) {
      console.log(
        JSON.stringify(
          {
            outputIpaPath: command.outputIpaPath,
            report
          },
          null,
          2
        )
      );
    } else {
      console.log(`Generated IPA: ${command.outputIpaPath}`);
      console.log(`Bundle ID: ${report.bundleId ?? "unknown"}`);
      console.log(`Version: ${report.version ?? "unknown"} (${report.buildNumber ?? "unknown"})`);
      console.log(`SHA-256: ${report.sha256 ?? "unavailable"}`);
      console.log(`Signing validated: ${report.signingValidated ? "yes" : "no"}`);
    }

    if (report.errors.length > 0) {
      report.errors.forEach((line) => console.error(`- ${line}`));
      return 1;
    }

    return 0;
  } finally {
    if (artifact.dispose) {
      await artifact.dispose();
    }
  }
}
