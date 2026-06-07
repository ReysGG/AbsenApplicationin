/**
 * types/locations.ts
 *
 * Type definitions for Locations & Geofence pages.
 *
 * Requirements: 9.1–9.15
 */

// ---------------------------------------------------------------------------
// Core Location type (mirrors backend Location model)
// ---------------------------------------------------------------------------

export type LocationType = "Office" | "Branch" | "WFHApproved";
export type LocationStatus = "Active" | "Inactive";

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  address?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: LocationStatus;
  assignedEmployeeCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Form values (React Hook Form + Zod)
// ---------------------------------------------------------------------------

export interface LocationFormValues {
  name: string;
  type: LocationType;
  address?: string;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  status: LocationStatus;
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

export interface LocationFilters {
  search: string;
  status: LocationStatus | "all";
  type: LocationType | "all";
}

// ---------------------------------------------------------------------------
// Coordinate picker mode
// ---------------------------------------------------------------------------

export type CoordInputMode = "map" | "manual";
