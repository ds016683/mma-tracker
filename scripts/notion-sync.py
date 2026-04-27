#!/usr/bin/env python3
"""Notion → Supabase sync for MMA Tracker regional data.
Runs on workflow_dispatch (Sync Notion button) and can be run locally.
"""
import json, os, urllib.request, urllib.error, time
from collections import defaultdict

NOTION_TOKEN = os.environ["NOTION_TOKEN"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

NARRATIVES_DB_ID = "34f750fa-613d-8139-80a7-f50e249be477"
OPP_DB_ID = "34f750fa-613d-813d-8bf7-c3578c5f2cfb"
NETWORKS_DB_ID = "34f750fa-613d-81b6-aef1-e85b58ffe7dc"

STATE_TO_REGION = {
    'WA':1,'OR':1,'ID':1,'MT':1,'AK':1,'HI':1,
    'CA':2,'NV':2,'AZ':2,'CO':2,'UT':3,'WY':3,
    'NM':4,'TX':4,'OK':4,'LA':4,'AR':4,
    'IL':5,'IN':5,'OH':5,
    'KS':6,'MO':6,'IA':6,'NE':6,'MN':6,'SD':6,'ND':6,'WI':6,'MI':6,
    'FL':7,
    'ME':8,'VT':8,'NH':8,'MA':8,'RI':8,'CT':8,'NY':8,'NJ':8,'PA':8,
    'KY':9,'TN':9,'AL':9,'MS':9,'GA':9,
    'WV':10,'MD':10,'NC':10,'SC':10,'VA':10,'DE':10,'DC':10,
}
REGION_STATES = defaultdict(list)
for state, region in STATE_TO_REGION.items():
    REGION_STATES[region].append(state)

def notion_query_all(db_id):
    all_results = []
    cursor = None
    while True:
        body = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        url = f"https://api.notion.com/v1/databases/{db_id}/query"
        req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST", headers={
            "Authorization": f"Bearer {NOTION_TOKEN}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
        })
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read())
        all_results.extend(data.get("results", []))
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
        time.sleep(0.2)
    return all_results

def supabase_patch(region_id, field, value):
    url = f"{SUPABASE_URL}/rest/v1/region_data?region_id=eq.{region_id}"
    req = urllib.request.Request(url, data=json.dumps({field: value}).encode(), method="PATCH", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    })
    with urllib.request.urlopen(req) as r:
        r.read()

# === Sync 1: Opportunity Narratives ===
print("Syncing narratives...")
for page in notion_query_all(NARRATIVES_DB_ID):
    props = page["properties"]
    region_num = props["Region #"]["number"]
    narrative = props["Narrative"]["rich_text"][0]["plain_text"] if props["Narrative"]["rich_text"] else ""
    payload = json.dumps({"narrative": narrative, "notion_url": page["url"], "region_num": region_num})
    supabase_patch(region_num, "networks_of_interest", f"__narrative__{payload}")
    print(f"  Region {region_num}: {len(narrative)} chars")
    time.sleep(0.1)

# === Sync 2: Opportunities ===
print("Syncing opportunities...")
opp_by_region = defaultdict(list)
for page in notion_query_all(OPP_DB_ID):
    props = page["properties"]
    region_num = int(props["Region #"]["number"] or 0)
    opp = {
        "id": page["id"],
        "issue": props["Issue"]["title"][0]["plain_text"] if props["Issue"]["title"] else "",
        "category": props["Category"]["select"]["name"] if props["Category"]["select"] else "",
        "priority": props["Priority"]["select"]["name"] if props["Priority"]["select"] else "",
        "status": props["Status"]["select"]["name"] if props["Status"]["select"] else "",
        "notes": props["Notes"]["rich_text"][0]["plain_text"] if props["Notes"]["rich_text"] else "",
        "notion_url": page["url"],
        "region_num": region_num,
    }
    opp_by_region[region_num].append(opp)

# Build per-region opportunity arrays
for r in range(1, 11):
    region_opps = opp_by_region.get(r, []) + opp_by_region.get(0, [])
    supabase_patch(r, "areas_of_opportunity", f"__json__{json.dumps(region_opps)}")
    print(f"  Region {r}: {len(region_opps)} opportunities")
    time.sleep(0.1)

# === Sync 3: Networks ===
print("Syncing network coverage...")
net_pages = notion_query_all(NETWORKS_DB_ID)
national_v8 = []
regional_v8 = []
v9_nets = []
for page in net_pages:
    props = page["properties"]
    net = {
        "name": props["Network Name"]["title"][0]["plain_text"] if props["Network Name"]["title"] else "",
        "carrier": props["Carrier"]["rich_text"][0]["plain_text"] if props["Carrier"]["rich_text"] else "",
        "version": props["Version"]["select"]["name"] if props["Version"]["select"] else "",
        "status": props["Status"]["select"]["name"] if props["Status"]["select"] else "",
        "plan_id": props["Plan ID"]["rich_text"][0]["plain_text"] if props["Plan ID"]["rich_text"] else "",
        "net_type": props["Network Type"]["rich_text"][0]["plain_text"] if props["Network Type"]["rich_text"] else "",
        "states": [s["name"] for s in props["States"]["multi_select"]],
        "regions": [int(r["name"]) for r in props["MMA Region #"]["multi_select"] if r["name"].isdigit()],
    }
    if "v9" in net["version"].lower():
        v9_nets.append(net)
    elif net["version"] == "v8":
        if net["states"]:
            regional_v8.append(net)
        else:
            national_v8.append(net)

for region_id in range(1, 11):
    region_states = sorted(REGION_STATES.get(region_id, []))
    state_networks = {}
    for state in region_states:
        nets = [{"name": n["name"], "carrier": n["carrier"], "plan_id": n["plan_id"], "type": n["net_type"]}
                for n in regional_v8 if state in n["states"]]
        nets += [{"name": n["name"], "carrier": n["carrier"], "plan_id": n["plan_id"], "type": n["net_type"]}
                 for n in national_v8]
        state_networks[state] = nets
    v9_for_region = [n for n in v9_nets if region_id in n["regions"]]
    coverage = {"state_networks": state_networks, "v9_candidates": [
        {"name": n["name"], "carrier": n["carrier"], "states": n["states"], "status": n["status"], "notes": ""}
        for n in v9_for_region
    ]}
    supabase_patch(region_id, "v8_coverage", f"__json__{json.dumps(coverage)}")
    print(f"  Region {region_id}: {len(region_states)} states")
    time.sleep(0.1)

print("\n✅ All syncs complete")
