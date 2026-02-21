import { describe, expect, it } from "vitest";

import { parseCliOptions } from "../../src/cli/main.js";

describe("parseCliOptions", () => {
  it("detects help flags", () => {
    expect(parseCliOptions(["--help"]).help).toBe(true);
    expect(parseCliOptions(["-h"]).help).toBe(true);
    expect(parseCliOptions([]).help).toBe(false);
  });
});
