#!/bin/bash

# Load environment variables from .env file
source .env

# Use the API_KEY in the curl command
curl -X POST http://localhost:3000/screenshot \
-H "Content-Type: application/json" \
-d "{\"apiKey\": \"$API_KEY\", \"html\": \"<html><body><h1>Hello World</h1></body></html>\", \"cacheKey\": \"test123\"}"