import { joinRoom, selfId } from "@trystero-p2p/mqtt";

const config = {
  appId: "tabletop-stardance-monopoly-v2",
  trickleIce: true,
  relayConfig: {
    redundancy: 5,
  },
};

export { selfId };

export function connectToRoom(code, onJoinError) {
  const normalizedCode = code.trim().toLowerCase();
  const room = joinRoom(config, normalizedCode, { onJoinError });
  return { room, selfId, code: normalizedCode.toUpperCase() };
}
