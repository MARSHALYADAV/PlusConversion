const logger = require('../../utils/logger');

// Simple in-memory jobs registry to track async executions
const jobs = new Map();

class QueueService {
    /**
     * Enqueue a new async task
     * @param {string} type - task category (e.g. 'merge', 'split')
     * @param {Function} taskFn - async function executing the operation
     * @returns {string} jobId
     */
    static enqueue(type, taskFn) {
        const jobId = `job_${Date.now()}_${Math.round(Math.random() * 1E6)}`;
        
        jobs.set(jobId, {
            id: jobId,
            type,
            status: 'pending',
            progress: 0,
            result: null,
            error: null,
            createdAt: new Date()
        });

        logger.info(`Queue: Enqueued job ${jobId} of type ${type}`);

        // Immediate background execution (non-blocking)
        (async () => {
            const job = jobs.get(jobId);
            try {
                job.status = 'processing';
                job.progress = 20;

                // Call task execution function
                const result = await taskFn((progressPercentage) => {
                    job.progress = Math.min(90, Math.round(progressPercentage));
                });

                job.status = 'completed';
                job.progress = 100;
                job.result = result;
                logger.info(`Queue: Job ${jobId} successfully completed.`);
            } catch (err) {
                job.status = 'failed';
                job.progress = 100;
                job.error = err.message;
                logger.error(`Queue: Job ${jobId} execution failed`, err);
            }
        })();

        return jobId;
    }

    /**
     * Get job status
     * @param {string} jobId
     * @returns {object|null}
     */
    static getJob(jobId) {
        return jobs.get(jobId) || null;
    }

    /**
     * Prune old completed or failed jobs from the map memory
     */
    static pruneJobs() {
        const now = Date.now();
        const oneHourMs = 60 * 60 * 1000;
        
        for (const [id, job] of jobs.entries()) {
            if (now - new Date(job.createdAt).getTime() > oneHourMs) {
                jobs.delete(id);
            }
        }
    }
}

// Set periodic map pruning interval
setInterval(() => QueueService.pruneJobs(), 15 * 60 * 1000);

module.exports = QueueService;
