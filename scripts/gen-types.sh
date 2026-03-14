#!/bin/bash
set -e

if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "Error: SUPABASE_PROJECT_ID is not set. Add it to .env.local"
  exit 1
fi

bunx supabase gen types typescript \
  --project-id "$SUPABASE_PROJECT_ID" \
  --schema public > lib/supabase/database.types.ts

echo "Types generated at lib/supabase/database.types.ts"
