/**
 * Utility function to retry a promise-returning function with exponential backoff
 * @param {Function} fn - Function that returns a promise
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 300)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 5000)
 * @returns {Promise} - The result of the function call
 */
export const withRetry = async (fn, options = {}) => {
    const maxRetries = options.maxRetries || 3;
    const initialDelay = options.initialDelay || 300;
    const maxDelay = options.maxDelay || 5000;

    let retries = 0;
    let lastError;

    while (retries <= maxRetries) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            retries++;

            if (retries > maxRetries) break;

            // Calculate delay with exponential backoff
            const delay = Math.min(
                maxDelay,
                initialDelay * Math.pow(2, retries - 1)
            );

            // Add some jitter (±20%)
            const jitter = delay * 0.2 * (Math.random() - 0.5);
            const finalDelay = delay + jitter;

            // Wait before next retry
            await new Promise((resolve) => setTimeout(resolve, finalDelay));
        }
    }

    throw lastError;
};
