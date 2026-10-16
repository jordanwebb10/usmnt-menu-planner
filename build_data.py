import csv
import json
import re
from pathlib import Path

CSV_PATH = Path(r"C:\Users\jwebb\.gemini\antigravity\brain\99282a37-ca14-4aac-84c1-b320e8d4b528\scratch\nov_2026_menu.csv")
RECIPE_MD_PATH = Path(r"C:\Users\jwebb\.gemini\antigravity\brain\99282a37-ca14-4aac-84c1-b320e8d4b528\november_2026_master_recipe_book.md")
OUT_JS_PATH = Path(r"c:\Users\jwebb\Documents\agy projects\mnt-executive-assistant\menu-explorer\data.js")

with open(CSV_PATH, "r", encoding="utf-8", errors="replace") as f:
    raw_rows = list(csv.reader(f))

def get_cell(r, c):
    if r < 0 or r >= len(raw_rows):
        return ""
    row = raw_rows[r]
    if c < 0 or c >= len(row):
        return ""
    val = row[c].strip()
    val = re.sub(r"\s+", " ", val)
    return val

def get_day_cell(r, day_idx, sub=0):
    """Each day_idx (0..11) occupies columns (2 + day_idx*2) and (3 + day_idx*2)."""
    col = 2 + day_idx * 2 + sub
    val = get_cell(r, col)
    if not val and sub == 0:
        # Fallback if value was placed in the second column of a merged pair
        val2 = get_cell(r, col + 1)
        if val2:
            return val2
    return val

DAYS_META = [
    {"dayIdx": 0, "id": "2026-11-07", "short": "Sat Nov 7", "fullDate": "Saturday, November 7th 2026", "md": "MD-7", "city": "Atlanta (Trilith)", "hotel": "Trilith Guesthouse", "type": "arrival", "gameHeader": ""},
    {"dayIdx": 1, "id": "2026-11-08", "short": "Sun Nov 8", "fullDate": "Sunday, November 8th 2026", "md": "MD-6", "city": "Atlanta (Trilith)", "hotel": "Trilith Guesthouse", "type": "arrival", "gameHeader": ""},
    {"dayIdx": 2, "id": "2026-11-09", "short": "Mon Nov 9", "fullDate": "Monday, November 9th 2026", "md": "MD-5", "city": "Atlanta (Trilith / NTC)", "hotel": "Trilith / NTC", "type": "training", "gameHeader": ""},
    {"dayIdx": 3, "id": "2026-11-10", "short": "Tue Nov 10", "fullDate": "Tuesday, November 10th 2026", "md": "MD-4", "city": "Atlanta (Trilith / NTC)", "hotel": "Trilith / NTC", "type": "training", "gameHeader": ""},
    {"dayIdx": 4, "id": "2026-11-11", "short": "Wed Nov 11", "fullDate": "Wednesday, November 11th 2026", "md": "MD-3", "city": "Atlanta (Trilith / NTC)", "hotel": "Trilith / NTC", "type": "training", "gameHeader": ""},
    {"dayIdx": 5, "id": "2026-11-12", "short": "Thu Nov 12", "fullDate": "Thursday, November 12th 2026", "md": "MD-2", "city": "Atlanta / Fly Kingston", "hotel": "Trilith / AC Marriott Kingston", "type": "travel", "gameHeader": ""},
    {"dayIdx": 6, "id": "2026-11-13", "short": "Fri Nov 13", "fullDate": "Friday, November 13th 2026", "md": "MD-1", "city": "Kingston, Jamaica", "hotel": "AC Hotel Kingston", "type": "md-1", "gameHeader": ""},
    {"dayIdx": 7, "id": "2026-11-14", "short": "Sat Nov 14", "fullDate": "Saturday, November 14th 2026", "md": "MD (vs Haiti)", "city": "Kingston, Jamaica", "hotel": "AC Hotel Kingston / Charter", "type": "match", "gameHeader": "Game Day: Haiti"},
    {"dayIdx": 8, "id": "2026-11-15", "short": "Sun Nov 15", "fullDate": "Sunday, November 15th 2026", "md": "MD+1 / MD-2", "city": "Cincinnati, OH (1am Arr)", "hotel": "Renaissance Cincinnati", "type": "regen", "gameHeader": ""},
    {"dayIdx": 9, "id": "2026-11-16", "short": "Mon Nov 16", "fullDate": "Monday, November 16th 2026", "md": "MD-1", "city": "Cincinnati, OH", "hotel": "Renaissance Cincinnati", "type": "md-1", "gameHeader": ""},
    {"dayIdx": 10, "id": "2026-11-17", "short": "Tue Nov 17", "fullDate": "Tuesday, November 17th 2026", "md": "MD (vs Haiti)", "city": "Cincinnati, OH", "hotel": "Renaissance / TQL Stadium", "type": "match", "gameHeader": "Game Day: Haiti"},
    {"dayIdx": 11, "id": "2026-11-18", "short": "Wed Nov 18", "fullDate": "Wednesday, November 18th 2026", "md": "MD+1 (Depart)", "city": "Cincinnati, OH", "hotel": "Departure", "type": "departure", "gameHeader": ""},
]

