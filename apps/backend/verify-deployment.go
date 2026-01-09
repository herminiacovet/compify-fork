package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// Colors for console output
const (
	ColorReset  = "\033[0m"
	ColorRed    = "\033[31m"
	ColorGreen  = "\033[32m"
	ColorYellow = "\033[33m"
	ColorCyan   = "\033[36m"
)

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Version   string            `json:"version,omitempty"`
	Uptime    string            `json:"uptime,omitempty"`
	Checks    map[string]string `json:"checks,omitempty"`
}

type VerificationResult struct {
	Endpoint    string
	StatusCode  int
	ResponseTime time.Duration
	Issues      []string
	Success     bool
}

func printStatus(message string) {
	fmt.Printf("%s[INFO]%s %s\n", ColorGreen, ColorReset, message)
}

func printError(message string) {
	fmt.Printf("%s[ERROR]%s %s\n", ColorRed, ColorReset, message)
}

func printWarning(message string) {
	fmt.Printf("%s[WARN]%s %s\n", ColorYellow, ColorReset, message)
}

func printHeader(message string) {
	fmt.Printf("%s%s%s\n", ColorCyan, message, ColorReset)
}

func makeRequest(url string, timeout time.Duration) (*http.Response, time.Duration, error) {
	client := &http.Client{
		Timeout: timeout,
	}
	
	start := time.Now()
	resp, err := client.Get(url)
	duration := time.Since(start)
	
	return resp, duration, err
}

func verifyEndpoint(baseURL, endpoint string) VerificationResult {
	url := strings.TrimSuffix(baseURL, "/") + endpoint
	result := VerificationResult{
		Endpoint: endpoint,
		Issues:   []string{},
	}
	
	printStatus(fmt.Sprintf("Testing %s...", endpoint))
	
	resp, duration, err := makeRequest(url, 10*time.Second)
	result.ResponseTime = duration
	
	if err != nil {
		result.Issues = append(result.Issues, fmt.Sprintf("Request failed: %v", err))
		return result
	}
	defer resp.Body.Close()
	
	result.StatusCode = resp.StatusCode
	
	// Check status code
	expectedStatus := 200
	if endpoint == "/health" {
		expectedStatus = 200
	} else if strings.HasPrefix(endpoint, "/auth/") {
		// Auth pages might return 405 if not properly configured for GET
		// or 200 if they serve login/register forms
		if resp.StatusCode != 200 && resp.StatusCode != 405 {
			result.Issues = append(result.Issues, fmt.Sprintf("HTTP %d (expected 200 or 405)", resp.StatusCode))
		}
	} else {
		if resp.StatusCode != expectedStatus {
			result.Issues = append(result.Issues, fmt.Sprintf("HTTP %d (expected %d)", resp.StatusCode, expectedStatus))
		}
	}
	
	// Check content type
	contentType := resp.Header.Get("Content-Type")
	if endpoint == "/health" {
		if !strings.Contains(contentType, "application/json") {
			result.Issues = append(result.Issues, fmt.Sprintf("Invalid content type: %s (expected JSON)", contentType))
		}
	} else if strings.HasPrefix(endpoint, "/auth/") {
		// Auth endpoints might return different content types depending on configuration
		// 405 responses typically return text/plain, which is acceptable
		if resp.StatusCode == 200 && !strings.Contains(contentType, "text/html") {
			result.Issues = append(result.Issues, fmt.Sprintf("Invalid content type: %s (expected HTML for 200 response)", contentType))
		}
		// For 405 responses, text/plain is acceptable
	}
	
	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		result.Issues = append(result.Issues, fmt.Sprintf("Failed to read response: %v", err))
		return result
	}
	
	// Validate health endpoint response
	if endpoint == "/health" {
		var health HealthResponse
		if err := json.Unmarshal(body, &health); err != nil {
			result.Issues = append(result.Issues, fmt.Sprintf("Invalid JSON response: %v", err))
		} else {
			if health.Status != "ok" && health.Status != "healthy" {
				result.Issues = append(result.Issues, fmt.Sprintf("Unhealthy status: %s", health.Status))
			}
			if health.Timestamp == "" {
				result.Issues = append(result.Issues, "Missing timestamp in health response")
			}
		}
	}
	
	// Check security headers
	securityHeaders := map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "", // Should be present
		"X-XSS-Protection":       "", // Should be present
	}
	
	for header, expectedValue := range securityHeaders {
		value := resp.Header.Get(header)
		if value == "" {
			printWarning(fmt.Sprintf("%s: Missing security header: %s", endpoint, header))
		} else if expectedValue != "" && value != expectedValue {
			printWarning(fmt.Sprintf("%s: Security header %s has value '%s' (expected '%s')", endpoint, header, value, expectedValue))
		}
	}
	
	result.Success = len(result.Issues) == 0
	return result
}

func verifyBackendDeployment() bool {
	backendURL := os.Getenv("BACKEND_URL")
	if backendURL == "" {
		backendURL = "http://localhost:8080"
	}
	
	printHeader("🔍 Verifying Backend Server Deployment")
	fmt.Printf("Testing server: %s\n", backendURL)
	fmt.Println()
	
	// Test endpoints
	endpoints := []string{
		"/health",
		"/auth/login",
		"/auth/register",
	}
	
	results := []VerificationResult{}
	allTestsPassed := true
	
	for _, endpoint := range endpoints {
		result := verifyEndpoint(backendURL, endpoint)
		results = append(results, result)
		
		if result.Success {
			printStatus(fmt.Sprintf("✓ %s - OK (%dms)", endpoint, result.ResponseTime.Milliseconds()))
		} else {
			printError(fmt.Sprintf("✗ %s - %s", endpoint, strings.Join(result.Issues, ", ")))
			allTestsPassed = false
		}
	}
	
	// Performance check
	fmt.Println()
	printHeader("⚡ Performance Check")
	
	healthResult := results[0] // Health endpoint
	if healthResult.ResponseTime < 1000*time.Millisecond {
		printStatus(fmt.Sprintf("✓ Health check response time: %dms (Good)", healthResult.ResponseTime.Milliseconds()))
	} else if healthResult.ResponseTime < 5000*time.Millisecond {
		printWarning(fmt.Sprintf("⚠ Health check response time: %dms (Acceptable)", healthResult.ResponseTime.Milliseconds()))
	} else {
		printError(fmt.Sprintf("✗ Health check response time: %dms (Too slow)", healthResult.ResponseTime.Milliseconds()))
		allTestsPassed = false
	}
	
	// Summary
	fmt.Println()
	printHeader("📊 Deployment Verification Summary")
	
	passedTests := 0
	for _, result := range results {
		if result.Success {
			passedTests++
		}
	}
	
	fmt.Printf("Endpoints tested: %d\n", len(results))
	fmt.Printf("Endpoints accessible: %d\n", passedTests)
	fmt.Printf("Success rate: %d%%\n", (passedTests*100)/len(results))
	
	if allTestsPassed {
		printStatus("🎉 All critical tests passed! Backend deployment verified.")
		return true
	} else {
		printError("❌ Some critical tests failed. Please check the issues above.")
		return false
	}
}

func main() {
	success := verifyBackendDeployment()
	if success {
		os.Exit(0)
	} else {
		os.Exit(1)
	}
}