import { joinRoom, selfId } from "trystero";

const config = { appId: "tabletop-monopoly-night-v1" };

export function connectToRoom(code) {
  const room = joinRoom(config, code.toLowerCase());
  return { room, selfId, code: code.toUpperCase() };
}
