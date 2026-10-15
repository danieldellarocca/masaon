import { COUNTRIES, type ContinentCode } from "./countries";

// [מערב, דרום, מזרח, צפון] במעלות.
export type BBox = [minLng: number, minLat: number, maxLng: number, maxLat: number];

export interface AreaEntry {
  code: string;
  // הגבלה לחלק מהמדינה (למשל רוסיה האירופית בלבד).
  clip?: BBox;
}

export interface MapPreset {
  id: string;
  name: string;
  emoji: string;
  entries: AreaEntry[];
}

// חיתוך ברירת מחדל: בלי טריטוריות מעבר לים שרחוקות מאוד מהמדינה עצמה.
export const DEFAULT_CLIPS: Record<string, BBox> = {
  FR: [-5.5, 41, 10, 51.5], // צרפת היבשתית וקורסיקה
  NO: [4, 57, 32, 71.5], // בלי סבאלבארד
  NL: [3, 50.7, 7.3, 53.7], // בלי האיים הקריביים
};

const EUROPEAN_RUSSIA: BBox = [19, 41, 60, 82];
const ASIAN_RUSSIA: BBox = [60, 40, 180, 82];

const codes = (list: string): AreaEntry[] => list.split(/\s+/).filter(Boolean).map((code) => ({ code }));

const byContinent = (continent: ContinentCode, exclude: string[] = []): AreaEntry[] =>
  COUNTRIES.filter((c) => c.continent === continent && !exclude.includes(c.code)).map((c) => ({ code: c.code }));

export const CONTINENTS: MapPreset[] = [
  {
    id: "europe",
    name: "אירופה",
    emoji: "🏰",
    entries: [...byContinent("EU", ["RU"]), { code: "RU", clip: EUROPEAN_RUSSIA }],
  },
  {
    id: "asia",
    name: "אסיה",
    emoji: "🏯",
    entries: [...byContinent("AS"), { code: "RU", clip: ASIAN_RUSSIA }],
  },
  { id: "africa", name: "אפריקה", emoji: "🦁", entries: byContinent("AF") },
  { id: "north-america", name: "צפון ומרכז אמריקה", emoji: "🗽", entries: byContinent("NA") },
  { id: "south-america", name: "דרום אמריקה", emoji: "🦙", entries: byContinent("SA") },
  { id: "oceania", name: "אוקיאניה", emoji: "🦘", entries: byContinent("OC") },
];

const NORTH_AFRICA = "MA DZ TN LY EG EH";

