import { joinRoom, selfId } from "@trystero-p2p/mqtt";

const config = {
  appId: "tabletop-stardance-monopoly-v2",
  // Allows separate browsers on one laptop to join the same room during demos.
  _test_only_mdnsHostFallbackToLoopback: true,
};

export function connectToRoom(code) {
  const room = joinRoom(config, code.toLowerCase());
  return { room, selfId, code: code.toUpperCase() };
}