# Define exact Excel Sheet Row Definitions (0-indexed row in CSV)
EXCEL_ROWS_SPEC = [
    # BREAKFAST
    {"rowId": "bf_loc", "csvRow": 1, "section": "Breakfast", "category": "Location", "label": "Breakfast Location", "isMeta": True},
    {"rowId": "bf_scramble", "csvRow": 3, "section": "Breakfast", "category": "Scramble", "label": "Egg Scramble"},
    {"rowId": "bf_spec_egg", "csvRow": 5, "section": "Breakfast", "category": "Specialty Egg", "label": "Specialty Egg"},
    {"rowId": "bf_vegan", "csvRow": 7, "section": "Breakfast", "category": "Vegan", "label": "Vegan Entree"},
    {"rowId": "bf_side_meat", "csvRow": 9, "section": "Breakfast", "category": "Sides", "label": "Side Protein (Bacon/Sausage)"},
    {"rowId": "bf_side_potato", "csvRow": 11, "section": "Breakfast", "category": "Sides", "label": "Potato / Hash Side"},
    {"rowId": "bf_special", "csvRow": 13, "section": "Breakfast", "category": "Special Item", "label": "Griddle Special (Waffles/Pancakes/FT)"},
    {"rowId": "bf_oat_whole", "csvRow": 16, "section": "Breakfast", "category": "Oatmeal", "label": "Oatmeal (Dairy)"},
    {"rowId": "bf_oat_almond", "csvRow": 17, "section": "Breakfast", "category": "Oatmeal", "label": "Oatmeal (Plant-Based)"},
    {"rowId": "bf_station", "csvRow": 18, "section": "Breakfast", "category": "Station", "label": "Action Station"},
    {"rowId": "bf_eggs", "csvRow": 20, "section": "Breakfast", "category": "Eggs", "label": "Made-to-Order Eggs"},
    {"rowId": "bf_oats_1", "csvRow": 22, "subCol": 0, "section": "Breakfast", "category": "Oats/Chia/Bread", "label": "Oats / Chia / Bread (Option A)"},
    {"rowId": "bf_oats_2", "csvRow": 22, "subCol": 1, "section": "Breakfast", "category": "Oats/Chia/Bread", "label": "Oats / Chia / Bread (Option B)"},

    # LUNCH
    {"rowId": "lu_loc", "csvRow": 25, "section": "Lunch", "category": "Location", "label": "Lunch Location", "isMeta": True},
    {"rowId": "lu_theme", "csvRow": 26, "section": "Lunch", "category": "Theme", "label": "Daily Lunch Theme", "isTheme": True},
    {"rowId": "lu_prot_1", "csvRow": 27, "section": "Lunch", "category": "Protein", "label": "Protein 1 (Poultry / Main)"},
    {"rowId": "lu_prot_2", "csvRow": 29, "section": "Lunch", "category": "Protein", "label": "Protein 2 (Fish / Pork / Red Meat)"},
    {"rowId": "lu_prot_3", "csvRow": 31, "section": "Lunch", "category": "Protein", "label": "Protein 3 (Seafood / Specialty)"},
    {"rowId": "lu_vegan", "csvRow": 33, "section": "Lunch", "category": "Vegan", "label": "Vegan Protein"},
    {"rowId": "lu_veg_1", "csvRow": 34, "section": "Lunch", "category": "Vegetables", "label": "Hot Vegetable 1"},
    {"rowId": "lu_veg_2", "csvRow": 35, "section": "Lunch", "category": "Vegetables", "label": "Hot Vegetable 2"},
    {"rowId": "lu_starch_1", "csvRow": 36, "section": "Lunch", "category": "Starches", "label": "Starch / Grain 1"},
    {"rowId": "lu_starch_2", "csvRow": 37, "section": "Lunch", "category": "Starches", "label": "Starch / Potato 2"},
    {"rowId": "lu_fruit", "csvRow": [38, 39, 40], "section": "Lunch", "category": "Fruits", "label": "Fresh Fruit Line"},
    {"rowId": "lu_salad", "csvRow": 41, "section": "Lunch", "category": "Salad", "label": "Composed Salad"},
    {"rowId": "lu_station", "csvRow": 43, "section": "Lunch", "category": "Station", "label": "Action Station"},
    {"rowId": "lu_soup", "csvRow": 44, "section": "Lunch", "category": "Soup", "label": "Daily Soup"},
    {"rowId": "lu_special", "csvRow": 46, "section": "Lunch", "category": "Special", "label": "Chef Special"},
    {"rowId": "lu_salad_bar", "csvRow": 48, "section": "Lunch", "category": "Salad Bar", "label": "Salad Bar"},

    # DINNER / PRE-MATCH MEAL
    {"rowId": "dn_loc", "csvRow": 50, "section": "Dinner", "category": "Location", "label": "Dinner Location", "isMeta": True},
    {"rowId": "dn_theme", "csvRow": 51, "section": "Dinner", "category": "Theme", "label": "Dinner / Pre-Match Theme", "isTheme": True},
    {"rowId": "dn_prot_1", "csvRow": 52, "section": "Dinner", "category": "Protein", "label": "Protein 1 (Poultry / Main)"},
    {"rowId": "dn_prot_2", "csvRow": 54, "section": "Dinner", "category": "Protein", "label": "Protein 2 (Fish / Seafood)"},
    {"rowId": "dn_prot_3", "csvRow": 56, "section": "Dinner", "category": "Protein", "label": "Protein 3 (Meat / Specialty)"},
    {"rowId": "dn_vegan", "csvRow": 58, "section": "Dinner", "category": "Vegan", "label": "Vegan Protein"},
    {"rowId": "dn_veg_1", "csvRow": 59, "section": "Dinner", "category": "Vegetables", "label": "Hot Vegetable 1"},
    {"rowId": "dn_veg_2", "csvRow": 60, "section": "Dinner", "category": "Vegetables", "label": "Hot Vegetable 2"},
    {"rowId": "dn_starch_1", "csvRow": 61, "section": "Dinner", "category": "Starches", "label": "Starch / Grain 1"},
    {"rowId": "dn_starch_2", "csvRow": 62, "section": "Dinner", "category": "Starches", "label": "Starch / Potato 2"},
    {"rowId": "dn_fruit", "csvRow": [63, 64, 65], "section": "Dinner", "category": "Fruit", "label": "Fresh Fruit Line"},
    {"rowId": "dn_salad", "csvRow": 66, "section": "Dinner", "category": "Salad", "label": "Composed Salad"},
    {"rowId": "dn_station", "csvRow": 68, "section": "Dinner", "category": "Station", "label": "Action Station"},
    {"rowId": "dn_soup", "csvRow": 69, "section": "Dinner", "category": "Soup", "label": "Daily Soup"},
    {"rowId": "dn_special", "csvRow": 71, "section": "Dinner", "category": "Special", "label": "Chef Special"},
    {"rowId": "dn_salad_bar", "csvRow": 73, "section": "Dinner", "category": "Salad Bar", "label": "Salad Bar"},
    {"rowId": "dn_dessert", "csvRow": 75, "section": "Dinner", "category": "Dessert", "label": "Evening Dessert"},
    {"rowId": "dn_recovery", "csvRow": 78, "section": "Dinner", "category": "Recovery Shot", "label": "Recovery Shot / Drink"},

    # POST-MATCH MEAL
    {"rowId": "pm_prot_1", "csvRow": 80, "section": "Post-Match", "category": "Protein", "label": "Post-Match Main 1"},
    {"rowId": "pm_prot_2", "csvRow": 82, "section": "Post-Match", "category": "Protein", "label": "Post-Match Main 2"},
    {"rowId": "pm_prot_3", "csvRow": 84, "section": "Post-Match", "category": "Protein", "label": "Post-Match Main 3"},
    {"rowId": "pm_station", "csvRow": 87, "section": "Post-Match", "category": "Station", "label": "Post-Match Pizza / Side 1"},
    {"rowId": "pm_veg_1", "csvRow": 88, "section": "Post-Match", "category": "Vegetables", "label": "Post-Match Veg 1"},
    {"rowId": "pm_veg_2", "csvRow": 89, "section": "Post-Match", "category": "Vegetables", "label": "Post-Match Veg 2 / Starch"},
    {"rowId": "pm_starch_1", "csvRow": 90, "section": "Post-Match", "category": "Starches", "label": "Post-Match Starch 1"},
    {"rowId": "pm_starch_2", "csvRow": 91, "section": "Post-Match", "category": "Starches", "label": "Post-Match Starch 2"},
    {"rowId": "pm_fruit", "csvRow": [92, 93, 94], "section": "Post-Match", "category": "Fruit", "label": "Post-Match Fruit Line"},
    {"rowId": "pm_salad", "csvRow": 95, "section": "Post-Match", "category": "Salad", "label": "Post-Match Salad"},
    {"rowId": "pm_salad_bar", "csvRow": 102, "section": "Post-Match", "category": "Salad Bar", "label": "Post-Match Salad Bar"},
    {"rowId": "pm_dessert", "csvRow": 104, "section": "Post-Match", "category": "Dessert", "label": "Post-Match Acai / Dessert Station"},
]

