/**
 * Generates lib/data/bangladesh-locations.json from bd-geodata.
 * Run: node scripts/generate-bangladesh-locations.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "node_modules", "bd-geodata", "data");

const divisions = JSON.parse(
  readFileSync(join(dataDir, "divisions.json"), "utf8")
);
const districts = JSON.parse(
  readFileSync(join(dataDir, "districts.json"), "utf8")
);
const upazilas = JSON.parse(
  readFileSync(join(dataDir, "upazilas.json"), "utf8")
);

const DIVISION_RENAME = {
  Chattagram: "Chattogram",
  Barisal: "Barishal",
};

const DISTRICT_RENAME = {
  "Cox's Bazar": "Cox's Bazar",
  Comilla: "Cumilla",
  Bagerhat: "Bagerhat",
};

function normalizeDivision(name) {
  return DIVISION_RENAME[name] ?? name;
}

function normalizeDistrict(name) {
  return DISTRICT_RENAME[name] ?? name;
}

function normalizeUpazila(name) {
  return name;
}

const divisionIdToName = new Map(
  divisions.map((d) => [d.id, normalizeDivision(d.name)])
);

const districtIdToName = new Map(
  districts.map((d) => [d.id, normalizeDistrict(d.name)])
);

const divisionNames = [...new Set(divisions.map((d) => normalizeDivision(d.name)))].sort(
  (a, b) => a.localeCompare(b)
);

const districtsByDivision = {};
for (const div of divisionNames) {
  districtsByDivision[div] = [];
}

for (const d of districts) {
  const divName = divisionIdToName.get(d.division_id);
  if (!divName) continue;
  const name = normalizeDistrict(d.name);
  if (!districtsByDivision[divName].includes(name)) {
    districtsByDivision[divName].push(name);
  }
}

for (const div of divisionNames) {
  districtsByDivision[div].sort((a, b) => a.localeCompare(b));
}

const upazilasByDistrict = {};
for (const d of districts) {
  const distName = normalizeDistrict(d.name);
  if (!upazilasByDistrict[distName]) {
    upazilasByDistrict[distName] = [];
  }
}

for (const u of upazilas) {
  const distName = districtIdToName.get(u.district_id);
  if (!distName) continue;
  const name = normalizeUpazila(u.name);
  if (!upazilasByDistrict[distName]) {
    upazilasByDistrict[distName] = [];
  }
  if (!upazilasByDistrict[distName].includes(name)) {
    upazilasByDistrict[distName].push(name);
  }
}

for (const dist of Object.keys(upazilasByDistrict)) {
  upazilasByDistrict[dist].sort((a, b) => a.localeCompare(b));
}

const payload = {
  divisions: divisionNames,
  districtsByDivision,
  upazilasByDistrict,
  aliases: {
    divisions: {
      Chattagram: "Chattogram",
      Barisal: "Barishal",
      Chittagong: "Chattogram",
    },
    districts: {
      Comilla: "Cumilla",
    },
  },
};

const outPath = join(root, "lib", "data", "bangladesh-locations.json");
writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");

const divCount = divisionNames.length;
const distCount = Object.values(districtsByDivision).flat().length;
const upaCount = Object.values(upazilasByDistrict).flat().length;

console.log(`Wrote ${outPath}`);
console.log(`${divCount} divisions, ${distCount} districts, ${upaCount} upazilas`);
