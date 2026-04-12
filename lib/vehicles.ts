/**
 * Vehicle Image Data Layer
 * Maps nation codes to AI-generated vehicle render images.
 * Images are stored in /public/vehicles/ as WebP files.
 */

export type VehicleType = "sedan" | "suv" | "truck" | "hatchback" | "crossover";

export interface VehicleImage {
  nationCode: string;
  vehicleType: VehicleType;
  vehicleName: string;
  src: string;        // path relative to /public
  alt: string;
  width: number;
  height: number;
}

const VEHICLE_NAMES: Record<VehicleType, string> = {
  sedan: "Toyota Camry",
  suv: "Toyota RAV4",
  truck: "Toyota Hilux",
  hatchback: "Volkswagen Golf",
  crossover: "Tesla Model Y",
};

/**
 * Raw mapping of nation code → available vehicle types.
 * Built from the 79 generated renders.
 */
const VEHICLE_MAP: Record<string, VehicleType[]> = {
  us: ["sedan", "suv", "truck"],
  ca: ["sedan", "suv", "truck"],
  mx: ["sedan", "suv", "truck"],
  pa: ["hatchback"],
  cw: ["suv"],
  ht: ["sedan"],
  ar: ["sedan", "suv", "truck"],
  br: ["sedan", "suv", "truck"],
  co: ["sedan", "suv", "truck"],
  ec: ["crossover"],
  py: ["truck"],
  uy: ["hatchback"],
  "gb-eng": ["sedan", "suv", "truck"],
  fr: ["sedan", "suv", "truck"],
  de: ["sedan", "suv", "truck"],
  es: ["sedan", "suv", "truck"],
  pt: ["sedan", "suv", "truck"],
  nl: ["sedan", "suv", "truck"],
  be: ["suv"],
  hr: ["sedan"],
  ch: ["crossover"],
  at: ["truck"],
  no: ["hatchback"],
  "gb-sct": ["suv"],
  se: ["sedan"],
  tr: ["crossover"],
  ba: ["truck"],
  cz: ["hatchback"],
  ma: ["sedan", "suv", "truck"],
  sn: ["suv"],
  gh: ["sedan"],
  dz: ["crossover"],
  cv: ["truck"],
  cd: ["hatchback"],
  eg: ["sedan", "suv", "truck"],
  ci: ["suv"],
  za: ["sedan"],
  tn: ["crossover"],
  jp: ["sedan", "suv", "truck"],
  kr: ["sedan", "suv", "truck"],
  au: ["truck"],
  sa: ["hatchback"],
  ir: ["suv"],
  iq: ["sedan"],
  qa: ["truck"],
  uz: ["hatchback"],
  nz: ["suv"],
};

function buildImage(nationCode: string, vehicleType: VehicleType, nationName: string): VehicleImage {
  return {
    nationCode,
    vehicleType,
    vehicleName: VEHICLE_NAMES[vehicleType],
    src: `/vehicles/${nationCode}_${vehicleType}.webp`,
    alt: `${nationName} car hood cover on ${VEHICLE_NAMES[vehicleType]} — Hood'd World Cup 2026`,
    width: 1200,
    height: 900,
  };
}

// Pre-import nation names to build alt text
import { getNation } from "./nations";

/**
 * Get all vehicle images for a given nation code.
 */
export function getVehicleImages(nationCode: string): VehicleImage[] {
  const types = VEHICLE_MAP[nationCode];
  if (!types) return [];
  const nation = getNation(nationCode);
  const name = nation?.name ?? nationCode;
  return types.map((t) => buildImage(nationCode, t, name));
}

/**
 * Get the primary (hero) vehicle image for a nation.
 * Prefers SUV > truck > sedan > others for visual impact.
 */
export function getHeroVehicleImage(nationCode: string): VehicleImage | null {
  const images = getVehicleImages(nationCode);
  if (images.length === 0) return null;
  const priority: VehicleType[] = ["suv", "truck", "sedan", "crossover", "hatchback"];
  for (const type of priority) {
    const match = images.find((img) => img.vehicleType === type);
    if (match) return match;
  }
  return images[0];
}

/**
 * Get a diverse set of vehicle images for the homepage showcase.
 * Returns images across different nations and vehicle types.
 */
export function getShowcaseImages(count: number = 6): VehicleImage[] {
  const showcase: VehicleImage[] = [];
  // Hand-picked for visual diversity: different nations, different vehicles
  const picks: [string, VehicleType][] = [
    ["us", "truck"],
    ["br", "sedan"],
    ["gb-eng", "suv"],
    ["mx", "truck"],
    ["de", "sedan"],
    ["ar", "suv"],
    ["fr", "truck"],
    ["jp", "sedan"],
    ["es", "suv"],
    ["kr", "truck"],
    ["co", "sedan"],
    ["ma", "suv"],
  ];

  for (const [code, type] of picks) {
    if (showcase.length >= count) break;
    const nation = getNation(code);
    if (!nation) continue;
    const types = VEHICLE_MAP[code];
    if (types?.includes(type)) {
      showcase.push(buildImage(code, type, nation.name));
    }
  }
  return showcase;
}

/**
 * Check if a nation has any vehicle images available.
 */
export function hasVehicleImages(nationCode: string): boolean {
  return (VEHICLE_MAP[nationCode]?.length ?? 0) > 0;
}

/**
 * Get all available nation codes with vehicle images.
 */
export function getNationsWithVehicles(): string[] {
  return Object.keys(VEHICLE_MAP);
}
