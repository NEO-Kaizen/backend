import { ErrorResponse, ValidationErrorResponse } from "./common.ts";

import {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "./auth.ts";

import { UserMetrics, UserListItem } from "./user.ts";

import { RequestSummary, RequestDetail } from "./request.ts";

import { QueueMetrics, QueueItem, QueueResponse } from "./queue.ts";

import { TriagemResponse } from "./triage.ts";

import { MappingResponse } from "./mapping.ts";

import { PortalConfig } from "./portal.ts";

import { PrioritizationCriteria } from "./prioritization.ts";

export {
  ErrorResponse,
  ValidationErrorResponse,
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UserMetrics,
  UserListItem,
  RequestSummary,
  RequestDetail,
  QueueMetrics,
  QueueItem,
  QueueResponse,
  TriagemResponse,
  MappingResponse,
  PortalConfig,
  PrioritizationCriteria,
};

export const schemas = {
  ErrorResponse,
  ValidationErrorResponse,
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UserMetrics,
  UserListItem,
  RequestSummary,
  RequestDetail,
  QueueMetrics,
  QueueItem,
  QueueResponse,
  TriagemResponse,
  MappingResponse,
  PortalConfig,
  PrioritizationCriteria,
} as const;