matrix_rows = []
for spec in EXCEL_ROWS_SPEC:
    cells = []
    for d in range(12):
        csv_row = spec["csvRow"]
        if isinstance(csv_row, list):
            parts = []
            for r_idx in csv_row:
                v = get_day_cell(r_idx, d, 0)
                if v:
                    parts.append(v.strip().rstrip(","))
            val = ", ".join(parts) if parts else ""
        elif "subCol" in spec:
            # Specific subcolumn (0 or 1)
            col = 2 + d * 2 + spec["subCol"]
            val = get_cell(csv_row, col)
        else:
            val = get_day_cell(csv_row, d, 0)
            # Special case for row 78 (Recovery Shot / Post-Match header)
            if spec["rowId"] == "dn_recovery" and val == "Post-Match Meal":
                val = "N/A (Managed by Performance Nutrition)"
        cells.append(val)
    matrix_rows.append({
        "rowId": spec["rowId"],
        "section": spec["section"],
        "category": spec["category"],
        "label": spec["label"],
        "isMeta": spec.get("isMeta", False),
        "isTheme": spec.get("isTheme", False),
        "cells": cells
    })

# Parse Master Recipe Book markdown
md_text = RECIPE_MD_PATH.read_text(encoding="utf-8")

section_pattern = re.compile(r"^## Section (\d+):\s*([^\n]+)", re.MULTILINE)
subsec_pattern = re.compile(r"^### ([0-9A-Z]+)\.\s*([^\n]+)", re.MULTILINE)
header_pattern = re.compile(r"^#### (\d+)\.\s*([^\n]+)", re.MULTILINE)

sec_matches = list(section_pattern.finditer(md_text))
subsec_matches = list(subsec_pattern.finditer(md_text))
header_matches = list(header_pattern.finditer(md_text))

def get_section_for_pos(pos):
    current = "1. Breakfast Recipes"
    for m in sec_matches:
        if m.start() <= pos:
            clean_sec = re.sub(r"\s*\(`[^`]+`\)", "", m.group(2).strip())
            current = f"{m.group(1)}. {clean_sec}"
        else:
            break
    return current

def get_subsec_for_pos(pos):
    current = "General"
    for m in subsec_matches:
        if m.start() <= pos:
            clean_sub = re.sub(r"\s*\(`[^`]+`\)", "", m.group(2).strip())
            current = clean_sub
        else:
            break
    return current

def clean_latex(s):
    s = re.sub(r"\$([0-9./–-]+)\\text\{\s*([^}]+)\}\$", r"\1 \2", s)
    s = re.sub(r"\$([0-9./–-]+)\^\\circ\\text\{([FC])\}\$", r"\1°\2", s)
    s = re.sub(r"\$([0-9,]+)\\%\$", r"\1%", s)
    s = s.replace("$", "")
    return s.strip()

recipes = []
for idx, m in enumerate(header_matches):
    r_num = int(m.group(1))
    raw_title = m.group(2).strip()
    dates_match = re.search(r"\*\(([^)]+)\)\*$", raw_title)
    r_dates = dates_match.group(1).strip() if dates_match else ""
    r_name = re.sub(r"\s*\*\([^)]+\)\*$", "", raw_title).strip()

    block_start = m.end()
    block_end = header_matches[idx + 1].start() if idx + 1 < len(header_matches) else len(md_text)
    block_text = md_text[block_start:block_end].strip()

    # Stop at --- or ### or ## if present inside block
    block_lines = []
    for line in block_text.splitlines():
        ls = line.strip()
        if ls.startswith("##") or ls.startswith("---"):
            break
        if ls:
            block_lines.append(ls)

    ing_line = ""
    method_line = ""
    extra_notes = []
    for line in block_lines:
        cl = clean_latex(re.sub(r"^\*\s*", "", line))
        if re.match(r"^\*\*(Ingredients|Mise en Place|Specification|Standard Offering|Assortment|Components)[^:]*:\*\*", cl, re.I):
            ing_line = re.sub(r"^\*\*[^:]+:\*\*\s*", "", cl).strip()
        elif re.match(r"^\*\*(Method|Preparation|Execution)[^:]*:\*\*", cl, re.I):
            method_line = re.sub(r"^\*\*[^:]+:\*\*\s*", "", cl).strip()
        else:
            extra_notes.append(re.sub(r"\*\*([^*]+)\*\*", r"\1", cl))

    if not ing_line and block_lines:
        ing_line = clean_latex(re.sub(r"^\*\s*\*\*[^:]+:\*\*\s*", "", block_lines[0]))

    ings = [i.strip().rstrip(".") for i in re.split(r"[;,]+\s*(?![^()]*\))", ing_line) if i.strip()]
    if not method_line:
        method_line = "Assemble and stage per USMNT Hotel BEO cold/hot holding specifications; keep dressings, sauces, and tree nuts/seeds on the side."
    steps = [s.strip() + ("." if not s.strip().endswith(".") else "") for s in re.split(r"\.\s+(?=[A-Z])", method_line) if s.strip()]

    sec_title = get_section_for_pos(m.start())
    r_cat = get_subsec_for_pos(m.start())
    if r_dates:
        r_cat = f"{r_cat} • {r_dates}"

    nl = (r_name + " " + method_line + " " + ing_line + " " + r_dates).lower()
    tags = []
    if any(k in nl for k in ["turmeric", "piperine", "tart cherry", "beet", "ginger", "omega-3", "salmon", "cod", "halibut", "ahi", "chia", "quinoa", "kale", "probiotic", "acai", "açaí", "collagen"]):
        tags.append("Functional Food")
    if "md-1" in nl or "nov 13" in nl or "nov 16" in nl:
        tags.append("MD-1 Safe")
    if "match" in nl or "nov 14" in nl or "nov 17" in nl or "glycogen" in nl:
        tags.append("Match Day")
    if "vegan" in r_cat.lower() or "tofu" in r_name.lower() or "tempeh" in r_name.lower() or "plant-based" in nl:
        tags.append("100% Plant-Based")
    if "fodmap" in nl or "low-residue" in nl:
        tags.append("Low-FODMAP")
    if "athlete request" in nl or "banana on the side" in r_name.lower():
        tags.append("Athlete Request")

    notes = " ".join(extra_notes) if extra_notes else "Standard USMNT Hotel BEO Specification (100% EVOO/Avocado Oil, sauces & nuts on side)."
    if "piperine" in nl or "turmeric" in nl:
        notes = "Mandatory: Pair curcumin with freshly cracked black pepper (piperine) + whole-egg lipids for 2,000% bioavailability (Shoba et al., 1998)."
    elif "banana on the side" in r_name.lower():
        notes = "Protected USMNT Match-Day Athlete Request (Breakfast, Lunch, and Pre-Match)."

    recipes.append({
        "id": r_num,
        "name": r_name,
        "category": r_cat,
        "section": sec_title,
        "yield": "10–12 Athlete Portions (1 Hotel Pan)",
        "ingredients": ings,
        "steps": steps,
        "notes": notes,
        "tags": tags
    })

