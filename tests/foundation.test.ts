import { describe, expect, it } from "vitest";
import { FetchAppsUseCase } from "../src/domain/use-cases/fetch-apps-use-case.js";

describe("FetchAppsUseCase", () => {
  it("delegates to the repository", async () => {
    const useCase = new FetchAppsUseCase({
      listApps: async () => [
        {
          id: "1",
          name: "Example",
          bundleId: "com.example.app"
        }
      ]
    });

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]?.bundleId).toBe("com.example.app");
  });
});
