export const COLORS = ["#ff6b6b", "#4dabf7", "#ffd43b", "#69db7c", "#da77f2", "#ffa94d", "#38d9a9", "#f06595"];
export const TOKENS = ["Top Hat", "Race Car", "Scottie", "Boot", "Thimble", "Ship", "Cat", "Duck"];

const p = (name, price, rents, group, houseCost) => ({ name, type: "property", price, rent: rents[0], rents, group, houseCost });
const rr = (name) => ({ name, type: "railroad", price: 200, rent: 25, group: "railroad" });
const util = (name) => ({ name, type: "utility", price: 150, rent: 0, group: "utility" });
const special = (name, type, note = "") => ({ name, type, note });

export const BOARD = [
  special("GO", "go", "Collect $200"),
  p("Mediterranean Avenue", 60, [2, 10, 30, 90, 160, 250], "brown", 50),
  special("Community Chest", "chest"),
  p("Baltic Avenue", 60, [4, 20, 60, 180, 320, 450], "brown", 50),
  special("Income Tax", "tax", "Pay $200"),
  rr("Reading Railroad"),
  p("Oriental Avenue", 100, [6, 30, 90, 270, 400, 550], "lightblue", 50),
  special("Chance", "chance"),
  p("Vermont Avenue", 100, [6, 30, 90, 270, 400, 550], "lightblue", 50),
  p("Connecticut Avenue", 120, [8, 40, 100, 300, 450, 600], "lightblue", 50),
  special("Jail / Just Visiting", "jail"),
  p("St. Charles Place", 140, [10, 50, 150, 450, 625, 750], "pink", 100),
  util("Electric Company"),
  p("States Avenue", 140, [10, 50, 150, 450, 625, 750], "pink", 100),
  p("Virginia Avenue", 160, [12, 60, 180, 500, 700, 900], "pink", 100),
  rr("Pennsylvania Railroad"),
  p("St. James Place", 180, [14, 70, 200, 550, 750, 950], "orange", 100),
  special("Community Chest", "chest"),
  p("Tennessee Avenue", 180, [14, 70, 200, 550, 750, 950], "orange", 100),
  p("New York Avenue", 200, [16, 80, 220, 600, 800, 1000], "orange", 100),
  special("Free Parking", "parking", "Take a breath"),
  p("Kentucky Avenue", 220, [18, 90, 250, 700, 875, 1050], "red", 150),
  special("Chance", "chance"),
  p("Indiana Avenue", 220, [18, 90, 250, 700, 875, 1050], "red", 150),
  p("Illinois Avenue", 240, [20, 100, 300, 750, 925, 1100], "red", 150),
  rr("B. & O. Railroad"),
  p("Atlantic Avenue", 260, [22, 110, 330, 800, 975, 1150], "yellow", 150),
  p("Ventnor Avenue", 260, [22, 110, 330, 800, 975, 1150], "yellow", 150),
  util("Water Works"),
  p("Marvin Gardens", 280, [24, 120, 360, 850, 1025, 1200], "yellow", 150),
  special("Go To Jail", "gotojail"),
  p("Pacific Avenue", 300, [26, 130, 390, 900, 1100, 1275], "green", 200),
  p("North Carolina Avenue", 300, [26, 130, 390, 900, 1100, 1275], "green", 200),
  special("Community Chest", "chest"),
  p("Pennsylvania Avenue", 320, [28, 150, 450, 1000, 1200, 1400], "green", 200),
  rr("Short Line"),
  special("Chance", "chance"),
  p("Park Place", 350, [35, 175, 500, 1100, 1300, 1500], "darkblue", 200),
  special("Luxury Tax", "tax", "Pay $100"),
  p("Boardwalk", 400, [50, 200, 600, 1400, 1700, 2000], "darkblue", 200),
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

export const createPlayers = (entries) => entries.map((entry, index) => ({
  id: `p${index + 1}`, name: typeof entry === "string" ? entry : entry.name, color: COLORS[index],
  token: typeof entry === "string" ? TOKENS[index] : entry.token,
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
  if (ownership.houses > 0) return space.rents[ownership.houses];
  const group = owner.properties.filter((i) => BOARD[i].group === space.group).length;
  const groupSize = BOARD.filter((s) => s.group === space.group).length;
  return space.rent * (group === groupSize ? 2 : 1);
}

export const money = (value) => `$${Math.max(0, value).toLocaleString()}`;
