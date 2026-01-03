package http

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	api "github.com/vincentanu04/where-did-my-money-go/generated/server"
)

type Server struct{}

func NewServer() *Server {
	return &Server{}
}

func (s *Server) GetExpenses(
	w http.ResponseWriter,
	r *http.Request,
	params api.GetExpensesParams,
) {
	_ = params.Date // "2026-01-02"

	resp := []api.Expense{
		{
			Id:       uuid.New(),
			Category: "Food",
			Amount:   400,
			Date:     time.Now(),
		},
	}

	json.NewEncoder(w).Encode(resp)
}

func (s *Server) PostExpenses(w http.ResponseWriter, r *http.Request) {
	var body api.CreateExpense
	json.NewDecoder(r.Body).Decode(&body)

	resp := api.Expense{
		Id:       uuid.New(),
		Category: body.Category,
		Amount:   body.Amount,
		Date:     body.Date,
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

func (s *Server) GetSummary(
	w http.ResponseWriter,
	r *http.Request,
	params api.GetSummaryParams,
) {
	resp := []api.CategorySummary{
		{Category: "Food", Total: 1200},
	}

	json.NewEncoder(w).Encode(resp)
}
