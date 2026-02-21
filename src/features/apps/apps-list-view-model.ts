import { FetchAppsUseCase } from "../../domain/use-cases/fetch-apps-use-case.js";
import { initialAppsListViewState, type AppsListViewState } from "./apps-list-view-state.js";

export type AppsListListener = (state: AppsListViewState) => void;

export class AppsListViewModel {
  private state: AppsListViewState = initialAppsListViewState;
  private readonly listeners = new Set<AppsListListener>();

  public constructor(private readonly fetchAppsUseCase: FetchAppsUseCase) {}

  public get snapshot(): AppsListViewState {
    return this.state;
  }

  public subscribe(listener: AppsListListener): () => void {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public async refresh(): Promise<void> {
    if (this.state.status === "loading") {
      return;
    }

    this.setState({
      status: "loading",
      apps: this.state.apps,
      errorMessage: null
    });

    try {
      const apps = await this.fetchAppsUseCase.execute();
      const sortedApps = [...apps].sort((left, right) =>
        left.name.localeCompare(right.name)
      );

      this.setState({
        status: "loaded",
        apps: sortedApps,
        errorMessage: null
      });
    } catch (error) {
      this.setState({
        status: "error",
        apps: this.state.apps,
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  public async loadApps(): Promise<AppsListViewState> {
    await this.refresh();
    return this.state;
  }

  private setState(nextState: AppsListViewState): void {
    this.state = nextState;

    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
