/**
 * Maps game identifiers to the retro arcade art assets already shipped in the public folder.
 * The values are deterministic so the static site stays reproducible across builds.
 */
export const retroAssets = [
  '/assets/arcade-machine.png',
  '/assets/game-console.png',
  '/assets/game-console-pocket.png',
  '/assets/game-over.png',
  '/assets/game-over-skull.png',
  '/assets/ghost.png',
] as const;

export function getRetroAssetForGame(gameId: number): string {
  const index = ((gameId - 1) % retroAssets.length + retroAssets.length) % retroAssets.length;
  return retroAssets[index];
}
