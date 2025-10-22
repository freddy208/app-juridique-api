import {
  PaginationParams,
  PaginationResult,
} from '../interfaces/pagination.interface';

export class PaginationUtil {
  static getPaginationParams(query: any): PaginationParams {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const page = Number.isNaN(parseInt(query.page, 10))
      ? 1
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        parseInt(query.page, 10);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const limit = Number.isNaN(parseInt(query.limit, 10))
      ? 10
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        parseInt(query.limit, 10);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const sortBy: string = query.sortBy ?? 'creeLe';
    const sortOrder: 'asc' | 'desc' =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
    const page: number = params.page ?? 1;
    const limit: number = params.limit ?? 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  static getPrismaPaginationParams(params: PaginationParams) {
    const page: number = params.page ?? 1;
    const limit: number = params.limit ?? 10;
    const sortBy: string = params.sortBy ?? 'creeLe';
    const sortOrder: 'asc' | 'desc' = params.sortOrder ?? 'desc';

    const skip = (page - 1) * limit;

    return {
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    };
  }
}
