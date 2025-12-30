#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/auth"

echo "--- 1. REGISTER ---"
# Registration with completely new information
REG_DATA='{
  "email": "tester_new_gen@supnum.mr",
  "password": "secure_password_2025",
  "role": "etudiant",
  "matricule": "887766",
  "level": "L3",
  "nom": "Michel New Gen"
}'

REGISTER_RES=$(curl -s -X POST "$API_URL/register" \
     -H "Content-Type: application/json" \
     -d "$REG_DATA")

echo "Response: $REGISTER_RES"
echo ""

echo "--- 2. LOGIN ---"
# Login to get the Token
LOGIN_DATA='{
  "email": "tester_new_gen@supnum.mr",
  "password": "secure_password_2025"
}'

LOGIN_RES=$(curl -s -X POST "$API_URL/login" \
     -H "Content-Type: application/json" \
     -d "$LOGIN_DATA")

# Extract Token and ID using grep/sed
TOKEN=$(echo $LOGIN_RES | grep -oP '(?<="token":")[^"]*')
USER_ID=$(echo $LOGIN_RES | grep -oP '(?<="id":)[0-9]*')

if [ -z "$TOKEN" ]; then
    echo "Error: Could not retrieve token. Check your server."
    exit 1
fi

echo "Token: ${TOKEN:0:30}..."
echo "User ID: $USER_ID"
echo ""

echo "--- 3. UPDATE ---"
# Update with different information
# Note: Using your route /update/:id defined in authController.js
UPDATE_DATA="{
  \"email\": \"michel_final_version@supnum.mr\",
  \"role\": \"etudiant\",
  \"inActive\": 0,
  \"nom\": \"Michel Updated Final\",
  \"matricule\": \"112233\",
  \"level\": \"Master 1\"
}"

UPDATE_RES=$(curl -s -X PUT "$API_URL/update/$USER_ID" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d "$UPDATE_DATA")

echo "Final Response: $UPDATE_RES"
