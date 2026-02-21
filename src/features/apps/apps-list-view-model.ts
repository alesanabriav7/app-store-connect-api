import { FetchAppsUseCase } from "../../domain/use-cases/fetch-apps-use-case.js";
import type { AppSummary } from "../../domain/entities/app.js";

export interface AppsListViewState {
  readonly status: "idle" | "loading" | "loaded" | "error";
  readonly apps: readonly AppSummary[];
  readonly errorMessage?: string;
}

const INITIAL_STATE: AppsListViewState = {
  status: "idle",
  apps: []
};

export class AppsListViewModel {
  private state: AppsListViewState = INITIAL_STATE;

  public constructor(private readonly fetchAppsUseCase: FetchAppsUseCase) {}

  public get snapshot(): AppsListViewState {
    return this.state;
  }

  public async loadApps(): Promise<AppsListViewState> {
    this.state = { status: "loading", apps: [] };

    try {
      const apps = await this.fetchAppsUseCase.execute();
      this.state = { status: "loaded", apps };
      return this.state;
    } catch (error) {
      this.state = {
        status: "error",
        apps: [],
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      };
      return this.state;
    }
  }
}
