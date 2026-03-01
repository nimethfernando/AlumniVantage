// server/utils/cronJobs.js
const cron = require('node-cron');
const pool = require('../config/db');

cron.schedule('0 0 * * *', async () => {
    console.log('Running midnight winner selection...');
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const [bids] = await connection.execute(
            'SELECT * FROM bids WHERE status = "pending" ORDER BY bid_amount DESC LIMIT 1'
        );

        if (bids.length > 0) {
            const winningBid = bids[0];

            await connection.execute(
                'UPDATE bids SET status = "won" WHERE id = ?',
                [winningBid.id]
            );

            await connection.execute(
                'UPDATE bids SET status = "lost" WHERE status = "pending" AND id != ?',
                [winningBid.id]
            );

            await connection.execute(
                'INSERT INTO featured_profiles (user_id, won_date) VALUES (?, CURRENT_DATE())',
                [winningBid.user_id]
            );
            
            await connection.commit();
            console.log(`Bid ID ${winningBid.id} won the feature.`);
        } else {
            console.log('No bids to process tonight.');
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error during midnight selection:', error);
    } finally {
        connection.release();
    }
});