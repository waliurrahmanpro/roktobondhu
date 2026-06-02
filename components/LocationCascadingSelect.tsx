"use client";

import { useMemo, useState } from "react";
import {
  BANGLADESH_DIVISIONS,
  getDistrictsForDivision,
  getUpazilasForDistrict,
  resolveLocationDefaults,
} from "@/lib/bangladesh-locations";
import { inputClassName, labelClassName } from "@/lib/constants";

type LocationCascadingSelectProps = {
  defaultDivision?: string;
  defaultDistrict?: string;
  defaultUpazila?: string;
  required?: boolean;
  idPrefix?: string;
};

export function LocationCascadingSelect({
  defaultDivision = "",
  defaultDistrict = "",
  defaultUpazila = "",
  required = true,
  idPrefix = "loc",
}: LocationCascadingSelectProps) {
  const resolved = useMemo(
    () =>
      resolveLocationDefaults({
        division: defaultDivision,
        district: defaultDistrict,
        upazila: defaultUpazila,
      }),
    [defaultDivision, defaultDistrict, defaultUpazila]
  );

  const [division, setDivision] = useState(resolved.division);
  const [district, setDistrict] = useState(resolved.district);
  const [upazila, setUpazila] = useState(resolved.upazila);

  const districts = useMemo(
    () => (division ? getDistrictsForDivision(division) : []),
    [division]
  );

  const upazilas = useMemo(
    () => (district ? getUpazilasForDistrict(district) : []),
    [district]
  );

  const req = required ? { required: true } : {};

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor={`${idPrefix}-division`} className={labelClassName}>
            Division
          </label>
          <select
            id={`${idPrefix}-division`}
            name="division"
            value={division}
            onChange={(e) => {
              setDivision(e.target.value);
              setDistrict("");
              setUpazila("");
            }}
            className={inputClassName}
            {...req}
          >
            <option value="" disabled>
              Select division
            </option>
            {BANGLADESH_DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-district`} className={labelClassName}>
            District
          </label>
          <select
            id={`${idPrefix}-district`}
            name="district"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setUpazila("");
            }}
            className={inputClassName}
            disabled={!division}
            {...req}
          >
            <option value="" disabled>
              {division ? "Select district" : "Select division first"}
            </option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            {district &&
              district.length > 0 &&
              !districts.includes(district) && (
                <option value={district}>{district} (saved)</option>
              )}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-upazila`} className={labelClassName}>
            Upazila / Thana
          </label>
          <select
            id={`${idPrefix}-upazila`}
            name="upazila"
            value={upazila}
            onChange={(e) => setUpazila(e.target.value)}
            className={inputClassName}
            disabled={!district}
            {...req}
          >
            <option value="" disabled>
              {district ? "Select upazila" : "Select district first"}
            </option>
            {upazilas.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
            {upazila && upazila.length > 0 && !upazilas.includes(upazila) && (
              <option value={upazila}>{upazila} (saved)</option>
            )}
          </select>
        </div>
      </div>
    </>
  );
}
