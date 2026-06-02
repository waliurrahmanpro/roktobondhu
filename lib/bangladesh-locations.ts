import locationsData from "@/lib/data/bangladesh-locations.json";

export type BangladeshLocationsData = {
  divisions: string[];
  districtsByDivision: Record<string, string[]>;
  upazilasByDistrict: Record<string, string[]>;
  aliases: {
    divisions: Record<string, string>;
    districts: Record<string, string>;
  };
};

const data = locationsData as BangladeshLocationsData;

export const BANGLADESH_DIVISIONS = data.divisions;

export function getDistrictsForDivision(division: string): string[] {
  const resolved = resolveDivisionName(division);
  if (!resolved) return [];
  return data.districtsByDivision[resolved] ?? [];
}

export function getUpazilasForDistrict(district: string): string[] {
  const resolved = resolveDistrictName(district);
  if (!resolved) return [];
  return data.upazilasByDistrict[resolved] ?? [];
}

export function resolveDivisionName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (data.divisions.includes(trimmed)) return trimmed;
  const alias = data.aliases.divisions[trimmed];
  if (alias && data.divisions.includes(alias)) return alias;
  const ci = data.divisions.find(
    (d) => d.toLowerCase() === trimmed.toLowerCase()
  );
  return ci ?? null;
}

export function resolveDistrictName(
  divisionOrDistrict: string,
  districtMaybe?: string
): string | null {
  const distInput = (districtMaybe ?? divisionOrDistrict).trim();
  const allDistricts = Object.values(data.districtsByDivision).flat();

  const matchInList = (list: string[]) => {
    if (list.includes(distInput)) return distInput;
    const alias = data.aliases.districts[distInput];
    if (alias && list.includes(alias)) return alias;
    const ci = list.find((d) => d.toLowerCase() === distInput.toLowerCase());
    if (ci) return ci;
    return (
      list.find((d) => d.toLowerCase().includes(distInput.toLowerCase())) ?? null
    );
  };

  if (!districtMaybe) {
    return matchInList(allDistricts);
  }

  const div = resolveDivisionName(divisionOrDistrict);
  if (!div) return matchInList(allDistricts);
  return matchInList(getDistrictsForDivision(div));
}

export function resolveUpazilaName(
  district: string,
  upazila: string
): string | null {
  const trimmed = upazila.trim();
  if (!trimmed) return null;
  const dist = resolveDistrictName(district);
  if (!dist) return null;
  const list = getUpazilasForDistrict(dist);
  if (list.includes(trimmed)) return trimmed;
  const ci = list.find((u) => u.toLowerCase() === trimmed.toLowerCase());
  if (ci) return ci;
  const fuzzy = list.find(
    (u) =>
      u.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(u.toLowerCase())
  );
  return fuzzy ?? null;
}

/** Resolve stored profile values to valid dropdown options (legacy free-text support). */
export function resolveLocationDefaults(profile: {
  division?: string;
  district?: string;
  upazila?: string;
}) {
  const division = profile.division
    ? resolveDivisionName(profile.division) ?? profile.division
    : "";
  const district = profile.district
    ? resolveDistrictName(division, profile.district) ??
      resolveDistrictName(profile.district) ??
      profile.district
    : "";
  const upazila =
    district && profile.upazila
      ? resolveUpazilaName(district, profile.upazila) ?? profile.upazila
      : profile.upazila ?? "";

  return { division, district, upazila };
}

export function formatLocationLine(parts: {
  upazila?: string;
  district?: string;
  division?: string;
}) {
  const segments = [parts.upazila, parts.district, parts.division].filter(
    Boolean
  );
  return segments.join(", ");
}
