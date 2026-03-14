package jobs

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// this is needed to keep supabase/free-tier postgres databases alive
// as they tend to go to sleep after 1 week of inactivity
func KeepDBAlive(ctx context.Context, pool *pgxpool.Pool) {
	ping := func(label string) {
		log.Printf("[cron] DB keepalive query (%s)\n", label)
		ctxQ, cancel := context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
		var v int
		if err := pool.QueryRow(ctxQ, "SELECT 1").Scan(&v); err != nil {
			log.Printf("[cron] DB keepalive query failed: %v\n", err)
		}
	}

	go func() {
		// run once immediately
		ping("startup")

		// run every 5 days
		ticker := time.NewTicker(5 * 24 * time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				ping("scheduled")
			case <-ctx.Done():
				log.Println("[cron] DB keepalive stopped")
				return
			}
		}
	}()
}
