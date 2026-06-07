import React from "react";

export function TokenPiece({ token = "Top Hat", color = "#ff6b6b", small = false }) {
  const slug = token.toLowerCase().replaceAll(" ", "-");
  return <span className={`metal-token token-${slug} ${small ? "token-small" : ""}`} style={{ "--player": color }} aria-label={token}><i /><b /></span>;
}

const pipMap = {
  1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9],
};

function Face({ side, value }) {
  return <span className={`dice-face face-${side}`}>{Array.from({ length: 9 }).map((_, i) => <i className={pipMap[value].includes(i + 1) ? "pip on" : "pip"} key={i} />)}</span>;
}

export function Dice3D({ value, rolling, second = false }) {
  return <span className={`dice-cube dice-value-${value} ${rolling ? "is-rolling" : ""} ${second ? "dice-second" : ""}`}>
    <Face side="front" value={value} /><Face side="back" value={7 - value} /><Face side="right" value={Math.max(1, (value + 1) % 7)} />
    <Face side="left" value={Math.max(1, (value + 3) % 7)} /><Face side="top" value={Math.max(1, (value + 2) % 7)} /><Face side="bottom" value={Math.max(1, (value + 4) % 7)} />
  </span>;
}
