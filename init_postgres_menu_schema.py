"""
Creates and seeds the `menu` schema in PostgreSQL:
- menu.camp: Multi-camp storage (days, meals, categories, cards, themes, event times)
- menu.meal_template: Reusable meal & category layouts by location/camp type
- menu.recipe: Master BEO recipe catalog with custom tags
- menu.tag_catalog: Global tag definitions for filtering and card tagging
- menu.audit_rule: Editable USMNT Menu Audit Rules (1.1-6.2+) that feed the AI Audit engine
"""

import json
import re
import socket
from pathlib import Path
import psycopg2
from psycopg2.extras import Json

# Force IPv4 to avoid IPv6 timeout on Windows RDS
orig_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4_only

DB_HOST = "ussf-analytics-2.cgeqvvq6y3pp.us-east-2.rds.amazonaws.com"
DB_PORT = 5432
DB_USER = "postgres"
DB_PASSWORD = "mkIeUAQEElxFZhpt0N9dzZ1zoGXrJlcie8nY4c9LlotBiYtV"
DB_NAME = "postgres"

DATA_JS_PATH = Path(__file__).resolve().parent / "data.js"

def load_menu_data():
    text = DATA_JS_PATH.read_text(encoding="utf-8")
    json_str = re.sub(r"^window\.MENU_DATA\s*=\s*", "", text.strip()).rstrip(";").strip()
    return json.loads(json_str)

