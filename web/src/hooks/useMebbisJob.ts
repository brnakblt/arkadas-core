/**
 * useMebbisJob Hook
 * Polls job status from MEBBIS service
 */

"use client";

import { useState, useEffect, useCallback } from 'react';

interface JobStatus {
    jobId: string;
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
    progress?: number;
    result?: unknown;
    error?: string;
}

interface UseMebbisJobReturn {
    jobStatus: JobStatus | null;
    isPolling: boolean;
    error: string | null;
    startPolling: (jobId: string, queue?: string) => void;
    stopPolling: () => void;
}

export const useMebbisJob = (pollInterval: number = 2000): UseMebbisJobReturn => {
    const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [currentQueue, setCurrentQueue] = useState<string>('');

    const fetchStatus = useCallback(async (jobId: string, queue: string) => {
        try {
            const response = await fetch(`/api/v1/mebbis/jobs/${jobId}?queue=${queue}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'İş durumu alınamadı');
            }

            setJobStatus(data.data);
            setError(null);

            // Stop polling if job is complete or failed
            if (data.data.status === 'completed' || data.data.status === 'failed') {
                setIsPolling(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
        }
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (isPolling && currentJobId) {
            // Fetch immediately
            fetchStatus(currentJobId, currentQueue);

            // Then poll at interval
            intervalId = setInterval(() => {
                fetchStatus(currentJobId, currentQueue);
            }, pollInterval);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isPolling, currentJobId, currentQueue, pollInterval, fetchStatus]);

    const startPolling = useCallback((jobId: string, queue: string = '') => {
        setCurrentJobId(jobId);
        setCurrentQueue(queue);
        setJobStatus(null);
        setError(null);
        setIsPolling(true);
    }, []);

    const stopPolling = useCallback(() => {
        setIsPolling(false);
    }, []);

    return {
        jobStatus,
        isPolling,
        error,
        startPolling,
        stopPolling,
    };
};

export default useMebbisJob;
