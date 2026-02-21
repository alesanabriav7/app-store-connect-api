import { describe, expect, it } from "vitest";

import { FetchAppsUseCase } from "../../src/domain/use-cases/fetch-apps-use-case.js";
import { AppsListViewModel } from "../../src/features/apps/apps-list-view-model.js";

describe("AppsListViewModel", () => {
  it("emits idle -> loading -> loaded and sorts apps by name", async () => {
    const snapshots: string[] = [];
    const viewModel = new AppsListViewModel(
      new FetchAppsUseCase({
        listApps: async () => [
          { id: "2", name: "Zulu", bundleId: "com.example.zulu" },
          { id: "1", name: "Alpha", bundleId: "com.example.alpha" }
        ]
      })
    );

    const unsubscribe = viewModel.subscribe((state) => {
      snapshots.push(state.status);
    });

    await viewModel.refresh();
    unsubscribe();

    expect(snapshots).toEqual(["idle", "loading", "loaded"]);
    expect(viewModel.snapshot.apps.map((item) => item.name)).toEqual([
      "Alpha",
      "Zulu"
    ]);
  });

  it("moves to error state and keeps last successful data", async () => {
    let callCount = 0;

    const viewModel = new AppsListViewModel(
      new FetchAppsUseCase({
        listApps: async () => {
          callCount += 1;

          if (callCount === 1) {
            return [
              {
                id: "1",
                name: "Finance",
                bundleId: "com.example.finance"
              }
            ];
          }

          throw new Error("API unavailable");
        }
      })
    );

    await viewModel.refresh();
    await viewModel.refresh();

    expect(viewModel.snapshot.status).toBe("error");
    expect(viewModel.snapshot.apps).toHaveLength(1);
    expect(viewModel.snapshot.errorMessage).toBe("API unavailable");
  });
});
