import { joinRoom, selfId } from "@trystero-p2p/mqtt";

const config = {
  appId: "tabletop-stardance-monopoly-v2",
  _test_only_mdnsHostFallbackToLoopback: true,
  turnConfig: [
    {
      urls: ["turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=udp"],
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
};

export { selfId };

export function connectToRoom(code, onJoinError) {
  const room = joinRoom(config, code.toLowerCase(), { onJoinError });
  return { room, selfId, code: code.toUpperCase() };
}
