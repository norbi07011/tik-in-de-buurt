import { useState, useEffect, useCallback } from 'react';
import { FetchStatus } from '../src/types';

type FetcherFunction<T> = () => Promise<T>;

export const useDataFetcher = <T,>(fetcher: FetcherFunction<T>) => {
    const [data, setData] = useState<T | null>(null);
    const [status, setStatus] = useState<FetchStatus>(FetchStatus.Idle);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        setStatus(FetchStatus.Loading);
        setError(null);
        try {
            const result = await fetcher();
            setData(result);
            setStatus(FetchStatus.Success);
        } catch (err) {
            setError(err as Error);
            setStatus(FetchStatus.Error);
        }
    }, [fetcher]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, status, error, refetch: fetchData };
};