# Add Recommended Replacement Cards so planners can drag & drop recommended swaps directly into the sheet!
RECOMMENDED_SWAPS = [
    {
        "id": 901,
        "name": "Herb-Roasted Chicken Sausage Links",
        "category": "Breakfast — Side Protein (Swap Rec)",
        "section": "1. Breakfast — Eggs, Scrambles & Specialty Dishes",
        "yield": "10 Athlete Portions (~1.5 kg)",
        "ingredients": ["1.5 kg lean herb chicken sausage links (casing-on, nitrate-free)", "15 mL extra-virgin olive oil", "10 g fresh flat-leaf parsley, finely chopped"],
        "steps": ["Sear links on a 190°C flat-top or roast at 200°C for 12–14 minutes until internal temperature reaches 74°C.", "Drain on perforated hotel pans and hold dry at 65°C."],
        "notes": "Recommended swap to break the 10-day Turkey Bacon streak, especially on MD+1 recovery mornings alongside fresh fruit.",
        "tags": ["Swap Recommendation", "MD-1 Safe"]
    },
    {
        "id": 902,
        "name": "Jamba Juice Style Recovery Smoothie Action Station",
        "category": "Lunch / Post-Match — Action Station (Swap Rec)",
        "section": "3. Soups, Broths & Action Stations",
        "yield": "10 Athlete Portions (~4.5 L)",
        "ingredients": ["1.5 kg frozen mango, pineapple, strawberry, and wild blueberry packs", "600 mL tart cherry juice concentrate & coconut water base", "400 g NSF-certified whey isolate & plant protein isolate", "300 g Greek yogurt, spinach, chia seeds, and ginger boosters"],
        "steps": ["Set up high-powered Vitamix station with labeled fruit bases, liquid electrolytes, and NSF-certified protein/collagen boosters.", "Blend to order for 45 seconds during MD+1 Light Lunch or Kingston Post-Match recovery."],
        "notes": "Interactive functional recovery station recommended for Kingston Post-Match or Cincinnati MD+1 Light Post-Regen Lunch.",
        "tags": ["Swap Recommendation", "Functional Food", "Match Day"]
    },
    {
        "id": 903,
        "name": "Grilled Halloumi & Roasted Chickpea Mediterranean Bowl",
        "category": "Lunch / Dinner — Vegetarian Protein (Swap Rec)",
        "section": "6. Plant-Based (Vegan) Entrees",
        "yield": "10 Athlete Portions (~2.4 kg)",
        "ingredients": ["1.0 kg Cypriot halloumi cheese or firm lupini/fava bean cakes, sliced", "800 g roasted garbanzo beans with oregano and lemon zest", "500 g baby spinach and roasted red peppers", "30 mL extra-virgin olive oil"],
        "steps": ["Sear halloumi/bean cakes on dry flattop 2 min per side until golden.", "Fold warm spiced chickpeas over wilted spinach and serve immediately."],
        "notes": "High-protein soy-free vegetarian/plant rotation to reduce the 22-instance tofu/tempeh fatigue across camp.",
        "tags": ["Swap Recommendation", "Functional Food"]
    },
    {
        "id": 904,
        "name": "Steamed Jasmine White Rice",
        "category": "Dinner — MD-1 Simple Starch (Swap Rec)",
        "section": "7. Starches, Grains, Risottos & Pastas",
        "yield": "10 Athlete Portions (~2.2 kg cooked)",
        "ingredients": ["900 g AAA jasmine white rice, rinsed 3x until water runs clear", "1.35 L filtered water", "5 g fine sea salt"],
        "steps": ["Steam in ration steamer at 100°C for 18 minutes; rest covered 10 minutes.", "Fluff with culinary fork and hold moist at 65°C."],
        "notes": "Low-residue (<1.5 g fiber), zero-tree-nut carbohydrate anchor recommended for MD-1 Dinners (Fri Nov 13 & Mon Nov 16) in place of nut-heavy Pesto Risotto or Lemon Pistachio Rice.",
        "tags": ["Swap Recommendation", "MD-1 Safe", "Match Day", "Low-FODMAP"]
    },
    {
        "id": 905,
        "name": "Baked Sweet Potato Wedges with Sea Salt",
        "category": "Post-Match — Recovery Starch (Swap Rec)",
        "section": "7. Starches, Grains, Risottos & Pastas",
        "yield": "10 Athlete Portions (~2.2 kg)",
        "ingredients": ["2.4 kg orange sweet potatoes, cut into 2 cm wedges", "35 mL avocado oil", "8 g flaky sea salt and 3 g Ceylon cinnamon"],
        "steps": ["Roast on parchment-lined sheet pans at 215°C convection for 22–25 minutes until tender and caramelized.", "Serve warm in Post-Match recovery locker room / hotel buffet."],
        "notes": "Micronutrient-dense complex carbohydrate + beta-carotene recovery swap for Kingston Post-Match Meal.",
        "tags": ["Swap Recommendation", "Functional Food", "Match Day"]
    },
    {
        "id": 906,
        "name": "Whole Unpeeled Fruit Bowl (Bananas, Clementines, Apples, Kiwi)",
        "category": "Breakfast — Whole Fruit Line (Swap Rec)",
        "section": "8. Salads, Cold Bar, Fruit & Desserts",
        "yield": "10 Athlete Portions (~2.5 kg)",
        "ingredients": ["10 whole cavendish bananas (unpeeled)", "15 whole clementines/tangerines (unpeeled)", "10 whole Honeycrisp apples, washed", "10 whole Sungold yellow kiwis (unpeeled)"],
        "steps": ["Display whole, unpeeled fruit in chilled stainless bowls on the Breakfast buffet line.", "Maintain strict CONCACAF travel hygiene (intact peel safeguard in Kingston)."],
        "notes": "Solves Rule 1.3 (Missing Breakfast Fruit Row + Kingston CONCACAF Travel Food Safety).",
        "tags": ["Swap Recommendation", "Functional Food", "MD-1 Safe"]
    }
]

