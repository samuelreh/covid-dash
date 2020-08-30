import { USStatesByCode } from "./USStates";
import { CanadaProvincesByCode } from "./CanadaProvinces";
import { CountriesByCode } from "./Countries";
import Constants from "lib/Constants";

// TODO these should be in a better place
const LOOPBACK_PORT = process.env["NODE_PORT"] || 3000;
export const BASE_URL =
  process.env["NODE_ENV"] === "development"
    ? process.env["DEV_HOST"] || `http://localhost:${LOOPBACK_PORT}`
    : "https://rt.live";
export const LOOPBACK_BASE_URL =
  process.env["DEV_HOST"] || `http://localhost:${LOOPBACK_PORT}`;
export const CDN_ROOT = "https://d3ic6i8aie5n7e.cloudfront.net/covid";

class ConfigFlags {
  constructor(useYellowInColorCode, allowSharing) {
    this.useYellowInColorCode = useYellowInColorCode;
    this.allowSharing = allowSharing;
  }
}

class Config {
  constructor(
    code,
    title,
    subAreaType,
    dataPath,
    subSets,
    subAreas,
    regionFilterOptions,
    highlightOptions,
    knownIssues = [],
    flags = new ConfigFlags()
  ) {
    this.code = code;
    this.title = title;
    this.subSets = subSets;
    this.subAreaType = subAreaType;
    this.subAreas = subAreas;
    this.regionFilterOptions = regionFilterOptions;
    this.dataURLBase = `${CDN_ROOT}/${dataPath}`;
    this.highlightOptions = highlightOptions;
    this.knownIssues = knownIssues;
    this.flags = flags;
  }

  getURLForShareImageGeneration(subArea) {
    let dt = new Date().getTime();
    return `${BASE_URL}/api/share/card?area=${this.code}&subarea=${subArea}&r=${dt}`;
  }
  getCDNURLForShareImage(subArea, runID) {
    if (!this.subAreas[subArea]) {
      throw new Error(`Invalid subarea: ${subArea}`);
    }
    return `${CDN_ROOT}/covid/shareimg/${this.code}/${subArea}/${runID}.png`;
  }

  getTwitterShareIntentURL(subArea, runID) {
    let shareURL = encodeURIComponent(
      `${BASE_URL}/share/${this.code}/${subArea}?r=${runID}`
    );
    return `https://twitter.com/share/?url=${shareURL}`;
  }

  getSubareasForFilter(filter, data) {
    if (filter === "All") {
      return null;
    }
    let entry = this.subSets[filter];
    if (_.isArray(entry)) {
      return entry;
    } else {
      let result = entry(data);
      return result;
    }
  }
}

function DemoLand() {
  return new Config(
    "demo",
    "DemoLand",
    "State",
    "demo_parsed_for_js5",
    {
      Northern: ["Rivia", "Kaedwen", "Cintra", "Lyria", "Redania"],
      Southern: ["Nilfgaard"],
    },
    {
      RI: "Rivia",
      KA: "Kaedwen",
      CI: "Cintra",
      LY: "Lyria",
      RE: "Redania",
      NI: "Nilfgaard",
    },
    ["All", "Northern", "Southern"],
    ["All", "Northern", "Southern"],
    [],
    new ConfigFlags(true, false)
  );
}

function US() {
  let ussubSets = {
    "Ten Largest": ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI"],
    West: [
      "AK",
      "AZ",
      "CA",
      "CO",
      "HI",
      "ID",
      "MT",
      "NV",
      "NM",
      "OR",
      "UT",
      "WA",
      "WY",
    ],
    Midwest: [
      "IL",
      "IN",
      "IA",
      "KS",
      "MI",
      "MO",
      "MN",
      "NE",
      "ND",
      "OH",
      "SD",
      "WI",
    ],
    South: [
      "AL",
      "AR",
      "DC",
      "FL",
      "GA",
      "KY",
      "LA",
      "MS",
      "OK",
      "NC",
      "SC",
      "TN",
      "TX",
      "VA",
      "WV",
    ],
    Reopened: (data) => {
      let matchingSeries = _.filter(data, (subarea) => {
        return (
          _.findIndex(
            subarea.annotations,
            (o) => o.type === Constants.InterventionTypes.ShelterEnded
          ) >= 0
        );
      });
      return _.map(matchingSeries, (e) => e.identifier);
    },
    "Never Sheltered": (data) => {
      let matchingSeries = _.filter(data, (subarea) => {
        return !_(subarea.annotations).some(
          (e) =>
            e.type === Constants.InterventionTypes.ShelterInPlace ||
            e.type === Constants.InterventionTypes.ShelterEnded
        );
      });
      return _.map(matchingSeries, (e) => e.identifier);
    },
    "N. East": [
      "ME",
      "NH",
      "VT",
      "NY",
      "MA",
      "MD",
      "RI",
      "CT",
      "NJ",
      "PA",
      "DE",
    ],
  };
  ussubSets["Northeast"] = ussubSets["N. East"];
  let knownIssues = [];
  const stateDropdownOptions = [
    "All",
    "Ten Largest",
    "Never Sheltered",
    "Reopened",
    "Northeast",
    "West",
    "Midwest",
    "South",
  ];
  let flags = new ConfigFlags(false, true);
  return new Config(
    "us",
    "U.S.",
    "State",
    "parsed_for_js5",
    ussubSets,
    USStatesByCode,
    [
      "All",
      "Reopened",
      "Never Sheltered",
      "N. East",
      "West",
      "Midwest",
      "South",
    ],
    stateDropdownOptions,
    knownIssues,
    flags
  );
}

function Canada() {
  let flags = new ConfigFlags(false, true);
  return new Config(
    "ca",
    "Canada",
    "Province",
    "parsed_for_js5",
    [],
    CanadaProvincesByCode,
    ["All"],
    [],
    [],
    flags
  );
}

function PageConfigInner() {
  this.us = US();
  this.ca = Canada();
  this.demo = DemoLand();
}

const PageConfig = new PageConfigInner();
export default PageConfig;
