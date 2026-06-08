export const RISK_COLORS = ["#ef5f55", "#3f8bd8", "#e4b83e", "#55a96a"];

export const TERRITORIES = [
  { id: "alaska", name: "Alaska", continent: "North America", x: 8, y: 18, links: ["alberta", "kamchatka"] },
  { id: "alberta", name: "Alberta", continent: "North America", x: 19, y: 27, links: ["alaska", "ontario", "western-us"] },
  { id: "ontario", name: "Ontario", continent: "North America", x: 29, y: 24, links: ["alberta", "western-us", "eastern-us", "greenland"] },
  { id: "greenland", name: "Greenland", continent: "North America", x: 40, y: 12, links: ["ontario", "iceland"] },
  { id: "western-us", name: "Western US", continent: "North America", x: 20, y: 39, links: ["alberta", "ontario", "eastern-us", "central-america"] },
  { id: "eastern-us", name: "Eastern US", continent: "North America", x: 32, y: 39, links: ["ontario", "western-us", "central-america"] },
  { id: "central-america", name: "Central America", continent: "North America", x: 27, y: 52, links: ["western-us", "eastern-us", "venezuela"] },
  { id: "venezuela", name: "Venezuela", continent: "South America", x: 35, y: 62, links: ["central-america", "peru", "brazil"] },
  { id: "peru", name: "Peru", continent: "South America", x: 39, y: 75, links: ["venezuela", "brazil", "argentina"] },
  { id: "brazil", name: "Brazil", continent: "South America", x: 48, y: 67, links: ["venezuela", "peru", "argentina", "north-africa"] },
  { id: "argentina", name: "Argentina", continent: "South America", x: 43, y: 88, links: ["peru", "brazil"] },
  { id: "iceland", name: "Iceland", continent: "Europe", x: 53, y: 20, links: ["greenland", "great-britain", "scandinavia"] },
  { id: "great-britain", name: "Great Britain", continent: "Europe", x: 55, y: 31, links: ["iceland", "scandinavia", "western-europe"] },
  { id: "scandinavia", name: "Scandinavia", continent: "Europe", x: 65, y: 23, links: ["iceland", "great-britain", "ukraine"] },
  { id: "western-europe", name: "Western Europe", continent: "Europe", x: 59, y: 41, links: ["great-britain", "ukraine", "north-africa"] },
  { id: "ukraine", name: "Ukraine", continent: "Europe", x: 70, y: 36, links: ["scandinavia", "western-europe", "ural", "middle-east"] },
  { id: "north-africa", name: "North Africa", continent: "Africa", x: 60, y: 57, links: ["western-europe", "brazil", "egypt", "congo"] },
  { id: "egypt", name: "Egypt", continent: "Africa", x: 70, y: 54, links: ["north-africa", "congo", "middle-east"] },
  { id: "congo", name: "Congo", continent: "Africa", x: 66, y: 70, links: ["north-africa", "egypt", "south-africa"] },
  { id: "south-africa", name: "South Africa", continent: "Africa", x: 70, y: 85, links: ["congo"] },
  { id: "ural", name: "Ural", continent: "Asia", x: 80, y: 27, links: ["ukraine", "siberia", "china", "middle-east"] },
  { id: "siberia", name: "Siberia", continent: "Asia", x: 88, y: 19, links: ["ural", "china", "kamchatka"] },
  { id: "kamchatka", name: "Kamchatka", continent: "Asia", x: 96, y: 25, links: ["siberia", "china", "japan", "alaska"] },
  { id: "china", name: "China", continent: "Asia", x: 86, y: 42, links: ["ural", "siberia", "kamchatka", "middle-east", "india"] },
  { id: "middle-east", name: "Middle East", continent: "Asia", x: 76, y: 50, links: ["ukraine", "ural", "china", "india", "egypt"] },
  { id: "india", name: "India", continent: "Asia", x: 84, y: 58, links: ["middle-east", "china", "siam"] },
  { id: "siam", name: "Siam", continent: "Asia", x: 91, y: 58, links: ["india", "indonesia"] },
  { id: "japan", name: "Japan", continent: "Asia", x: 98, y: 41, links: ["kamchatka"] },
  { id: "indonesia", name: "Indonesia", continent: "Australia", x: 89, y: 72, links: ["siam", "new-guinea", "western-australia"] },
  { id: "new-guinea", name: "New Guinea", continent: "Australia", x: 98, y: 72, links: ["indonesia", "eastern-australia"] },
  { id: "western-australia", name: "Western Australia", continent: "Australia", x: 91, y: 86, links: ["indonesia", "eastern-australia"] },
  { id: "eastern-australia", name: "Eastern Australia", continent: "Australia", x: 99, y: 88, links: ["new-guinea", "western-australia"] },
];

export const createRiskState = (names) => {
  const players = names.map((name, i) => ({ id: `risk-${i}`, name, color: RISK_COLORS[i] }));
  const shuffled = [...TERRITORIES].sort(() => Math.random() - .5);
  const territories = Object.fromEntries(shuffled.map((territory, i) => [territory.id, { owner: players[i % players.length].id, armies: 2 }]));
  return { players, territories };
};

export const isAdjacent = (from, to) => TERRITORIES.find((territory) => territory.id === from)?.links.includes(to);
