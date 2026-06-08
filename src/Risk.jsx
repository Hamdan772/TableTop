import React, { useState } from "react";
import { ArrowRight, Check, Crown, DiceFive, Flag, ShieldChevron, Sword, Users, X } from "@phosphor-icons/react";
import { createRiskState, isAdjacent, RISK_COLORS, TERRITORIES } from "./riskData";

const dice = () => Math.ceil(Math.random() * 6);

function RiskSetup({ onStart, onExit }) {
  const [names, setNames] = useState(["Player 1", "Player 2"]);
  const add = () => names.length < 4 && setNames([...names, `Player ${names.length + 1}`]);
  return <main className="risk-setup">
    <header><div><span className="risk-kicker">TableTop presents</span><h1>RISK</h1><p>Claim the map. Hold your borders. Own the world.</p></div><button className="secondary" onClick={onExit}><X /> Back</button></header>
    <section className="risk-setup-card">
      <span className="eyebrow">Local strategy table</span><h2>Seat your generals.</h2>
      <div className="risk-seats">{names.map((name, i) => <label key={i} style={{ "--risk-player": RISK_COLORS[i] }}><i />Player {i + 1}<input value={name} onChange={(e) => setNames(names.map((item, index) => index === i ? e.target.value : item))} />{names.length > 2 && <button onClick={() => setNames(names.filter((_, index) => index !== i))}><X /></button>}</label>)}</div>
      {names.length < 4 && <button className="secondary" onClick={add}><Users /> Add general</button>}
      <button className="risk-start" disabled={names.some((name) => !name.trim())} onClick={() => onStart(createRiskState(names))}>Deal territories <ArrowRight /></button>
    </section>
  </main>;
}

function RiskBoard({ state, selected, target, onTerritory }) {
  return <div className="risk-board-wrap"><div className="risk-board">
    <div className="risk-ocean-label">TABLETOP WORLD MAP</div>
    <div className="risk-compass">N<br /><b>✦</b></div>
    {TERRITORIES.map((territory) => {
      const status = state.territories[territory.id];
      const owner = state.players.find((player) => player.id === status.owner);
      return <button key={territory.id} className={`risk-territory ${selected === territory.id ? "selected" : ""} ${target === territory.id ? "target" : ""}`} style={{ left: `${territory.x}%`, top: `${territory.y}%`, "--owner": owner.color }} onClick={() => onTerritory(territory.id)}>
        <span>{territory.name}</span><strong>{status.armies}</strong>
      </button>;
    })}
    <div className="risk-route route-one" /><div className="risk-route route-two" /><div className="risk-route route-three" />
  </div></div>;
}

