# TableTop

TableTop is a premium digital board-game night experience. The first playable game is Monopoly, with online peer-to-peer rooms and optional local pass-and-play.

![TableTop logo](public/assets/tabletop-logo.png)

## Live App

Play at [tabletop-monopoly-night.vercel.app](https://tabletop-monopoly-night.vercel.app).

## Play Modes

- **Online room:** Create a four-character room code and share it with friends. Browsers discover each other through Trystero's public MQTT signaling network, then gameplay is sent directly between peers over encrypted WebRTC.
- **Local pass-and-play:** Configure 2–8 players and share one screen.

There is no TableTop backend, database, authentication, saved account data, or bots. Public signaling relays are used only for peer discovery; game state travels peer-to-peer.

## Features

- Configurable 2–8 player rooms and unique physical tokens
- Full 40-space Monopoly board
- Animated 3D dice and tabletop pieces
- Property buying, exact rent schedules, houses, hotels, mortgages, and building sales
- Chance, Community Chest, taxes, jail, doubles, auctions, bankruptcy, and win conditions
- Property trading and synchronized event log
- Responsive desktop and mobile layouts

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production Build

```bash
npm run build
npm run preview
```

## Deploy

The app is a static Vite project and can be deployed directly to Vercel:

```bash
vercel --prod
```

No environment variables are required.

## Networking Notes

TableTop uses [`trystero`](https://github.com/dmotz/trystero) for room discovery and WebRTC data channels. A signaling medium is technically required for arbitrary browsers to find each other from a short code. TableTop uses public MQTT signaling instead of operating its own backend.

Peers should keep the room open while playing. Refreshing or closing the tab leaves the current game.

## Tech

- React 19
- Vite
- Trystero / WebRTC
- Phosphor Icons
- Native CSS
