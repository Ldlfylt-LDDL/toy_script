export function isReversed({ srcPriceAtT, dstPriceAtNext }) {
  return srcPriceAtT > dstPriceAtNext;
}
export function directionHubs(edge, capacity) {
  return capacity >= 0
    ? { srcHubId: edge.hub1Id, dstHubId: edge.hub2Id }
    : { srcHubId: edge.hub2Id, dstHubId: edge.hub1Id };
}
