import React, { useMemo, useState } from "react";
import {
  Buildings, ChatCircleDots, Check, Copy, DiceFive, Handshake, House,
  Money, Plus, SealCheck, Trash, Users, X,
} from "@phosphor-icons/react";
import Board from "./Board";
import {
  BOARD, CHANCE, CHEST, TOKENS, calculateRent, createPlayers, initialOwnership, money,
} from "./game";
import { TokenPiece } from "./Pieces";

const randomCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();

function Lobby({ onStart }) {
  const [mode, setMode] = useState("home");
  const [tableName, setTableName] = useState("Friday Game Night");
  const [players, setPlayers] = useState([{ name: "Player 1", token: TOKENS[0] }, { name: "Player 2", token: TOKENS[1] }]);
  const [roomCode] = useState(randomCode());

  const updateSeat = (index, key, value) => setPlayers((list) => list.map((player, i) => i === index ? { ...player, [key]: value } : player));
  const addPlayer = () => setPlayers((list) => list.length < 8 ? [...list, { name: `Player ${list.length + 1}`, token: TOKENS.find((token) => !list.some((p) => p.token === token)) }] : list);
  const removePlayer = (index) => setPlayers((list) => list.length > 2 ? list.filter((_, i) => i !== index) : list);
  const canStart = players.length >= 2 && players.every((p) => p.name.trim()) && new Set(players.map((p) => p.token)).size === players.length;

  if (mode === "home") return (
    <main className="welcome">
      <nav className="welcome-nav"><Brand /><span className="status-pill"><i /> Local pass-and-play</span></nav>
      <section className="welcome-grid">
        <div className="welcome-copy">
          <span className="eyebrow">Tonight's table is open</span>
          <h1>Board game night,<br /><em>minus the cleanup.</em></h1>
          <p>Classic games, cozy rooms, and just enough friendly chaos to keep the group chat alive.</p>
          <div className="welcome-actions">
            <button className="primary big" onClick={() => setMode("create")}><Plus /> Set the table</button>
          </div>
          <div className="friend-strip">
            <p><strong>No accounts. No servers.</strong> One screen, two to eight friends, a complete game.</p>
          </div>
        </div>
        <div className="table-preview">
          <div className="preview-board"><b>MONOPOLY</b><span>Game night starts here</span></div>
          <span className="preview-piece p1"><TokenPiece token="Top Hat" color="#ff6b6b" /></span><span className="preview-piece p2"><TokenPiece token="Race Car" color="#4dabf7" /></span>
          <div className="preview-die d1">5</div><div className="preview-die d2">2</div>
          <div className="voice-bubble"><ChatCircleDots /> Pass the dice, not a login.</div>
        </div>
      </section>
      <footer className="welcome-footer"><span>TableTop</span><span>A complete local Monopoly table.</span></footer>
    </main>
  );

  return (
    <main className="lobby">
      <nav><Brand /><button className="secondary" onClick={() => setMode("home")}><X /> Leave room</button></nav>
      <section className="lobby-card">
        <div className="lobby-head">
          <div><span className="eyebrow">Local table setup</span><h1>Choose your pieces.</h1><p>Name every player and pick a unique token. Everything runs on this device.</p></div>
          <div className="table-details"><label>Table name<input value={tableName} onChange={(e) => setTableName(e.target.value)} /></label><button className="room-code" onClick={() => navigator.clipboard?.writeText(roomCode)}><span>GAME ID</span><strong>{roomCode}</strong><Copy /></button></div>
        </div>
        <div className="seats setup-seats">
          {players.map((player, index) => <article className="seat setup-seat" key={index}>
            <div className="seat-avatar" style={{ "--player": ["#ff6b6b", "#4dabf7", "#ffd43b", "#69db7c", "#da77f2", "#ffa94d", "#38d9a9", "#f06595"][index] }}><TokenPiece token={player.token} color="currentColor" /></div>
            <input aria-label={`Player ${index + 1} name`} value={player.name} onChange={(e) => updateSeat(index, "name", e.target.value)} />
            <select aria-label={`Player ${index + 1} token`} value={player.token} onChange={(e) => updateSeat(index, "token", e.target.value)}>{TOKENS.map((token) => <option disabled={players.some((p, i) => i !== index && p.token === token)} key={token}>{token}</option>)}</select>
            <button className="icon-button" disabled={players.length <= 2} onClick={() => removePlayer(index)} title="Remove player"><Trash /></button>
          </article>)}
          {players.length < 8 && <button className="seat add-seat" onClick={addPlayer}><div className="seat-avatar"><Plus /></div><div><strong>Add player</strong><span>{8 - players.length} seats remaining</span></div></button>}
        </div>
        <div className="lobby-bottom"><p><Users /> {players.length} players · {tableName || "Untitled table"}</p><button className="primary big" disabled={!canStart} onClick={() => onStart({ players: createPlayers(players), roomCode, tableName })}>Start game <DiceFive /></button></div>
      </section>
    </main>
  );
}

