import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { CatalogSummary, Category, Game, Publisher } from '../types/game';

export interface GameFilters {
    categoryNames?: readonly string[];
    publisherName?: string;
}

export type GameSort = 'title-asc' | 'title-desc' | 'rating-desc';

/**
 * Sorts games deterministically, placing unrated games after rated games.
 *
 * @param gamesToSort - Games to order without mutating the input array.
 * @param sort - Requested title or rating order.
 * @returns A newly sorted game array.
 */
export function sortGames(gamesToSort: readonly Game[], sort: GameSort): Game[] {
    return [...gamesToSort].sort((left, right) => {
        if (sort === 'rating-desc') {
            if (left.starRating === null && right.starRating === null) return left.title.localeCompare(right.title);
            if (left.starRating === null) return 1;
            if (right.starRating === null) return -1;
            return right.starRating - left.starRating || left.title.localeCompare(right.title);
        }

        const comparison = left.title.localeCompare(right.title);
        return sort === 'title-desc' ? -comparison : comparison;
    });
}

/**
 * Returns one page of the catalog while preserving its stable ordering.
 *
 * @param db - The Drizzle database instance used for the query.
 * @param page - One-based page number.
 * @param limit - Number of games per page.
 * @param filters - Optional catalog filters applied before pagination.
 * @returns The requested page and total matching game count.
 */
export async function getGamesPage(
    db: Database,
    page: number,
    limit: number,
    filters: GameFilters = {},
): Promise<{ games: Game[]; total: number; page: number; limit: number }> {
    const safeLimit = Math.max(1, Math.floor(limit));
    const allGames = await getAllGames(db, filters);
    const total = allGames.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);
    const start = (safePage - 1) * safeLimit;
    return { games: allGames.slice(start, start + safeLimit), total, page: safePage, limit: safeLimit };
}

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    categoryDescription: categories.description,
    publisherId: publishers.id,
    publisherName: publishers.name,
    publisherDescription: publishers.description,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    categoryDescription: string | null;
    publisherId: number | null;
    publisherName: string | null;
    publisherDescription: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName, description: row.categoryDescription }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName, description: row.publisherDescription }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

function filterConditions(filters: GameFilters) {
    const conditions = [];

    if (filters.categoryNames && filters.categoryNames.length > 0) {
        conditions.push(inArray(categories.name, filters.categoryNames));
    }

    if (filters.publisherName) {
        conditions.push(eq(publishers.name, filters.publisherName));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
}

/** All games ordered by title. */
export async function getAllGames(db: Database, filters: GameFilters = {}): Promise<Game[]> {
    const query = baseGamesQuery(db);
    const conditions = filterConditions(filters);
    const rows = await (conditions ? query.where(conditions) : query).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/** All categories ordered by name. */
export async function getAllCategories(db: Database): Promise<Category[]> {
    return db
        .select({ id: categories.id, name: categories.name, description: categories.description })
        .from(categories)
        .orderBy(asc(categories.name));
}

/** All publishers ordered by name. */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    return db
        .select({ id: publishers.id, name: publishers.name, description: publishers.description })
        .from(publishers)
        .orderBy(asc(publishers.name));
}

/**
 * Returns a publisher and all games associated with it.
 *
 * @param db - The Drizzle database instance used for the query.
 * @param id - The publisher identifier.
 * @returns The publisher page data, or null when the publisher does not exist.
 */
export async function getPublisherById(
    db: Database,
    id: number,
): Promise<{ publisher: Publisher; games: Game[] } | null> {
    const publisher = await db
        .select({ id: publishers.id, name: publishers.name, description: publishers.description })
        .from(publishers)
        .where(eq(publishers.id, id))
        .get();

    if (!publisher) {
        return null;
    }

    return {
        publisher,
        games: await getAllGames(db, { publisherName: publisher.name }),
    };
}

/**
 * Returns all publisher identifiers used to generate static publisher pages.
 *
 * @param db - The Drizzle database instance used for the query.
 * @returns A stable, name-ordered list of publisher IDs.
 */
export async function getAllPublisherIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: publishers.id }).from(publishers).orderBy(asc(publishers.name));
    return rows.map((row) => row.id);
}

/** All game ids ordered by title. */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/** A single game by id, or null when it does not exist. */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}

/** Summary values for the catalog landing page, including a safe average for rated games only. */
export async function getCatalogSummary(db: Database): Promise<CatalogSummary> {
    const allGames = await getAllGames(db);
    const ratedGames = allGames.filter((game) => game.starRating !== null);

    if (allGames.length === 0) {
        return { totalGames: 0, averageRating: null };
    }

    if (ratedGames.length === 0) {
        return { totalGames: allGames.length, averageRating: null };
    }

    const averageRating = ratedGames.reduce((sum, game) => sum + (game.starRating ?? 0), 0) / ratedGames.length;

    return {
        totalGames: allGames.length,
        averageRating: Number(averageRating.toFixed(2)),
    };
}