DEFAULT_SWIMLANES = [
    {"laneId": "bf_eggs", "meal": "Breakfast", "title": "Eggs & Specialty Eggs", "subtitle": "Scrambles & Specialty Egg Dishes", "sourceRows": [{"rowId": "bf_scramble", "tag": "Scramble"}, {"rowId": "bf_spec_egg", "tag": "Specialty Egg"}]},
    {"laneId": "bf_vegan", "meal": "Breakfast", "title": "Breakfast Vegan", "subtitle": "Plant-Based Morning Entree", "sourceRows": [{"rowId": "bf_vegan", "tag": "Vegan"}]},
    {"laneId": "bf_sides", "meal": "Breakfast", "title": "Meats & Potato Sides", "subtitle": "Bacon/Sausage & Potatoes/Hash", "sourceRows": [{"rowId": "bf_side_meat", "tag": "Meat"}, {"rowId": "bf_side_potato", "tag": "Potato"}]},
    {"laneId": "bf_griddle", "meal": "Breakfast", "title": "Griddle Specials", "subtitle": "Pancakes, Waffles & French Toast", "sourceRows": [{"rowId": "bf_special", "tag": "Griddle"}]},
    {"laneId": "bf_oats", "meal": "Breakfast", "title": "Overnight Oats, Chia & Bakery", "subtitle": "Cold Oats, Chia Puddings & Breads", "sourceRows": [{"rowId": "bf_oats_1", "tag": "Oats/Chia"}, {"rowId": "bf_oats_2", "tag": "Bakery/Oats"}]},
    {"laneId": "bf_fruit", "meal": "Breakfast", "title": "Breakfast Fruits", "subtitle": "Whole Unpeeled & Berries", "sourceRows": []},

    {"laneId": "lu_proteins", "meal": "Lunch", "title": "Lunch Proteins", "subtitle": "Poultry, Fish/Seafood & Meat Entrees", "sourceRows": [{"rowId": "lu_prot_1", "tag": "Protein 1"}, {"rowId": "lu_prot_2", "tag": "Protein 2"}, {"rowId": "lu_prot_3", "tag": "Protein 3"}]},
    {"laneId": "lu_vegan", "meal": "Lunch", "title": "Lunch Plant-Based", "subtitle": "Vegan Entree", "sourceRows": [{"rowId": "lu_vegan", "tag": "Vegan"}]},
    {"laneId": "lu_veggies", "meal": "Lunch", "title": "Lunch Vegetables", "subtitle": "Hot Vegetable Sides", "sourceRows": [{"rowId": "lu_veg_1", "tag": "Veg 1"}, {"rowId": "lu_veg_2", "tag": "Veg 2"}]},
    {"laneId": "lu_starches", "meal": "Lunch", "title": "Lunch Carbs & Starches", "subtitle": "Rice, Risotto, Farro & Potatoes", "sourceRows": [{"rowId": "lu_starch_1", "tag": "Starch 1"}, {"rowId": "lu_starch_2", "tag": "Starch 2"}]},
    {"laneId": "lu_salad_soup", "meal": "Lunch", "title": "Lunch Salad & Soup", "subtitle": "Composed Salad & Daily Soup", "sourceRows": [{"rowId": "lu_salad", "tag": "Salad"}, {"rowId": "lu_soup", "tag": "Soup"}]},
    {"laneId": "lu_station_special", "meal": "Lunch", "title": "Lunch Station & Special", "subtitle": "Action Station & Chef Special", "sourceRows": [{"rowId": "lu_station", "tag": "Action Station"}, {"rowId": "lu_special", "tag": "Chef Special"}]},

    {"laneId": "dn_proteins", "meal": "Dinner", "title": "Dinner / Pre-Match Proteins", "subtitle": "Poultry, Fish/Seafood & Meat Entrees", "sourceRows": [{"rowId": "dn_prot_1", "tag": "Protein 1"}, {"rowId": "dn_prot_2", "tag": "Protein 2"}, {"rowId": "dn_prot_3", "tag": "Protein 3"}]},
    {"laneId": "dn_vegan", "meal": "Dinner", "title": "Dinner Plant-Based", "subtitle": "Vegan Entree", "sourceRows": [{"rowId": "dn_vegan", "tag": "Vegan"}]},
    {"laneId": "dn_veggies", "meal": "Dinner", "title": "Dinner Vegetables", "subtitle": "Hot Vegetable Sides", "sourceRows": [{"rowId": "dn_veg_1", "tag": "Veg 1"}, {"rowId": "dn_veg_2", "tag": "Veg 2"}]},
    {"laneId": "dn_starches", "meal": "Dinner", "title": "Dinner Carbs & Starches", "subtitle": "Rice, Noodles, Risotto & Potatoes", "sourceRows": [{"rowId": "dn_starch_1", "tag": "Starch 1"}, {"rowId": "dn_starch_2", "tag": "Starch 2"}]},
    {"laneId": "dn_salad_soup", "meal": "Dinner", "title": "Dinner Salad & Soup", "subtitle": "Composed Salad & Evening Soup", "sourceRows": [{"rowId": "dn_salad", "tag": "Salad"}, {"rowId": "dn_soup", "tag": "Soup"}]},
    {"laneId": "dn_station_special", "meal": "Dinner", "title": "Dinner Station, Special & Dessert", "subtitle": "Action Station, Chef Special & Dessert", "sourceRows": [{"rowId": "dn_station", "tag": "Action Station"}, {"rowId": "dn_special", "tag": "Chef Special"}, {"rowId": "dn_dessert", "tag": "Dessert"}]},

    {"laneId": "pm_mains", "meal": "Post-Match", "title": "Post-Match Mains & Stations", "subtitle": "Recovery Proteins, Pizza/Sushi & Açaí Station", "sourceRows": [{"rowId": "pm_prot_1", "tag": "Main 1"}, {"rowId": "pm_prot_2", "tag": "Main 2"}, {"rowId": "pm_prot_3", "tag": "Main 3"}, {"rowId": "pm_station", "tag": "Station"}, {"rowId": "pm_dessert", "tag": "Recovery Station"}]},
    {"laneId": "pm_sides", "meal": "Post-Match", "title": "Post-Match Sides & Salads", "subtitle": "Recovery Starches, Vegetables & Salad", "sourceRows": [{"rowId": "pm_veg_1", "tag": "Side"}, {"rowId": "pm_veg_2", "tag": "Side"}, {"rowId": "pm_starch_1", "tag": "Starch"}, {"rowId": "pm_starch_2", "tag": "Starch"}, {"rowId": "pm_salad", "tag": "Salad"}]}
]