export const REGIONS: MapPreset[] = [
  { id: "middle-east", name: "המזרח התיכון", emoji: "🕌", entries: codes("IL PS JO LB SY IQ IR TR SA AE QA BH KW OM YE EG CY") },
  { id: "nordic", name: "סקנדינביה והארצות הנורדיות", emoji: "🛶", entries: codes("NO SE DK FI IS FO AX") },
  { id: "british-isles", name: "האיים הבריטיים", emoji: "☕", entries: codes("GB IE IM JE GG") },
  { id: "western-europe", name: "מערב אירופה", emoji: "🥐", entries: codes("FR BE NL LU MC GB IE") },
  { id: "central-europe", name: "מרכז אירופה", emoji: "🥨", entries: codes("DE AT CH LI PL CZ SK HU SI") },
  { id: "southern-europe", name: "דרום אירופה", emoji: "🍝", entries: codes("ES PT AD IT SM VA MT GR CY") },
  { id: "balkans", name: "הבלקן", emoji: "⛰️", entries: codes("SI HR BA RS ME XK MK AL BG RO GR") },
  { id: "baltics", name: "המדינות הבלטיות", emoji: "🌲", entries: codes("EE LV LT") },
  {
    id: "eastern-europe",
    name: "מזרח אירופה",
    emoji: "🪆",
    entries: [...codes("PL UA BY MD RO BG EE LV LT"), { code: "RU", clip: EUROPEAN_RUSSIA }],
  },
  {
    id: "eu",
    name: "האיחוד האירופי",
    emoji: "🇪🇺",
    entries: codes("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE"),
  },
  {
    id: "former-ussr",
    name: "ברית המועצות לשעבר",
    emoji: "☭",
    entries: codes("RU UA BY MD EE LV LT GE AM AZ KZ KG UZ TJ TM"),
  },
  { id: "east-asia", name: "מזרח אסיה", emoji: "🍜", entries: codes("JP KR TW HK MO MN CN KP") },
  { id: "southeast-asia", name: "דרום-מזרח אסיה", emoji: "🛺", entries: codes("TH VN KH LA MM MY SG ID PH BN TL") },
  { id: "south-asia", name: "תת-היבשת ההודית", emoji: "🐘", entries: codes("IN PK BD LK NP BT MV") },
  { id: "central-asia", name: "מרכז אסיה והקווקז", emoji: "🐎", entries: codes("KZ KG UZ TJ TM GE AM AZ MN") },
  { id: "north-africa", name: "צפון אפריקה", emoji: "🐪", entries: codes(NORTH_AFRICA) },
  {
    id: "sub-saharan-africa",
    name: "אפריקה שמדרום לסהרה",
    emoji: "🌍",
    entries: byContinent("AF", NORTH_AFRICA.split(" ")),
  },
  { id: "southern-africa", name: "דרום היבשת האפריקנית", emoji: "🦓", entries: codes("ZA LS SZ BW NA ZW MZ") },
  { id: "east-africa", name: "מזרח אפריקה", emoji: "🦒", entries: codes("KE UG TZ RW BI ET SO DJ ER SS") },
  { id: "west-africa", name: "מערב אפריקה", emoji: "🥁", entries: codes("SN GM GW GN SL LR CI GH TG BJ NG BF ML NE MR CV") },
  { id: "us-canada", name: "ארה״ב וקנדה", emoji: "🍁", entries: codes("US CA") },
  { id: "central-america", name: "מקסיקו ומרכז אמריקה", emoji: "🌮", entries: codes("MX GT BZ SV HN NI CR PA") },
  {
    id: "caribbean",
    name: "הקריביים",
    emoji: "🏝️",
    entries: codes("CU JM HT DO PR BS TT BB LC VC GD AG KN DM AW CW SX MF BL AI VG VI KY TC MS BM"),
  },
  {
    id: "latin-america",
    name: "אמריקה הלטינית",
    emoji: "💃",
    entries: codes("MX GT BZ SV HN NI CR PA CU DO PR CO VE EC PE BO CL AR UY PY BR"),
  },
  { id: "anz", name: "אוסטרליה וניו זילנד", emoji: "🐨", entries: codes("AU NZ") },
  {
    id: "pacific-islands",
    name: "איי האוקיינוס השקט",
    emoji: "🌺",
    entries: byContinent("OC", ["AU", "NZ"]),
  },
  {
    id: "spanish",
    name: "ארצות דוברות ספרדית",
    emoji: "🗣️",
    entries: codes("ES MX GT HN SV NI CR PA CU DO PR CO VE EC PE BO CL AR UY PY GQ"),
  },
  {
    id: "english",
    name: "ארצות דוברות אנגלית",
    emoji: "💂",
    entries: codes("US CA GB IE AU NZ IM JE GG BM JM BS BB TT"),
  },
  {
    id: "arabic",
    name: "העולם הערבי",
    emoji: "🌙",
    entries: codes("JO AE QA OM BH KW SA IQ SY LB PS EG LY TN DZ MA YE SD MR"),
  },
  {
    id: "portuguese",
    name: "ארצות דוברות פורטוגזית",
    emoji: "⚽",
    entries: codes("PT BR AO MZ CV GW ST TL"),
  },
];

export const ALL_PRESETS: MapPreset[] = [...CONTINENTS, ...REGIONS];

export const PRESET_BY_ID: Record<string, MapPreset> = Object.fromEntries(ALL_PRESETS.map((p) => [p.id, p]));
