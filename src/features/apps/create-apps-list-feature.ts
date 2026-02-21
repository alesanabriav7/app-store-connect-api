import type { AppsRepository } from "../../domain/repositories/apps-repository.js";
import { FetchAppsUseCase } from "../../domain/use-cases/fetch-apps-use-case.js";
import { AppsListViewModel } from "./apps-list-view-model.js";

export function createAppsListViewModel(
  appsRepository: AppsRepository
): AppsListViewModel {
  const fetchAppsUseCase = new FetchAppsUseCase(appsRepository);

  return new AppsListViewModel(fetchAppsUseCase);
}