function Brand() {
  return <div className="brand"><img src={`${import.meta.env.BASE_URL}assets/tabletop-logo.png`} alt="" /><strong>TableTop</strong><small>GAME NIGHT</small></div>;
}

function PlayerCard({ player, active, onTrade }) {
  return <article className={`player-card ${active ? "active" : ""} ${player.bankrupt ? "bankrupt" : ""}`}>
    <div className="player-avatar" style={{ "--player": player.color }}><TokenPiece token={player.token} color={player.color} /><i /></div>
    <div className="player-meta"><strong>{player.name}</strong><span>{player.bankrupt ? "Bankrupt" : money(player.money)}</span></div>
    {!player.bankrupt && <button className="icon-button" onClick={() => onTrade(player.id)} title={`Trade with ${player.name}`}><Handshake /></button>}
  </article>;
}

function PropertyPanel({ index, ownership, players, currentPlayer, onBuyBuilding, onSellBuilding, onMortgage, onClose }) {
  const space = BOARD[index];
  const state = ownership[index];
  const owner = players.find((p) => p.id === state.owner);
  const canManage = owner?.id === currentPlayer.id && ["property", "railroad", "utility"].includes(space.type);
  return <aside className="drawer">
    <button className="drawer-close" onClick={onClose}><X /></button>
    <div className={`property-hero group-${space.group || space.type}`}><span>{space.type}</span><h2>{space.name}</h2>{space.price && <strong>{money(space.price)}</strong>}</div>
    <div className="property-owner">{owner ? <><span style={{ background: owner.color }}><TokenPiece token={owner.token} color={owner.color} /></span><p>Owned by <strong>{owner.name}</strong></p></> : <><span className="bank-mark">B</span><p>Available from the <strong>Bank</strong></p></>}</div>
    {space.type === "property" && <div className="rent-table">
      <div><span>Base rent</span><strong>{money(space.rent)}</strong></div>
      {space.rents.slice(1, 5).map((rent, i) => <div key={rent}><span>With {i + 1} house{i ? "s" : ""}</span><strong>{money(rent)}</strong></div>)}
      <div><span>With hotel</span><strong>{money(space.rents[5])}</strong></div>
      <div><span>Building cost</span><strong>{money(space.houseCost)}</strong></div>
    </div>}
    {space.note && <p className="panel-note">{space.note}</p>}
    {owner && <div className="property-state"><span>{state.mortgaged ? "Mortgaged" : `${state.houses === 5 ? "Hotel" : `${state.houses} houses`}`}</span></div>}
    {canManage && <div className="manage-actions">
      {space.type === "property" && <button className="primary" disabled={state.mortgaged || state.houses >= 5 || currentPlayer.money < space.houseCost} onClick={() => onBuyBuilding(index)}><House /> {state.houses === 4 ? "Buy hotel" : "Buy house"}</button>}
      {space.type === "property" && state.houses > 0 && <button className="secondary" onClick={() => onSellBuilding(index)}>Sell building</button>}
      <button className="secondary" disabled={state.houses > 0} onClick={() => onMortgage(index)}><Money /> {state.mortgaged ? "Unmortgage" : "Mortgage"}</button>
    </div>}
  </aside>;
}