def build_initial_board(data):
    row_map = {r["rowId"]: r["cells"] for r in data["excelRows"]}
    meals = [
        {"id": "Breakfast", "name": "Breakfast", "icon": "🍳", "defaultTime": "08:00 AM"},
        {"id": "Lunch", "name": "Lunch", "icon": "🥗", "defaultTime": "01:00 PM"},
        {"id": "Dinner", "name": "Dinner / Pre-Match", "icon": "🍽️", "defaultTime": "07:00 PM"},
        {"id": "Post-Match", "name": "Post-Match Recovery", "icon": "⚽", "defaultTime": "10:30 PM"}
    ]
    days = []
    for d in data["days"]:
        d_copy = dict(d)
        d_copy["eventTime"] = "07:30 PM Kickoff" if d["type"] == "match" else ("11:00 AM Training" if d["type"] in ("training", "md-1") else "Travel / Regen")
        days.append(d_copy)

    card_seq = 1
    slots = {}
    for lane in DEFAULT_SWIMLANES:
        slots[lane["laneId"]] = []
        for d_idx in range(len(days)):
            day_cards = []
            for sr in lane["sourceRows"]:
                val = (row_map.get(sr["rowId"], [""]*12)[d_idx] or "").strip()
                if val and val not in ("No Station", "No Special") and not val.startswith("N/A"):
                    day_cards.append({
                        "id": f"c_{card_seq}",
                        "dish": val,
                        "subTag": sr["tag"],
                        "tags": [],
                        "origDish": val
                    })
                    card_seq += 1
            slots[lane["laneId"]].append(day_cards)

    themes = {
        "Lunch": list(row_map.get("lu_theme", [""]*12)),
        "Dinner": list(row_map.get("dn_theme", [""]*12))
    }

    return {
        "days": days,
        "meals": meals,
        "swimlanes": DEFAULT_SWIMLANES,
        "slots": slots,
        "themes": themes,
        "aiAuditFlags": []
    }

