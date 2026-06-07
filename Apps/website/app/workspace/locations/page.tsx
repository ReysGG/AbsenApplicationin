"use client";

/**
 * app/workspace/locations/page.tsx
 *
 * Halaman Manajemen Lokasi — Location CRUD dengan:
 *  - Leaflet/OSM map picker (via next/dynamic ssr:false)
 *  - Fallback input lat/lng manual
 *  - Confirmation dialog saat ubah radius geofence (R9.7)
 *  - Permission guard: manage_locations, manage_geofence
 *  - Card grid 2-column (lg), 1-column (mobile)
 *
 * Requirements: 9.3, 9.7
 */

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  PowerOff,
  Users,
  AlertTriangle,
  Map,
  Keyboard,
  X,
  AlertCircle,
  Building2,
  GitBranch,
  Home,
} from "lucide-react";
import type {
  Location,
  LocationType,
  LocationStatus,
  LocationFormValues,
  LocationFilters,
  CoordInputMode,
} from "@/types/locations";

// ---------------------------------------------------------------------------
// Leaflet map — loaded client-side only (SSR-safe)
// ---------------------------------------------------------------------------

const LocationMap = dynamic(
  () => import("@/components/dashboard/LocationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] flex items-center justify-center bg-surface-container rounded-lg border border-outline-variant">
        <span className="text-xs text-on-surface-variant">
          Memuat peta…
        </span>
      </div>
    ),
  }
);

// ---------------------------------------------------------------------------
// Zod schema (mirrors backend createLocationSchema / updateLocationSchema)
// ---------------------------------------------------------------------------

const locationFormSchema = z.object({
  name: z
    .string({ required_error: "Nama lokasi wajib diisi" })
    .min(2, "Minimal 2 karakter")
    .max(200, "Maksimal 200 karakter")
    .trim(),
  type: z.enum(["Office", "Branch", "WFHApproved"] as const, {
    required_error: "Tipe lokasi wajib dipilih",
  }),
  address: z.string().max(500).trim().optional().or(z.literal("")),
  latitude: z
    .number({ required_error: "Latitude wajib diisi" })
    .min(-90, "Latitude antara -90 dan 90")
    .max(90, "Latitude antara -90 dan 90"),
  longitude: z
    .number({ required_error: "Longitude wajib diisi" })
    .min(-180, "Longitude antara -180 dan 180")
    .max(180, "Longitude antara -180 dan 180"),
  radiusMeters: z
    .number({ required_error: "Radius wajib diisi" })
    .int("Radius harus bilangan bulat")
    .min(50, "Radius minimal 50 meter")
    .max(500, "Radius maksimal 500 meter"),
  status: z.enum(["Active", "Inactive"] as const),
});

type LocationFormSchema = z.infer<typeof locationFormSchema>;

// ---------------------------------------------------------------------------
// Mock permission helpers (will be replaced by real permission map from /me)
// ---------------------------------------------------------------------------

