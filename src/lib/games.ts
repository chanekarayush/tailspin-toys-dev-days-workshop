import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { CatalogSummary, Category, Game, Publisher } from '../types/game';

export interface GameFilters {
    categoryNames?: readonly string[];
    publisherName?: string;
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
