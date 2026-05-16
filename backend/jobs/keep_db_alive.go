package jobs

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Keeps free-tier Postgres databases alive (e.g. Supabase)
// - Drops and recreates the keepalive table on startup to ensure correct schema
// - Inserts a new heartbeat row each run
// - Prunes rows older than 30 days to keep the table small
// - Runs once at startup, then once every 24 hours
// - Stops cleanly on shutdown
func KeepDBAlive(ctx context.Context, pool *pgxpool.Pool) {
	ensureTable := func() {
		ctxQ, cancel := context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
		_, err := pool.Exec(ctxQ, `
			DROP TABLE IF EXISTS keepalive;
			CREATE TABLE keepalive (
				id        BIGSERIAL PRIMARY KEY,
				pinged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)`)
		if err != nil {
			log.Printf("[cron] DB keepalive ensure table failed: %v\n", err)
		}
	}

	runQuery := func() {
		ctxQ, cancel := context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
		_, err := pool.Exec(ctxQ, `INSERT INTO keepalive (pinged_at) VALUES (NOW())`)
		if err != nil {
			log.Printf("[cron] DB keepalive insert failed: %v\n", err)
			return
		}
		// Prune rows older than 30 days
		_, err = pool.Exec(ctxQ, `DELETE FROM keepalive WHERE pinged_at < NOW() - INTERVAL '30 days'`)
		if err != nil {
			log.Printf("[cron] DB keepalive prune failed: %v\n", err)
		}
	}

	// Recreate the table once before the loop
	ensureTable()

	go func() {
		// Run immediately on startup
		log.Println("[cron] DB keepalive insert (startup)")
		runQuery()

		// Then run every 24 hours
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				log.Println("[cron] DB keepalive insert")
				runQuery()

			case <-ctx.Done():
				log.Println("[cron] DB keepalive stopped")
				return
			}
		}
	}()
}