export default function Risk({ onExit }) {
  const [setup, setSetup] = useState(null);
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState("reinforce");
  const [reinforcements, setReinforcements] = useState(3);
  const [selected, setSelected] = useState(null);
  const [target, setTarget] = useState(null);
  const [battle, setBattle] = useState(null);
  const [log, setLog] = useState(["The world has been divided."]);
  if (!setup) return <RiskSetup onStart={setSetup} onExit={onExit} />;

  const current = setup.players[turn];
  const owned = Object.values(setup.territories).filter((territory) => territory.owner === current.id).length;
  const alive = setup.players.filter((player) => Object.values(setup.territories).some((territory) => territory.owner === player.id));
  const winner = alive.length === 1 ? alive[0] : null;
  const selectedState = selected ? setup.territories[selected] : null;
  const targetState = target ? setup.territories[target] : null;
  const addLog = (text) => setLog((items) => [text, ...items].slice(0, 20));
  const updateTerritories = (fn) => setSetup((game) => ({ ...game, territories: fn(game.territories) }));

  const chooseTerritory = (id) => {
    const territory = setup.territories[id];
    if (phase === "reinforce") {
      if (territory.owner !== current.id || reinforcements <= 0) return;
      updateTerritories((all) => ({ ...all, [id]: { ...all[id], armies: all[id].armies + 1 } }));
      setReinforcements((count) => count - 1);
      addLog(`${current.name} reinforced ${TERRITORIES.find((item) => item.id === id).name}.`);
      return;
    }
    if (!selected) {
      if (territory.owner === current.id && territory.armies > 1) setSelected(id);
      return;
    }
    if (id === selected) { setSelected(null); setTarget(null); return; }
    if (!isAdjacent(selected, id)) return;
    if (phase === "attack" && territory.owner !== current.id) setTarget(id);
    if (phase === "fortify" && territory.owner === current.id) setTarget(id);
  };

  const attack = () => {
    if (!selected || !target || !isAdjacent(selected, target) || selectedState.armies < 2 || targetState.owner === current.id) return;
    const attackerDice = [dice(), dice(), dice()].slice(0, Math.min(3, selectedState.armies - 1)).sort((a, b) => b - a);
    const defenderDice = [dice(), dice()].slice(0, Math.min(2, targetState.armies)).sort((a, b) => b - a);
    let attackerLoss = 0; let defenderLoss = 0;
    defenderDice.forEach((roll, i) => attackerDice[i] > roll ? defenderLoss++ : attackerLoss++);
    const fromName = TERRITORIES.find((item) => item.id === selected).name;
    const toName = TERRITORIES.find((item) => item.id === target).name;
    const conquered = targetState.armies - defenderLoss <= 0;
    updateTerritories((all) => ({
      ...all,
      [selected]: { ...all[selected], armies: all[selected].armies - attackerLoss - (conquered ? 1 : 0) },
      [target]: conquered ? { owner: current.id, armies: 1 } : { ...all[target], armies: all[target].armies - defenderLoss },
    }));
    setBattle({ attackerDice, defenderDice, attackerLoss, defenderLoss, conquered, fromName, toName });
    addLog(conquered ? `${current.name} conquered ${toName}.` : `${current.name} attacked ${toName}.`);
    if (conquered) setTarget(null);
  };

  const fortify = () => {
    if (!selected || !target || targetState.owner !== current.id || !isAdjacent(selected, target) || selectedState.armies < 2) return;
    updateTerritories((all) => ({ ...all, [selected]: { ...all[selected], armies: all[selected].armies - 1 }, [target]: { ...all[target], armies: all[target].armies + 1 } }));
    addLog(`${current.name} fortified ${TERRITORIES.find((item) => item.id === target).name}.`);
    endTurn();
  };

  const endTurn = () => {
    let next = (turn + 1) % setup.players.length;
    while (!Object.values(setup.territories).some((territory) => territory.owner === setup.players[next].id)) next = (next + 1) % setup.players.length;
    const nextPlayer = setup.players[next];
    const nextOwned = Object.values(setup.territories).filter((territory) => territory.owner === nextPlayer.id).length;
    setTurn(next); setPhase("reinforce"); setReinforcements(Math.max(3, Math.floor(nextOwned / 3))); setSelected(null); setTarget(null); setBattle(null);
    addLog(`${nextPlayer.name} begins a new campaign.`);
  };

  const phaseHelp = phase === "reinforce" ? `Place ${reinforcements} more armies.` : phase === "attack" ? "Select your army, then an enemy neighbor." : "Move one army between friendly neighbors.";
  return <main className="risk-shell">
    <header className="risk-topbar"><div className="risk-wordmark">RISK <small>WORLD DOMINATION</small></div><div className="risk-turn"><i style={{ background: current.color }} /><span><small>CURRENT GENERAL</small><strong>{current.name}</strong></span></div><button className="secondary" onClick={onExit}><X /> Leave</button></header>
    <section className="risk-layout">
      <aside className="risk-sidebar risk-players"><div className="risk-panel-title"><Users /> Generals</div>{setup.players.map((player) => {
        const territories = Object.values(setup.territories).filter((territory) => territory.owner === player.id);
        return <article className={player.id === current.id ? "active" : ""} key={player.id}><i style={{ background: player.color }} /><div><strong>{player.name}</strong><span>{territories.length} territories · {territories.reduce((sum, item) => sum + item.armies, 0)} armies</span></div></article>;
      })}</aside>
      <section className="risk-center"><RiskBoard state={setup} selected={selected} target={target} onTerritory={chooseTerritory} /><div className="risk-controls">
        <div><small>{phase.toUpperCase()} PHASE</small><strong>{phaseHelp}</strong></div>
        {phase === "reinforce" && <button disabled={reinforcements > 0} onClick={() => setPhase("attack")}><Sword /> Begin attack</button>}
        {phase === "attack" && <><button className="risk-attack" disabled={!target} onClick={attack}><DiceFive /> Roll battle dice</button><button onClick={() => { setPhase("fortify"); setSelected(null); setTarget(null); }}><ShieldChevron /> Fortify</button></>}
        {phase === "fortify" && <><button disabled={!target} onClick={fortify}><Flag /> Move army</button><button onClick={endTurn}><Check /> End turn</button></>}
      </div></section>
      <aside className="risk-sidebar risk-log"><div className="risk-panel-title"><Crown /> War room</div>{battle && <div className="battle-card"><strong>{battle.fromName} → {battle.toName}</strong><div><span>{battle.attackerDice.join(" · ")}</span><b>VS</b><span>{battle.defenderDice.join(" · ")}</span></div><p>{battle.conquered ? "Territory conquered." : `Attacker lost ${battle.attackerLoss}; defender lost ${battle.defenderLoss}.`}</p></div>}<div className="risk-log-list">{log.map((item, i) => <p key={`${item}-${i}`}>{item}</p>)}</div></aside>
    </section>
    {winner && <div className="modal-backdrop"><section className="winner-card risk-winner"><Crown /><span className="eyebrow">World conquered</span><h1>{winner.name} rules the map.</h1><button className="primary big" onClick={onExit}>Back to game shelf</button></section></div>}
  </main>;
}
