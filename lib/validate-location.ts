import {
  resolveDistrictName,
  resolveDivisionName,
  resolveUpazilaName,
} from "@/lib/bangladesh-locations";

export type ValidatedLocation = {
  division: string;
  district: string;
  upazila: string;
};

export function validateAndNormalizeLocation(
  division: string,
  district: string,
  upazila: string
): { error?: string; location?: ValidatedLocation } {
  const divTrimmed = division.trim();
  const distTrimmed = district.trim();
  const upaTrimmed = upazila.trim();

  if (!divTrimmed || !distTrimmed || !upaTrimmed) {
    return { error: "Division, district, and upazila are required." };
  }

  const div = resolveDivisionName(divTrimmed) ?? divTrimmed;
  const dist = resolveDistrictName(div, distTrimmed) ?? distTrimmed;
  const upa = resolveUpazilaName(dist, upaTrimmed) ?? upaTrimmed;

  return {
    location: {
      division: div,
      district: dist,
      upazila: upa,
    },
  };
}
