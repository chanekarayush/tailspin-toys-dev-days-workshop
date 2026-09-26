import { describe, expect, it } from 'vitest';
import type { Game } from '../types/game';
import {
    addGameToWishlist,
    clearWishlist,
    getWishlist,
    isGameSaved,
    removeGameFromWishlist,
    WISHLIST_STORAGE_KEY,
} from './wishlist';

function createStorage(): Storage {
    const store = new Map<string, string>();

    return {
        getItem(key: string): string | null {
            return store.has(key) ? store.get(key) ?? null : null;
        },
        setItem(key: string, value: string): void {
            store.set(key, value);
        },
        removeItem(key: string): void {
            store.delete(key);
        },
        clear(): void {
            store.clear();
        },
        key(index: number): string | null {
            return Array.from(store.keys())[index] ?? null;
        },
        get length(): number {
            return store.size;
        },
    } as Storage;
}

function createGame(id: number): Game {
    return {
        id,
        title: `Game ${id}`,
        description: `Description ${id}`,
        starRating: 4.5,
        category: { id: 1, name: 'Strategy', description: 'cat' },
        publisher: { id: 2, name: 'Arcade Press', description: 'pub' },
    };
}

describe('wishlist helpers', () => {
    it('adds unseen games and avoids duplicates', () => {
        const storage = createStorage();
        const first = createGame(1);
        const second = createGame(2);

        const afterFirst = addGameToWishlist(first, storage);
        const afterSecond = addGameToWishlist(second, storage);
        const duplicate = addGameToWishlist(first, storage);

        expect(afterFirst).toHaveLength(1);
        expect(afterSecond).toHaveLength(2);
        expect(duplicate).toHaveLength(2);
        expect(JSON.parse(storage.getItem(WISHLIST_STORAGE_KEY) ?? '[]')).toHaveLength(2);
    });

    it('removes a single saved game and keeps the rest', () => {
        const storage = createStorage();
        const first = createGame(1);
        const second = createGame(2);

        addGameToWishlist(first, storage);
        addGameToWishlist(second, storage);
        const updated = removeGameFromWishlist(first.id, storage);

        expect(updated.map((game) => game.id)).toEqual([second.id]);
        expect(getWishlist(storage)).toEqual([second]);
    });

    it('clears the saved wishlist and reports saved state accurately', () => {
        const storage = createStorage();
        const game = createGame(7);

        addGameToWishlist(game, storage);
        expect(isGameSaved(game.id, storage)).toBe(true);

        clearWishlist(storage);

        expect(getWishlist(storage)).toEqual([]);
        expect(isGameSaved(game.id, storage)).toBe(false);
        expect(storage.getItem(WISHLIST_STORAGE_KEY)).toBeNull();
    });

    it('ignores malformed wishlist payloads and resets storage', () => {
        const storage = createStorage();
        storage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify({ broken: true }));

        expect(getWishlist(storage)).toEqual([]);
        expect(storage.getItem(WISHLIST_STORAGE_KEY)).toBe('[]');
    });
});
