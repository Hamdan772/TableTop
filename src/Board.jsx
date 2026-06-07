import { BOARD, GROUP_COLORS } from "./game";

const gridPosition = (index) => {
  if (index <= 10) return { gridRow: 11, gridColumn: 11 - index };
  if (index <= 20) return { gridRow: 21 - index, gridColumn: 1 };
  if (index <= 30) return { gridRow: 1, gridColumn: index - 19 };
  return { gridRow: index - 29, gridColumn: 11 };
};

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
      <span className="space-name">{space.name.replace(" Avenue", "").replace(" Railroad", " RR")}</span>
      {space.price && <span className="space-price">${space.price}</span>}
      {ownership.owner && <span className="owner-dot" style={{ background: players.find((p) => p.id === ownership.owner)?.color }} />}
      {ownership.houses > 0 && <span className="houses">{ownership.houses === 5 ? "HOTEL" : "■".repeat(ownership.houses)}</span>}
      <span className="tokens">
        {occupants.map((player) => <span className="token" style={{ "--token": player.color }} key={player.id}>{player.glyph}</span>)}
      </span>
    </button>
  );
}

export default function Board({ players, ownership, selected, onSelect, dice, rolling }) {
  return (
    <div className="board-wrap">
      <div className="board">
        {BOARD.map((space, index) => (
          <Space key={`${space.name}-${index}`} {...{ space, index, ownership: ownership[index], players, selected: selected === index, onSelect }} />
        ))}
        <div className="board-center">
          <div className="board-stamp">TABLETOP ORIGINAL</div>
          <h1>MONOPOLY</h1>
          <p>Room for big moves and bad deals.</p>
          <div className={`dice-pair ${rolling ? "rolling" : ""}`}>
            {dice.map((die, index) => <div className="die" key={index}>{die}</div>)}
          </div>
          <div className="center-decks">
            <span>COMMUNITY CHEST</span>
            <span>CHANCE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
