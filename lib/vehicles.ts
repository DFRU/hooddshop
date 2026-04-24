/**
 * Vehicle & Mockup Image Data Layer
 * 
 * Two image sources:
 * 1. AI-generated vehicle renders in /public/vehicles/{code}_{type}.webp
 * 2. Printkk product mockups in /public/vehicles/{code}_mockup_{0-5}.webp
 *
 * Each nation has up to 6 mockup views:
 *   0 = Front SUV, 1 = Size Info, 2 = Outdoor 3/4,
 *   3 = Close-up, 4 = Side Angle, 5 = White Car
 */

export type VehicleType = "sedan" | "suv" | "truck" | "hatchback" | "crossover";

export type MockupView = 0 | 1 | 2 | 3;

export const MOCKUP_VIEW_LABELS: Record<MockupView, string> = {
  0: "Front SUV",
  1: "Size Info",
  2: "Outdoor 3/4 View",
  3: "Close-up Detail",
};

export interface VehicleImage {
  nationCode: string;
  vehicleType: VehicleType;
  vehicleName: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface MockupImage {
  nationCode: string;
  view: MockupView;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProductImage {
  nationCode: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * Nations with actual product photography (fabric close-up shots).
 * Files: /public/vehicles/{code}_product.webp — 1200x900
 */
const PRODUCT_PHOTO_NATIONS = new Set([
  "ar", "at", "au", "ba", "be", "br", "ca", "cd", "ch", "ci", "co", "cv",
  "cw", "cz", "de", "dz", "ec", "eg", "es", "fr", "gb-eng", "gb-sct", "gh",
  "hr", "ht", "iq", "ir", "jo", "jp", "kr", "ma", "mx", "nl", "no", "nz",
  "pa", "pt", "py", "qa", "sa", "se", "sn", "tn", "tr", "us", "uy", "uz", "za",
]);

const VEHICLE_NAMES: Record<VehicleType, string> = {
  sedan: "Toyota Camry",
  suv: "Toyota RAV4",
  truck: "Toyota Hilux",
  hatchback: "Volkswagen Golf",
  crossover: "Tesla Model Y",
};

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

/**
 * Nations with Printkk product mockup images available.
 * Value is the number of views (typically 6).
 */
const MOCKUP_NATIONS: Record<string, number> = {
  "ar": 4, "at": 4, "au": 4, "ba": 4, "be": 4, "br": 4,
  "ca": 4, "cd": 4, "ch": 4, "ci": 4, "co": 4, "cv": 4,
  "cw": 4, "cz": 4, "de": 4, "dz": 4, "ec": 4, "eg": 4,
  "es": 4, "fr": 4, "gb-eng": 4, "gb-sct": 4, "gh": 4, "hr": 4,
  "ht": 4, "iq": 4, "ir": 4, "jo": 4, "jp": 4, "kr": 4,
  "ma": 4, "mx": 4, "nl": 4, "no": 4, "nz": 4, "pa": 4,
  "pt": 4, "py": 4, "qa": 4, "sa": 4, "se": 4, "sn": 4,
  "tn": 4, "tr": 4, "us": 4, "uy": 4, "uz": 4, "za": 4,
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

function buildMockup(nationCode: string, nationName: string, view: MockupView = 0, designType?: string): MockupImage {
  // Per-design mockups use: {code}_{designType}_mockup_{view}.webp
  // Original/fallback uses:  {code}_mockup_{view}.webp
  const filename = designType
    ? `/vehicles/${nationCode}_${designType}_mockup_${view}.webp`
    : `/vehicles/${nationCode}_mockup_${view}.webp`;
  return {
    nationCode,
    view,
    src: filename,
    alt: `${nationName} car hood cover ${MOCKUP_VIEW_LABELS[view]} — Hood'd World Cup 2026`,
    width: 1200,
    height: 1200,
  };
}

import { getNation } from "./nations";

/**
 * Get the actual product photo (fabric close-up) for a nation.
 * These are real photography of the printed hood cover material.
 */
export function getProductImage(nationCode: string): ProductImage | null {
  if (!PRODUCT_PHOTO_NATIONS.has(nationCode)) return null;
  const nation = getNation(nationCode);
  if (!nation) return null;
  return {
    nationCode,
    src: `/vehicles/${nationCode}_product.webp`,
    alt: `${nation.name} hood cover print detail — Hood'd World Cup 2026`,
    width: 1200,
    height: 900,
  };
}

/**
 * Get a single Printkk product mockup image for a nation.
 * @param view - 0=front SUV, 1=size info, 2=outdoor 3/4, 3=closeup
 */
export function getMockupImage(nationCode: string, view: MockupView = 0): MockupImage | null {
  const viewCount = MOCKUP_NATIONS[nationCode];
  if (!viewCount || view >= viewCount) return null;
  const nation = getNation(nationCode);
  if (!nation) return null;
  return buildMockup(nationCode, nation.name, view);
}

/**
 * Get all Printkk product mockup images for a nation.
 * Views 0-3 only (views 4+5 removed from project — rendered incorrectly).
 */
const VALID_MOCKUP_VIEWS: MockupView[] = [0, 2, 3, 1];
export function getMockupImages(nationCode: string): MockupImage[] {
  const viewCount = MOCKUP_NATIONS[nationCode];
  if (!viewCount) return [];
  const nation = getNation(nationCode);
  if (!nation) return [];
  return VALID_MOCKUP_VIEWS
    .filter((v) => v < viewCount)
    .map((v) => buildMockup(nationCode, nation.name, v));
}

/**
 * Get all AI-generated vehicle images for a given nation code.
 */
export function getVehicleImages(nationCode: string): VehicleImage[] {
  const types = VEHICLE_MAP[nationCode];
  if (!types) return [];
  const nation = getNation(nationCode);
  const name = nation?.name ?? nationCode;
  return types.map((t) => buildImage(nationCode, t, name));
}

/**
 * Get the primary (hero) image for a nation.
 * Prefers Printkk mockup (front SUV view) if available, falls back to AI render.
 */
export function getHeroVehicleImage(nationCode: string): MockupImage | VehicleImage | null {
  const mockup = getMockupImage(nationCode, 0);
  if (mockup) return mockup;
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
 * Get a diverse set of images for the homepage showcase.
 * Uses different mockup views per nation for visual variety.
 */
export function getShowcaseImages(count: number = 6): (MockupImage | VehicleImage)[] {
  const showcase: (MockupImage | VehicleImage)[] = [];
  // Different view per nation for variety: front SUV, outdoor 3/4, closeup
  const picks: [string, MockupView][] = [
    ["us", 0], ["br", 2], ["gb-eng", 3], ["mx", 0], ["de", 3], ["ar", 0],
    ["fr", 2], ["jp", 0], ["es", 3], ["kr", 2], ["co", 0], ["ma", 2],
  ];
  for (const [code, view] of picks) {
    if (showcase.length >= count) break;
    const mockup = getMockupImage(code, view);
    if (mockup) showcase.push(mockup);
    else {
      const hero = getHeroVehicleImage(code);
      if (hero) showcase.push(hero);
    }
  }
  return showcase;
}

/**
 * Design type keys used in per-design mockup filenames.
 * Maps from Shopify alt-text labels to filesystem slug.
 */
export const DESIGN_TYPE_SLUGS: Record<string, string> = {
  "Original Design": "jersey",
  "Home Jersey Design": "home",
  "Away Jersey Design": "away",
  "Jersey Inspired Full Name": "full",
  "Jersey Inspired Abbreviated": "abbrev",
  "Flag Inspired Design": "flag",
};

/**
 * Check if per-design mockup files exist for a given nation + design slug.
 * Per-design mockups follow the pattern: {code}_{slug}_mockup_{0-5}.webp
 */
export function hasDesignMockup(nationCode: string, designSlug: string): boolean {
  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(process.cwd(), "public", "vehicles", `${nationCode}_${designSlug}_mockup_0.webp`);
  return fs.existsSync(filePath);
}

/**
 * Get mockup images for a specific design variant of a nation.
 * Returns views 0, 1, 2, 3.
 */
export function getMockupImagesForDesign(
  nationCode: string,
  designSlug: string
): MockupImage[] {
  if (!hasDesignMockup(nationCode, designSlug)) return [];

  const views: MockupView[] = [0, 2, 3, 1];
  return views.map((view) => ({
    nationCode,
    view,
    src: `/vehicles/${nationCode}_${designSlug}_mockup_${view}.webp`,
    alt: `${nationCode.toUpperCase()} ${designSlug} design mockup - ${MOCKUP_VIEW_LABELS[view]}`,
    width: 1200,
    height: 1200,
  }));
}
