import { describe, expect, it } from "vitest";

import { InfrastructureError } from "../../src/core/errors.js";
import { parseCliCommand } from "../../src/cli/command-parser.js";

describe("parseCliCommand", () => {
  it("parses builds upload command with prebuilt ipa source", () => {
    const command = parseCliCommand([
      "builds",
      "upload",
      "--app",
      "com.example.demo",
      "--version",
      "1.2.3",
      "--build-number",
      "45",
      "--ipa",
      "./Demo.ipa",
      "--wait-processing",
      "--json"
    ]);

    expect(command).toEqual({
      kind: "builds-upload",
      appReference: "com.example.demo",
      version: "1.2.3",
      buildNumber: "45",
      waitProcessing: true,
      apply: false,
      json: true,
      ipaSource: {
        kind: "prebuilt",
        ipaPath: "./Demo.ipa"
      }
    });
  });

  it("throws when ipa and generation flags are mixed", () => {
    expect(() =>
      parseCliCommand([
        "builds",
        "upload",
        "--app",
        "com.example.demo",
        "--version",
        "1.2.3",
        "--build-number",
        "45",
        "--ipa",
        "./Demo.ipa",
        "--scheme",
        "Demo",
        "--export-options-plist",
        "./ExportOptions.plist",
        "--workspace-path",
        "./Demo.xcworkspace"
      ])
    ).toThrowError(InfrastructureError);
  });

  it("throws when both workspace and project are provided", () => {
    expect(() =>
      parseCliCommand([
        "builds",
        "upload",
        "--app",
        "com.example.demo",
        "--version",
        "1.2.3",
        "--build-number",
        "45",
        "--scheme",
        "Demo",
        "--export-options-plist",
        "./ExportOptions.plist",
        "--workspace-path",
        "./Demo.xcworkspace",
        "--project-path",
        "./Demo.xcodeproj"
      ])
    ).toThrowError(InfrastructureError);
  });

  it("parses ipa generate command with custom build command source", () => {
    const command = parseCliCommand([
      "ipa",
      "generate",
      "--output-ipa",
      "./dist/Demo.ipa",
      "--build-command",
      "make build-ipa",
      "--generated-ipa-path",
      "./build/Demo.ipa"
    ]);

    expect(command).toEqual({
      kind: "ipa-generate",
      json: false,
      outputIpaPath: "./dist/Demo.ipa",
      ipaSource: {
        kind: "customCommand",
        buildCommand: "make build-ipa",
        generatedIpaPath: "./build/Demo.ipa",
        outputIpaPath: "./dist/Demo.ipa"
      }
    });
  });
});
