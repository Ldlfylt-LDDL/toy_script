// CFD power order endpoint. Mirrors the game client's route builder exactly:
//   api_orders:(hubId,kind,tick) => `/api/v1/hubs/${hubId}/orders/${kind}/${tick}`
// Critically: NO trailing slash. A trailing slash makes the server misparse the
// path and reject a POST with 400 "Incorrect resource kind supplied". The GET
// order book uses the same URL (reads worked; only the POST had the stray slash).
export function orderUrl(hubId, tick) {
  return `/api/v1/hubs/${hubId}/orders/power/${tick}`;
}
