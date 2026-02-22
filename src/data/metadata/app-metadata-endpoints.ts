import { InfrastructureError } from "../../core/errors.js";
import type {
  UpdateAppInfoLocalizationInput,
  UpdateAppStoreVersionLocalizationInput
} from "../../domain/repositories/app-metadata-repository.js";
import type { HttpRequest } from "../http/http-client.js";

export function createListAppInfoLocalizationsRequest(appInfoId: string): HttpRequest {
  return {
    method: "GET",
    path: `/v1/appInfos/${appInfoId}/appInfoLocalizations`
  };
}

export function createUpdateAppInfoLocalizationRequest(
  input: UpdateAppInfoLocalizationInput
): HttpRequest {
  const attributes = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {})
  };

  if (Object.keys(attributes).length === 0) {
    throw new InfrastructureError(
      "At least one app info localization field is required for update."
    );
  }

  return {
    method: "PATCH",
    path: `/v1/appInfoLocalizations/${input.appInfoLocalizationId}`,
    body: {
      data: {
        type: "appInfoLocalizations",
        id: input.appInfoLocalizationId,
        attributes
      }
    }
  };
}

export function createListAppStoreVersionLocalizationsRequest(
  appStoreVersionId: string
): HttpRequest {
  return {
    method: "GET",
    path: `/v1/appStoreVersions/${appStoreVersionId}/appStoreVersionLocalizations`
  };
}

export function createUpdateAppStoreVersionLocalizationRequest(
  input: UpdateAppStoreVersionLocalizationInput
): HttpRequest {
  const attributes = {
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.keywords !== undefined ? { keywords: input.keywords } : {})
  };

  if (Object.keys(attributes).length === 0) {
    throw new InfrastructureError(
      "At least one app store version localization field is required for update."
    );
  }

  return {
    method: "PATCH",
    path: `/v1/appStoreVersionLocalizations/${input.appStoreVersionLocalizationId}`,
    body: {
      data: {
        type: "appStoreVersionLocalizations",
        id: input.appStoreVersionLocalizationId,
        attributes
      }
    }
  };
}
