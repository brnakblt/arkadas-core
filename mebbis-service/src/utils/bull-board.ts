import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { thumbnailQueue, indexingQueue, cleanupQueue, mebbisQueue } from '../queues';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues: [
        new BullMQAdapter(thumbnailQueue),
        new BullMQAdapter(indexingQueue),
        new BullMQAdapter(cleanupQueue),
        new BullMQAdapter(mebbisQueue),
    ],
    serverAdapter: serverAdapter,
});

export { serverAdapter };
