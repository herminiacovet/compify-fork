package main

import (
	"log"
	
	"compify-backend/internal/server"
)

func main() {
	log.Println("Starting Compify backend...")
	
	// Create and start the server
	srv := server.NewServer()
	
	log.Println("Server created, starting...")
	if err := srv.Start(); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}