const CAN_MANAGE_LOCATIONS = true;
const CAN_MANAGE_GEOFENCE = true;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_LOCATIONS: Location[] = [
  {
    id: "loc-001",
    name: "HQ Jakarta",
    type: "Office",
    address: "Jl. Jend. Sudirman No. 21, Senayan, Jakarta Selatan",
    latitude: -6.2088,
    longitude: 106.8456,
    radiusMeters: 150,
    status: "Active",
    assignedEmployeeCount: 45,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "loc-002",
    name: "Bandung R&D Hub",
    type: "Branch",
    address: "Jl. Asia Afrika No. 90, Bandung",
    latitude: -6.9175,
    longitude: 107.6191,
    radiusMeters: 200,
    status: "Active",
    assignedEmployeeCount: 12,
    createdAt: "2024-02-15T00:00:00Z",
  },
  {
    id: "loc-003",
    name: "WFH – Jakarta Selatan",
    type: "WFHApproved",
    address: "Kebayoran Baru, Jakarta Selatan",
    latitude: -6.2607,
    longitude: 106.8109,
    radiusMeters: 100,
    status: "Active",
    assignedEmployeeCount: 8,
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "loc-004",
    name: "Medan Hub (Ditutup)",
    type: "Branch",
    address: "Jl. Balai Kota No. 2, Medan Barat",
    latitude: 3.5952,
    longitude: 98.6782,
    radiusMeters: 250,
    status: "Inactive",
    assignedEmployeeCount: 0,
    createdAt: "2023-11-20T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Type badge config
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  LocationType,
  { label: string; colorClass: string; Icon: React.ElementType }
> = {
  Office: {
    label: "Kantor",
    colorClass:
      "bg-blue-100 text-blue-800 border-blue-200",
    Icon: Building2,
  },
  Branch: {
    label: "Cabang",
    colorClass:
      "bg-orange-100 text-orange-800 border-orange-200",
    Icon: GitBranch,
  },
  WFHApproved: {
    label: "WFH",
    colorClass:
      "bg-purple-100 text-purple-800 border-purple-200",
    Icon: Home,
  },
};

// ---------------------------------------------------------------------------
// Radius default by type
// ---------------------------------------------------------------------------

function defaultRadiusByType(type: LocationType): number {
  return type === "WFHApproved" ? 150 : 100;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function LocationsPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [filters, setFilters] = useState<LocationFilters>({
    search: "",
    status: "Active",
    type: "all",
  });

  // Dialog state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] =
    useState<Location | null>(null);

  // Radius confirmation dialog (R9.7)
  const [showRadiusConfirmDialog, setShowRadiusConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] =
    useState<LocationFormSchema | null>(null);

  // Coordinate picker mode
  const [coordMode, setCoordMode] = useState<CoordInputMode>("map");

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<LocationFormSchema>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      type: "Office",
      radiusMeters: 100,
      status: "Active",
    },
  });

  const watchedLat = watch("latitude");
  const watchedLng = watch("longitude");
  const watchedRadius = watch("radiusMeters");
  const watchedType = watch("type");

  // ---------------------------------------------------------------------------
  // Filtered locations
  // ---------------------------------------------------------------------------
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchSearch = loc.name
        .toLowerCase()
        .includes(filters.search.toLowerCase());
      const matchStatus =
        filters.status === "all" || loc.status === filters.status;
      const matchType = filters.type === "all" || loc.type === filters.type;
      return matchSearch && matchStatus && matchType;
    });
  }, [locations, filters]);

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------
  const stats = useMemo(
    () => ({
      total: locations.length,
      active: locations.filter((l) => l.status === "Active").length,
      totalAssigned: locations.reduce(
        (sum, l) => sum + l.assignedEmployeeCount,
        0
      ),
    }),
    [locations]
  );

  // ---------------------------------------------------------------------------
  // Dialog openers
  // ---------------------------------------------------------------------------
  function openCreateDialog() {
    setEditingLocation(null);
    reset({
      name: "",
      type: "Office",
      address: "",
      latitude: undefined,
      longitude: undefined,
      radiusMeters: 100,
      status: "Active",
    });
    setCoordMode("map");
    setShowFormDialog(true);
  }

  function openEditDialog(loc: Location) {
    setEditingLocation(loc);
    reset({
      name: loc.name,
      type: loc.type,
      address: loc.address ?? "",
      latitude: loc.latitude,
      longitude: loc.longitude,
      radiusMeters: loc.radiusMeters,
      status: loc.status,
    });
    setCoordMode("map");
    setShowFormDialog(true);
  }

  function closeFormDialog() {
    setShowFormDialog(false);
    setEditingLocation(null);
    setPendingFormData(null);
  }

  // ---------------------------------------------------------------------------
  // Form submit
  // ---------------------------------------------------------------------------
  function onFormSubmit(data: LocationFormSchema) {
    // R9.7: If editing and radius changed → show confirmation dialog
    if (
      editingLocation &&
      data.radiusMeters !== editingLocation.radiusMeters
    ) {
      setPendingFormData(data);
      setShowRadiusConfirmDialog(true);
      return;
    }

    applyFormData(data);
  }

  function applyFormData(data: LocationFormSchema) {
    if (editingLocation) {
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === editingLocation.id
            ? {
                ...loc,
                name: data.name,
                type: data.type as LocationType,
                address: data.address || undefined,
                latitude: data.latitude,
                longitude: data.longitude,
                radiusMeters: data.radiusMeters,
                status: data.status as LocationStatus,
              }
            : loc
        )
      );
    } else {
      const newLoc: Location = {
        id: `loc-${Date.now()}`,
        name: data.name,
        type: data.type as LocationType,
        address: data.address || undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters,
        status: data.status as LocationStatus,
        assignedEmployeeCount: 0,
        createdAt: new Date().toISOString(),
      };
      setLocations((prev) => [...prev, newLoc]);
    }
    closeFormDialog();
    setShowRadiusConfirmDialog(false);
    setPendingFormData(null);
  }

  function handleRadiusConfirmOk() {
    if (pendingFormData) {
      applyFormData(pendingFormData);
    }
  }

  // ---------------------------------------------------------------------------
  // Deactivate / Activate
  // ---------------------------------------------------------------------------
  function handleToggleStatus(loc: Location) {
    if (loc.status === "Active") {
      setShowDeactivateDialog(loc);
    } else {
      setLocations((prev) =>
        prev.map((l) =>
          l.id === loc.id ? { ...l, status: "Active" } : l
        )
      );
    }
  }

  function confirmDeactivate() {
    if (!showDeactivateDialog) return;
    setLocations((prev) =>
      prev.map((l) =>
        l.id === showDeactivateDialog.id ? { ...l, status: "Inactive" } : l
      )
    );
    setShowDeactivateDialog(null);
  }

  // ---------------------------------------------------------------------------
  // Map coordinate selection handler
  // ---------------------------------------------------------------------------
  function handleMapCoordSelect(lat: number, lng: number) {
    setValue("latitude", parseFloat(lat.toFixed(6)));
    setValue("longitude", parseFloat(lng.toFixed(6)));
  }

  // ---------------------------------------------------------------------------
  // When type changes, update default radius
  // ---------------------------------------------------------------------------
  function handleTypeChange(type: LocationType) {
    setValue("type", type);
    if (!editingLocation) {
      setValue("radiusMeters", defaultRadiusByType(type));
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-title-xxl text-primary font-bold tracking-tight">
            Manajemen Lokasi
          </h2>
          <p className="text-xs text-on-surface-variant font-medium">
            Kelola lokasi kerja, tipe, koordinat, dan radius geofence.
          </p>
        </div>
        {CAN_MANAGE_LOCATIONS && (
          <button
            onClick={openCreateDialog}
            className="h-9 px-4 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-2"
            aria-label="Tambah lokasi baru"
          >
            <Plus size={14} />
            Tambah Lokasi
          </button>
        )}
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
              Total Lokasi
            </span>
            <p className="text-xl font-bold text-on-surface">{stats.total}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin size={16} className="text-primary" />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
              Lokasi Aktif
            </span>
            <p className="text-xl font-bold text-emerald-600">{stats.active}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <MapPin size={16} className="text-emerald-600" />
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
              Total Karyawan
            </span>
            <p className="text-xl font-bold text-on-surface">
              {stats.totalAssigned}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Users size={16} className="text-blue-600" />
          </div>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-2.5 text-on-surface-variant"
            size={15}
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            placeholder="Cari nama lokasi..."
            aria-label="Cari lokasi"
            className="w-full h-9 pl-9 pr-4 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:ml-auto">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-on-surface-variant">
              Status:
            </span>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: e.target.value as LocationStatus | "all",
                }))
              }
              aria-label="Filter status lokasi"
              className="h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="Active">Aktif</option>
              <option value="Inactive">Nonaktif</option>
              <option value="all">Semua</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-on-surface-variant">
              Tipe:
            </span>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  type: e.target.value as LocationType | "all",
                }))
              }
              aria-label="Filter tipe lokasi"
              className="h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="all">Semua Tipe</option>
              <option value="Office">Kantor</option>
              <option value="Branch">Cabang</option>
              <option value="WFHApproved">WFH</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Location Cards Grid ─────────────────────────────────────── */}
      {filteredLocations.length === 0 ? (
        /* Empty state (R19.9) */
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">
          <MapPin size={40} className="text-on-surface-variant/40" />
          <div className="text-center">
            <p className="text-sm font-bold text-on-surface-variant">
              Belum ada lokasi
            </p>
            <p className="text-xs text-on-surface-variant/60 mt-1">
              {filters.search || filters.status !== "Active" || filters.type !== "all"
                ? "Tidak ada lokasi yang sesuai filter."
                : "Tambahkan lokasi pertama untuk memulai."}
            </p>
          </div>
          {CAN_MANAGE_LOCATIONS && !filters.search && (
            <button
              onClick={openCreateDialog}
              className="mt-2 h-9 px-4 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/95 transition-colors flex items-center gap-2"
            >
              <Plus size={14} />
              Tambah Lokasi
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLocations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              canManage={CAN_MANAGE_LOCATIONS}
              canManageGeofence={CAN_MANAGE_GEOFENCE}
              onEdit={() => openEditDialog(loc)}
              onToggleStatus={() => handleToggleStatus(loc)}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit Dialog ───────────────────────────────────────── */}
      {showFormDialog && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loc-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeFormDialog();
          }}
        >
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col my-8">
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container/40">
              <h3
                id="loc-dialog-title"
                className="text-sm font-bold text-on-surface"
              >
                {editingLocation ? "Edit Lokasi" : "Tambah Lokasi"}
              </h3>
              <button
                onClick={closeFormDialog}
                aria-label="Tutup dialog"
                className="h-7 w-7 rounded-md border border-outline-variant hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Dialog Body */}
            <form
              id="location-form"
              onSubmit={handleSubmit(onFormSubmit)}
              className="px-6 py-5 space-y-5 overflow-y-auto"
            >
              {/* Name */}
              <div className="space-y-1">
                <label
                  htmlFor="loc-name"
                  className="text-xs font-semibold text-on-surface"
                >
                  Nama Lokasi <span className="text-error">*</span>
                </label>
                <input
                  id="loc-name"
                  type="text"
                  {...register("name")}
                  placeholder="contoh: HQ Jakarta"
                  className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "loc-name-err" : undefined}
                />
                {errors.name && (
                  <p id="loc-name-err" className="text-[11px] text-error">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Type + Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="loc-type"
                    className="text-xs font-semibold text-on-surface"
                  >
                    Tipe Lokasi <span className="text-error">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <select
                        id="loc-type"
                        value={field.value}
                        onChange={(e) =>
                          handleTypeChange(e.target.value as LocationType)
                        }
                        className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                        aria-invalid={!!errors.type}
                      >
                        <option value="Office">Kantor (Office)</option>
                        <option value="Branch">Cabang (Branch)</option>
                        <option value="WFHApproved">WFH Disetujui</option>
                      </select>
                    )}
                  />
                  {errors.type && (
                    <p className="text-[11px] text-error">
                      {errors.type.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="loc-status"
                    className="text-xs font-semibold text-on-surface"
                  >
                    Status
                  </label>
                  <select
                    id="loc-status"
                    {...register("status")}
                    className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                  >
                    <option value="Active">Aktif</option>
                    <option value="Inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label
                  htmlFor="loc-address"
                  className="text-xs font-semibold text-on-surface"
                >
                  Alamat
                </label>
                <input
                  id="loc-address"
                  type="text"
                  {...register("address")}
                  placeholder="Masukkan alamat lengkap (opsional)"
                  className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              {/* ── Koordinat Section ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface">
                    Koordinat <span className="text-error">*</span>
                  </label>
                  {/* Toggle picker mode */}
                  <div
                    className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg border border-outline-variant"
                    role="group"
                    aria-label="Pilih mode input koordinat"
                  >
                    <button
                      type="button"
                      onClick={() => setCoordMode("map")}
                      className={`h-7 px-3 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                        coordMode === "map"
                          ? "bg-primary text-white"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      aria-pressed={coordMode === "map"}
                    >
                      <Map size={11} />
                      Pilih dari peta
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoordMode("manual")}
                      className={`h-7 px-3 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                        coordMode === "manual"
                          ? "bg-primary text-white"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      aria-pressed={coordMode === "manual"}
                    >
                      <Keyboard size={11} />
                      Input manual
                    </button>
                  </div>
                </div>

                {/* Leaflet Map Picker */}
                {coordMode === "map" && (
                  <div className="space-y-2">
                    <LocationMap
                      lat={
                        typeof watchedLat === "number" && !isNaN(watchedLat)
                          ? watchedLat
                          : undefined
                      }
                      lng={
                        typeof watchedLng === "number" && !isNaN(watchedLng)
                          ? watchedLng
                          : undefined
                      }
                      radius={watchedRadius ?? 100}
                      onCoordinateSelect={handleMapCoordSelect}
                      readOnly={false}
                      height="280px"
                    />
                    <p className="text-[11px] text-on-surface-variant">
                      Klik pada peta untuk memilih koordinat. Atau gunakan{" "}
                      <button
                        type="button"
                        onClick={() => setCoordMode("manual")}
                        className="text-primary underline"
                      >
                        input manual
                      </button>{" "}
                      sebagai fallback.
                    </p>
                    {/* Show selected coords */}
                    {typeof watchedLat === "number" &&
                      typeof watchedLng === "number" && (
                        <div className="flex gap-3 text-[11px] font-mono text-on-surface bg-surface-container px-3 py-2 rounded-lg border border-outline-variant">
                          <span>
                            Lat:{" "}
                            <strong>{watchedLat.toFixed(6)}</strong>
                          </span>
                          <span>
                            Lng:{" "}
                            <strong>{watchedLng.toFixed(6)}</strong>
                          </span>
                        </div>
                      )}
                  </div>
                )}

                {/* Manual coordinate input (R9.3 fallback) */}
                {coordMode === "manual" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label
                        htmlFor="loc-lat"
                        className="text-xs font-semibold text-on-surface"
                      >
                        Latitude
                      </label>
                      <input
                        id="loc-lat"
                        type="number"
                        step="any"
                        {...register("latitude", { valueAsNumber: true })}
                        placeholder="-6.208763"
                        className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden font-mono"
                        aria-invalid={!!errors.latitude}
                        aria-describedby={
                          errors.latitude ? "loc-lat-err" : undefined
                        }
                      />
                      {errors.latitude && (
                        <p id="loc-lat-err" className="text-[11px] text-error">
                          {errors.latitude.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="loc-lng"
                        className="text-xs font-semibold text-on-surface"
                      >
                        Longitude
                      </label>
                      <input
                        id="loc-lng"
                        type="number"
                        step="any"
                        {...register("longitude", { valueAsNumber: true })}
                        placeholder="106.845599"
                        className="w-full h-9 px-3 border border-outline-variant rounded-lg text-xs font-semibold bg-surface focus:ring-1 focus:ring-primary focus:outline-hidden font-mono"
                        aria-invalid={!!errors.longitude}
                        aria-describedby={
                          errors.longitude ? "loc-lng-err" : undefined
                        }
                      />
                      {errors.longitude && (
                        <p id="loc-lng-err" className="text-[11px] text-error">
                          {errors.longitude.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Coordinate validation errors (when mode=map and coords not set) */}
                {(errors.latitude || errors.longitude) &&
                  coordMode === "map" && (
                    <p className="text-[11px] text-error flex items-center gap-1">
                      <AlertCircle size={11} />
                      Klik peta untuk memilih koordinat, atau gunakan input
                      manual.
                    </p>
                  )}
              </div>

              {/* ── Radius Section ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="loc-radius"
                    className="text-xs font-bold text-on-surface"
                  >
                    Radius Geofence <span className="text-error">*</span>
                  </label>
                  <span
                    className={`text-xs font-bold ${
                      watchedRadius < 75 || watchedRadius > 400
                        ? "text-amber-600"
                        : "text-primary"
                    }`}
                  >
                    {watchedRadius} meter
                  </span>
                </div>
                <input
                  id="loc-radius"
                  type="range"
                  min={50}
                  max={500}
                  step={25}
                  {...register("radiusMeters", { valueAsNumber: true })}
                  className="w-full h-2 bg-surface border border-outline-variant rounded-lg appearance-none cursor-pointer accent-primary focus:outline-hidden"
                  aria-valuemin={50}
                  aria-valuemax={500}
                  aria-valuenow={watchedRadius}
                  aria-label="Slider radius geofence"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold">
                  <span>Min 50m</span>
                  <span>WFO: 100m / WFH: 150m</span>
                  <span>Maks 500m</span>
                </div>
                {/* Extreme radius warnings */}
                {watchedRadius <= 75 && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                    <AlertTriangle size={11} />
                    Radius sangat kecil — area geofence terbatas.
                  </p>
                )}
                {watchedRadius >= 400 && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                    <AlertTriangle size={11} />
                    Radius sangat besar — geofence mencakup area luas.
                  </p>
                )}
                {errors.radiusMeters && (
                  <p className="text-[11px] text-error">
                    {errors.radiusMeters.message}
                  </p>
                )}

                {/* Disable radius if no manage_geofence (R9.8, R13.3) */}
                {editingLocation && !CAN_MANAGE_GEOFENCE && (
                  <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                    <AlertCircle size={11} />
                    Anda tidak memiliki izin{" "}
                    <code className="font-mono bg-surface-container px-1 rounded">
                      manage_geofence
                    </code>{" "}
                    — radius tidak dapat diubah.
                  </p>
                )}
              </div>
            </form>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container/30 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeFormDialog}
                className="h-9 px-4 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="location-form"
                className="h-9 px-4 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/95 transition-colors"
              >
                {editingLocation ? "Simpan Perubahan" : "Tambah Lokasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Radius Change Confirmation Dialog (R9.7) ──────────────── */}
      {showRadiusConfirmDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="radius-confirm-title"
          aria-describedby="radius-confirm-desc"
        >
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div>
                <h3
                  id="radius-confirm-title"
                  className="text-sm font-bold text-on-surface"
                >
                  Konfirmasi Ubah Radius Geofence
                </h3>
                <p
                  id="radius-confirm-desc"
                  className="text-xs text-on-surface-variant mt-1 leading-relaxed"
                >
                  Perubahan radius geofence akan berlaku untuk attendance baru.
                  Data historis tidak berubah. Lanjutkan?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRadiusConfirmDialog(false);
                  setPendingFormData(null);
                }}
                className="h-9 px-4 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRadiusConfirmOk}
                className="h-9 px-4 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
              >
                Ya, Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivate Confirmation Dialog ─────────────────────────── */}
      {showDeactivateDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="deactivate-confirm-title"
        >
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center shrink-0">
                <PowerOff size={18} className="text-error" />
              </div>
              <div>
                <h3
                  id="deactivate-confirm-title"
                  className="text-sm font-bold text-on-surface"
                >
                  Nonaktifkan Lokasi
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Nonaktifkan lokasi ini? Lokasi tidak akan bisa dipakai untuk
                  assignment baru.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeactivateDialog(null)}
                className="h-9 px-4 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDeactivate}
                className="h-9 px-4 bg-error text-white rounded-lg text-xs font-semibold hover:bg-error/90 transition-colors"
              >
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LocationCard sub-component
// ---------------------------------------------------------------------------

interface LocationCardProps {
  location: Location;
  canManage: boolean;
  canManageGeofence: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
}

function LocationCard({
  location,
  canManage,
  onEdit,
  onToggleStatus,
}: LocationCardProps) {
  const typeConfig = TYPE_CONFIG[location.type];
  const TypeIcon = typeConfig.Icon;

  return (
    <div
      className={`bg-surface-container-lowest border rounded-2xl overflow-hidden flex flex-col transition-all ${
        location.status === "Inactive"
          ? "border-outline-variant/60 opacity-70"
          : "border-outline-variant hover:border-outline-variant-high"
      }`}
    >
      {/* Map preview */}
      <div className="h-[180px] relative overflow-hidden bg-slate-100">
        <LocationMap
          lat={location.latitude}
          lng={location.longitude}
          radius={location.radiusMeters}
          readOnly={true}
          height="180px"
        />
        {/* Overlay badge */}
        <div className="absolute top-2 left-2 z-10">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeConfig.colorClass}`}
          >
            <TypeIcon size={9} />
            {typeConfig.label}
          </span>
        </div>
        <div className="absolute top-2 right-2 z-10">
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              location.status === "Active"
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
            role="status"
          >
            {location.status === "Active" ? "Aktif" : "Nonaktif"}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Name + coords */}
        <div>
          <h3 className="text-sm font-bold text-on-surface leading-snug">
            {location.name}
          </h3>
          {location.address && (
            <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
              {location.address}
            </p>
          )}
          <p className="text-[11px] font-mono text-on-surface-variant mt-1">
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </p>
        </div>

        {/* Radius + assigned employees */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant">
          <div className="flex items-center gap-1">
            <MapPin size={11} />
            <span>Radius: {location.radiusMeters} m</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={11} />
            <span>{location.assignedEmployeeCount} karyawan</span>
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex gap-2 mt-auto pt-2 border-t border-outline-variant/60">
            <button
              onClick={onEdit}
              aria-label={`Edit lokasi ${location.name}`}
              className="flex-1 h-8 rounded-lg border border-outline-variant hover:bg-surface-container text-[11px] font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit2 size={11} />
              Edit
            </button>
            <button
              onClick={onToggleStatus}
              aria-label={
                location.status === "Active"
                  ? `Nonaktifkan ${location.name}`
                  : `Aktifkan ${location.name}`
              }
              className={`flex-1 h-8 rounded-lg border text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                location.status === "Active"
                  ? "border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-error"
                  : "border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-emerald-600"
              }`}
            >
              <PowerOff size={11} />
              {location.status === "Active" ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
