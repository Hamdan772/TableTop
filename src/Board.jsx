import React from "react";
import { BOARD, GROUP_COLORS } from "./game";
import { Dice3D, TokenPiece } from "./Pieces";

const gridPosition = (index) => {
  if (index <= 10) return { gridRow: 11, gridColumn: 11 - index };
  if (index <= 20) return { gridRow: 21 - index, gridColumn: 1 };
  if (index <= 30) return { gridRow: 1, gridColumn: index - 19 };
  return { gridRow: index - 29, gridColumn: 11 };
};

const spaceMark = (space) => ({
  go: "GO",
  jail: "JAIL",
  parking: "FREE",
  gotojail: "GO TO JAIL",
  chance: "?",
  chest: "CHEST",
  tax: "$",
  railroad: "RR",
  utility: "UTIL",
}[space.type]);

function Space({ space, index, ownership, players, selected, onSelect }) {
  const occupants = players.filter((player) => !player.bankrupt && player.position === index);
  return (
    <button
      className={`space space-${space.type} ${selected ? "is-selected" : ""}`}
      style={gridPosition(index)}
      onClick={() => onSelect(index)}
      aria-label={space.name}
    >
      {space.group && <span className="color-band" style={{ background: GROUP_COLORS[space.group] }} />}
      {spaceMark(space) && <span className={`space-mark mark-${space.type}`}>{spaceMark(space)}</span>}
      <span className="space-name">{space.name.replace(" Avenue", "").replace(" Railroad", " RR")}</span>
      {space.price && <span className="space-price">${space.price}</span>}
      {ownership.owner && <span className="owner-dot" style={{ background: players.find((p) => p.id === ownership.owner)?.color }} />}
      {ownership.mortgaged && <span className="mortgage-stamp">MORTGAGED</span>}
      {ownership.houses > 0 && <span className="houses">{ownership.houses === 5 ? <i className="hotel-model" /> : Array.from({ length: ownership.houses }).map((_, i) => <i className="house-model" key={i} />)}</span>}
      <span className="tokens">
        {occupants.map((player) => <TokenPiece token={player.token} color={player.color} small key={player.id} />)}
      </span>
    </button>
  );
}

export default function Board({ players, ownership, selected, onSelect, dice, rolling, fastMode, scale = 1 }) {
  return (
    <div className="board-wrap">
      <div className="board-scale" style={{ "--board-scale": scale }}>
      <div className="board">
        <span className="board-screw screw-one" /><span className="board-screw screw-two" /><span className="board-screw screw-three" /><span className="board-screw screw-four" />
        <div className="paper-crease crease-one" /><div className="paper-crease crease-two" />
        {BOARD.map((space, index) => (
          <Space key={`${space.name}-${index}`} {...{ space, index, ownership: ownership[index], players, selected: selected === index, onSelect }} />
        ))}
        <div className="board-center">
          <div className="stardance-sticker">STARDANCE<br />GAME NIGHT</div>
          <div className="board-stamp">TABLETOP ORIGINAL</div>
          <h1>MONOPOLY</h1>
          <p>Room for big moves and bad deals.</p>
          <div className={`dice-pair ${rolling ? "rolling" : ""} ${fastMode ? "fast" : ""}`}>
            {dice.map((die, index) => <Dice3D value={die} rolling={rolling} second={index === 1} key={index} />)}
          </div>
          <div className={`dice-result ${rolling ? "is-hidden" : ""}`}>{dice[0]} + {dice[1]} = <strong>{dice[0] + dice[1]}</strong></div>
          <div className="center-decks">
            <span>COMMUNITY CHEST</span>
            <span>CHANCE</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
