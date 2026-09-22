import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllCategories,
    getAllGameIds,
    getGameById,
    getAllPublishers,
    getCatalogSummary,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [strategy] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [puzzle] = await db
        .insert(categories)
        .values({ name: 'Puzzle', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });
    const [secondPublisher] = await db
        .insert(publishers)
        .values({ name: 'Pub Two', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: i % 2 === 0 ? puzzle.id : strategy.id,
            publisherId: i % 2 === 0 ? secondPublisher.id : publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy', description: 'cat' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One', description: 'pub' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('returns the catalog summary for rated games', async () => {
        await seedGames(db, 3);
        const summary = await getCatalogSummary(db);

        expect(summary).toEqual({ totalGames: 3, averageRating: 4.2 });
    });

    it('returns a null average when no games have ratings', async () => {
        await seedGames(db, 2);
        await db.update(games).set({ starRating: null }).where(eq(games.title, 'Game 01'));
        await db.update(games).set({ starRating: null }).where(eq(games.title, 'Game 02'));

        const summary = await getCatalogSummary(db);

        expect(summary).toEqual({ totalGames: 2, averageRating: null });
    });

    it('returns zero and null values for an empty catalog', async () => {
        expect(await getCatalogSummary(db)).toEqual({ totalGames: 0, averageRating: null });
    });

    it('filters games by one or more categories', async () => {
        await seedGames(db, 4);

        const filtered = await getAllGames(db, { categoryNames: ['Puzzle'] });

        expect(filtered.map((game) => game.title)).toEqual(['Game 02', 'Game 04']);
    });

    it('matches games from multiple selected categories', async () => {
        await seedGames(db, 4);

        const filtered = await getAllGames(db, { categoryNames: ['Puzzle', 'Strategy'] });

        expect(filtered).toHaveLength(4);
    });

    it('combines category and publisher filters', async () => {
        await seedGames(db, 4);

        const filtered = await getAllGames(db, {
            categoryNames: ['Puzzle'],
            publisherName: 'Pub Two',
        });

        expect(filtered.map((game) => game.title)).toEqual(['Game 02', 'Game 04']);
    });

    it('returns filter options ordered by name', async () => {
        await seedGames(db, 2);

        expect((await getAllCategories(db)).map((category) => category.name)).toEqual(['Puzzle', 'Strategy']);
        expect((await getAllCategories(db)).every((category) => category.description === 'cat')).toBe(true);
        expect((await getAllPublishers(db)).map((publisher) => publisher.name)).toEqual(['Pub One', 'Pub Two']);
        expect((await getAllPublishers(db)).every((publisher) => publisher.description === 'pub')).toBe(true);
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });
});
