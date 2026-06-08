import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Buildings, ChatCircleDots, Check, Copy, DiceFive, Eye, Handshake, House,
  Lightning, MagnifyingGlass, MagnifyingGlassMinus, MagnifyingGlassPlus, Money, MusicNotes, Plus, SealCheck, SpeakerHigh, Timer, Trash, Users, X,
} from "@phosphor-icons/react";
import Board from "./Board";
import {
  BOARD, CHANCE, CHEST, TOKENS, calculateRent, createPlayers, initialOwnership, money,
} from "./game";
import { TokenPiece } from "./Pieces";
import { connectToRoom, PUBLIC_DIRECTORY } from "./network";

const randomCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const shuffle = (items) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

function Lobby({ onStart }) {
  const [mode, setMode] = useState("home");
  const [joinCode, setJoinCode] = useState("");
  const [tableName, setTableName] = useState("Friday Game Night");
  const [players, setPlayers] = useState([{ name: "Player 1", token: TOKENS[0] }, { name: "Player 2", token: TOKENS[1] }]);
  const [roomCode] = useState(randomCode());

  const updateSeat = (index, key, value) => setPlayers((list) => list.map((player, i) => i === index ? { ...player, [key]: value } : player));
  const addPlayer = () => setPlayers((list) => list.length < 8 ? [...list, { name: `Player ${list.length + 1}`, token: TOKENS.find((token) => !list.some((p) => p.token === token)) }] : list);
  const removePlayer = (index) => setPlayers((list) => list.length > 2 ? list.filter((_, i) => i !== index) : list);
  const canStart = players.length >= 2 && players.every((p) => p.name.trim()) && new Set(players.map((p) => p.token)).size === players.length;

  if (mode === "home") return (
    <main className="welcome">
      <nav className="welcome-nav"><Brand /><span className="status-pill"><i /> Peer-to-peer rooms</span></nav>
      <section className="welcome-grid">
        <div className="welcome-copy">
          <span className="eyebrow">Tonight's table is open</span>
          <h1>Board game night,<br /><em>minus the cleanup.</em></h1>
          <p>Classic games, cozy rooms, and just enough friendly chaos to keep the group chat alive.</p>
          <div className="welcome-actions">
            <button className="primary big" onClick={() => setMode("online")}><Plus /> Create online room</button>
            <button className="secondary big" onClick={() => setMode("join")}><Users /> Join with code</button>
            <button className="secondary big" onClick={() => setMode("browse")}><MagnifyingGlass /> Public tables</button>
            <button className="secondary big" onClick={() => setMode("create")}><DiceFive /> Local game</button>
          </div>
          <div className="friend-strip">
            <p><strong>No accounts or TableTop server.</strong> Room discovery, then encrypted peer-to-peer play.</p>
          </div>
        </div>
        <div className="table-preview">
          <div className="preview-board"><b>MONOPOLY</b><span>Game night starts here</span></div>
          <span className="preview-piece p1"><TokenPiece token="Top Hat" color="#ff6b6b" /></span><span className="preview-piece p2"><TokenPiece token="Race Car" color="#4dabf7" /></span>
          <div className="preview-die d1">5</div><div className="preview-die d2">2</div>
          <div className="voice-bubble"><ChatCircleDots /> Pass the dice, not a login.</div>
        </div>
      </section>
      <footer className="welcome-footer"><span>TableTop</span><span>Online rooms and local pass-and-play.</span></footer>
    </main>
  );

  if (mode === "browse") return <PublicLobby onBack={() => setMode("home")} onJoin={(code) => { setJoinCode(code); setMode("join"); }} />;
  if (mode === "online" || mode === "join") return <OnlineLobby role={mode === "online" ? "host" : "guest"} initialCode={mode === "online" ? roomCode : joinCode} onBack={() => setMode("home")} onStart={onStart} />;

  return (
    <main className="lobby">
      <nav><Brand /><button className="secondary" onClick={() => setMode("home")}><X /> Leave room</button></nav>
      <section className="lobby-card">
        <div className="lobby-head">
          <div><span className="eyebrow">Local pass-and-play</span><h1>Choose your pieces.</h1><p>Name every player and pick a unique token for one-screen play.</p></div>
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

function PublicLobby({ onBack, onJoin }) {
  const [tables, setTables] = useState([]);
  const [status, setStatus] = useState("Looking for open tables...");
  useEffect(() => {
    const directory = connectToRoom(PUBLIC_DIRECTORY);
    const listings = directory.room.makeAction("listing");
    const discover = directory.room.makeAction("discover");
    listings.onMessage = (listing) => {
      setTables((current) => [listing, ...current.filter((table) => table.code !== listing.code)].slice(0, 12));
      setStatus("Live tables found. Pick a seat.");
    };
    const requestListings = () => discover.send({ requestedAt: Date.now() });
    directory.room.onPeerJoin = requestListings;
    const discoveryTimer = setInterval(requestListings, 2500);
    requestListings();
    const prune = setInterval(() => setTables((current) => current.filter((table) => Date.now() - table.seenAt < 10000)), 3000);
    return () => {
      clearInterval(discoveryTimer);
      clearInterval(prune);
      directory.room.leave();
    };
  }, []);
  return <main className="join-screen"><Brand /><section className="online-room-card public-lobby-card">
    <button className="drawer-close" onClick={onBack}><X /></button>
    <span className="eyebrow">Public tables</span><h2>Find a game night.</h2>
    <p className="public-lobby-intro">Open rooms appear here while their hosts are waiting. Games in progress can be joined as a spectator.</p>
    <div className="public-table-list">{tables.length ? tables.map((table) => <article key={table.code}><div><strong>{table.name}</strong><span>{table.code} · {table.players} seated · {table.status}</span></div><button className="primary" onClick={() => onJoin(table.code)}>{table.status === "In progress" ? <Eye /> : <Users />} {table.status === "In progress" ? "Spectate" : "Join"}</button></article>) : <div className="public-empty"><MagnifyingGlass /><strong>No public tables yet</strong><span>Create one and it will appear here.</span></div>}</div>
    <p className="connection-status"><i /> {status}</p>
  </section></main>;
}

function OnlineLobby({ role, initialCode, onBack, onStart }) {
  const [name, setName] = useState(role === "host" ? "Host" : "Player");
  const [token, setToken] = useState(role === "host" ? TOKENS[0] : TOKENS[1]);
  const [code, setCode] = useState(initialCode);
  const [connection, setConnection] = useState(null);
  const [roster, setRoster] = useState([]);
  const [ready, setReady] = useState(role === "host");
  const [isPublic, setIsPublic] = useState(false);
  const [status, setStatus] = useState(role === "host" ? "Opening room..." : "Enter the room code to connect.");
  const connectionRef = useRef(null);
  const profileRef = useRef(null);
  const rosterRef = useRef([]);
  const publicRef = useRef(false);
  const handedOff = useRef(false);

  useEffect(() => {
    if (role === "host") join(initialCode);
    return () => {
      clearInterval(connectionRef.current?.announceTimer);
      clearInterval(connectionRef.current?.listingTimer);
      clearTimeout(connectionRef.current?.connectionTimer);
      if (!handedOff.current) {
        connectionRef.current?.room.leave();
        connectionRef.current?.directory?.room.leave();
      }
    };
  }, []);

  const join = (roomCode = code) => {
    if (roomCode.length !== 4 || connection) return;
    const network = connectToRoom(roomCode);
    const profile = network.room.makeAction("profile");
    const rosterAction = network.room.makeAction("roster");
    const joinAction = network.room.makeAction("join-request");
    const startAction = network.room.makeAction("start");
    const directory = null;
    const listingAction = null;
    const mine = { peerId: network.selfId, name, token, ready: role === "host" };
    profileRef.current = mine;
    const connected = { ...network, profile, rosterAction, joinAction, startAction, directory, listingAction };
    connectionRef.current = connected;
    rosterRef.current = [mine];
    setConnection(connected);
    setRoster([mine]);
    setStatus(role === "host" ? "Room open. Waiting for players..." : "Looking for the host...");
    const addToRoster = (entry) => {
      if (role !== "host") return;
      setRoster((current) => {
        const otherPlayers = current.filter((player) => player.peerId !== entry.peerId);
        const usedTokens = otherPlayers.map((player) => player.token);
        const assignedToken = usedTokens.includes(entry.token)
          ? TOKENS.find((item) => !usedTokens.includes(item))
          : entry.token;
        const next = [...otherPlayers, { ...entry, token: assignedToken }].slice(0, 8);
        rosterRef.current = next;
        connected.rosterCount = next.length;
        rosterAction.send(next);
        connected.announceListing?.();
        return next;
      });
    };
    profile.onMessage = addToRoster;
    joinAction.onMessage = (entry, peerId) => {
      if (role !== "host") return;
      addToRoster(entry);
      rosterAction.send(rosterRef.current, { target: peerId });
    };
    rosterAction.onMessage = (next) => {
      const mine = next.find((player) => player.peerId === network.selfId);
      if (mine && mine.token !== profileRef.current.token) {
        profileRef.current = mine;
        setToken(mine.token);
      }
      rosterRef.current = next;
      setRoster(next);
      setStatus("You are seated. Ready up when everyone arrives.");
    };
    startAction.onMessage = (setup) => {
      handedOff.current = true;
      onStart({ ...setup, network: connected, localPeerId: network.selfId, online: true });
    };
    network.room.onPeerJoin = (peerId) => {
      connected.hasPeer = true;
      profile.send(profileRef.current);
      if (role === "guest") joinAction.send(profileRef.current, { target: peerId });
      if (role === "host") rosterAction.send(rosterRef.current, { target: peerId });
      setStatus("Peer connected. Ready when the table is.");
    };
    network.room.onPeerLeave = (peerId) => {
      setRoster((current) => {
        const next = current.filter((p) => p.peerId !== peerId);
        rosterRef.current = next;
        connected.rosterCount = next.length;
        if (role === "host") {
          rosterAction.send(next);
          connected.announceListing?.();
        }
        return next;
      });
      setStatus("A player left the room.");
    };
    connected.announceTimer = setInterval(() => {
      profile.send(profileRef.current);
      if (role === "guest") joinAction.send(profileRef.current);
      if (role === "host") rosterAction.send(rosterRef.current);
    }, 2500);
    connected.connectionTimer = setTimeout(() => {
      if (!connected.hasPeer && role === "guest") setStatus("No host found yet. Check the code and keep this window open.");
    }, 12000);
    connected.rosterCount = 1;
  };
  const updateProfile = (key, value) => {
    if (key === "name") setName(value); else setToken(value);
    if (!connection) return;
    const mine = { peerId: connection.selfId, name: key === "name" ? value : name, token: key === "token" ? value : token, ready };
    profileRef.current = mine;
    connection.profile.send(mine);
    setRoster((current) => {
      const next = current.map((p) => p.peerId === connection.selfId ? mine : p);
      rosterRef.current = next;
      if (role === "host") connection.rosterAction.send(next);
      return next;
    });
  };
  const toggleReady = () => {
    const nextReady = !ready;
    setReady(nextReady);
    const mine = { ...profileRef.current, ready: nextReady };
    profileRef.current = mine;
    connection.profile.send(mine);
    setRoster((current) => {
      const next = current.map((player) => player.peerId === connection.selfId ? mine : player);
      rosterRef.current = next;
      return next;
    });
  };
  const togglePublic = () => {
    const nextPublic = !isPublic;
    publicRef.current = nextPublic;
    setIsPublic(nextPublic);
    if (nextPublic && !connection.directory) {
      connection.directory = connectToRoom(PUBLIC_DIRECTORY);
      connection.listingAction = connection.directory.room.makeAction("listing");
      connection.discoveryAction = connection.directory.room.makeAction("discover");
      connection.announceListing = () => {
        if (!publicRef.current) return;
        connection.listingAction.send({
          code: code.toUpperCase(),
          name: `${profileRef.current.name}'s table`,
          players: connection.rosterCount,
          status: "Waiting",
          seenAt: Date.now(),
        });
      };
      connection.discoveryAction.onMessage = connection.announceListing;
      connection.directory.room.onPeerJoin = connection.announceListing;
      connection.listingTimer = setInterval(connection.announceListing, 2500);
      connection.announceListing();
    }
  };
  const startOnline = async () => {
    const setup = { players: createPlayers(roster), roomCode: code.toUpperCase(), tableName: `${name}'s online table`, hostPeerId: connection.selfId, publicRoom: isPublic };
    setStatus("Dealing the board to everyone...");
    await connection.startAction.send(setup);
    handedOff.current = true;
    onStart({ ...setup, network: connection, localPeerId: connection.selfId, online: true });
  };
  const tokensUsed = roster.filter((p) => p.peerId !== connection?.selfId).map((p) => p.token);
  const leaveRoom = () => { connection?.room.leave(); connection?.directory?.room.leave(); onBack(); };
  return <main className="join-screen"><Brand /><section className="online-room-card">
    <button className="drawer-close" onClick={leaveRoom}><X /></button>
    <span className="eyebrow">{role === "host" ? "Create online room" : "Join online room"}</span><h2>{connection ? "The table is open." : "Meet at the table."}</h2>
    {!connection && role === "guest" && <label>Room code<input className="code-input" maxLength="4" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></label>}
    <div className="online-profile"><label>Your name<input value={name} onChange={(e) => updateProfile("name", e.target.value)} /></label><label>Your token<select value={token} onChange={(e) => updateProfile("token", e.target.value)}>{TOKENS.map((item) => <option disabled={tokensUsed.includes(item)} key={item}>{item}</option>)}</select></label></div>
    {!connection ? <button className="primary big" disabled={code.length !== 4 || !name.trim()} onClick={() => join()}>Connect to room</button> : <>
      <button className="room-code online-code" onClick={() => navigator.clipboard?.writeText(code)}><span>SHARE ROOM CODE</span><strong>{code}</strong><Copy /></button>
      {role === "host" && <button className={isPublic ? "visibility-toggle is-public" : "visibility-toggle"} onClick={togglePublic}><Eye /><span><strong>{isPublic ? "Public table" : "Private table"}</strong><small>{isPublic ? "Visible in public tables" : "Only people with the code can join"}</small></span></button>}
      <div className="online-roster">{roster.map((player) => <article className="seat" key={player.peerId}><div className="seat-avatar"><TokenPiece token={player.token} color="#9ca9a2" /></div><div><strong>{player.name}</strong><span>{player.peerId === connection.selfId ? "You" : "Connected peer"} · {player.token}</span></div><b className={player.ready ? "roster-ready is-ready" : "roster-ready"}>{player.ready ? "READY" : "WAITING"}</b></article>)}</div>
      {role === "guest" && <button className={ready ? "secondary big ready-toggle" : "primary big ready-toggle"} onClick={toggleReady}>{ready ? <Check /> : null}{ready ? "Ready" : "I'm ready"}</button>}
      {role === "host" && <button className="primary big" disabled={roster.length < 2 || roster.some((p) => !p.ready) || new Set(roster.map((p) => p.token)).size !== roster.length} onClick={startOnline}>Start online game</button>}
    </>}
    <p className="connection-status"><i /> {status}</p>
  </section></main>;
}

function Brand() {
  return <div className="brand"><img src={`${import.meta.env.BASE_URL}assets/tabletop-logo.png`} alt="" /><strong>TableTop</strong><small>GAME NIGHT</small></div>;
}

function PlayerCard({ player, active, onTrade, canTrade, offline }) {
  return <article className={`player-card ${active ? "active" : ""} ${player.bankrupt ? "bankrupt" : ""} ${offline ? "offline" : ""}`}>
    <div className="player-avatar" style={{ "--player": player.color }}><TokenPiece token={player.token} color={player.color} /><i /></div>
    <div className="player-meta"><strong>{player.name}</strong><span>{player.bankrupt ? "Bankrupt" : offline ? "Disconnected" : money(player.money)}</span></div>
    {!player.bankrupt && <button className="icon-button" disabled={!canTrade} onClick={() => onTrade(player.id)} title={`Trade with ${player.name}`}><Handshake /></button>}
  </article>;
}

function PropertyPanel({ index, ownership, players, currentPlayer, canAct, onBuyBuilding, onSellBuilding, onMortgage, onClose }) {
  const space = BOARD[index];
  const state = ownership[index];
  const owner = players.find((p) => p.id === state.owner);
  const canManage = canAct && owner?.id === currentPlayer.id && ["property", "railroad", "utility"].includes(space.type);
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
    <p className="trade-note">The other player must accept before anything changes hands.</p>
    <div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={offerMoney > currentPlayer.money || requestMoney > (target?.money || 0)} onClick={() => onTrade({ targetId, offerMoney, requestMoney, offerProps, requestProps })}><Handshake /> Send offer</button></div>
  </section></div>;
}

function TradeOfferModal({ offer, players, onResolve, canResolve }) {
  const from = players.find((p) => p.id === offer.fromId);
  const target = players.find((p) => p.id === offer.targetId);
  const propertyNames = (items) => items.map((i) => BOARD[i].name).join(", ") || "No properties";
  return <div className="modal-backdrop"><section className="trade-modal trade-offer-modal">
    <div className="modal-head"><div><span className="eyebrow">Trade offer</span><h2>{from.name} wants to make a deal.</h2></div><Handshake /></div>
    <div className="trade-columns">
      <div><h3>{from.name} offers</h3><strong>{money(offer.offerMoney)}</strong><p>{propertyNames(offer.offerProps)}</p></div>
      <div><h3>{target.name} gives</h3><strong>{money(offer.requestMoney)}</strong><p>{propertyNames(offer.requestProps)}</p></div>
    </div>
    <p className="trade-note">{canResolve ? "Accept or reject the offer." : `Waiting for ${target.name} to decide.`}</p>
    <div className="modal-actions"><button className="secondary" disabled={!canResolve} onClick={() => onResolve(false)}>Reject</button><button className="primary" disabled={!canResolve} onClick={() => onResolve(true)}><Check /> Accept trade</button></div>
  </section></div>;
}

function SocialPanel({ log, messages, onSend }) {
  const [text, setText] = useState("");
  const submit = (value = text) => { onSend(value); setText(""); };
  return <section className="panel event-log social-panel"><div className="panel-title"><span><ChatCircleDots /> Table talk</span><i /></div>
    <div className="social-scroll"><div className="log-list">{log.slice(0, 8).map((item, i) => <p key={`${item}-${i}`}><span>{i === 0 ? "NOW" : `${i + 1}`}</span>{item}</p>)}</div>
      <div className="chat-list">{messages.map((message) => <p key={message.id}><strong>{message.author}</strong><span>{message.text}</span></p>)}</div>
    </div>
    <div className="quick-reactions">{["👏", "😮", "😂", "🤝"].map((reaction) => <button key={reaction} onClick={() => submit(reaction)}>{reaction}</button>)}</div>
    <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); submit(); }}><input aria-label="Table chat message" placeholder="Say something..." value={text} onChange={(event) => setText(event.target.value)} /><button disabled={!text.trim()}><ChatCircleDots /></button></form>
  </section>;
}

