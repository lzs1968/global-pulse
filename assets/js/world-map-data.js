/** Country-level aggregated approval (demo data, national only) */
export const COUNTRY_RATES = {
  India: { rate: 58.2, votes: 892400, leader: "Narendra Modi" },
  Brazil: { rate: 51.4, votes: 534200, leader: "Lula da Silva" },
  "United Kingdom": { rate: 47.1, votes: 412800, leader: "Winston Churchill" },
  "United States of America": { rate: 41.2, votes: 1024000, leader: "Joe Biden" },
  Singapore: { rate: 66.2, votes: 128450, leader: "Lee Hsien Loong" },
  Germany: { rate: 54.3, votes: 312880, leader: "Angela Merkel" },
  Canada: { rate: 58.1, votes: 94201, leader: "Justin Trudeau" },
  France: { rate: 49.6, votes: 890120, leader: "Emmanuel Macron" },
  Mexico: { rate: 47.8, votes: 67330, leader: "Andrés M. López Obrador" },
  Japan: { rate: 44.2, votes: 556700, leader: "Fumio Kishida" },
  Australia: { rate: 52.8, votes: 198400, leader: "Anthony Albanese" },
  "South Africa": { rate: 46.5, votes: 221000, leader: "Cyril Ramaphosa" },
  Nigeria: { rate: 55.1, votes: 187600, leader: "Bola Tinubu" },
  Indonesia: { rate: 53.6, votes: 445200, leader: "Joko Widodo" },
  China: { rate: null, votes: 0, leader: null },
};

export const LEADER_MARKERS = [
  {
    id: "modi",
    name: "Narendra Modi",
    meta: "Trending +12% today",
    rate: 58.2,
    lat: 28.6139,
    lng: 77.209,
    href: "leader.html",
    seed: "IN",
    color: "1e4f94",
  },
  {
    id: "lula",
    name: "Lula da Silva",
    meta: "Brazil · Current",
    rate: 51.4,
    lat: -15.7801,
    lng: -47.9292,
    href: "leader.html",
    seed: "BR",
    color: "0f7a66",
  },
  {
    id: "churchill",
    name: "Winston Churchill",
    meta: "Historical",
    rate: 47.1,
    lat: 51.5074,
    lng: -0.1278,
    href: "leader.html",
    seed: "EU",
    color: "a67c1a",
  },
  {
    id: "lee",
    name: "Lee Hsien Loong",
    meta: "Singapore · Current",
    rate: 66.2,
    lat: 1.3521,
    lng: 103.8198,
    href: "leader.html",
    seed: "SG",
    color: "1e4f94",
  },
  {
    id: "merkel",
    name: "Angela Merkel",
    meta: "Germany · Historical",
    rate: 54.3,
    lat: 52.52,
    lng: 13.405,
    href: "leader.html",
    seed: "DE",
    color: "a67c1a",
  },
  {
    id: "macron",
    name: "Emmanuel Macron",
    meta: "France · Divided",
    rate: 49.6,
    lat: 48.8566,
    lng: 2.3522,
    href: "leader.html",
    seed: "FR",
    color: "657080",
  },
];

export const GEOJSON_URL = "assets/data/world-countries.geo.json";

export function rateToColor(rate) {
  if (rate == null || Number.isNaN(rate)) return "rgba(90, 100, 110, 0.25)";
  if (rate >= 55) return "rgba(15, 122, 102, 0.55)";
  if (rate >= 50) return "rgba(30, 79, 148, 0.45)";
  if (rate >= 45) return "rgba(101, 112, 128, 0.4)";
  return "rgba(201, 69, 60, 0.5)";
}

export function rateLabel(rate) {
  if (rate == null) return "No aggregate";
  return `${rate.toFixed(1)}% approval`;
}
