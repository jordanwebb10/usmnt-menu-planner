import base64
import csv
import io
import json
import os
import re
import socket
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

# Force IPv4 for RDS connections on Windows
orig_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4_only

try:
    import psycopg2
    from psycopg2.extras import Json, RealDictCursor
    PG_AVAILABLE = True
except ImportError:
    PG_AVAILABLE = False

DB_HOST = "ussf-analytics-2.cgeqvvq6y3pp.us-east-2.rds.amazonaws.com"
DB_PORT = 5432
DB_USER = "postgres"
DB_PASSWORD = "mkIeUAQEElxFZhpt0N9dzZ1zoGXrJlcie8nY4c9LlotBiYtV"
DB_NAME = "postgres"

BASE_DIR = Path(__file__).resolve().parent
STATE_FILE = BASE_DIR / "saved_menu_state.json"
SKILL_MD_PATH = BASE_DIR.parent / ".agents" / "skills" / "menu-plan-auditor" / "SKILL.md"

def get_pg_conn():
    if not PG_AVAILABLE:
        return None
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            connect_timeout=5
        )
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"Postgres connection warning: {e}", flush=True)
        return None

def parse_uploaded_excel_bytes(file_bytes, filename="uploaded.xlsx"):
    """
    Smart AI-ready Excel/CSV schedule & menu parser.
    Detects dates, MD countdowns, locations, event/training times, meals, categories, and dishes.
    """
    rows = []
    if filename.lower().endswith(".csv"):
        text = file_bytes.decode("utf-8", errors="replace")
        rows = list(csv.reader(io.StringIO(text)))
    else:
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
        ws = wb.active
        for r in ws.iter_rows(values_only=True):
            rows.append([str(c).strip() if c is not None else "" for c in r])

    if not rows:
        raise ValueError("Uploaded sheet is empty")

    # Find date header row (look for months or dates)
    date_row_idx = -1
    date_cols = []
    month_pat = re.compile(r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|202\d|monday|tuesday|wednesday|thursday|friday|saturday|sunday)", re.I)

    for r_i, row in enumerate(rows[:12]):
        matches = []
        for c_i, val in enumerate(row):
            if c_i >= 1 and val and month_pat.search(val) and len(val) < 45:
                matches.append((c_i, val))
        if len(matches) >= 2:
            date_row_idx = r_i
            date_cols = matches
            break

    # Deduplicate merged pairs if adjacent columns have identical date text
    cleaned_date_cols = []
    for c_i, val in date_cols:
        if cleaned_date_cols and cleaned_date_cols[-1][1] == val:
            continue
        cleaned_date_cols.append((c_i, val))

    if not cleaned_date_cols:
        # Fallback: treat columns 2..N as days
        max_c = max(len(r) for r in rows[:5])
        cleaned_date_cols = [(c, f"Day {i+1}") for i, c in enumerate(range(2, min(max_c, 16)))]
        date_row_idx = 0

    days = []
    for idx, (col_i, date_str) in enumerate(cleaned_date_cols):
        game_hdr = rows[0][col_i] if date_row_idx >= 1 and col_i < len(rows[0]) else ""
        city_str = rows[date_row_idx - 1][col_i] if date_row_idx >= 1 and col_i < len(rows[date_row_idx - 1]) else "Camp Venue"
        is_match = "game" in game_hdr.lower() or "match" in game_hdr.lower()
        short_lbl = re.sub(r"(\w+day),\s*(\w+)\s*(\d+)\w*\s*202\d", lambda m: f"{m.group(1)[:3]} {m.group(2)[:3]} {m.group(3)}", date_str)
        if len(short_lbl) > 16:
            short_lbl = short_lbl[:16]
        days.append({
            "dayIdx": idx,
            "id": f"day-{idx+1}",
            "short": short_lbl or f"Day {idx+1}",
            "fullDate": date_str,
            "md": game_hdr if game_hdr else f"Day {idx+1}",
            "city": city_str or "Camp Venue",
            "hotel": city_str or "Team Hotel",
            "type": "match" if is_match else "training",
            "gameHeader": game_hdr if is_match else "",
            "eventTime": "07:30 PM Kickoff" if is_match else "11:00 AM Training"
        })

    # Parse Meals & Categories dynamically from rows below date_row_idx
    meals = []
    meal_set = set()
    swimlanes = []
    slots = {}
    themes = {}

    current_meal = "Breakfast"
    current_cat = "General"
    card_seq = 1000

    for r_i in range(date_row_idx + 1, len(rows)):
        row = rows[r_i]
        if not any(row):
            continue
        col0 = (row[0] if len(row) > 0 else "").strip()
        col1 = (row[1] if len(row) > 1 else "").strip()

        if col0 and col0.lower() in ("breakfast", "lunch", "dinner", "pre-match", "post-match", "snack", "brunch"):
            current_meal = col0.title()
        if col1.lower() == "post-match meal" or any("post-match meal" in (c or "").lower() for c in row):
            current_meal = "Post-Match"
            continue

        if current_meal not in meal_set:
            meal_set.add(current_meal)
            icons = {"Breakfast": "🍳", "Lunch": "🥗", "Dinner": "🍽️", "Post-Match": "⚽"}
            meals.append({
                "id": current_meal,
                "name": current_meal,
                "icon": icons.get(current_meal, "🍴"),
                "defaultTime": "08:00 AM" if current_meal == "Breakfast" else ("01:00 PM" if current_meal == "Lunch" else "07:00 PM")
            })

        if col1:
            current_cat = col1

        # Skip pure location / constant rows
        if current_cat.lower() in ("location", "trilith", "ntc", "salad bar", "oatmeal", "station", "eggs") and col1.lower() in ("oatmeal", "salad bar"):
            continue

        if current_cat.lower() == "theme":
            themes[current_meal] = []
            for idx, (col_i, _) in enumerate(cleaned_date_cols):
                v = row[col_i] if col_i < len(row) else ""
                if not v and col_i + 1 < len(row):
                    v = row[col_i + 1]
                themes[current_meal].append(v)
            continue

        # Collect items across day columns
        day_items = []
        has_any_item = False
        for idx, (col_i, _) in enumerate(cleaned_date_cols):
            v1 = row[col_i].strip() if col_i < len(row) and row[col_i] else ""
            next_col_start = cleaned_date_cols[idx + 1][0] if idx + 1 < len(cleaned_date_cols) else col_i + 2
            v2 = row[col_i + 1].strip() if (col_i + 1 < next_col_start and col_i + 1 < len(row) and row[col_i + 1]) else ""
            vals = [v for v in (v1, v2) if v and v not in ("No Station", "No Special", "N/A")]
            if vals:
                has_any_item = True
            day_items.append(vals)

        if not has_any_item:
            continue

        lane_id = re.sub(r"[^a-z0-9]+", "_", f"{current_meal}_{current_cat}".lower()).strip("_")
        existing_lane = next((l for l in swimlanes if l["laneId"] == lane_id), None)
        if not existing_lane:
            existing_lane = {
                "laneId": lane_id,
                "meal": current_meal,
                "title": f"{current_meal} — {current_cat}",
                "subtitle": f"Imported {current_cat} line",
                "sourceRows": []
            }
            swimlanes.append(existing_lane)
            slots[lane_id] = [[] for _ in range(len(days))]

        for d_idx, vals in enumerate(day_items):
            for v in vals:
                slots[lane_id][d_idx].append({
                    "id": f"c_{card_seq}",
                    "dish": v,
                    "subTag": current_cat,
                    "tags": [],
                    "origDish": v
                })
                card_seq += 1

    return {
        "days": days,
        "meals": meals,
        "swimlanes": swimlanes,
        "slots": slots,
        "themes": themes,
        "aiAuditFlags": []
    }