def main():
    data = load_menu_data()
    board = build_initial_board(data)

    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    conn.autocommit = True
    cur = conn.cursor()

    print("Creating schema `menu` and tables in PostgreSQL...")
    cur.execute("CREATE SCHEMA IF NOT EXISTS menu;")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS menu.camp (
            camp_id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            subtitle TEXT,
            start_date DATE,
            end_date DATE,
            locations TEXT,
            board_json JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS menu.meal_template (
            template_id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            location_tag TEXT,
            description TEXT,
            meals_json JSONB NOT NULL,
            swimlanes_json JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS menu.recipe (
            recipe_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            section TEXT,
            yield_text TEXT,
            ingredients JSONB NOT NULL,
            steps JSONB NOT NULL,
            notes TEXT,
            tags JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS menu.tag_catalog (
            tag_name TEXT PRIMARY KEY,
            color_class TEXT DEFAULT 'b-func',
            category_group TEXT DEFAULT 'Dietary & Performance',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS menu.audit_rule (
            rule_code TEXT PRIMARY KEY,
            pillar TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            trigger_desc TEXT NOT NULL,
            action_prompt TEXT NOT NULL,
            status_text TEXT DEFAULT 'Active',
            is_active BOOLEAN DEFAULT TRUE,
            sort_order INTEGER DEFAULT 100,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    # 1. Seed Default Camp (November 2026 Camp)
    cur.execute("""
        INSERT INTO menu.camp (name, subtitle, start_date, end_date, locations, board_json, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT (name) DO UPDATE SET
            subtitle = EXCLUDED.subtitle,
            board_json = EXCLUDED.board_json,
            updated_at = NOW();
    """, (
        "November 2026 Camp (vs. Haiti)",
        "Nov 7–18, 2026 • Atlanta, Kingston & Cincinnati",
        "2026-11-07",
        "2026-11-18",
        "Atlanta (Trilith / NTC), Kingston (Jamaica), Cincinnati (OH)",
        Json(board)
    ))

    # 2. Seed Location / Camp Meal Templates
    templates = [
        (
            "USMNT Standard Training Camp (Atlanta / NTC)",
            "Atlanta (Trilith / NTC)",
            "Standard 4-meal structure (Breakfast, Lunch, Dinner/Pre-Match, Post-Match) with full protein, vegan, carb, vegetable, fruit, salad/soup, and action station categories.",
            board["meals"],
            DEFAULT_SWIMLANES
        ),
        (
            "CONCACAF Away Match Setup (Kingston, Jamaica)",
            "Kingston, Jamaica",
            "Away travel meal layout adding Whole Unpeeled Fruit safeguards, MD-1 clean starch anchors, Pre-Match Meal, and Post-Match Charter Recovery.",
            board["meals"],
            DEFAULT_SWIMLANES
        ),
        (
            "MD+1 Late Arrival Brunch & Regen Cadence (Cincinnati)",
            "Cincinnati, OH",
            "Adjusted 1:00 AM charter arrival layout: Late Morning Brunch -> Light Post-Regen Lunch & Jamba Smoothie Station -> Evening Recovery Dinner.",
            [
                {"id": "Breakfast", "name": "Late Morning Brunch (10:30 AM)", "icon": "🥞", "defaultTime": "10:30 AM"},
                {"id": "Lunch", "name": "Light Post-Regen Lunch / Smoothie Bar (2:30 PM)", "icon": "🥤", "defaultTime": "02:30 PM"},
                {"id": "Dinner", "name": "Evening Recovery Dinner (7:30 PM)", "icon": "🍽️", "defaultTime": "07:30 PM"},
                {"id": "Post-Match", "name": "Post-Match Recovery", "icon": "⚽", "defaultTime": "10:30 PM"}
            ],
            DEFAULT_SWIMLANES
        )
    ]
    for t_name, t_loc, t_desc, t_meals, t_lanes in templates:
        cur.execute("""
            INSERT INTO menu.meal_template (name, location_tag, description, meals_json, swimlanes_json, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (name) DO UPDATE SET
                location_tag = EXCLUDED.location_tag,
                description = EXCLUDED.description,
                meals_json = EXCLUDED.meals_json,
                swimlanes_json = EXCLUDED.swimlanes_json,
                updated_at = NOW();
        """, (t_name, t_loc, t_desc, Json(t_meals), Json(t_lanes)))

    # 3. Seed Tag Catalog
    default_tags = [
        ("Functional Food", "b-func", "Performance"),
        ("MD-1 Safe", "b-bio", "Match Cadence"),
        ("Match Day", "b-req", "Match Cadence"),
        ("100% Plant-Based", "b-func", "Dietary"),
        ("Low-FODMAP", "b-bio", "Dietary"),
        ("Athlete Request", "b-req", "Preference"),
        ("Swap Recommendation", "b-func", "Audit"),
        ("High Carb / Glycogen", "b-req", "Macros"),
        ("Lean Protein", "b-bio", "Macros"),
        ("Anti-Inflammatory", "b-func", "Performance"),
        ("Gluten-Free", "b-bio", "Allergen"),
        ("Dairy-Free", "b-bio", "Allergen"),
        ("Nut-Free", "b-func", "Allergen")
    ]
    for t_name, c_cls, c_grp in default_tags:
        cur.execute("""
            INSERT INTO menu.tag_catalog (tag_name, color_class, category_group)
            VALUES (%s, %s, %s)
            ON CONFLICT (tag_name) DO NOTHING;
        """, (t_name, c_cls, c_grp))

    # 4. Seed Recipes
    for r in data["recipes"]:
        cur.execute("""
            INSERT INTO menu.recipe (recipe_id, name, category, section, yield_text, ingredients, steps, notes, tags, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (recipe_id) DO UPDATE SET
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                section = EXCLUDED.section,
                yield_text = EXCLUDED.yield_text,
                ingredients = EXCLUDED.ingredients,
                steps = EXCLUDED.steps,
                notes = EXCLUDED.notes,
                tags = EXCLUDED.tags,
                updated_at = NOW();
        """, (
            r["id"],
            r["name"],
            r.get("category", ""),
            r.get("section", ""),
            r.get("yield", "10–12 Athlete Portions"),
            Json(r.get("ingredients", [])),
            Json(r.get("steps", [])),
            r.get("notes", ""),
            Json(r.get("tags", []))
        ))

    # 5. Seed Editable USMNT Audit Rules
    for idx, rule in enumerate(data["rules"]):
        cur.execute("""
            INSERT INTO menu.audit_rule (rule_code, pillar, rule_name, trigger_desc, action_prompt, status_text, is_active, sort_order, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, TRUE, %s, NOW())
            ON CONFLICT (rule_code) DO UPDATE SET
                pillar = EXCLUDED.pillar,
                rule_name = EXCLUDED.rule_name,
                trigger_desc = EXCLUDED.trigger_desc,
                action_prompt = EXCLUDED.action_prompt,
                status_text = EXCLUDED.status_text,
                sort_order = EXCLUDED.sort_order,
                updated_at = NOW();
        """, (
            rule["code"],
            rule["cat"],
            rule["name"],
            rule["trigger"],
            rule["action"],
            rule["status"],
            idx + 1
        ))

    cur.execute("SELECT COUNT(*) FROM menu.camp;")
    camp_cnt = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM menu.recipe;")
    rec_cnt = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM menu.audit_rule;")
    rule_cnt = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM menu.meal_template;")
    tmpl_cnt = cur.fetchone()[0]

    print(f"PostgreSQL `menu` schema ready: {camp_cnt} camps, {tmpl_cnt} meal templates, {rec_cnt} recipes, {rule_cnt} audit rules.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