function AuctionModal({ auction, players, localPlayerId, online, onBid, onPass }) {
  const eligible = players.filter((p) => !p.bankrupt && p.money > 0 && !auction.passed.includes(p.id));
  const [bidderId, setBidderId] = useState(localPlayerId || eligible[0]?.id);
  const bidder = players.find((p) => p.id === bidderId);
  const highest = Object.entries(auction.bids).sort((a, b) => b[1] - a[1])[0];
  const minimum = (highest?.[1] || 0) + 1;
  const [bid, setBid] = useState(minimum);
  const canAct = (!online || bidderId === localPlayerId) && !auction.passed.includes(bidderId);
  const isHighestBidder = highest?.[0] === bidderId;
  useEffect(() => setBid(minimum), [minimum]);
  const property = BOARD[auction.property];
  return <div className="modal-backdrop"><section className="trade-modal auction-modal">
    <div className="modal-head"><div><span className="eyebrow">Live bank auction</span><h2>{property.name}</h2></div><strong>{highest ? `${players.find((p) => p.id === highest[0])?.name}: ${money(highest[1])}` : "No bids yet"}</strong></div>
    <p className="trade-note">Every active player may bid. Passing removes a player from this auction.</p>
    <label>Bidder<select disabled={online} value={bidderId} onChange={(e) => { setBidderId(e.target.value); setBid(minimum); }}>{eligible.map((p) => <option value={p.id} key={p.id}>{p.name} · {money(p.money)}</option>)}</select></label>
    <label>Bid<input type="number" min={minimum} max={bidder?.money || 0} value={bid} onChange={(e) => setBid(+e.target.value)} /></label>
    <div className="auction-bidders">{players.filter((p) => !p.bankrupt).map((p) => <span className={auction.passed.includes(p.id) ? "passed" : ""} key={p.id}>{p.name}{auction.bids[p.id] ? ` · ${money(auction.bids[p.id])}` : ""}</span>)}</div>
    <div className="modal-actions"><button className="secondary" disabled={!canAct || !bidderId || isHighestBidder} onClick={() => onPass(bidderId)}>Pass</button><button className="primary" disabled={!canAct || !bid || bid < minimum || bid > (bidder?.money || 0)} onClick={() => { onBid(bidderId, bid); setBid(bid + 1); }}>Place bid</button></div>
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
  const [pendingTrade, setPendingTrade] = useState(null);
  const [auction, setAuction] = useState(null);
  const [debtTo, setDebtTo] = useState(null);
  const [chanceDeck, setChanceDeck] = useState(() => shuffle(CHANCE));
  const [chestDeck, setChestDeck] = useState(() => shuffle(CHEST));
  const [bankHouses, setBankHouses] = useState(32);
  const [bankHotels, setBankHotels] = useState(12);
  const [log, setLog] = useState([`The table is set. ${setup.players[0].name} has the first turn.`]);
  const [messages, setMessages] = useState([]);
  const [turnSeconds, setTurnSeconds] = useState(90);
  const [fastMode, setFastMode] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [boardZoom, setBoardZoom] = useState(() => window.innerWidth < 820 ? .55 : 1);
  const [offlinePeers, setOfflinePeers] = useState([]);
  const currentPlayer = players[turn];
  const canAct = !setup.online || currentPlayer.peerId === setup.localPeerId;
  const hostCanAdvanceOffline = setup.online && setup.localPeerId === setup.hostPeerId && offlinePeers.includes(currentPlayer.peerId);
  const activePlayers = players.filter((p) => !p.bankrupt);
  const winner = activePlayers.length === 1 ? activePlayers[0] : null;
  const receivingState = useRef(false);
  const broadcasting = useRef(false);
  const broadcastTimer = useRef(null);
  const stateRef = useRef(null);
  const [syncAction] = useState(() => setup.online ? setup.network.room.makeAction("game-state") : null);
  const [chatAction] = useState(() => setup.online ? setup.network.room.makeAction("table-chat") : null);
  const addLog = (text) => setLog((items) => [text, ...items].slice(0, 30));
  const updatePlayer = (id, fn) => setPlayers((list) => list.map((p) => p.id === id ? fn(p) : p));
  const markLocalMove = () => {
    if (!setup.online) return;
    broadcasting.current = true;
    clearTimeout(broadcastTimer.current);
    broadcastTimer.current = setTimeout(() => { broadcasting.current = false; }, 1800);
  };

  useEffect(() => window.scrollTo(0, 0), []);

  useEffect(() => {
    if (!musicOn) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const notes = [130.81, 164.81, 196, 220];
    const playNote = () => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine"; oscillator.frequency.value = notes[Math.floor(Math.random() * notes.length)];
      gain.gain.setValueAtTime(.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.008, context.currentTime + .15);
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + 1.4);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 1.5);
    };
    playNote();
    const musicTimer = setInterval(playNote, 1800);
    return () => { clearInterval(musicTimer); context.close(); };
  }, [musicOn]);

  useEffect(() => {
    if (!syncAction) return;
    syncAction.onMessage = (state) => {
      receivingState.current = true;
      setPlayers(state.players); setOwnership(state.ownership); setTurn(state.turn); setDice(state.dice);
      setRolling(state.rolling); setRolled(state.rolled); setExtraTurn(state.extraTurn); setDoublesCount(state.doublesCount);
      setPendingBuy(state.pendingBuy); setCard(state.card); setAuction(state.auction); setDebtTo(state.debtTo);
      setPendingTrade(state.pendingTrade); setChanceDeck(state.chanceDeck); setChestDeck(state.chestDeck);
      setBankHouses(state.bankHouses); setBankHotels(state.bankHotels); setLog(state.log);
      setTimeout(() => { receivingState.current = false; }, 0);
    };
  }, [syncAction]);

  useEffect(() => {
    if (!chatAction) return;
    chatAction.onMessage = (message) => setMessages((items) => [...items, message].slice(-30));
  }, [chatAction]);

  useEffect(() => {
    if (!syncAction || receivingState.current || !broadcasting.current) return;
    syncAction.send({ players, ownership, turn, dice, rolling, rolled, extraTurn, doublesCount, pendingBuy, card, auction, debtTo, pendingTrade, chanceDeck, chestDeck, bankHouses, bankHotels, log });
  }, [players, ownership, turn, dice, rolling, rolled, extraTurn, doublesCount, pendingBuy, card, auction, debtTo, pendingTrade, chanceDeck, chestDeck, bankHouses, bankHotels, log, syncAction]);

  useEffect(() => {
    stateRef.current = { players, ownership, turn, dice, rolling, rolled, extraTurn, doublesCount, pendingBuy, card, auction, debtTo, pendingTrade, chanceDeck, chestDeck, bankHouses, bankHotels, log };
  }, [players, ownership, turn, dice, rolling, rolled, extraTurn, doublesCount, pendingBuy, card, auction, debtTo, pendingTrade, chanceDeck, chestDeck, bankHouses, bankHotels, log]);

  useEffect(() => {
    if (!setup.online || setup.localPeerId !== setup.hostPeerId) return;
    setup.network.room.onPeerJoin = (peerId) => {
      setOfflinePeers((peers) => peers.filter((id) => id !== peerId));
      setup.network.startAction.send({ players: setup.players, roomCode: setup.roomCode, tableName: setup.tableName, hostPeerId: setup.hostPeerId, spectator: true }, { target: peerId });
      setTimeout(() => syncAction.send(stateRef.current, { target: peerId }), 700);
    };
    setTimeout(() => syncAction.send(stateRef.current), 500);
    const announceGame = () => {
      if (!setup.publicRoom) return;
      setup.network.listingAction?.send({
        code: setup.roomCode,
        name: setup.tableName,
        players: stateRef.current?.players.filter((player) => !player.bankrupt).length || setup.players.length,
        status: "In progress",
        seenAt: Date.now(),
      });
    };
    setup.network.announceListing = announceGame;
    if (setup.network.discoveryAction) setup.network.discoveryAction.onMessage = announceGame;
    if (setup.network.directory) setup.network.directory.room.onPeerJoin = announceGame;
    announceGame();
    const directoryTimer = setInterval(announceGame, 2500);
    return () => clearInterval(directoryTimer);
  }, [setup, syncAction]);

  useEffect(() => {
    if (!setup.online) return;
    setup.network.room.onPeerLeave = (peerId) => {
      setOfflinePeers((peers) => [...new Set([...peers, peerId])]);
      addLog(`${players.find((player) => player.peerId === peerId)?.name || "A spectator"} disconnected.`);
    };
  }, [setup, players]);

  const sendMessage = (text) => {
    const clean = text.trim().slice(0, 120);
    if (!clean) return;
    const author = players.find((p) => p.peerId === setup.localPeerId)?.name || (setup.spectator ? "Spectator" : currentPlayer.name);
    const message = { id: `${Date.now()}-${Math.random()}`, author, text: clean };
    setMessages((items) => [...items, message].slice(-30));
    chatAction?.send(message);
  };
  const playSound = (frequency = 260, duration = .08) => {
    if (!soundOn) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency; gain.gain.value = .025;
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start();
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
    oscillator.stop(context.currentTime + duration);
  };

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
    else if (space.type === "chance" || space.type === "chest") drawCard(playerId, space.type, workingPlayers);
    else if (space.type === "parking") addLog(`${player.name} is taking it easy at Free Parking.`);
  };

  const charge = (id, amount, message) => {
    updatePlayer(id, (p) => ({ ...p, money: p.money - amount }));
    setDebtTo(null);
    addLog(message);
  };
  const transfer = (from, to, amount, message) => {
    setPlayers((list) => list.map((p) => p.id === from ? { ...p, money: p.money - amount } : p.id === to ? { ...p, money: p.money + amount } : p));
    setDebtTo(to);
    addLog(message);
  };
  const sendToJail = (id) => {
    updatePlayer(id, (p) => ({ ...p, position: 10, inJail: true, jailTurns: 0 }));
    addLog(`${players.find((p) => p.id === id)?.name} went directly to Jail.`);
  };
  const drawCard = (id, type, workingPlayers = players) => {
    const deck = type === "chance" ? chanceDeck : chestDeck;
    const drawn = deck[0];
    if (type === "chance") setChanceDeck([...deck.slice(1), drawn]); else setChestDeck([...deck.slice(1), drawn]);
    const name = workingPlayers.find((p) => p.id === id)?.name;
    setCard({ ...drawn, type });
    addLog(`${name} drew ${type === "chance" ? "a Chance card" : "Community Chest"}: ${drawn.text}`);
    if (drawn.jail) sendToJail(id);
    else if (drawn.money) updatePlayer(id, (p) => ({ ...p, money: p.money + drawn.money }));
    else if (drawn.moveBack) {
      const player = workingPlayers.find((p) => p.id === id);
      const position = (player.position - drawn.moveBack + 40) % 40;
      const updated = workingPlayers.map((p) => p.id === id ? { ...p, position } : p);
      setPlayers(updated);
      setTimeout(() => settleSpace(id, position, 7, updated), 0);
    } else if (drawn.move !== undefined) {
      const updated = workingPlayers.map((p) => p.id === id ? { ...p, money: drawn.move < p.position ? p.money + 200 : p.money, position: drawn.move } : p);
      setPlayers(updated);
      if (drawn.move !== 0) setTimeout(() => settleSpace(id, drawn.move, 7, updated), 0);
    }
  };

  const rollDice = () => {
    if (rolling || rolled || winner) return;
    markLocalMove();
    setRolling(true);
    setTimeout(() => {
      const next = [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
      const total = next[0] + next[1];
      playSound(190 + total * 18, .12);
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
    }, fastMode ? 260 : 720);
  };

  const buyProperty = () => {
    markLocalMove();
    const space = BOARD[pendingBuy];
    if (currentPlayer.money < space.price) return;
    updatePlayer(currentPlayer.id, (p) => ({ ...p, money: p.money - space.price, properties: [...p.properties, pendingBuy] }));
    setOwnership((all) => ({ ...all, [pendingBuy]: { ...all[pendingBuy], owner: currentPlayer.id } }));
    playSound(520, .12);
    addLog(`${currentPlayer.name} bought ${space.name}.`);
    setPendingBuy(null);
  };
  const endTurn = () => {
    markLocalMove();
    if (pendingBuy !== null) { setAuction({ property: pendingBuy, bids: {}, passed: [] }); setPendingBuy(null); return; }
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
  const finalizeAuction = (result) => {
    const highest = Object.entries(result.bids).sort((a, b) => b[1] - a[1])[0];
    if (!highest) {
      addLog(`${BOARD[result.property].name} received no bids.`);
      setAuction(null); setTimeout(finishTurn, 0); return;
    }
    const [bidderId, bid] = highest;
    const space = BOARD[result.property];
    setPlayers((list) => list.map((p) => p.id === bidderId ? { ...p, money: p.money - bid, properties: [...p.properties, result.property] } : p));
    setOwnership((all) => ({ ...all, [result.property]: { ...all[result.property], owner: bidderId } }));
    addLog(`${players.find((p) => p.id === bidderId)?.name} won ${space.name} at auction for ${money(bid)}.`);
    setAuction(null);
    setTimeout(finishTurn, 0);
  };
  const placeBid = (bidderId, bid) => {
    markLocalMove();
    const next = { ...auction, bids: { ...auction.bids, [bidderId]: bid } };
    setAuction(next);
    addLog(`${players.find((p) => p.id === bidderId)?.name} bid ${money(bid)} on ${BOARD[auction.property].name}.`);
  };
  const passAuction = (bidderId) => {
    markLocalMove();
    const next = { ...auction, passed: [...new Set([...auction.passed, bidderId])] };
    const active = players.filter((p) => !p.bankrupt && p.money > 0 && !next.passed.includes(p.id));
    setAuction(next);
    if (active.length <= (Object.keys(next.bids).length ? 1 : 0)) setTimeout(() => finalizeAuction(next), 0);
  };
  const declareBankruptcy = () => {
    markLocalMove();
    const id = currentPlayer.id;
    const creditor = players.find((p) => p.id === debtTo && !p.bankrupt);
    const returnedHouses = currentPlayer.properties.reduce((sum, property) => sum + (ownership[property].houses < 5 ? ownership[property].houses : 0), 0);
    const returnedHotels = currentPlayer.properties.filter((property) => ownership[property].houses === 5).length;
    setPlayers((list) => list.map((p) => p.id === id ? { ...p, money: 0, properties: [], bankrupt: true } : p.id === creditor?.id ? { ...p, properties: [...new Set([...p.properties, ...currentPlayer.properties])] } : p));
    setOwnership((all) => Object.fromEntries(Object.entries(all).map(([i, state]) => [i, state.owner === id ? { owner: creditor?.id || null, houses: 0, mortgaged: state.mortgaged } : state])));
    setBankHouses((count) => count + returnedHouses);
    setBankHotels((count) => count + returnedHotels);
    setDebtTo(null);
    addLog(`${currentPlayer.name} declared bankruptcy${creditor ? ` to ${creditor.name}` : " to the Bank"}.`);
    let next = (turn + 1) % players.length;
    while (players[next].bankrupt || players[next].id === id) next = (next + 1) % players.length;
    setTurn(next); setRolled(false); setDoublesCount(0); setSelected(null); setCard(null);
  };
  const buyBuilding = (index) => {
    markLocalMove();
    const space = BOARD[index];
    const group = BOARD.map((item, i) => ({ ...item, index: i })).filter((item) => item.group === space.group);
    if (!group.every((item) => currentPlayer.properties.includes(item.index))) {
      addLog(`${currentPlayer.name} needs the full ${space.group} set before building.`);
      return;
    }
    if (group.some((item) => ownership[item.index].mortgaged)) {
      addLog(`${currentPlayer.name} cannot build while a property in the set is mortgaged.`);
      return;
    }
    const minimum = Math.min(...group.map((item) => ownership[item.index].houses));
    if (ownership[index].houses !== minimum) {
      addLog("Houses must be built evenly across the color set.");
      return;
    }
    if (ownership[index].houses === 4 && bankHotels < 1) { addLog("The Bank has no hotels left."); return; }
    if (ownership[index].houses < 4 && bankHouses < 1) { addLog("The Bank has no houses left."); return; }
    if (ownership[index].houses >= 5 || currentPlayer.money < space.houseCost) return;
    updatePlayer(currentPlayer.id, (p) => ({ ...p, money: p.money - space.houseCost }));
    setOwnership((all) => ({ ...all, [index]: { ...all[index], houses: all[index].houses + 1 } }));
    if (ownership[index].houses === 4) { setBankHotels((count) => count - 1); setBankHouses((count) => count + 4); } else setBankHouses((count) => count - 1);
    addLog(`${currentPlayer.name} built ${ownership[index].houses === 4 ? "a hotel" : "a house"} on ${space.name}.`);
  };
  const sellBuilding = (index) => {
    markLocalMove();
    const space = BOARD[index];
    if (ownership[index].houses <= 0) return;
    const group = BOARD.map((item, i) => ({ ...item, index: i })).filter((item) => item.group === space.group);
    const maximum = Math.max(...group.map((item) => ownership[item.index].houses));
    if (ownership[index].houses !== maximum) {
      addLog("Buildings must be sold evenly across the color set.");
      return;
    }
    if (ownership[index].houses === 5 && bankHouses < 4) { addLog("The Bank needs four houses before a hotel can be sold."); return; }
    updatePlayer(currentPlayer.id, (p) => ({ ...p, money: p.money + Math.floor(space.houseCost / 2) }));
    setOwnership((all) => ({ ...all, [index]: { ...all[index], houses: all[index].houses - 1 } }));
    if (ownership[index].houses === 5) { setBankHotels((count) => count + 1); setBankHouses((count) => count - 4); } else setBankHouses((count) => count + 1);
    addLog(`${currentPlayer.name} sold a building on ${space.name} for ${money(Math.floor(space.houseCost / 2))}.`);
  };
  const mortgage = (index) => {
    markLocalMove();
    const space = BOARD[index]; const state = ownership[index];
    const value = Math.floor(space.price / 2); const cost = Math.ceil(value * 1.1);
    const group = BOARD.map((item, i) => ({ ...item, index: i })).filter((item) => item.group === space.group);
    if (!state.mortgaged && group.some((item) => ownership[item.index].houses > 0)) {
      addLog("Sell every building in the color set before mortgaging.");
      return;
    }
    if (state.mortgaged && currentPlayer.money < cost) return;
    updatePlayer(currentPlayer.id, (p) => ({ ...p, money: p.money + (state.mortgaged ? -cost : value) }));
    setOwnership((all) => ({ ...all, [index]: { ...all[index], mortgaged: !state.mortgaged } }));
    addLog(`${currentPlayer.name} ${state.mortgaged ? "unmortgaged" : "mortgaged"} ${space.name}.`);
  };
  const makeTrade = ({ targetId, offerMoney, requestMoney, offerProps, requestProps }) => {
    markLocalMove();
    setPendingTrade({ fromId: currentPlayer.id, targetId, offerMoney, requestMoney, offerProps, requestProps });
    addLog(`${currentPlayer.name} sent a trade offer to ${players.find((p) => p.id === targetId)?.name}.`);
    setTradeTarget(null);
  };
  const resolveTrade = (accept) => {
    markLocalMove();
    if (!pendingTrade) return;
    const { fromId, targetId, offerMoney, requestMoney, offerProps, requestProps } = pendingTrade;
    const from = players.find((p) => p.id === fromId);
    const target = players.find((p) => p.id === targetId);
    const validOffer = offerProps.every((index) => from?.properties.includes(index) && ownership[index].houses === 0);
    const validRequest = requestProps.every((index) => target?.properties.includes(index) && ownership[index].houses === 0);
    if (!accept || !from || !target || from.money < offerMoney || target.money < requestMoney || !validOffer || !validRequest) {
      addLog(`${target?.name || "The player"} rejected the trade offer.`);
      setPendingTrade(null);
      return;
    }
    setPlayers((list) => list.map((p) => {
      if (p.id === fromId) return { ...p, money: p.money - offerMoney + requestMoney, properties: [...p.properties.filter((i) => !offerProps.includes(i)), ...requestProps] };
      if (p.id === targetId) return { ...p, money: p.money + offerMoney - requestMoney, properties: [...p.properties.filter((i) => !requestProps.includes(i)), ...offerProps] };
      return p;
    }));
    setOwnership((all) => Object.fromEntries(Object.entries(all).map(([i, state]) => [i, offerProps.includes(+i) ? { ...state, owner: targetId } : requestProps.includes(+i) ? { ...state, owner: fromId } : state])));
    addLog(`${from.name} completed a trade with ${target.name}.`);
    setPendingTrade(null);
  };

  useEffect(() => {
    setTurnSeconds(90);
    const timer = setInterval(() => setTurnSeconds((seconds) => {
      if (seconds > 1) return seconds - 1;
      if ((canAct || hostCanAdvanceOffline) && !rolling && !winner) setTimeout(() => rolled ? endTurn() : rollDice(), 0);
      return 90;
    }), 1000);
    return () => clearInterval(timer);
  }, [turn, rolled, canAct, hostCanAdvanceOffline, rolling, winner]);

  const owned = useMemo(() => currentPlayer.properties.map((i) => ({ index: i, ...BOARD[i], ...ownership[i] })), [currentPlayer, ownership]);
  return <main className="game-shell">
    <div className="table-props" aria-hidden="true"><span className="coffee-cup" /><span className="coaster">TT</span><span className="pencil" /><span className="money-stack">$</span><span className="snack-bowl">•••</span></div>
    <header className="game-topbar"><Brand /><div className="room-mini"><span>{setup.tableName}{setup.spectator ? " · SPECTATING" : ""}</span><strong>{setup.roomCode}</strong></div><div className="game-tools"><button className={fastMode ? "active" : ""} onClick={() => setFastMode(!fastMode)} title="Fast animations"><Lightning /></button><button className={soundOn ? "active" : ""} onClick={() => setSoundOn(!soundOn)} title="Sound effects"><SpeakerHigh /></button><button className={musicOn ? "active" : ""} onClick={() => setMusicOn(!musicOn)} title="Background music"><MusicNotes /></button></div><div className="turn-banner"><span style={{ background: currentPlayer.color }}><TokenPiece token={currentPlayer.token} color={currentPlayer.color} /></span><div><small>CURRENT TURN · {turnSeconds}s</small><strong>{currentPlayer.name}</strong></div><Timer /></div><button className="secondary" onClick={onExit}><X /> Leave</button></header>
    <section className="game-layout">
      <aside className="left-rail panel"><div className="panel-title"><span><Users /> Players</span><small>{activePlayers.length} left</small></div>
        <div className="player-list">{players.map((player, i) => <PlayerCard key={player.id} player={player} active={i === turn} offline={offlinePeers.includes(player.peerId)} canTrade={canAct && player.id !== currentPlayer.id} onTrade={setTradeTarget} />)}</div>
        <button className="trade-button" disabled={!canAct} onClick={() => setTradeTarget(true)}><Handshake /> Propose a trade</button>
      </aside>
      <section className="board-stage"><div className="bank-tray" aria-hidden="true"><span>DEEDS</span><b /><b /><b /><i>$</i></div><div className="board-zoom-controls"><button onClick={() => setBoardZoom(Math.max(.45, boardZoom - .15))}><MagnifyingGlassMinus /></button><button onClick={() => setBoardZoom(window.innerWidth < 820 ? .55 : 1)}>{Math.round(boardZoom * 100)}%</button><button onClick={() => setBoardZoom(Math.min(1.75, boardZoom + .15))}><MagnifyingGlassPlus /></button></div><Board {...{ players, ownership, selected, onSelect: setSelected, dice, rolling, fastMode }} scale={boardZoom} />
        <div className="turn-controls">
          <div className="turn-copy"><span style={{ background: currentPlayer.color }}><TokenPiece token={currentPlayer.token} color={currentPlayer.color} /></span><div><small>{currentPlayer.inJail ? "IN JAIL" : "YOUR MOVE"}</small><strong>{currentPlayer.inJail ? "Roll doubles or pay $50" : pendingBuy !== null ? `${BOARD[pendingBuy].name} is available` : rolled ? "Ready to pass the dice?" : "Roll the dice"}</strong></div></div>
          {currentPlayer.inJail && !rolled && <button className="secondary" disabled={!canAct || currentPlayer.money < 50} onClick={() => { markLocalMove(); charge(currentPlayer.id, 50, `${currentPlayer.name} paid $50 to leave Jail.`); updatePlayer(currentPlayer.id, (p) => ({ ...p, inJail: false })); }}>Pay $50</button>}
          {pendingBuy !== null && <button className="primary buy-button" disabled={!canAct || currentPlayer.money < BOARD[pendingBuy].price} onClick={buyProperty}>Buy · {money(BOARD[pendingBuy].price)}</button>}
          {!rolled ? <button className="roll-button" onClick={rollDice} disabled={!canAct || rolling}><DiceFive /> {canAct ? rolling ? "Rolling..." : "Roll dice" : `Waiting for ${currentPlayer.name}`}</button> : <button className="roll-button" onClick={endTurn} disabled={!canAct || players.some((p) => !p.bankrupt && p.money < 0)}>End turn <Check /></button>}
        </div>
      </section>
      <aside className="right-rail">
        <section className="panel wallet"><div className="panel-title"><span><Money /> Your wallet</span><strong>{money(currentPlayer.money)}</strong></div>
          <div className="asset-row"><span><Buildings /> Properties</span><strong>{owned.length}</strong></div>
          <div className="asset-row bank-stock"><span><House /> Bank stock</span><strong>{bankHouses}H · {bankHotels} hotels</strong></div>
          <div className="owned-strip">{owned.length ? owned.map((item) => <button onClick={() => setSelected(item.index)} style={{ borderTopColor: `var(--group-${item.group})` }} key={item.index}>{item.name.split(" ")[0]}<small>{item.mortgaged ? "M" : item.houses ? `${item.houses}H` : ""}</small></button>) : <p>Land somewhere nice to start your collection.</p>}</div>
          {currentPlayer.money < 0 && <button className="danger" onClick={declareBankruptcy}>Declare bankruptcy</button>}
        </section>
        <SocialPanel log={log} messages={messages} onSend={sendMessage} />
      </aside>
    </section>
    {selected !== null && <PropertyPanel index={selected} {...{ ownership, players, currentPlayer, canAct, onBuyBuilding: buyBuilding, onSellBuilding: sellBuilding, onMortgage: mortgage }} onClose={() => setSelected(null)} />}
    {card && <div className="modal-backdrop" onClick={() => setCard(null)}><section className={`drawn-card ${card.type}`} onClick={(e) => e.stopPropagation()}><span>{card.type === "chance" ? "?" : "★"}</span><small>{card.type === "chance" ? "CHANCE" : "COMMUNITY CHEST"}</small><h2>{card.text}</h2><button className="primary" onClick={() => setCard(null)}>Got it</button></section></div>}
    {tradeTarget && <TradeModal {...{ players, currentPlayer, ownership }} initialTarget={tradeTarget === true ? null : tradeTarget} onClose={() => setTradeTarget(null)} onTrade={makeTrade} />}
    {pendingTrade && <TradeOfferModal offer={pendingTrade} players={players} onResolve={resolveTrade} canResolve={!setup.online || players.find((p) => p.id === pendingTrade.targetId)?.peerId === setup.localPeerId} />}
    {auction !== null && <AuctionModal auction={auction} players={players} localPlayerId={players.find((p) => p.peerId === setup.localPeerId)?.id} online={setup.online} onBid={placeBid} onPass={passAuction} />}
    {winner && <div className="modal-backdrop"><section className="winner-card"><SealCheck /><span className="eyebrow">Game over</span><h1>{winner.name} owns the table.</h1><p>One last deal, one very full property portfolio, and the bragging rights are official.</p><button className="primary big" onClick={onExit}>Back to lobby</button></section></div>}
  </main>;
}

export default function App() {
  const [game, setGame] = useState(null);
  const exitGame = () => { game?.network?.room.leave(); game?.network?.directory?.room.leave(); setGame(null); };
  return game ? <Game setup={game} onExit={exitGame} /> : <Lobby onStart={setGame} />;
}