function TradeModal({ players, currentPlayer, ownership, initialTarget, onClose, onTrade }) {
  const possible = players.filter((p) => p.id !== currentPlayer.id && !p.bankrupt);
  const [targetId, setTargetId] = useState(initialTarget && initialTarget !== currentPlayer.id ? initialTarget : possible[0]?.id);
  const [offerMoney, setOfferMoney] = useState(0);
  const [requestMoney, setRequestMoney] = useState(0);
  const [offerProps, setOfferProps] = useState([]);
  const [requestProps, setRequestProps] = useState([]);
  const target = players.find((p) => p.id === targetId);
  const toggle = (setter, list, value) => setter(list.includes(value) ? list.filter((i) => i !== value) : [...list, value]);
  return <div className="modal-backdrop"><section className="trade-modal">
    <div className="modal-head"><div><span className="eyebrow">Make a deal</span><h2>Trade with the table</h2></div><button className="icon-button" onClick={onClose}><X /></button></div>
    <label>Trading partner<select value={targetId} onChange={(e) => { setTargetId(e.target.value); setRequestProps([]); }}>{possible.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
    <div className="trade-columns">
      <div><h3>You offer</h3><label>Cash<input type="number" min="0" max={currentPlayer.money} value={offerMoney} onChange={(e) => setOfferMoney(+e.target.value)} /></label>
        <div className="trade-props">{currentPlayer.properties.map((i) => <button disabled={ownership[i].houses > 0} className={offerProps.includes(i) ? "selected" : ""} onClick={() => toggle(setOfferProps, offerProps, i)} key={i}>{BOARD[i].name}{ownership[i].houses > 0 ? " · sell buildings first" : ""}</button>)}</div>
      </div>
      <div><h3>You request</h3><label>Cash<input type="number" min="0" max={target?.money || 0} value={requestMoney} onChange={(e) => setRequestMoney(+e.target.value)} /></label>
        <div className="trade-props">{target?.properties.map((i) => <button disabled={ownership[i].houses > 0} className={requestProps.includes(i) ? "selected" : ""} onClick={() => toggle(setRequestProps, requestProps, i)} key={i}>{BOARD[i].name}{ownership[i].houses > 0 ? " · sell buildings first" : ""}</button>)}</div>
      </div>
    </div>
    <p className="trade-note">Local table mode: {target?.name} can accept or reject this offer now.</p>
    <div className="modal-actions"><button className="secondary" onClick={onClose}>Reject</button><button className="primary" disabled={offerMoney > currentPlayer.money || requestMoney > (target?.money || 0)} onClick={() => onTrade({ targetId, offerMoney, requestMoney, offerProps, requestProps })}><Handshake /> Accept trade</button></div>
  </section></div>;
}

function AuctionModal({ property, players, onClose, onWin }) {
  const eligible = players.filter((p) => !p.bankrupt && p.money > 0);
  const [bidderId, setBidderId] = useState(eligible[0]?.id);
  const bidder = players.find((p) => p.id === bidderId);
  const [bid, setBid] = useState(Math.min(10, bidder?.money || 0));
  return <div className="modal-backdrop"><section className="trade-modal auction-modal">
    <div className="modal-head"><div><span className="eyebrow">Bank auction</span><h2>{property.name}</h2></div></div>
    <p className="trade-note">The property was declined. Pass the device around and agree on the highest bid.</p>
    <label>Winning bidder<select value={bidderId} onChange={(e) => { setBidderId(e.target.value); setBid(10); }}>{eligible.map((p) => <option value={p.id} key={p.id}>{p.name} · {money(p.money)}</option>)}</select></label>
    <label>Winning bid<input type="number" min="1" max={bidder?.money || 0} value={bid} onChange={(e) => setBid(+e.target.value)} /></label>
    <div className="modal-actions"><button className="secondary" onClick={onClose}>No bids</button><button className="primary" disabled={!bid || bid > (bidder?.money || 0)} onClick={() => onWin(bidderId, bid)}>Award property</button></div>
  </section></div>;
}

function Game({ setup, onExit }) {
  const [players, setPlayers] = useState(setup.players);
  const [ownership, setOwnership] = useState(initialOwnership);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [rolled, setRolled] = useState(false);
  const [extraTurn, setExtraTurn] = useState(false);
  const [doublesCount, setDoublesCount] = useState(0);
  const [pendingBuy, setPendingBuy] = useState(null);
  const [selected, setSelected] = useState(null);
  const [card, setCard] = useState(null);
  const [tradeTarget, setTradeTarget] = useState(null);
  const [auction, setAuction] = useState(null);
  const [log, setLog] = useState([`The table is set. ${setup.players[0].name} has the first turn.`]);
  const currentPlayer = players[turn];
  const activePlayers = players.filter((p) => !p.bankrupt);
  const winner = activePlayers.length === 1 ? activePlayers[0] : null;
  const addLog = (text) => setLog((items) => [text, ...items].slice(0, 30));
  const updatePlayer = (id, fn) => setPlayers((list) => list.map((p) => p.id === id ? fn(p) : p));

  const settleSpace = (playerId, position, total, workingPlayers = players) => {
    const space = BOARD[position];
    const state = ownership[position];
    const player = workingPlayers.find((p) => p.id === playerId);
    if (["property", "railroad", "utility"].includes(space.type)) {
      if (!state.owner) { setPendingBuy(position); addLog(`${player.name} can buy ${space.name} for ${money(space.price)}.`); }
      else if (state.owner !== playerId) {
        const owner = workingPlayers.find((p) => p.id === state.owner);
        const rent = calculateRent(space, state, owner, total);
        transfer(playerId, owner.id, rent, `${player.name} paid ${owner.name} ${money(rent)} rent.`);
      }
    } else if (space.type === "tax") {
      const amount = position === 4 ? 200 : 100;
      charge(playerId, amount, `${player.name} paid ${money(amount)} in taxes.`);
    } else if (space.type === "gotojail") sendToJail(playerId);
    else if (space.type === "chance" || space.type === "chest") drawCard(playerId, space.type);
    else if (space.type === "parking") addLog(`${player.name} is taking it easy at Free Parking.`);
  };

  const charge = (id, amount, message) => {
    updatePlayer(id, (p) => ({ ...p, money: p.money - amount }));
    addLog(message);
  };
  const transfer = (from, to, amount, message) => {
    setPlayers((list) => list.map((p) => p.id === from ? { ...p, money: p.money - amount } : p.id === to ? { ...p, money: p.money + amount } : p));
    addLog(message);
  };
  const sendToJail = (id) => {
    updatePlayer(id, (p) => ({ ...p, position: 10, inJail: true, jailTurns: 0 }));
    addLog(`${players.find((p) => p.id === id)?.name} went directly to Jail.`);
  };
  const drawCard = (id, type) => {
    const deck = type === "chance" ? CHANCE : CHEST;
    const drawn = deck[Math.floor(Math.random() * deck.length)];
    const name = players.find((p) => p.id === id)?.name;
    setCard({ ...drawn, type });
    addLog(`${name} drew ${type === "chance" ? "a Chance card" : "Community Chest"}: ${drawn.text}`);
    if (drawn.jail) sendToJail(id);
    else if (drawn.money) updatePlayer(id, (p) => ({ ...p, money: p.money + drawn.money }));
    else if (drawn.move !== undefined) {
      const updated = players.map((p) => p.id === id ? { ...p, money: drawn.move < p.position ? p.money + 200 : p.money, position: drawn.move } : p);
      setPlayers(updated);
      if (drawn.move !== 0) setTimeout(() => settleSpace(id, drawn.move, 7, updated), 0);
    }
  };

  const rollDice = () => {
    if (rolling || rolled || winner) return;
    setRolling(true);
    setTimeout(() => {
      const next = [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
      const total = next[0] + next[1];
      setDice(next); setRolling(false); setRolled(true);
      addLog(`${currentPlayer.name} rolled a ${total}.`);
      if (currentPlayer.inJail) {
        if (next[0] === next[1]) {
          updatePlayer(currentPlayer.id, (p) => ({ ...p, inJail: false, jailTurns: 0, position: 10 + total }));
          addLog(`${currentPlayer.name} rolled doubles and left Jail.`);
          settleSpace(currentPlayer.id, 10 + total, total);
        } else if (currentPlayer.jailTurns >= 2) {
          const updated = players.map((p) => p.id === currentPlayer.id ? { ...p, money: p.money - 50, inJail: false, jailTurns: 0, position: 10 + total } : p);
          setPlayers(updated);
          addLog(`${currentPlayer.name} paid $50 after three turns and left Jail.`);
          settleSpace(currentPlayer.id, 10 + total, total, updated);
        } else {
          updatePlayer(currentPlayer.id, (p) => ({ ...p, jailTurns: p.jailTurns + 1 }));
          addLog(`${currentPlayer.name} remains in Jail.`);
        }
        return;
      }
      if (next[0] === next[1] && doublesCount >= 2) {
        setExtraTurn(false); setDoublesCount(0); sendToJail(currentPlayer.id);
        addLog(`${currentPlayer.name} rolled three doubles and went to Jail.`);
        return;
      }
      setExtraTurn(next[0] === next[1]);
      setDoublesCount(next[0] === next[1] ? doublesCount + 1 : 0);
      const old = currentPlayer.position;
      const position = (old + total) % 40;
      const passedGo = old + total >= 40;
      const updated = players.map((p) => p.id === currentPlayer.id ? { ...p, position, money: p.money + (passedGo ? 200 : 0) } : p);
      setPlayers(updated);
      if (passedGo) addLog(`${currentPlayer.name} passed GO and collected $200.`);
      settleSpace(currentPlayer.id, position, total, updated);
    }, 620);
  };

  const buyProperty = () => {
    const space = BOARD[pendingBuy];
    if (currentPlayer.money < space.price) return;
    updatePlayer(currentPlayer.id, (p) => ({ ...p, money: p.money - space.price, properties: [...p.properties, pendingBuy] }));
    setOwnership((all) => ({ ...all, [pendingBuy]: { ...all[pendingBuy], owner: currentPlayer.id } }));
    addLog(`${currentPlayer.name} bought ${space.name}.`);
    setPendingBuy(null);
  };
  const endTurn = () => {
    if (pendingBuy !== null) { setAuction(pendingBuy); setPendingBuy(null); return; }
    finishTurn();
  };
  const closeAuction = () => {
    setAuction(null);
    finishTurn();
  };
  const finishTurn = () => {
    const negative = players.find((p) => !p.bankrupt && p.money < 0);
    if (negative) return;
    if (extraTurn && !currentPlayer.inJail) {
      setRolled(false); setExtraTurn(false); setSelected(null); setCard(null);
      addLog(`${currentPlayer.name} rolled doubles and gets another turn.`);
      return;
    }
    let next = (turn + 1) % players.length;
    while (players[next].bankrupt) next = (next + 1) % players.length;
    setTurn(next); setRolled(false); setDoublesCount(0); setSelected(null); setCard(null);
  };
  const winAuction = (bidderId, bid) => {
    const space = BOARD[auction];
    setPlayers((list) => list.map((p) => p.id === bidderId ? { ...p, money: p.money - bid, properties: [...p.properties, auction] } : p));
    setOwnership((all) => ({ ...all, [auction]: { ...all[auction], owner: bidderId } }));
    addLog(`${players.find((p) => p.id === bidderId)?.name} won ${space.name} at auction for ${money(bid)}.`);
    setAuction(null);
    setTimeout(finishTurn, 0);
  };
  const declareBankruptcy = () => {
    const id = currentPlayer.id;
    setPlayers((list) => list.map((p) => p.id === id ? { ...p, money: 0, properties: [], bankrupt: true } : p));
    setOwnership((all) => Object.fromEntries(Object.entries(all).map(([i, state]) => [i, state.owner === id ? { owner: null, houses: 0, mortgaged: false } : state])));
    addLog(`${currentPlayer.name} declared bankruptcy.`);
    setTimeout(endTurn, 0);
  };
  const buyBuilding = (index) => {
    const space = BOARD[index];
    const group = BOARD.map((item, i) => ({ ...item, index: i })).filter((item) => item.group === space.group);
    if (!group.every((item) => currentPlayer.properties.includes(item.index))) {
      addLog(`${currentPlayer.name} needs the full ${space.group} set before building.`);
      return;
    }
    updatePlayer(currentPlayer.id, (p) => ({ ...p, money: p.money - space.houseCost }));
    setOwnership((all) => ({ ...all, [index]: { ...all[index], houses: all[index].houses + 1 } }));
    addLog(`${currentPlayer.name} built ${ownership[index].houses === 4 ? "a hotel" : "a house"} on ${space.name}.`);
  };
  const sellBuilding = (index) => {
    const space = BOARD[index];
    if (ownership[index].houses <= 0) return;
    updatePlayer(currentPlayer.id, (p) => ({ ...p, money: p.money + Math.floor(space.houseCost / 2) }));
    setOwnership((all) => ({ ...all, [index]: { ...all[index], houses: all[index].houses - 1 } }));
    addLog(`${currentPlayer.name} sold a building on ${space.name} for ${money(Math.floor(space.houseCost / 2))}.`);
  };
  const mortgage = (index) => {
    const space = BOARD[index]; const state = ownership[index];
    const value = Math.floor(space.price / 2); const cost = Math.ceil(value * 1.1);
    if (state.mortgaged && currentPlayer.money < cost) return;
    updatePlayer(currentPlayer.id, (p) => ({ ...p, money: p.money + (state.mortgaged ? -cost : value) }));
    setOwnership((all) => ({ ...all, [index]: { ...all[index], mortgaged: !state.mortgaged } }));
    addLog(`${currentPlayer.name} ${state.mortgaged ? "unmortgaged" : "mortgaged"} ${space.name}.`);
  };
  const makeTrade = ({ targetId, offerMoney, requestMoney, offerProps, requestProps }) => {
    setPlayers((list) => list.map((p) => {
      if (p.id === currentPlayer.id) return { ...p, money: p.money - offerMoney + requestMoney, properties: [...p.properties.filter((i) => !offerProps.includes(i)), ...requestProps] };
      if (p.id === targetId) return { ...p, money: p.money + offerMoney - requestMoney, properties: [...p.properties.filter((i) => !requestProps.includes(i)), ...offerProps] };
      return p;
    }));
    setOwnership((all) => Object.fromEntries(Object.entries(all).map(([i, state]) => [i, offerProps.includes(+i) ? { ...state, owner: targetId } : requestProps.includes(+i) ? { ...state, owner: currentPlayer.id } : state])));
    addLog(`${currentPlayer.name} completed a trade with ${players.find((p) => p.id === targetId)?.name}.`);
    setTradeTarget(null);
  };

  const owned = useMemo(() => currentPlayer.properties.map((i) => ({ index: i, ...BOARD[i], ...ownership[i] })), [currentPlayer, ownership]);
  return <main className="game-shell">
    <header className="game-topbar"><Brand /><div className="room-mini"><span>{setup.tableName}</span><strong>{setup.roomCode}</strong></div><div className="turn-banner"><span style={{ background: currentPlayer.color }}><TokenPiece token={currentPlayer.token} color={currentPlayer.color} /></span><div><small>CURRENT TURN</small><strong>{currentPlayer.name}</strong></div></div><button className="secondary" onClick={onExit}><X /> Leave</button></header>
    <section className="game-layout">
      <aside className="left-rail panel"><div className="panel-title"><span><Users /> Players</span><small>{activePlayers.length} left</small></div>
        <div className="player-list">{players.map((player, i) => <PlayerCard key={player.id} player={player} active={i === turn} onTrade={setTradeTarget} />)}</div>
        <button className="trade-button" onClick={() => setTradeTarget(true)}><Handshake /> Propose a trade</button>
      </aside>
      <section className="board-stage"><Board {...{ players, ownership, selected, onSelect: setSelected, dice, rolling }} />
        <div className="turn-controls">
          <div className="turn-copy"><span style={{ background: currentPlayer.color }}><TokenPiece token={currentPlayer.token} color={currentPlayer.color} /></span><div><small>{currentPlayer.inJail ? "IN JAIL" : "YOUR MOVE"}</small><strong>{currentPlayer.inJail ? "Roll doubles or pay $50" : pendingBuy !== null ? `${BOARD[pendingBuy].name} is available` : rolled ? "Ready to pass the dice?" : "Roll the dice"}</strong></div></div>
          {currentPlayer.inJail && !rolled && <button className="secondary" disabled={currentPlayer.money < 50} onClick={() => { charge(currentPlayer.id, 50, `${currentPlayer.name} paid $50 to leave Jail.`); updatePlayer(currentPlayer.id, (p) => ({ ...p, inJail: false })); }}>Pay $50</button>}
          {pendingBuy !== null && <button className="primary buy-button" disabled={currentPlayer.money < BOARD[pendingBuy].price} onClick={buyProperty}>Buy · {money(BOARD[pendingBuy].price)}</button>}
          {!rolled ? <button className="roll-button" onClick={rollDice} disabled={rolling}><DiceFive /> {rolling ? "Rolling..." : "Roll dice"}</button> : <button className="roll-button" onClick={endTurn} disabled={players.some((p) => !p.bankrupt && p.money < 0)}>End turn <Check /></button>}
        </div>
      </section>
      <aside className="right-rail">
        <section className="panel wallet"><div className="panel-title"><span><Money /> Your wallet</span><strong>{money(currentPlayer.money)}</strong></div>
          <div className="asset-row"><span><Buildings /> Properties</span><strong>{owned.length}</strong></div>
          <div className="owned-strip">{owned.length ? owned.map((item) => <button onClick={() => setSelected(item.index)} style={{ borderTopColor: `var(--group-${item.group})` }} key={item.index}>{item.name.split(" ")[0]}<small>{item.mortgaged ? "M" : item.houses ? `${item.houses}H` : ""}</small></button>) : <p>Land somewhere nice to start your collection.</p>}</div>
          {currentPlayer.money < 0 && <button className="danger" onClick={declareBankruptcy}>Declare bankruptcy</button>}
        </section>
        <section className="panel event-log"><div className="panel-title"><span><ChatCircleDots /> Table talk</span><i /></div><div className="log-list">{log.map((item, i) => <p key={`${item}-${i}`}><span>{i === 0 ? "NOW" : `${i + 1}`}</span>{item}</p>)}</div></section>
      </aside>
    </section>
    {selected !== null && <PropertyPanel index={selected} {...{ ownership, players, currentPlayer, onBuyBuilding: buyBuilding, onSellBuilding: sellBuilding, onMortgage: mortgage }} onClose={() => setSelected(null)} />}
    {card && <div className="modal-backdrop" onClick={() => setCard(null)}><section className={`drawn-card ${card.type}`} onClick={(e) => e.stopPropagation()}><span>{card.type === "chance" ? "?" : "★"}</span><small>{card.type === "chance" ? "CHANCE" : "COMMUNITY CHEST"}</small><h2>{card.text}</h2><button className="primary" onClick={() => setCard(null)}>Got it</button></section></div>}
    {tradeTarget && <TradeModal {...{ players, currentPlayer, ownership }} initialTarget={tradeTarget === true ? null : tradeTarget} onClose={() => setTradeTarget(null)} onTrade={makeTrade} />}
    {auction !== null && <AuctionModal property={BOARD[auction]} players={players} onClose={closeAuction} onWin={winAuction} />}
    {winner && <div className="modal-backdrop"><section className="winner-card"><SealCheck /><span className="eyebrow">Game over</span><h1>{winner.name} owns the table.</h1><p>One last deal, one very full property portfolio, and the bragging rights are official.</p><button className="primary big" onClick={onExit}>Back to lobby</button></section></div>}
  </main>;
}

export default function App() {
  const [game, setGame] = useState(null);
  return game ? <Game setup={game} onExit={() => setGame(null)} /> : <Lobby onStart={setGame} />;
}