recipes.extend(RECOMMENDED_SWAPS)

AUDIT_DATA = {
    "dietitian": [
        {"id": "D1", "title": "1. Turmeric Bioavailability (Nov 14 & 17 Match-Day Scrambles)", "rule": "Rule 1.2", "days": ["2026-11-14", "2026-11-17"], "targetCells": [{"rowId": "bf_scramble", "dayIdx": 7}, {"rowId": "bf_scramble", "dayIdx": 10}], "finding": "Scrambled Eggs with Turmeric appear on both Match Days (Nov 14 & Nov 17).", "detail": "Plain curcumin has near-zero gut absorption without piperine (black pepper) and lipids. Shoba et al. (1998, Planta Medica) & Hewlings & Kalman (2017, Foods) showed 20 mg piperine + curcumin increases systemic bioavailability by 2,000% (20x).", "question": "Ensure freshly cracked black pepper and olive oil/butter are whisked directly into the scramble base."},
        {"id": "D2", "title": "2. Missing Breakfast Fruit Line & Kingston Food-Safety Safeguard", "rule": "Rule 1.3", "days": ["2026-11-07", "2026-11-13", "2026-11-14"], "targetCells": [{"rowId": "lu_fruit", "dayIdx": 6}, {"rowId": "lu_fruit", "dayIdx": 7}], "finding": "The spreadsheet includes a Fruit line at Lunch and Dinner, but there is no Fruit row listed under Breakfast.", "detail": "For Kingston (Nov 12–14), prioritize whole, unpeeled fruits (bananas, tangerines/clementines, whole apples) alongside berries as a food-safety safeguard.", "question": "Confirm daily breakfast fruit availability and intact-skin fruit protocols in Kingston."},
        {"id": "D3", "title": "3. Daily Ingredient & Nut Butter Quality Checks", "rule": "Rule 3.4", "days": ["2026-11-08", "2026-11-10", "2026-11-13", "2026-11-15", "2026-11-17"], "targetCells": [{"rowId": "bf_oats_1", "dayIdx": 3}, {"rowId": "bf_oats_1", "dayIdx": 6}, {"rowId": "bf_oats_1", "dayIdx": 8}], "finding": "Nut butters and pantry staples appear daily across overnight oats, toast stations, and smoothies.", "detail": "Avoid hydrogenated palm/rapeseed oils and added icing sugars in hotel catering tubs.", "question": "Verify ingredient labels daily upon hotel receiving (100% natural nut butters, extra-virgin olive oil, pure maple/honey) to avoid hydrogenated oils and added sugars."},
        {"id": "D4", "title": "4. MD-1 Dinner Starch Check (Nov 13 & Nov 16)", "rule": "Rule 2.1", "days": ["2026-11-13", "2026-11-16"], "targetCells": [{"rowId": "dn_starch_1", "dayIdx": 6}, {"rowId": "dn_starch_1", "dayIdx": 9}], "finding": "Fri Nov 13 (MD-1 Kingston) pairs Pesto Risotto + Roasted Fingerlings; Mon Nov 16 (MD-1 Cincinnati) pairs Lemon Pistachio Rice + Boursin Mashed Potatoes.", "detail": "High-fat dairy/cheese and tree nuts on MD-1 can slow gastric emptying and shortchange clean muscle glycogen supercompensation.", "question": "Consider swapping one heavy/nut-based starch on each MD-1 dinner for a simple, clean carbohydrate (e.g., plain white rice, baked potato, or sweet potato)."},
        {"id": "D5", "title": "5. MD-1 Tree Nut & Seed Exposure (Nov 13 & Nov 16)", "rule": "Rule 2.2", "days": ["2026-11-13", "2026-11-16"], "targetCells": [{"rowId": "dn_starch_1", "dayIdx": 6}, {"rowId": "dn_salad", "dayIdx": 9}, {"rowId": "dn_prot_1", "dayIdx": 9}], "finding": "Tree nuts appear across multiple MD-1 dishes (Pesto Risotto on Nov 13; Almond Romesco, Pecan Crusted Cod, Pistachio Rice, and Pecan Salad on Nov 16).", "detail": "Repeated nut allergens on MD-1 increase cross-contact risk and dietary fiber/fat load.", "question": "Review with the chef/dietitian to keep sauces on the side or offer nut-free starch/protein alternatives on MD-1."},
        {"id": "D6", "title": "6. MD-1 Raw Cruciferous / Slaw Check (Nov 10 & Nov 13)", "rule": "Rule 2.3", "days": ["2026-11-10", "2026-11-13"], "targetCells": [{"rowId": "dn_special", "dayIdx": 3}, {"rowId": "lu_veg_2", "dayIdx": 6}], "finding": "Brussels sprouts with turkey bacon (Nov 13 MD-1 lunch) and raw cabbage slaw (Nov 10 dinner) are high in raffinose/insoluble fiber.", "detail": "Cruciferous vegetables within 24–36h of kickoff ferment in the colon and can cause GI distension.", "question": "Consider swapping for lower-fiber, easily digested cooked vegetables ahead of Match Day."},
        {"id": "D7", "title": "7. Pre-Match Garlic Aioli Question (Nov 14 & Nov 17)", "rule": "Rule 3.2", "days": ["2026-11-14", "2026-11-17"], "targetCells": [{"rowId": "dn_prot_3", "dayIdx": 7}, {"rowId": "dn_prot_3", "dayIdx": 10}], "finding": "Chicken Cutlet Sandwich with Roasted Red Peppers and Garlic Aioli is listed on both Pre-Match Meals (Nov 14 & Nov 17).", "detail": "Emulsified raw garlic oil (fructans + high lipid) 3–4 hours pre-kickoff can trigger reflux during warmups.", "question": "Pose to the team: Are we comfortable with Garlic Aioli at Pre-Match, or should it be served strictly on the side / swapped for a lighter spread?"},
        {"id": "D8", "title": "8. Cincinnati MD+1 Schedule & Meal Cadence (Sun Nov 15)", "rule": "Rule 3.1", "days": ["2026-11-15"], "targetCells": [{"rowId": "bf_spec_egg", "dayIdx": 8}, {"rowId": "lu_theme", "dayIdx": 8}, {"rowId": "lu_special", "dayIdx": 8}], "finding": "With the charter arriving in Cincinnati around ~1:00 AM and a late-morning/early-afternoon Regen session, a standard early breakfast + heavy lunch may not fit the sleep/recovery window.", "detail": "Protecting 8+ hours of post-match REM/deep sleep after a 1:00 AM arrival requires shifting morning meal service.", "question": "Should we shift to a Later Brunch, followed by a Light Post-Regen Lunch/Snack (featuring a 'Jamba Juice' style smoothie action station and the Grilled Cheese + Tomato Soup), and then Dinner?"},
        {"id": "D9", "title": "9. Vegan Consumption Tracking & Made-to-Order Options", "rule": "Rule 5.1", "days": ["2026-11-08", "2026-11-11", "2026-11-14"], "targetCells": [{"rowId": "bf_vegan", "dayIdx": 1}, {"rowId": "lu_vegan", "dayIdx": 4}], "finding": "Full hot-held vegan trays are scheduled at every meal across all 12 days.", "detail": "If only 1–2 athletes utilize the vegan line, full chaffing pans lead to food waste and overcooked textures.", "question": "How are we currently tracking actual consumption on the vegan line? Would made-to-order vegan options (or smaller batch rotation) improve freshness and reduce waste?"},
        {"id": "D10", "title": "10. High Soy (Tofu / Tempeh) Frequency Across Camp", "rule": "Rule 5.2", "days": ["2026-11-08", "2026-11-09", "2026-11-13", "2026-11-14", "2026-11-16", "2026-11-17"], "targetCells": [{"rowId": "lu_vegan", "dayIdx": 1}, {"rowId": "dn_vegan", "dayIdx": 6}, {"rowId": "lu_vegan", "dayIdx": 7}, {"rowId": "dn_vegan", "dayIdx": 7}], "finding": "Tofu or tempeh is the sole vegan protein in 22 of 23 lunch/dinner slots (including 3x/day on both Match Days).", "detail": "Excessive soy reliance lacks amino acid & culinary variety.", "question": "Pose to the chef: Can we diversify the plant-based protein rotation with legumes, lentils, chickpeas, black beans, or quinoa/seed-based dishes?"}
    ],
    "culinary": [
        {"id": "C1", "title": "1. Breakfast Meat Variety (10-Day Turkey Bacon Streak)", "rule": "Rule 4.1", "days": ["2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17"], "targetCells": [{"rowId": "bf_side_meat", "dayIdx": 1}, {"rowId": "bf_side_meat", "dayIdx": 8}], "finding": "Turkey Bacon is listed for 10 consecutive days (Nov 8–17), with Pork Bacon only on arrival/departure.", "detail": "Menu fatigue sets in after >2 consecutive days of the exact same breakfast meat.", "question": "Discuss with the chef where to work in real Pork Bacon and Chicken Sausage (e.g., Fruit + Chicken Sausage on MD+1 mornings)."},
        {"id": "C2", "title": "2. Back-to-Back Tempeh Marinara (Nov 10 & Nov 11)", "rule": "Rule 4.2", "days": ["2026-11-10", "2026-11-11"], "targetCells": [{"rowId": "dn_vegan", "dayIdx": 3}, {"rowId": "lu_vegan", "dayIdx": 4}], "finding": "Seared Tofu with Tuscan Sauce (Tue Nov 10 Dinner) is followed immediately by Seared Tempeh with Marinara Sauce (Wed Nov 11 Lunch).", "detail": "Back-to-back tomato/Italian soy entrees.", "question": "Let the chef choose a fresh replacement for one of these slots."},
        {"id": "C3", "title": "3. Back-to-Back Seabass Cream Sauces (Nov 11 & Nov 12)", "rule": "Rule 4.2", "days": ["2026-11-11", "2026-11-12"], "targetCells": [{"rowId": "lu_prot_3", "dayIdx": 4}, {"rowId": "lu_prot_3", "dayIdx": 5}], "finding": "Seared Seabass with Tuscan Cream Sauce (Wed Nov 11 Lunch) is followed the next day by Pan Seared Seabass with Saffron Sauce (Thu Nov 12 Lunch).", "detail": "Identical fish species in rich sauces on consecutive lunches.", "question": "Ask the chef if they'd like to vary the fish species or preparation on one of the days."},
        {"id": "C4", "title": "4. Back-to-Back Lemon Caper Sauce (Fri Nov 13)", "rule": "Rule 4.2", "days": ["2026-11-13"], "targetCells": [{"rowId": "lu_prot_2", "dayIdx": 6}, {"rowId": "lu_vegan", "dayIdx": 6}, {"rowId": "dn_prot_1", "dayIdx": 6}, {"rowId": "dn_vegan", "dayIdx": 6}], "finding": "Fri Nov 13 features Seared Cod & Tofu with Lemon Caper Sauce at Lunch, followed by Chicken & Tempeh Piccata (also lemon-caper sauce) that same night at Dinner.", "detail": "4 different lemon-caper entrees in a single day.", "question": "Flag for the chef to differentiate the Lunch vs. Dinner flavor profiles on Nov 13."},
        {"id": "C5", "title": "5. Exact Salad Repeats Across Camp", "rule": "Rule 4.3", "days": ["2026-11-10", "2026-11-11", "2026-11-14", "2026-11-17"], "targetCells": [{"rowId": "dn_salad", "dayIdx": 3}, {"rowId": "lu_salad", "dayIdx": 4}, {"rowId": "lu_salad", "dayIdx": 7}, {"rowId": "lu_salad", "dayIdx": 10}], "finding": "Green Goddess Composed Salad runs Tue Nov 10 Dinner and again Wed Nov 11 Lunch (~16 hours apart). Spinach Strawberry & Beet Salad with Goat Cheese repeats verbatim on Nov 14 & Nov 17 Lunches.", "detail": "Exact composed salad repeats reduce cold-table variety.", "question": "Flag for the chef to rotate greens/dressings if desired."},
        {"id": "C6", "title": "6. Identical Match-Day Menus (Nov 14 vs. Nov 17)", "rule": "Rule 4.5", "days": ["2026-11-14", "2026-11-17"], "targetCells": [{"rowId": "lu_prot_1", "dayIdx": 7}, {"rowId": "lu_prot_1", "dayIdx": 10}, {"rowId": "dn_prot_1", "dayIdx": 7}, {"rowId": "dn_prot_1", "dayIdx": 10}], "finding": "Match Day 1 (Nov 14 in Kingston) and Match Day 2 (Nov 17 in Cincinnati) are 100% identical across Breakfast, Lunch, and Pre-Match.", "detail": "Note: Banana Pancakes at all 3 meals are an athlete request and stay untouched.", "question": "Ask the performance/culinary team: Is the 100% repeat across both Match Days intentional for routine consistency, or should we introduce subtle variety in Cincinnati?"},
        {"id": "C7", "title": "7. High-Frequency Side Dish Loops (Rice Pilaf, Asparagus, Carrots)", "rule": "Rule 4.3", "days": ["2026-11-08", "2026-11-13", "2026-11-14", "2026-11-15", "2026-11-17"], "targetCells": [{"rowId": "lu_starch_1", "dayIdx": 6}, {"rowId": "lu_starch_2", "dayIdx": 6}, {"rowId": "lu_starch_1", "dayIdx": 7}, {"rowId": "lu_starch_2", "dayIdx": 8}], "finding": "Rice Pilaf appears 5 times (and twice in the same Lunch on Fri Nov 13 rows 37 & 38). Asparagus (6x) and Candied/Steamed Carrots (5x) also carry a heavy load.", "detail": "Row 37 & Row 38 on Nov 13 are duplicate Rice Pilaf entries.", "question": "Flag duplicate cells (Nov 13 Lunch) and let the chef broaden the vegetable/grain rotation."},
        {"id": "C8", "title": "8. Theme vs. Dish Alignment Check", "rule": "Rule 4.4", "days": ["2026-11-10", "2026-11-11", "2026-11-12"], "targetCells": [{"rowId": "lu_station", "dayIdx": 3}, {"rowId": "dn_salad", "dayIdx": 5}, {"rowId": "dn_special", "dayIdx": 5}], "finding": "A few dishes drift from their daily theme:", "detail": "• Tue Nov 10 Lunch ('American Southern' Theme): Features a Risotto Station.\n• Wed Nov 11 Lunch ('Italian' Theme): Features a Classic French Pork Roulade with Black Peppercorn Sauce.\n• Thu Nov 12 Dinner ('Jamaican' Theme): Features a Beef Quesadilla with Sour Cream & Salsa alongside Rasta Pasta Salad.", "question": "Bring to the chef's attention to see if they want to align those items closer to the daily themes."},
        {"id": "C9", "title": "9. European Dinner Heaviness (Tue Nov 10)", "rule": "Rule 2.3", "days": ["2026-11-10"], "targetCells": [{"rowId": "dn_prot_1", "dayIdx": 3}, {"rowId": "dn_special", "dayIdx": 3}, {"rowId": "dn_soup", "dayIdx": 3}], "finding": "Tue Nov 10 Dinner stacks Beef Stroganoff, Seared Salmon with Tuscan Cream Sauce, Fried Pork Schnitzel, and Cream of Mushroom Soup in the same meal.", "detail": "Four heavy cream/breaded items in one seating after intense MD-4 training.", "question": "Suggest lightening 1–2 preparations so athletes have a cleaner option alongside the comfort classics."},
        {"id": "C10", "title": "10. Typo & BEO Clarity Cleanup", "rule": "Rule 6.1", "days": ["2026-11-08", "2026-11-13", "2026-11-14", "2026-11-16"], "targetCells": [{"rowId": "dn_prot_1", "dayIdx": 1}, {"rowId": "dn_prot_3", "dayIdx": 6}, {"rowId": "dn_special", "dayIdx": 6}], "finding": "Clean up minor spelling items before sending BEOs to hotel kitchens:", "detail": "• 'Braised Chicken Things' -> Thighs (Nov 8)\n• 'Manocati Shels / Lagsana' -> Manicotti Shells / Lasagna (Nov 13)\n• 'Hailbut' -> Halibut (Nov 14/17)\n• 'Ropa Veija / Tajun' -> Ropa Vieja / Tajín (Nov 16)", "question": "Auto-fix BEO spelling prior to hotel distribution."}
    ]
}

