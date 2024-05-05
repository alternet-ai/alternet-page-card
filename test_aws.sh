#!/bin/bash

# Load environment variables from .env file
source .env

# Use the API_KEY in the curl command
curl -X POST http://56e9004688261d8f6353c7c79a45ee59-153620318.us-west-2.elb.amazonaws.com/screenshot \
-H "Content-Type: application/json" \
-d "{\"apiKey\": \"$API_KEY\", \"html\": \"<html><body><h1>Hello World</h1></body></html>\", \"cacheKey\": \"test123\"}"