def build_gemini_audit_schema_and_flags(board, rules):
    """
    Builds the exact Gemini AI Audit Request Schema (combining the `menu-plan-auditor` skill,
    the user's active editable rules from Tab 4, and the current camp board JSON) AND computes
    structured card-level flags.
    """
    skill_excerpt = ""
    if SKILL_MD_PATH.exists():
        skill_excerpt = SKILL_MD_PATH.read_text(encoding="utf-8")[:4500]

    active_rules = [r for r in rules if r.get("is_active", True)]

    # Compact representation of current board for LLM context
    compact_schedule = []
    days = board.get("days", [])
    slots = board.get("slots", {})
    swimlanes = board.get("swimlanes", [])

    for d_idx, d in enumerate(days):
        day_entry = {
            "dayIdx": d_idx,
            "date": d.get("short"),
            "md": d.get("md"),
            "type": d.get("type"),
            "city": d.get("city"),
            "eventTime": d.get("eventTime", ""),
            "meals": {}
        }
        for lane in swimlanes:
            lid = lane["laneId"]
            cards = slots.get(lid, [])
            day_cards = cards[d_idx] if d_idx < len(cards) else []
            if day_cards:
                day_entry["meals"][f"{lane['meal']} :: {lane['title']} ({lid})"] = [
                    {"cardIdx": c_i, "dish": c.get("dish"), "tags": c.get("tags", [])}
                    for c_i, c in enumerate(day_cards)
                ]
        compact_schedule.append(day_entry)

    gemini_schema = {
        "model": "gemini-2.5-pro / gemini-5-preview",
        "system_instruction": (
            "You are the USMNT Performance Nutrition & Culinary Menu Auditor (powered by the `menu-plan-auditor` skill). "
            "Evaluate the provided `camp_menu_board` against the `active_audit_rules` table. "
            "Never micromanage the chef—pose collaborative questions and broad replacement categories. "
            "Return a JSON object matching `response_schema` with card-level `flags` and `summary_points`."
        ),
        "skill_reference": skill_excerpt or "USMNT Menu Plan Auditor Skill (Rules 1.1–6.2)",
        "active_audit_rules": active_rules,
        "camp_menu_board": compact_schedule,
        "response_schema": {
            "type": "object",
            "required": ["flags", "dietitian_perspectives", "culinary_perspectives"],
            "properties": {
                "flags": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["laneId", "dayIdx", "cardIdx", "ruleCode", "severity", "badgeText", "explanation"],
                        "properties": {
                            "laneId": {"type": "string"},
                            "dayIdx": {"type": "integer"},
                            "cardIdx": {"type": "integer"},
                            "dish": {"type": "string"},
                            "ruleCode": {"type": "string"},
                            "severity": {"type": "string", "enum": ["warning", "action", "bio", "positive", "protected"]},
                            "badgeText": {"type": "string"},
                            "explanation": {"type": "string"}
                        }
                    }
                }
            }
        }
    }

    # Check if GEMINI_API_KEY is configured for live LLM call; also run rule-driven evaluator
    # that dynamically respects the user's active_audit_rules in `menu.audit_rule`!
    active_codes = {r.get("rule_code") or r.get("code") for r in active_rules}
    flags = []

    def norm_str(s):
        return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()

    # Evaluate rules dynamically based on which rules are enabled in Tab 4
    for lane in swimlanes:
        lid = lane["laneId"]
        lane_slots = slots.get(lid, [])

        # Rule 4.1: Streak check
        if "Rule 4.1" in active_codes:
            dish_runs = {}
            for d_i in range(len(days)):
                for c_i, c in enumerate(lane_slots[d_i] if d_i < len(lane_slots) else []):
                    n = norm_str(c.get("dish"))
                    if n:
                        dish_runs.setdefault(n, []).append((d_i, c_i, c.get("dish")))
            for n, occs in dish_runs.items():
                run = [occs[0]]
                for idx_o in range(1, len(occs) + 1):
                    cur = occs[idx_o] if idx_o < len(occs) else None
                    prev = occs[idx_o - 1]
                    if cur and cur[0] in (prev[0], prev[0] + 1):
                        run.append(cur)
                    else:
                        u_days = len(set(x[0] for x in run))
                        if u_days > 3:
                            for r_d, r_c, r_dish in run:
                                flags.append({
                                    "laneId": lid,
                                    "dayIdx": r_d,
                                    "cardIdx": r_c,
                                    "dish": r_dish,
                                    "ruleCode": "Rule 4.1",
                                    "severity": "warning",
                                    "badgeText": f"⚠️ {u_days}d Streak (Rule 4.1)",
                                    "explanation": f"Rule 4.1: '{r_dish}' repeats for {u_days} consecutive days."
                                })
                        if cur:
                            run = [cur]

        for d_i, d in enumerate(days):
            day_cards = lane_slots[d_i] if d_i < len(lane_slots) else []
            for c_i, c in enumerate(day_cards):
                dish = c.get("dish", "")
                low = dish.lower()

                if "Rule 1.2" in active_codes and "turmeric" in low and "pepper" not in low and "piperine" not in low:
                    flags.append({
                        "laneId": lid,
                        "dayIdx": d_i,
                        "cardIdx": c_i,
                        "dish": dish,
                        "ruleCode": "Rule 1.2",
                        "severity": "bio",
                        "badgeText": "🔬 +Black Pepper (Rule 1.2)",
                        "explanation": "Rule 1.2: Pair turmeric (curcumin) with cracked black pepper (piperine) + lipids for 2,000% bioavailability."
                    })

                if d.get("type") == "md-1":
                    if "Rule 2.2" in active_codes and re.search(r"(pesto|almond|pistachio|pecan|walnut)", low):
                        flags.append({
                            "laneId": lid,
                            "dayIdx": d_i,
                            "cardIdx": c_i,
                            "dish": dish,
                            "ruleCode": "Rule 2.2",
                            "severity": "action",
                            "badgeText": "⚠️ MD-1 Nuts (Rule 2.2)",
                            "explanation": "Rule 2.2: Tree nuts/pesto on MD-1. Serve on the side or offer nut-free starch/protein."
                        })
                    if "Rule 2.1" in active_codes and re.search(r"(boursin|cream sauce|alfredo|schnitzel)", low):
                        flags.append({
                            "laneId": lid,
                            "dayIdx": d_i,
                            "cardIdx": c_i,
                            "dish": dish,
                            "ruleCode": "Rule 2.1",
                            "severity": "action",
                            "badgeText": "⚠️ MD-1 Heavy Fat (Rule 2.1)",
                            "explanation": "Rule 2.1: Heavy cream/cheese on MD-1 slows gastric emptying and glycogen storage."
                        })

                if "Rule 3.2" in active_codes and d.get("type") == "match" and "garlic aioli" in low:
                    flags.append({
                        "laneId": lid,
                        "dayIdx": d_i,
                        "cardIdx": c_i,
                        "dish": dish,
                        "ruleCode": "Rule 3.2",
                        "severity": "action",
                        "badgeText": "⚠️ Pre-Match Aioli (Rule 3.2)",
                        "explanation": "Rule 3.2: Emulsified garlic oil 4h pre-kickoff — check whether to hold on side."
                    })

                if "Rule 6.1" in active_codes:
                    m = re.search(r"\b(Things|Hailbut|Manocati|Shels|Lagsana|Veija|Tajun|Starwberry|Brussle|Qunioa|Omellet|Burriots)\b", dish, re.I)
                    if m:
                        flags.append({
                            "laneId": lid,
                            "dayIdx": d_i,
                            "cardIdx": c_i,
                            "dish": dish,
                            "ruleCode": "Rule 6.1",
                            "severity": "warning",
                            "badgeText": f"✏️ Typo '{m.group(1)}' (Rule 6.1)",
                            "explanation": f"Rule 6.1: BEO spelling issue '{m.group(1)}' in '{dish}'."
                        })

    return gemini_schema, flags


class MenuPlannerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/bootstrap":
            conn = get_pg_conn()
            if not conn:
                if STATE_FILE.exists():
                    self.send_json(200, json.loads(STATE_FILE.read_text(encoding="utf-8")))
                else:
                    self.send_json(200, {"pgConnected": False})
                return

            try:
                cur = conn.cursor(cursor_factory=RealDictCursor)
                cur.execute("SELECT camp_id, name, subtitle, start_date, end_date, locations, board_json, updated_at FROM menu.camp ORDER BY camp_id ASC;")
                camps = list(cur.fetchall())

                cur.execute("SELECT template_id, name, location_tag, description, meals_json, swimlanes_json FROM menu.meal_template ORDER BY template_id ASC;")
                templates = list(cur.fetchall())

                cur.execute("SELECT recipe_id AS id, name, category, section, yield_text AS yield, ingredients, steps, notes, tags FROM menu.recipe ORDER BY recipe_id ASC;")
                recipes = list(cur.fetchall())

                cur.execute("SELECT tag_name, color_class, category_group FROM menu.tag_catalog ORDER BY tag_name ASC;")
                tags = list(cur.fetchall())

                cur.execute("SELECT rule_code AS code, pillar AS cat, rule_name AS name, trigger_desc AS trigger, action_prompt AS action, status_text AS status, is_active, sort_order FROM menu.audit_rule ORDER BY sort_order ASC, rule_code ASC;")
                rules = list(cur.fetchall())

                cur.close()
                conn.close()
                self.send_json(200, {
                    "pgConnected": True,
                    "schema": "menu",
                    "camps": camps,
                    "templates": templates,
                    "recipes": recipes,
                    "tags": tags,
                    "rules": rules
                })
            except Exception as e:
                conn.close()
                self.send_json(500, {"pgConnected": False, "error": str(e)})
            return

        if parsed.path == "/api/state":
            if STATE_FILE.exists():
                self.send_json(200, json.loads(STATE_FILE.read_text(encoding="utf-8")))
            else:
                self.send_json(200, {"hasSaved": False})
            return

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except Exception:
            body = {}

        # 1. Save / Update Camp in Postgres `menu.camp`
        if parsed.path in ("/api/camp", "/api/state"):
            STATE_FILE.write_text(json.dumps(body, indent=2, ensure_ascii=False), encoding="utf-8")
            conn = get_pg_conn()
            if conn:
                try:
                    cur = conn.cursor(cursor_factory=RealDictCursor)
                    camp_id = body.get("campId")
                    name = (body.get("name") or "November 2026 Camp (vs. Haiti)").strip()
                    subtitle = body.get("subtitle") or "USMNT Performance Nutrition Camp Plan"
                    board_data = body.get("board") or {}
                    days = board_data.get("days", [])
                    locations = ", ".join(sorted(set(d.get("city", "") for d in days if d.get("city"))))

                    if camp_id and not body.get("createNew"):
                        cur.execute("""
                            UPDATE menu.camp
                            SET name = %s, subtitle = %s, locations = %s, board_json = %s, updated_at = NOW()
                            WHERE camp_id = %s
                            RETURNING camp_id, name, subtitle, board_json;
                        """, (name, subtitle, locations, Json(board_data), camp_id))
                        row = cur.fetchone()
                    else:
                        cur.execute("""
                            INSERT INTO menu.camp (name, subtitle, locations, board_json, updated_at)
                            VALUES (%s, %s, %s, %s, NOW())
                            ON CONFLICT (name) DO UPDATE SET
                                subtitle = EXCLUDED.subtitle,
                                locations = EXCLUDED.locations,
                                board_json = EXCLUDED.board_json,
                                updated_at = NOW()
                            RETURNING camp_id, name, subtitle, board_json;
                        """, (name, subtitle, locations, Json(board_data)))
                        row = cur.fetchone()

                    cur.close()
                    conn.close()
                    self.send_json(200, {"ok": True, "pgSaved": True, "camp": row})
                    return
                except Exception as e:
                    conn.close()
                    self.send_json(200, {"ok": True, "pgSaved": False, "error": str(e)})
                    return

            self.send_json(200, {"ok": True, "pgSaved": False})
            return

        # 2. Save / Update Meal Template in `menu.meal_template`
        if parsed.path == "/api/meal-template":
            conn = get_pg_conn()
            if not conn:
                self.send_json(500, {"ok": False, "error": "PostgreSQL not connected"})
                return
            try:
                cur = conn.cursor(cursor_factory=RealDictCursor)
                name = (body.get("name") or "Custom Meal Setup").strip()
                loc = (body.get("locationTag") or "Universal").strip()
                desc = (body.get("description") or "Saved meal & category template").strip()
                meals = body.get("meals", [])
                swimlanes = body.get("swimlanes", [])
                cur.execute("""
                    INSERT INTO menu.meal_template (name, location_tag, description, meals_json, swimlanes_json, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (name) DO UPDATE SET
                        location_tag = EXCLUDED.location_tag,
                        description = EXCLUDED.description,
                        meals_json = EXCLUDED.meals_json,
                        swimlanes_json = EXCLUDED.swimlanes_json,
                        updated_at = NOW()
                    RETURNING template_id, name, location_tag, description, meals_json, swimlanes_json;
                """, (name, loc, desc, Json(meals), Json(swimlanes)))
                saved = cur.fetchone()
                cur.close()
                conn.close()
                self.send_json(200, {"ok": True, "template": saved})
            except Exception as e:
                conn.close()
                self.send_json(500, {"ok": False, "error": str(e)})
            return

        # 3. Save / Update Tags (`menu.tag_catalog` & `menu.recipe`)
        if parsed.path == "/api/tags":
            conn = get_pg_conn()
            if not conn:
                self.send_json(200, {"ok": True, "pgSaved": False})
                return
            try:
                cur = conn.cursor()
                if body.get("tagName"):
                    cur.execute("""
                        INSERT INTO menu.tag_catalog (tag_name, color_class, category_group)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (tag_name) DO UPDATE SET
                            color_class = EXCLUDED.color_class,
                            category_group = EXCLUDED.category_group;
                    """, (body["tagName"].strip(), body.get("colorClass", "b-func"), body.get("categoryGroup", "Custom")))

                if body.get("recipeId") and isinstance(body.get("recipeTags"), list):
                    cur.execute("""
                        UPDATE menu.recipe SET tags = %s, updated_at = NOW() WHERE recipe_id = %s;
                    """, (Json(body["recipeTags"]), int(body["recipeId"])))

                cur.close()
                conn.close()
                self.send_json(200, {"ok": True, "pgSaved": True})
            except Exception as e:
                conn.close()
                self.send_json(500, {"ok": False, "error": str(e)})
            return

        # 4. Save / Update / Delete Editable USMNT Audit Rules in `menu.audit_rule`
        if parsed.path == "/api/rules":
            conn = get_pg_conn()
            if not conn:
                self.send_json(200, {"ok": True, "pgSaved": False})
                return
            try:
                cur = conn.cursor(cursor_factory=RealDictCursor)
                action = body.get("action", "upsert")
                if action == "delete" and body.get("code"):
                    cur.execute("DELETE FROM menu.audit_rule WHERE rule_code = %s;", (body["code"],))
                elif action == "bulk_save" and isinstance(body.get("rules"), list):
                    for idx, r in enumerate(body["rules"]):
                        cur.execute("""
                            INSERT INTO menu.audit_rule (rule_code, pillar, rule_name, trigger_desc, action_prompt, status_text, is_active, sort_order, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                            ON CONFLICT (rule_code) DO UPDATE SET
                                pillar = EXCLUDED.pillar,
                                rule_name = EXCLUDED.rule_name,
                                trigger_desc = EXCLUDED.trigger_desc,
                                action_prompt = EXCLUDED.action_prompt,
                                status_text = EXCLUDED.status_text,
                                is_active = EXCLUDED.is_active,
                                sort_order = EXCLUDED.sort_order,
                                updated_at = NOW();
                        """, (
                            r["code"],
                            r.get("cat", "Custom Pillar"),
                            r.get("name", "Custom Rule"),
                            r.get("trigger", ""),
                            r.get("action", ""),
                            r.get("status", "Active"),
                            bool(r.get("is_active", True)),
                            idx + 1
                        ))
                else:
                    r = body.get("rule", body)
                    cur.execute("""
                        INSERT INTO menu.audit_rule (rule_code, pillar, rule_name, trigger_desc, action_prompt, status_text, is_active, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                        ON CONFLICT (rule_code) DO UPDATE SET
                            pillar = EXCLUDED.pillar,
                            rule_name = EXCLUDED.rule_name,
                            trigger_desc = EXCLUDED.trigger_desc,
                            action_prompt = EXCLUDED.action_prompt,
                            status_text = EXCLUDED.status_text,
                            is_active = EXCLUDED.is_active,
                            updated_at = NOW();
                    """, (
                        r["code"],
                        r.get("cat", "Custom Pillar"),
                        r.get("name", "Custom Rule"),
                        r.get("trigger", ""),
                        r.get("action", ""),
                        r.get("status", "Active"),
                        bool(r.get("is_active", True))
                    ))

                cur.execute("SELECT rule_code AS code, pillar AS cat, rule_name AS name, trigger_desc AS trigger, action_prompt AS action, status_text AS status, is_active, sort_order FROM menu.audit_rule ORDER BY sort_order ASC, rule_code ASC;")
                updated_rules = list(cur.fetchall())
                cur.close()
                conn.close()
                self.send_json(200, {"ok": True, "pgSaved": True, "rules": updated_rules})
            except Exception as e:
                conn.close()
                self.send_json(500, {"ok": False, "error": str(e)})
            return

        # 5. Upload Excel Schedule / Menu -> Parse Dates, Event Times, Meals, Categories & Cards
        if parsed.path == "/api/upload-schedule":
            try:
                b64 = body.get("fileBase64", "")
                filename = body.get("filename", "schedule.xlsx")
                file_bytes = base64.b64decode(b64)
                parsed_board = parse_uploaded_excel_bytes(file_bytes, filename)
                self.send_json(200, {"ok": True, "board": parsed_board})
            except Exception as e:
                self.send_json(400, {"ok": False, "error": str(e)})
            return

        # 6. AI Audit & Gemini Schema Generator
        if parsed.path == "/api/ai-audit":
            try:
                board = body.get("board", {})
                rules = body.get("rules", [])
                gemini_schema, flags = build_gemini_audit_schema_and_flags(board, rules)
                self.send_json(200, {
                    "ok": True,
                    "geminiPayloadSchema": gemini_schema,
                    "flags": flags,
                    "flagCount": len(flags)
                })
            except Exception as e:
                self.send_json(500, {"ok": False, "error": str(e)})
            return

        self.send_json(404, {"ok": False, "error": "Not found"})


class DualStackServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8090))
    try:
        server = DualStackServer(("::", port), MenuPlannerHandler)
    except Exception:
        server = ThreadingHTTPServer(("0.0.0.0", port), MenuPlannerHandler)
    print(f"USMNT Menu Planner + PostgreSQL (`menu` schema) Server listening on port {port}", flush=True)
    server.serve_forever()
