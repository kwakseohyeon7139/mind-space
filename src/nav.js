export const nav = {
  cardPos: null,
  cardPositions: {},
  uiActive: false,
  cameraPos: { x:0, y:0, z:0 },
  cameraYaw: 0,
  flyTarget: null,      // [x,y,z] → smoothly fly to galaxy center
  galaxyCenters: [],    // filled by Scene on mount: [[x,y,z], ...]
}
export const config = { mode: 'drag' } // 'drag' | 'look'
