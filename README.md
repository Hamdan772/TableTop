# TableTop

**A cozy online Monopoly table that feels like game night with friends, without accounts, bots, or a game server.**

![A live TableTop Monopoly game with players, 3D dice, property management, and game history](public/assets/tabletop-gameplay.png)

### [Play TableTop live](https://tabletop-monopoly-night.vercel.app)

Open the link, create a private room, and share its four-character code with your friends.

## Features

- Play complete Monopoly games with 2–8 players in private peer-to-peer rooms
- Join friends using a four-character room code, with no accounts or central game server
- Buy and auction properties, collect rent, trade, mortgage, build, go to jail, and play to bankruptcy
- Roll animated 3D dice on a physical-style board with tokens, deeds, houses, and hotels
- Draw the complete classic Chance and Community Chest decks, including nearest-property, repairs, and player-payment cards

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

## How it works

TableTop has no application backend. Trystero uses MQTT signaling to connect browsers, then room rosters and game state travel directly between players over WebRTC. Hosts remain authoritative for room membership and continuously acknowledge roster state so a missed peer event cannot leave someone stuck outside the table.

The game itself is built in React with native CSS. Monopoly rules and synchronized state live entirely in the browser.

I hate backends btw

## Credits

- **Game logic and direction:** [Hamdan Nishad](https://github.com/Hamdan772)
- **UI and visual assets:** AI did it (OpenAI Codex)
- Built for the Hack Club Stardance event
