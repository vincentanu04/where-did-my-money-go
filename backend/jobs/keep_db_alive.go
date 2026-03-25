package jobs

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Keeps free-tier Postgres databases alive (e.g. Supabase)
// - Creates a keepalive table on first run if it doesn't exist
// - Upserts a heartbeat row each run
// - Runs once at startup, then once every 5 days
// - Stops cleanly on shutdown
func KeepDBAlive(ctx context.Context, pool *pgxpool.Pool) {
	ensureTable := func() {
		ctxQ, cancel := context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
		_, err := pool.Exec(ctxQ, `
			CREATE TABLE IF NOT EXISTS keepalive (
				id        INTEGER PRIMARY KEY DEFAULT 1,
				last_ping TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				CHECK (id = 1)
			)`)
		if err != nil {
			log.Printf("[cron] DB keepalive ensure table failed: %v\n", err)
			return
		}
		// Seed the single heartbeat row if it doesn't exist yet
		_, err = pool.Exec(ctxQ, `
			INSERT INTO keepalive (id, last_ping) VALUES (1, CURRENT_TIMESTAMP)
			ON CONFLICT (id) DO NOTHING`)
		if err != nil {
			log.Printf("[cron] DB keepalive seed row failed: %v\n", err)
		}
	}

	runQuery := func() {
		ctxQ, cancel := context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
		_, err := pool.Exec(ctxQ, `
			UPDATE keepalive SET last_ping = CURRENT_TIMESTAMP WHERE id = 1`)
		if err != nil {
			log.Printf("[cron] DB keepalive update failed: %v\n", err)
		}
	}

	// Create the table once before the loop
	ensureTable()

	go func() {
		// Run immediately on startup
		log.Println("[cron] DB keepalive upsert (startup)")
		runQuery()

		// Then run every 5 days
		ticker := time.NewTicker(5 * 24 * time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				log.Println("[cron] DB keepalive upsert")
				runQuery()

			case <-ctx.Done():
				log.Println("[cron] DB keepalive stopped")
				return
			}
		}
	}()
}
