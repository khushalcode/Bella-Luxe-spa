#!/usr/bin/env python3
"""
Refactor all server actions to use `await getSupabase()` instead of the
synchronous `supabase` export. This supports the admin-login fallback when
the service_role key is not configured.

Strategy:
  1. Replace `import { supabase, ... }` with `import { getSupabase, ... }`
  2. Replace `import { ..., supabase }` with `import { ..., getSupabase }`
  3. For each function body that uses `supabase.from(`, insert
     `const sb = await getSupabase()` as the first statement, and replace
     `supabase.from(` with `sb.from(` within that function.
"""
import re
import os

ACTIONS_DIR = "/home/z/my-project/src/app/actions"
API_DIR = "/home/z/my-project/src/app/api"


def find_function_bounds(content, start_idx):
    """Given the index right after an opening `{` of a function, return the
    index of the matching closing `}`. Handles nested braces and strings."""
    depth = 1
    i = start_idx
    in_str = None  # tracks if we're inside a string literal
    while i < len(content) and depth > 0:
        c = content[i]
        if in_str:
            if c == in_str and content[i - 1] != "\\":
                in_str = None
        else:
            if c in ('"', "'", "`"):
                in_str = c
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
        i += 1
    return i  # position right after the closing `}`


def refactor_file(path):
    with open(path, "r") as f:
        content = f.read()
    original = content

    # 1. Fix imports
    # Pattern: import { supabase, toISO } from '@/lib/supabaseServer'
    content = re.sub(
        r"import\s*\{\s*supabase(\s*,\s*[^}]+?)\s*\}\s*from\s*'",
        lambda m: f"import {{ getSupabase{m.group(1)} }} from '",
        content,
    )
    # Pattern: import { toISO, supabase } from '@/lib/supabaseServer'
    content = re.sub(
        r"import\s*\{\s*([^}]+?),\s*supabase\s*\}\s*from\s*'",
        lambda m: f"import {{ {m.group(1)}, getSupabase }} from '",
        content,
    )
    # Pattern: import { supabase } from '@/lib/supabaseServer'
    content = re.sub(
        r"import\s*\{\s*supabase\s*\}\s*from\s*'",
        "import { getSupabase } from '",
        content,
    )

    # 2. Find each `export async function NAME(...) ... {` and refactor the body.
    # We use a function-level regex to find each exported async function.
    func_pattern = re.compile(
        r"(export\s+async\s+function\s+\w+\s*\([^)]*\)\s*(?::\s*[^{]+?)?\s*\{)",
        re.MULTILINE,
    )

    def refactor_function(match):
        func_sig = match.group(1)
        body_start = match.end()  # position right after the opening `{`
        body_end = find_function_bounds(content, body_start)
        body = content[body_start:body_end - 1]  # exclude the closing `}`

        # Check if this function uses `supabase.from(`
        if "supabase.from(" not in body:
            return func_sig  # leave unchanged

        # Replace `supabase.from(` with `sb.from(` in the body
        new_body = body.replace("supabase.from(", "sb.from(")

        # Add `const sb = await getSupabase();` as the first statement.
        # Detect indentation from the first non-empty line of the body.
        lines = new_body.split("\n")
        # Find the first non-empty line that isn't a comment or blank
        indent = "  "  # default
        for line in lines:
            stripped = line.lstrip()
            if stripped and not stripped.startswith("//"):
                indent = line[:len(line) - len(stripped)]
                break
        new_body = "\n" + indent + "const sb = await getSupabase()" + new_body

        # Return the new function signature + refactored body
        # We need to use a placeholder because we're modifying content via re.sub
        # but we also need to update the content outside the match. We'll do this
        # differently — use a marker and replace after.
        return func_sig + "\x00REFACTORED_BODY\x00" + new_body + "\x01"

    # We can't easily do this with re.sub because we need to modify text outside
    # the match. Let's do it manually by iterating over matches.

    # Actually, since our regex only matches the function signature (not the body),
    # we can use re.sub with a function that returns the new signature + refactored body.
    # But the body is outside the match, so we need to use a different approach.

    # Let's iterate over matches and build the new content piece by piece.
    new_content_parts = []
    last_end = 0
    for match in func_pattern.finditer(content):
        # Append text before this match
        new_content_parts.append(content[last_end:match.start()])
        # Append the function signature
        new_content_parts.append(match.group(1))
        body_start = match.end()
        body_end = find_function_bounds(content, body_start)
        body = content[body_start:body_end - 1]

        if "supabase.from(" in body:
            # Replace `supabase.from(` with `sb.from(` in the body
            new_body = body.replace("supabase.from(", "sb.from(")
            # Detect indentation from the first non-empty, non-comment line
            indent = "  "
            for line in new_body.split("\n"):
                stripped = line.lstrip()
                if stripped and not stripped.startswith("//"):
                    indent = line[:len(line) - len(stripped)]
                    break
            # Insert `const sb = await getSupabase()` as the first statement
            # Find the right place to insert — at the start of the body, preserving
            # any leading comments/whitespace
            # Look for the first non-blank, non-comment line
            insert_pos = 0
            body_lines = new_body.split("\n")
            for i, line in enumerate(body_lines):
                stripped = line.strip()
                if stripped and not stripped.startswith("//"):
                    insert_pos = i
                    break
            # Insert before the first non-comment line
            new_body_lines = body_lines[:insert_pos] + [indent + "const sb = await getSupabase()"] + body_lines[insert_pos:]
            new_body = "\n".join(new_body_lines)
            new_content_parts.append(new_body)
        else:
            new_content_parts.append(body)

        new_content_parts.append(content[body_end - 1:body_end])  # the closing `}`
        last_end = body_end

    new_content_parts.append(content[last_end:])
    content = "".join(new_content_parts)

    if content != original:
        with open(path, "w") as f:
            f.write(content)
        print(f"  ✓ refactored: {path}")
        return True
    else:
        print(f"  (no changes): {path}")
        return False


def main():
    print("=== Refactoring server actions ===")
    for fname in sorted(os.listdir(ACTIONS_DIR)):
        if fname.endswith(".ts"):
            refactor_file(os.path.join(ACTIONS_DIR, fname))

    print("\n=== Refactoring API routes ===")
    for root, dirs, files in os.walk(API_DIR):
        for fname in files:
            if fname.endswith(".ts"):
                refactor_file(os.path.join(root, fname))


if __name__ == "__main__":
    main()
