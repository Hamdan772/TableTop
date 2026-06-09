import test from "node:test";
import assert from "node:assert/strict";
import {
  BOARD, CHANCE, CHEST, calculateRent, createPlayers, initialOwnership,
} from "./game.js";

test("a new game starts with official cash and an empty bank board", () => {
  const players = createPlayers(["Ada", "Grace"]);
  const ownership = initialOwnership();

  assert.equal(players.length, 2);
  assert.equal(players[0].money, 1500);
  assert.deepEqual(players[0].jailCards, []);
  assert.equal(Object.values(ownership).every((space) => space.owner === null), true);
});

test("Chance and Community Chest each contain one held jail card", () => {
  assert.equal(CHANCE.length, 16);
  assert.equal(CHEST.length, 16);
  assert.equal(CHANCE.filter((card) => card.getOutOfJail).length, 1);
  assert.equal(CHEST.filter((card) => card.getOutOfJail).length, 1);
});

test("rent follows monopoly, railroad, utility, and mortgage rules", () => {
  const owner = { properties: [1, 3, 5, 15, 12, 28] };

  assert.equal(calculateRent(BOARD[1], { houses: 0, mortgaged: false }, owner), 4);
  assert.equal(calculateRent(BOARD[5], { houses: 0, mortgaged: false }, owner), 50);
  assert.equal(calculateRent(BOARD[12], { houses: 0, mortgaged: false }, owner, 8), 80);
  assert.equal(calculateRent(BOARD[1], { houses: 0, mortgaged: true }, owner), 0);
});