RULES_DATA = [
    {"code": "Rule 1.1", "cat": "1. Functional Foods", "name": "Daily Functional Food Coverage", "trigger": "Check every day for at least 2 functional food pillars: anti-inflammatory (turmeric, ginger, tart cherry, berries), nitric oxide (beets, arugula, spinach), omega-3 (salmon, cod, chia), & gut/immune (fermented, probiotics, garlic/onion).", "action": "Pose a broad question on where to layer in missing functional foods.", "status": "Verified"},
    {"code": "Rule 1.2", "cat": "1. Functional Foods", "name": "Bioavailability & Synergy Check", "trigger": "Flag functional ingredients served without their required absorption cofactor (e.g., Turmeric without black pepper/piperine + fat; fat-soluble carotenoids without lipid).", "action": "Cite peer-reviewed literature (Shoba et al., 1998 — 2,000% bioavailability increase) and recommend adding the cofactor.", "status": "Flagged (Nov 14 & 17)"},
    {"code": "Rule 1.3", "cat": "1. Functional Foods", "name": "Daily Fruit Line & Travel Food Safety", "trigger": "Verify that a dedicated Fruit row exists across all 3 main meals (Breakfast, Lunch, Dinner). When traveling in CONCACAF / high-risk locations, check fruit prep format.", "action": "Flag missing Fruit lines (e.g., Breakfast) and recommend whole, unpeeled fruits (bananas, clementines, whole apples) as a travel safeguard.", "status": "Flagged (Breakfast)"},
    {"code": "Rule 2.1", "cat": "2. Match-Day-Minus-1 (MD-1)", "name": "MD-1 Clean Carbohydrate Anchor", "trigger": "Check MD-1 Lunch and Dinner starches. Flag if both starches are high-fat, cheese-heavy, or nut-heavy (e.g., Pesto Risotto, Boursin Mashed Potatoes, Pistachio Rice) with no plain, low-residue carb option.", "action": "Suggest swapping one rich starch for a clean glycogen loader (plain white rice, baked potato, or sweet potato).", "status": "Flagged (Nov 13 & 16)"},
    {"code": "Rule 2.2", "cat": "2. Match-Day-Minus-1 (MD-1)", "name": "MD-1 Allergen & Tree Nut Exposure", "trigger": "Count tree nut/seed occurrences (pesto/pine nuts, almonds, pecans, pistachios, walnuts) on MD-1.", "action": "If nuts appear in >= 2 dishes on MD-1, flag the cumulative exposure and suggest moving sauces to the side or simplifying.", "status": "Flagged (Nov 13 & 16)"},
    {"code": "Rule 2.3", "cat": "2. Match-Day-Minus-1 (MD-1)", "name": "MD-1 GI Distress / Fiber / Fat Guardrail", "trigger": "Scan MD-1 and Pre-Match meals for raw cruciferous vegetables (Brussels sprouts, raw cabbage slaw, broccoli), heavy cream sauces, or deep-fried items.", "action": "Pose a question about swapping for lower-fiber, easily digested cooked vegetables and lighter sauces.", "status": "Flagged (Nov 10 & 13)"},
    {"code": "Rule 3.1", "cat": "3. Match Day & MD+1", "name": "MD+1 Late-Night Arrival & Regen Cadence", "trigger": "Cross-reference flight/arrival schedule on MD+1. If charter arrival is after midnight (e.g., ~1:00 AM arrival) with a late-morning/early-afternoon Regen session, flag standard 3-meal timing.", "action": "Propose shifting to a Later Brunch -> Light Post-Regen Lunch/Snack (e.g., 'Jamba Juice' smoothie station + light sandwich/soup) -> Dinner.", "status": "Action Needed (Nov 15)"},
    {"code": "Rule 3.2", "cat": "3. Match Day & MD+1", "name": "Pre-Match Condiment & Allium Check", "trigger": "Scan Pre-Match meals (4h prior to kickoff) for heavy emulsified fats or pungent raw garlic/onion sauces (e.g., Garlic Aioli, Horseradish Aioli).", "action": "Pose as a question to the dietitian/chef whether to hold on the side or offer a lighter spread.", "status": "Flagged (Nov 14 & 17)"},
    {"code": "Rule 3.3", "cat": "3. Match Day & MD+1", "name": "Post-Match Away Meal & Charter Integration", "trigger": "Audit Post-Match away meals for the 4 R's (Glycogen, Lean Protein, Anti-inflammatory, Rehydration) plus team morale, and check connection to charter flight catering.", "action": "Recommend local cultural touches (e.g., Jamaican Jerk/Festival) balanced with clean recovery upgrades and tiered charter flight snacks.", "status": "Action Needed (Nov 14)"},
    {"code": "Rule 3.4", "cat": "3. Match Day & MD+1", "name": "Daily Staple & Nut Butter Quality Audit", "trigger": "Scan daily staples (peanut/almond butter, oats, bread, cooking oils) that stay on the buffet every day.", "action": "Remind staff to verify ingredient labels daily (100% nuts/salt, no palm/hydrogenated oils or added sugars).", "status": "Daily Protocol"},
    {"code": "Rule 4.1", "cat": "4. Culinary Variety", "name": "Single-Item Streak Limit (<= 3 Days)", "trigger": "Count consecutive days any identical side protein or starch appears (excluding daily station baselines like Oatmeal/Eggs to Order). Flag any streak > 3 days.", "action": "Highlight the streak (e.g., 10 days of Turkey Bacon) and suggest broad rotation options (Pork Bacon, Chicken Sausage).", "status": "Flagged (10-Day Streak)"},
    {"code": "Rule 4.2", "cat": "4. Culinary Variety", "name": "Back-to-Back Protein / Sauce Collision", "trigger": "Check consecutive meals (Day N Dinner -> Day N+1 Lunch, or Same-Day Lunch -> Dinner) for identical proteins or identical sauce bases.", "action": "Flag collisions (e.g., Seabass 2 lunches in a row; Lemon Caper 4x in one day; Tuscan Tofu -> Marinara Tempeh) and let the chef choose the swap.", "status": "Flagged (3 Collisions)"},
    {"code": "Rule 4.3", "cat": "4. Culinary Variety", "name": "Exact Salad & Side Loop Detection", "trigger": "Count total camp occurrences of every composed salad, vegetable, and starch. Flag any composed salad repeated within 48h, any side appearing >= 5 times, or duplicate rows in the same meal.", "action": "Point out exact repeats (e.g., Green Goddess back-to-back; Rice Pilaf listed twice in the same lunch) for chef awareness.", "status": "Flagged (Nov 10, 11, 13)"},
    {"code": "Rule 4.4", "cat": "4. Culinary Variety", "name": "Theme-to-Menu Cohesion Check", "trigger": "Compare the stated Daily Theme (e.g., 'American Southern', 'Italian', 'Jamaican') against every dish and action station in that meal.", "action": "Flag clear culinary drift (e.g., Risotto Station on Southern Day; Beef Quesadilla on Jamaican Night).", "status": "Flagged (Nov 10, 11, 12)"},
    {"code": "Rule 4.5", "cat": "4. Culinary Variety", "name": "Multi-Match Window Copy-Paste Check", "trigger": "Compare Match Day 1 vs. Match Day 2 menus across the window.", "action": "If 100% identical, ask if the carbon copy is intentional for routine consistency or if subtle variety is desired.", "status": "Question Posed (Nov 14 & 17)"},
    {"code": "Rule 5.1", "cat": "5. Plant-Based & Soy", "name": "Vegan Line Utilization & Batch Format", "trigger": "Check if full hot-held vegan buffet pans are scheduled across all meals regardless of headcount.", "action": "Ask how consumption is tracked and whether made-to-order vegan options would improve quality and reduce waste.", "status": "Question Posed"},
    {"code": "Rule 5.2", "cat": "5. Plant-Based & Soy", "name": "Soy (Tofu/Tempeh) Ceiling (< 50%)", "trigger": "Calculate the percentage of vegan slots relying on soy (tofu/tempeh). Flag if soy exceeds 50% of camp vegan entrees.", "action": "Recommend broad whole-food plant rotations (lentils, chickpeas, black beans, quinoa bowls).", "status": "Flagged (95.6% Soy)"},
    {"code": "Rule 6.1", "cat": "6. BEO Hygiene", "name": "BEO Spelling & Culinary Terminology", "trigger": "Scan all cells for typos before hotel catering distribution.", "action": "List clean corrections (e.g., Things -> Thighs, Manocati -> Manicotti, Hailbut -> Halibut).", "status": "Flagged (6 Typos)"},
    {"code": "Rule 6.2", "cat": "6. BEO Hygiene", "name": "Protected Athlete Requests & Staff-Owned Rows", "trigger": "Cross-reference known athlete traditions (e.g., Match-Day Banana Pancakes at all 3 meals) and staff-handled items (e.g., Recovery Shots marked N/A).", "action": "Do NOT flag protected items as errors.", "status": "Protected"}
]

payload = {
    "days": DAYS_META,
    "excelRows": matrix_rows,
    "recipes": recipes,
    "audit": AUDIT_DATA,
    "rules": RULES_DATA
}

js_content = "window.MENU_DATA = " + json.dumps(payload, indent=2, ensure_ascii=False) + ";\n"
OUT_JS_PATH.write_text(js_content, encoding="utf-8")
print(f"Wrote {OUT_JS_PATH} ({OUT_JS_PATH.stat().st_size} bytes) with {len(matrix_rows)} Excel rows and {len(recipes)} recipes.")
