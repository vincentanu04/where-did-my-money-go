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
	go func() {
		// run once immediately
		log.Println("[cron] DB keepalive ping (startup)")
		ctxPing, cancel := context.WithTimeout(ctx, 10*time.Second)
		if err := pool.Ping(ctxPing); err != nil {
			log.Printf("[cron] DB ping failed: %v\n", err)
		}
		cancel()

		// run every 5 days
		ticker := time.NewTicker(5 * 24 * time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				log.Println("[cron] DB keepalive ping")

				ctxPing, cancel := context.WithTimeout(ctx, 10*time.Second)
				if err := pool.Ping(ctxPing); err != nil {
					log.Printf("[cron] DB ping failed: %v\n", err)
				}
				cancel()

			case <-ctx.Done():
				log.Println("[cron] DB keepalive stopped")
				return
			}
		}
	}()
}
