#!/bin/bash
# Test the API to see what experimentDescription data is being returned

# First, we need to load a project and get the category results
# Let's use curl to call the API endpoints

PROJECT_FILE="/home/svobodadl/bmdexpress-web/src/main/resources/data/bmd/P3MP-Parham.bm2"

echo "Testing API endpoint for experiment description data..."
echo "======================================================="
echo ""

# Note: We'd need a session/CSRF token to actually call the API
# Instead, let's check the service code and add logging

echo "Will add logging to CategoryResultsService to verify experimentDescription is populated"
