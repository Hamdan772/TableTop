export const COLORS = ["#ff6b6b", "#4dabf7", "#ffd43b", "#69db7c", "#da77f2", "#ffa94d", "#38d9a9", "#f06595"];
export const TOKENS = ["Top Hat", "Race Car", "Scottie", "Boot", "Thimble", "Ship", "Cat", "Duck"];
export const TOKEN_GLYPHS = ["♜", "◆", "♞", "●", "♟", "▲", "★", "✦"];

const p = (name, price, rent, group, houseCost) => ({ name, type: "property", price, rent, group, houseCost });
const rr = (name) => ({ name, type: "railroad", price: 200, rent: 25, group: "railroad" });
const util = (name) => ({ name, type: "utility", price: 150, rent: 0, group: "utility" });
const special = (name, type, note = "") => ({ name, type, note });

export const BOARD = [
  special("GO", "go", "Collect $200"),
  p("Mediterranean Avenue", 60, 2, "brown", 50),
  special("Community Chest", "chest"),
  p("Baltic Avenue", 60, 4, "brown", 50),
  special("Income Tax", "tax", "Pay $200"),
  rr("Reading Railroad"),
  p("Oriental Avenue", 100, 6, "lightblue", 50),
  special("Chance", "chance"),
  p("Vermont Avenue", 100, 6, "lightblue", 50),
  p("Connecticut Avenue", 120, 8, "lightblue", 50),
  special("Jail / Just Visiting", "jail"),
  p("St. Charles Place", 140, 10, "pink", 100),
  util("Electric Company"),
  p("States Avenue", 140, 10, "pink", 100),
  p("Virginia Avenue", 160, 12, "pink", 100),
  rr("Pennsylvania Railroad"),
  p("St. James Place", 180, 14, "orange", 100),
  special("Community Chest", "chest"),
  p("Tennessee Avenue", 180, 14, "orange", 100),
  p("New York Avenue", 200, 16, "orange", 100),
  special("Free Parking", "parking", "Take a breath"),
  p("Kentucky Avenue", 220, 18, "red", 150),
  special("Chance", "chance"),
  p("Indiana Avenue", 220, 18, "red", 150),
  p("Illinois Avenue", 240, 20, "red", 150),
  rr("B. & O. Railroad"),
  p("Atlantic Avenue", 260, 22, "yellow", 150),
  p("Ventnor Avenue", 260, 22, "yellow", 150),
  util("Water Works"),
  p("Marvin Gardens", 280, 24, "yellow", 150),
  special("Go To Jail", "gotojail"),
  p("Pacific Avenue", 300, 26, "green", 200),
  p("North Carolina Avenue", 300, 26, "green", 200),
  special("Community Chest", "chest"),
  p("Pennsylvania Avenue", 320, 28, "green", 200),
  rr("Short Line"),
  special("Chance", "chance"),
  p("Park Place", 350, 35, "darkblue", 200),
  special("Luxury Tax", "tax", "Pay $100"),
  p("Boardwalk", 400, 50, "darkblue", 200),
];

export const GROUP_COLORS = {
  brown: "#8d5b43", lightblue: "#80d4ee", pink: "#d85a9f", orange: "#f29b38",
  red: "#e75454", yellow: "#f1d557", green: "#47a96b", darkblue: "#3f65bd",
  railroad: "#31383a", utility: "#a6a9a1",
};

export const CHANCE = [
  { text: "Advance to GO. Collect $200.", move: 0 },
  { text: "Advance to Boardwalk.", move: 39 },
  { text: "Bank pays you dividend of $50.", money: 50 },
  { text: "Speeding fine. Pay $15.", money: -15 },
  { text: "Go directly to Jail.", jail: true },
  { text: "Your building loan matures. Collect $150.", money: 150 },
];

export const CHEST = [
  { text: "Advance to GO. Collect $200.", move: 0 },
  { text: "Bank error in your favor. Collect $200.", money: 200 },
  { text: "Doctor's fee. Pay $50.", money: -50 },
  { text: "From sale of stock you get $50.", money: 50 },
  { text: "Go directly to Jail.", jail: true },
  { text: "Holiday fund matures. Receive $100.", money: 100 },
];

export const createPlayers = (names) => names.map((name, index) => ({
  id: `p${index + 1}`, name, color: COLORS[index], token: TOKENS[index], glyph: TOKEN_GLYPHS[index],
  money: 1500, position: 0, properties: [], inJail: false, jailTurns: 0, bankrupt: false, ready: index === 0,
}));

export const initialOwnership = () => Object.fromEntries(
  BOARD.map((space, index) => [index, { owner: null, houses: 0, mortgaged: false }]),
);

export function calculateRent(space, ownership, owner, diceTotal = 7) {
  if (ownership.mortgaged) return 0;
  if (space.type === "railroad") {
    const count = owner.properties.filter((i) => BOARD[i].type === "railroad").length;
    return 25 * (2 ** Math.max(0, count - 1));
  }
  if (space.type === "utility") {
    const count = owner.properties.filter((i) => BOARD[i].type === "utility").length;
    return diceTotal * (count === 2 ? 10 : 4);
  }
  if (ownership.houses === 5) return space.rent * 12;
  if (ownership.houses > 0) return space.rent * (ownership.houses * 2 + 2);
  const group = owner.properties.filter((i) => BOARD[i].group === space.group).length;
  const groupSize = BOARD.filter((s) => s.group === space.group).length;
  return space.rent * (group === groupSize ? 2 : 1);
}

export const money = (value) => `$${Math.max(0, value).toLocaleString()}`;
