const cron = require('node-cron');
const pool = require('../config/db');
// User model import might not be needed here anymore if we use a JOIN, but kept for reference
// const User = require('../models/userModel'); 
const { sendBidResultEmail } = require('./emailService');

// Added timezone configuration to ensure it runs at 6 PM London time regardless of server location
cron.schedule('0 18 * * *', async () => {
    console.log('Running 6 PM winner selection...'); // Updated log message
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Added JOIN to get emails instantly (fixes N+1), and added 'id ASC' for tie-breakers
        const [bids] = await connection.execute(`
            SELECT b.*, u.email 
            FROM bids b
            JOIN users u ON b.user_id = u.id
            WHERE b.status = "pending" 
            ORDER BY b.bid_amount DESC, b.id ASC
        `);

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

            // Insert the winner into featured_profiles as inactive first
            await connection.execute(
                'INSERT INTO featured_profiles (user_id, won_date, is_active) VALUES (?, CURRENT_DATE(), 0)',
                [winningBid.user_id]
            );
            
            await connection.commit();
            console.log(`Bid ID ${winningBid.id} won the feature.`);

            // --- SEND NOTIFICATION EMAILS ---
            try {
                // 1. Notify the Winner (using the email we fetched in the JOIN)
                if (winningBid.email) {
                    await sendBidResultEmail(winningBid.email, 'won');
                }

                // 2. Notify all the Losers (No more N+1 database queries!)
                for (let i = 1; i < bids.length; i++) {
                    const loserBid = bids[i];
                    if (loserBid.email) {
                        await sendBidResultEmail(loserBid.email, 'lost');
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
        console.error('Error during 6 PM selection:', error);
    } finally {
        connection.release();
    }
}, {
    // Set the timezone to ensure it runs at 6 PM Sri Lanka time
    timezone: "Asia/Colombo"
});

// Midnight Sri Lanka Time
// - Activate the winner profile for display
cron.schedule('0 0 * * *', async () => {
    console.log('Running midnight activation...');

    try {
        await pool.execute(`
            UPDATE featured_profiles
            SET is_active = 1
            WHERE won_date = CURRENT_DATE()
              AND (is_active = 0 OR is_active IS NULL)
        `);

        console.log('Winner activated for today.');
    } catch (error) {
        console.error('Midnight activation error:', error);
    }
}, {
    timezone: 'Asia/Colombo'
});