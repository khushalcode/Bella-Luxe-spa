#!/bin/bash
# Refactor server actions to use `await getSupabase()` instead of `supabase`.
# Assumes the import was already updated to `import { getSupabase, ... } from '@/lib/supabaseServer'`.
#
# Strategy:
#   1. For each file in src/app/actions/ and src/app/api/
#   2. Replace `supabase.from(` with `sb.from(` (literal)
#   3. After each line that ends with `... {` and matches `export async function`,
#      insert `  const sb = await getSupabase()` as the next line.
#
# Step 3 is done with a Perl one-liner that uses a regex with a /e flag.

set -e

FILES=$(find /home/z/my-project/src/app/actions /home/z/my-project/src/app/api -name "*.ts" -type f)

for FILE in $FILES; do
  # Step 1: Make sure the import is correct
  # (already done by previous script, but just in case)
  sed -i "s|import { supabase, |import { getSupabase, |g" "$FILE"
  sed -i "s|import { supabase }|import { getSupabase }|g" "$FILE"
  sed -i "s|, supabase }|, getSupabase }|g" "$FILE"

  # Step 2: Replace `supabase.from(` with `sb.from(` everywhere
  sed -i 's|supabase\.from(|sb.from(|g' "$FILE"

  # Step 3: Insert `const sb = await getSupabase()` after each `export async function ... {` line.
  # Use awk for multi-line processing.
  awk '
    /^export async function/ && /{$/ {
      print $0
      print "  const sb = await getSupabase()"
      next
    }
    { print }
  ' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
done

echo "Refactor complete"
