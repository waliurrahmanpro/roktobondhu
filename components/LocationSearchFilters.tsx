"use client";

import { useMemo, useState } from "react";
import {
  BANGLADESH_DIVISIONS,
  getDistrictsForDivision,
  getUpazilasForDistrict,
} from "@/lib/bangladesh-locations";
import { inputClassName } from "@/lib/constants";

export function LocationSearchFilters() {
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");

  const districts = useMemo(
    () => (division ? getDistrictsForDivision(division) : []),
    [division]
  );

  const upazilas = useMemo(
    () => (district ? getUpazilasForDistrict(district) : []),
    [district]
  );

  return (
    <>
      <div>
        <label htmlFor="division" className="mb-2 block text-sm font-medium text-gray-700">
          Division
        </label>
        <select
          id="division"
          name="division"
          value={division}
          onChange={(e) => {
            setDivision(e.target.value);
            setDistrict("");
            setUpazila("");
          }}
          className={inputClassName}
        >
          <option value="">Any division</option>
          {BANGLADESH_DIVISIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="district" className="mb-2 block text-sm font-medium text-gray-700">
          District
        </label>
        <select
          id="district"
          name="district"
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setUpazila("");
          }}
          className={inputClassName}
          disabled={!division}
        >
          <option value="">Any district</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="upazila" className="mb-2 block text-sm font-medium text-gray-700">
          Upazila / Thana
        </label>
        <select
          id="upazila"
          name="upazila"
          value={upazila}
          onChange={(e) => setUpazila(e.target.value)}
          className={inputClassName}
          disabled={!district}
        >
          <option value="">Any upazila</option>
          {upazilas.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
