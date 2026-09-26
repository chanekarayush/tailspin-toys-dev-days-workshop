/**
 * Browser wishlist state used by the static pages for feature persistence.
 */
import type { Game } from '../types/game';

export const WISHLIST_STORAGE_KEY = 'tailspin-wishlist';

/**
 * Basic storage-like interface used for tests and browser storage.
 */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
    if (typeof window === 'undefined') {
        return storage ?? null;
    }

    try {
        const browserStorage = storage ?? window.localStorage;
        browserStorage.getItem(WISHLIST_STORAGE_KEY);
        return browserStorage;
    } catch {
        return null;
    }
}

function isWishlistGame(value: unknown): value is Game {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const candidate = value as Partial<Game> & { id?: number; title?: string; description?: string };

    return typeof candidate.id === 'number'
        && typeof candidate.title === 'string'
        && typeof candidate.description === 'string';
}

/**
 * Reads the saved wishlist from browser storage and normalizes invalid payloads.
 *
 * @param storage Optional browser storage instance.
 * @returns The current saved games, ordered by insertion.
 */
export function getWishlist(storage?: StorageLike | null): Game[] {
    const target = resolveStorage(storage);
    if (!target) {
        return [];
    }

    try {
        const raw = target.getItem(WISHLIST_STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
            target.setItem(WISHLIST_STORAGE_KEY, '[]');
            return [];
        }

        const normalized = parsed.filter(isWishlistGame);

        if (normalized.length !== parsed.length) {
            target.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(normalized));
        }

        return normalized;
    } catch {
        target.removeItem(WISHLIST_STORAGE_KEY);
        return [];
    }
}

/**
 * Adds a game to the browser wishlist if it is not already there.
 *
 * @param game Game to keep in the wishlist.
 * @param storage Optional browser storage instance.
 * @returns The updated wishlist contents.
 */
export function addGameToWishlist(game: Game, storage?: StorageLike | null): Game[] {
    const target = resolveStorage(storage);
    if (!target) {
        return [];
    }

    const current = getWishlist(target);
    if (current.some((entry) => entry.id === game.id)) {
        return current;
    }

    const next = [...current, game];
    target.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
    return next;
}

/**
 * Removes a single game from the wishlist.
 *
 * @param gameId Game id to remove.
 * @param storage Optional browser storage instance.
 * @returns The updated wishlist contents.
 */
export function removeGameFromWishlist(gameId: number, storage?: StorageLike | null): Game[] {
    const target = resolveStorage(storage);
    if (!target) {
        return [];
    }

    const next = getWishlist(target).filter((game) => game.id !== gameId);
    if (next.length === 0) {
        target.removeItem(WISHLIST_STORAGE_KEY);
    } else {
        target.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
    }

    return next;
}

/**
 * Clears the saved wishlist for the current browser session.
 *
 * @param storage Optional browser storage instance.
 */
export function clearWishlist(storage?: StorageLike | null): void {
    const target = resolveStorage(storage);
    if (!target) {
        return;
    }

    target.removeItem(WISHLIST_STORAGE_KEY);
}

/**
 * Checks whether a game id is already in the wishlist.
 *
 * @param gameId Game id to check.
 * @param storage Optional browser storage instance.
 * @returns True when the id exists in the wishlist.
 */
export function isGameSaved(gameId: number, storage?: StorageLike | null): boolean {
    return getWishlist(storage).some((game) => game.id === gameId);
}
