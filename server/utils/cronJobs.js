const cron = require('node-cron');
const pool = require('../config/db');
const User = require('../models/userModel'); // Import User model to get email addresses
const { sendBidResultEmail } = require('./emailService'); // Import your new email function

cron.schedule('0 0 * * *', async () => {
    console.log('Running midnight winner selection...');
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Fetch ALL pending bids sorted by amount so we know who won and who lost
        const [bids] = await connection.execute(
            'SELECT * FROM bids WHERE status = "pending" ORDER BY bid_amount DESC'
        );

        if (bids.length > 0) {
            const winningBid = bids[0];

            // Update the winner's status
            await connection.execute(
                'UPDATE bids SET status = "won" WHERE id = ?',
                [winningBid.id]
            );

            // Update all the losers' statuses
            await connection.execute(
                'UPDATE bids SET status = "lost" WHERE status = "pending" AND id != ?',
                [winningBid.id]
            );

            // Insert the winner into featured_profiles
            await connection.execute(
                'INSERT INTO featured_profiles (user_id, won_date) VALUES (?, CURRENT_DATE())',
                [winningBid.user_id]
            );
            
            await connection.commit();
            console.log(`Bid ID ${winningBid.id} won the feature.`);

            // --- SEND NOTIFICATION EMAILS ---
            try {
                // 1. Notify the Winner
                const winner = await User.findById(winningBid.user_id);
                if (winner && winner.email) {
                    await sendBidResultEmail(winner.email, 'won');
                }

                // 2. Notify all the Losers
                for (let i = 1; i < bids.length; i++) {
                    const loserBid = bids[i];
                    const loser = await User.findById(loserBid.user_id);
                    if (loser && loser.email) {
                        await sendBidResultEmail(loser.email, 'lost');
                    }
                }
            } catch (emailError) {
                console.error("Error sending notification emails:", emailError);
            }

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