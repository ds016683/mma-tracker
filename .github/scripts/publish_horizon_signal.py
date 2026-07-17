"""
Horizon Signal — Weekly digest generation and Supabase publish.

Run by GitHub Actions every Monday at 6 AM EST.
Uses Anthropic (claude-opus-4-5) with web_search to research current
US healthcare market developments, then writes directly to Postgres via
the Supabase DB URL (already available in GH secrets as SUPABASE_DB_URL).
"""

import os
import json
import datetime
import anthropic

# ── Config ────────────────────────────────────────────────────────────────────

SUPABASE_DB_URL   = os.environ["SUPABASE_DB_URL"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]

TODAY = datetime.date.today().isoformat()

SYSTEM_PROMPT = """You are Mr. MMA, a healthcare market intelligence analyst for Third Horizon Strategies.
You write The Horizon Signal — a weekly digest covering US healthcare market developments
relevant to employer plan design, payer-provider dynamics, provider network intelligence,
and hospital price transparency regulation.

Your audience is MMA (Marsh McLennan Agency) regional producers who advise employer clients
on insurance plan selection and cost management.

Writing style:
- Authoritative, precise, no fluff
- Lead with the most consequential development first
- Cite specific organizations, dollar figures, dates wherever possible
- Each paragraph covers one distinct theme: antitrust/regulation, consolidation/M&A,
  carrier/network dynamics, or price transparency enforcement
- 3 paragraphs, each 120-200 words
- 6-10 source articles with real URLs"""

RESEARCH_PROMPT = f"""Today is {TODAY}. Search for the most significant US healthcare market
developments from the past 7 days across these areas:

1. DOJ/FTC antitrust enforcement against health systems or payer contracting practices
2. Hospital or health system mergers, acquisitions, and consolidation
3. Carrier network changes, payer-provider contract disputes, or market exits
4. CMS hospital price transparency rule enforcement and MRF compliance updates
5. ACA marketplace changes, premium trends, or employer plan design shifts

Research these topics using web search, then write The Horizon Signal digest.
Return ONLY a JSON object with this exact structure — no markdown, no commentary:

{{
  "body": [
    "paragraph 1 text (most consequential development first)",
    "paragraph 2 text (second theme)",
    "paragraph 3 text (third theme)"
  ],
  "articles": [
    {{"title": "...", "outlet": "...", "url": "https://...", "date": "YYYY-MM-DD"}},
    ...
  ]
}}

Include 6-10 articles with verified URLs."""


def generate_digest() -> dict:
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    print("Calling Claude with web_search to research healthcare news…")
    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 12}],
        messages=[{"role": "user", "content": RESEARCH_PROMPT}],
    )

    # Extract the final text block (after any tool-use turns)
    text_content = ""
    for block in message.content:
        if hasattr(block, "text"):
            text_content += block.text

    print(f"Raw response: {len(text_content)} chars")

    # Strip accidental markdown fences
    cleaned = text_content.strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        cleaned = parts[1] if len(parts) > 1 else cleaned
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    digest = json.loads(cleaned)

    assert "body" in digest and isinstance(digest["body"], list) and len(digest["body"]) >= 2, \
        "body must have >= 2 paragraphs"
    assert "articles" in digest and isinstance(digest["articles"], list) and len(digest["articles"]) >= 4, \
        "articles must have >= 4 entries"

    print(f"Digest OK: {len(digest['body'])} paragraphs, {len(digest['articles'])} articles")
    return digest


def publish_to_postgres(digest: dict) -> None:
    # Use psycopg2 — pre-installed on ubuntu-latest
    import psycopg2
    import psycopg2.extras

    print("Connecting to Supabase Postgres…")
    conn = psycopg2.connect(SUPABASE_DB_URL)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            # Archive current edition
            cur.execute(
                "UPDATE horizon_signal_digests SET is_current = false WHERE is_current = true"
            )
            print(f"Archived {cur.rowcount} previous current row(s)")

            # Insert new edition
            cur.execute(
                """
                INSERT INTO horizon_signal_digests (published_at, body, articles, is_current)
                VALUES (%s, %s, %s, true)
                RETURNING id, published_at
                """,
                (
                    TODAY,
                    psycopg2.extras.Json(digest["body"]),
                    psycopg2.extras.Json(digest["articles"]),
                ),
            )
            row = cur.fetchone()
            print(f"Inserted: id={row[0]}, published_at={row[1]}")

        conn.commit()
        print("Transaction committed.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    digest = generate_digest()
    publish_to_postgres(digest)
    print(f"✅ Horizon Signal published for {TODAY}.")
