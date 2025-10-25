/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  PaginationParams,
  PaginationResult,
} from '../interfaces/pagination.interface';

export class PaginationUtil {
  static getPaginationParams(query: any): PaginationParams {
    const page = Number.isNaN(parseInt(query.page, 10))
      ? 1
      : parseInt(query.page, 10);
    const limit = Number.isNaN(parseInt(query.limit, 10))
      ? 10
      : parseInt(query.limit, 10);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sortBy: string = query.sortBy ?? 'creeLe';
    const sortOrder: 'asc' | 'desc' =
      query.sortOrder === 'asc' ? 'asc' : 'desc';

    return {
      page,
      limit,
      sortBy,
      sortOrder,
    };
  }

  static createPaginationResult<T>(
    data: T[],
    total: number,
    params: PaginationParams,
  ): PaginationResult<T> {
    // ✅ CORRECTION : Conversion forcée en number
    const page =
      typeof params.page === 'string'
        ? parseInt(params.page, 10)
        : (params.page ?? 1);
    const limit =
      typeof params.limit === 'string'
        ? parseInt(params.limit, 10)
        : (params.limit ?? 10);

    // Validation des valeurs
    const validPage = Math.max(1, isNaN(page) ? 1 : page);
    const validLimit = Math.max(1, isNaN(limit) ? 10 : limit);
    const totalPages = Math.ceil(total / validLimit);

    return {
      data,
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
    };
  }

  static getPrismaPaginationParams(params: PaginationParams) {
    // ✅ CORRECTION CRITIQUE : Conversion forcée en number
    const page =
      typeof params.page === 'string'
        ? parseInt(params.page, 10)
        : (params.page ?? 1);
    const limit =
      typeof params.limit === 'string'
        ? parseInt(params.limit, 10)
        : (params.limit ?? 10);
    const sortBy: string = params.sortBy ?? 'creeLe';
    const sortOrder: 'asc' | 'desc' = params.sortOrder ?? 'desc';

    // Validation et nettoyage des valeurs
    const validPage = Math.max(1, isNaN(page) ? 1 : page);
    const validLimit = Math.max(1, Math.min(100, isNaN(limit) ? 10 : limit));
    const skip = (validPage - 1) * validLimit;

    return {
      skip,
      take: validLimit, // ✅ Maintenant c'est toujours un number
      orderBy: {
        [sortBy]: sortOrder,
      },
    };
  }
}
