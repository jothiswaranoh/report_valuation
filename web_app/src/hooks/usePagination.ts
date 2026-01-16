import { useState, useCallback, useMemo } from 'react';

interface PaginationOptions {
    initialPage?: number;
    initialPerPage?: number;
    totalItems?: number;
}

interface PaginationState {
    page: number;
    perPage: number;
    totalItems: number;
}

interface PaginationResult {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    startIndex: number;
    endIndex: number;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    setTotalItems: (total: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    firstPage: () => void;
    lastPage: () => void;
}

/**
 * Hook for managing pagination state.
 * 
 * @param options - Initial pagination options
 * @returns Pagination state and control functions
 */
export function usePagination(options: PaginationOptions = {}): PaginationResult {
    const {
        initialPage = 1,
        initialPerPage = 10,
        totalItems: initialTotal = 0
    } = options;

    const [state, setState] = useState<PaginationState>({
        page: initialPage,
        perPage: initialPerPage,
        totalItems: initialTotal,
    });

    const totalPages = useMemo(() => {
        return Math.ceil(state.totalItems / state.perPage) || 1;
    }, [state.totalItems, state.perPage]);

    const hasNextPage = useMemo(() => {
        return state.page < totalPages;
    }, [state.page, totalPages]);

    const hasPrevPage = useMemo(() => {
        return state.page > 1;
    }, [state.page]);

    const startIndex = useMemo(() => {
        return (state.page - 1) * state.perPage;
    }, [state.page, state.perPage]);

    const endIndex = useMemo(() => {
        return Math.min(startIndex + state.perPage, state.totalItems);
    }, [startIndex, state.perPage, state.totalItems]);

    const setPage = useCallback((page: number) => {
        setState(prev => ({
            ...prev,
            page: Math.max(1, Math.min(page, Math.ceil(prev.totalItems / prev.perPage) || 1)),
        }));
    }, []);

    const setPerPage = useCallback((perPage: number) => {
        setState(prev => ({
            ...prev,
            perPage: Math.max(1, perPage),
            page: 1, // Reset to first page when changing page size
        }));
    }, []);

    const setTotalItems = useCallback((total: number) => {
        setState(prev => {
            const newTotalPages = Math.ceil(total / prev.perPage) || 1;
            return {
                ...prev,
                totalItems: total,
                page: Math.min(prev.page, newTotalPages),
            };
        });
    }, []);

    const nextPage = useCallback(() => {
        if (hasNextPage) {
            setPage(state.page + 1);
        }
    }, [hasNextPage, state.page, setPage]);

    const prevPage = useCallback(() => {
        if (hasPrevPage) {
            setPage(state.page - 1);
        }
    }, [hasPrevPage, state.page, setPage]);

    const firstPage = useCallback(() => {
        setPage(1);
    }, [setPage]);

    const lastPage = useCallback(() => {
        setPage(totalPages);
    }, [setPage, totalPages]);

    return {
        page: state.page,
        perPage: state.perPage,
        totalItems: state.totalItems,
        totalPages,
        hasNextPage,
        hasPrevPage,
        startIndex,
        endIndex,
        setPage,
        setPerPage,
        setTotalItems,
        nextPage,
        prevPage,
        firstPage,
        lastPage,
    };
}

export default usePagination;
