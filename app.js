(function () {
  const DATA = window.MENU_DATA || { days: [], excelRows: [], recipes: [], audit: { dietitian: [], culinary: [] }, rules: [] };

  function norm(s) {
    return (s || "")
      .toLowerCase()
      .replace(/\(.*?\)/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Default Meals & Category Swimlanes (used when initializing from static data.js)
  const DEFAULT_MEALS = [
    { id: "Breakfast", name: "Breakfast", icon: "🍳", defaultTime: "08:00 AM" },
    { id: "Lunch", name: "Lunch", icon: "🥗", defaultTime: "01:00 PM" },
    { id: "Dinner", name: "Dinner / Pre-Match", icon: "🍽️", defaultTime: "07:00 PM" },
    { id: "Post-Match", name: "Post-Match Recovery", icon: "⚽", defaultTime: "10:30 PM" }
  ];

  const DEFAULT_SWIMLANES = [
    { laneId: "bf_eggs", meal: "Breakfast", title: "Eggs & Specialty Eggs", subtitle: "Scrambles & Specialty Egg Dishes", sourceRows: [{ rowId: "bf_scramble", tag: "Scramble" }, { rowId: "bf_spec_egg", tag: "Specialty Egg" }] },
    { laneId: "bf_vegan", meal: "Breakfast", title: "Breakfast Vegan", subtitle: "Plant-Based Morning Entree", sourceRows: [{ rowId: "bf_vegan", tag: "Vegan" }] },
    { laneId: "bf_sides", meal: "Breakfast", title: "Meats & Potato Sides", subtitle: "Bacon/Sausage & Potatoes/Hash", sourceRows: [{ rowId: "bf_side_meat", tag: "Meat" }, { rowId: "bf_side_potato", tag: "Potato" }] },
    { laneId: "bf_griddle", meal: "Breakfast", title: "Griddle Specials", subtitle: "Pancakes, Waffles & French Toast", sourceRows: [{ rowId: "bf_special", tag: "Griddle" }] },
    { laneId: "bf_oats", meal: "Breakfast", title: "Overnight Oats, Chia & Bakery", subtitle: "Cold Oats, Chia Puddings & Breads", sourceRows: [{ rowId: "bf_oats_1", tag: "Oats/Chia" }, { rowId: "bf_oats_2", tag: "Bakery/Oats" }] },
    { laneId: "bf_fruit", meal: "Breakfast", title: "Breakfast Fruits", subtitle: "Whole Unpeeled & Berries", sourceRows: [] },

    { laneId: "lu_proteins", meal: "Lunch", title: "Lunch Proteins", subtitle: "Poultry, Fish/Seafood & Meat Entrees", sourceRows: [{ rowId: "lu_prot_1", tag: "Protein 1" }, { rowId: "lu_prot_2", tag: "Protein 2" }, { rowId: "lu_prot_3", tag: "Protein 3" }] },
    { laneId: "lu_vegan", meal: "Lunch", title: "Lunch Plant-Based", subtitle: "Vegan Entree", sourceRows: [{ rowId: "lu_vegan", tag: "Vegan" }] },
    { laneId: "lu_veggies", meal: "Lunch", title: "Lunch Vegetables", subtitle: "Hot Vegetable Sides", sourceRows: [{ rowId: "lu_veg_1", tag: "Veg 1" }, { rowId: "lu_veg_2", tag: "Veg 2" }] },
    { laneId: "lu_starches", meal: "Lunch", title: "Lunch Carbs & Starches", subtitle: "Rice, Risotto, Farro & Potatoes", sourceRows: [{ rowId: "lu_starch_1", tag: "Starch 1" }, { rowId: "lu_starch_2", tag: "Starch 2" }] },
    { laneId: "lu_salad_soup", meal: "Lunch", title: "Lunch Salad & Soup", subtitle: "Composed Salad & Daily Soup", sourceRows: [{ rowId: "lu_salad", tag: "Salad" }, { rowId: "lu_soup", tag: "Soup" }] },
    { laneId: "lu_station_special", meal: "Lunch", title: "Lunch Station & Special", subtitle: "Action Station & Chef Special", sourceRows: [{ rowId: "lu_station", tag: "Action Station" }, { rowId: "lu_special", tag: "Chef Special" }] },

    { laneId: "dn_proteins", meal: "Dinner", title: "Dinner / Pre-Match Proteins", subtitle: "Poultry, Fish/Seafood & Meat Entrees", sourceRows: [{ rowId: "dn_prot_1", tag: "Protein 1" }, { rowId: "dn_prot_2", tag: "Protein 2" }, { rowId: "dn_prot_3", tag: "Protein 3" }] },
    { laneId: "dn_vegan", meal: "Dinner", title: "Dinner Plant-Based", subtitle: "Vegan Entree", sourceRows: [{ rowId: "dn_vegan", tag: "Vegan" }] },
    { laneId: "dn_veggies", meal: "Dinner", title: "Dinner Vegetables", subtitle: "Hot Vegetable Sides", sourceRows: [{ rowId: "dn_veg_1", tag: "Veg 1" }, { rowId: "dn_veg_2", tag: "Veg 2" }] },
    { laneId: "dn_starches", meal: "Dinner", title: "Dinner Carbs & Starches", subtitle: "Rice, Noodles, Risotto & Potatoes", sourceRows: [{ rowId: "dn_starch_1", tag: "Starch 1" }, { rowId: "dn_starch_2", tag: "Starch 2" }] },
    { laneId: "dn_salad_soup", meal: "Dinner", title: "Dinner Salad & Soup", subtitle: "Composed Salad & Evening Soup", sourceRows: [{ rowId: "dn_salad", tag: "Salad" }, { rowId: "dn_soup", tag: "Soup" }] },
    { laneId: "dn_station_special", meal: "Dinner", title: "Dinner Station, Special & Dessert", subtitle: "Action Station, Chef Special & Dessert", sourceRows: [{ rowId: "dn_station", tag: "Action Station" }, { rowId: "dn_special", tag: "Chef Special" }, { rowId: "dn_dessert", tag: "Dessert" }] },

    { laneId: "pm_mains", meal: "Post-Match", title: "Post-Match Mains & Stations", subtitle: "Recovery Proteins, Pizza/Sushi & Açaí Station", sourceRows: [{ rowId: "pm_prot_1", tag: "Main 1" }, { rowId: "pm_prot_2", tag: "Main 2" }, { rowId: "pm_prot_3", tag: "Main 3" }, { rowId: "pm_station", tag: "Station" }, { rowId: "pm_dessert", tag: "Recovery Station" }] },
    { laneId: "pm_sides", meal: "Post-Match", title: "Post-Match Sides & Salads", subtitle: "Recovery Starches, Vegetables & Salad", sourceRows: [{ rowId: "pm_veg_1", tag: "Side" }, { rowId: "pm_veg_2", tag: "Side" }, { rowId: "pm_starch_1", tag: "Starch" }, { rowId: "pm_starch_2", tag: "Starch" }, { rowId: "pm_salad", tag: "Salad" }] }
  ];

  let nextCardId = 500;

  function buildBoardFromExcelRows(excelRows, daysInput) {
    const rowMap = new Map();
    (excelRows || []).forEach((r) => rowMap.set(r.rowId, r.cells));
    const days = (daysInput || DATA.days || []).map((d, idx) => ({
      ...d,
      dayIdx: idx,
      eventTime: d.eventTime || (d.type === "match" ? "07:30 PM Kickoff" : d.type === "md-1" || d.type === "training" ? "11:00 AM Training" : "Travel / Regen")
    }));

    const meals = JSON.parse(JSON.stringify(DEFAULT_MEALS));
    const swimlanes = JSON.parse(JSON.stringify(DEFAULT_SWIMLANES));
    const slots = {};

    swimlanes.forEach((lane) => {
      slots[lane.laneId] = Array.from({ length: days.length }, (_, dIdx) => {
        const cards = [];
        (lane.sourceRows || []).forEach((sr) => {
          const val = (rowMap.get(sr.rowId)?.[dIdx] || "").trim();
          if (val && val !== "No Station" && val !== "No Special" && !val.startsWith("N/A")) {
            cards.push({
              id: `c_${nextCardId++}`,
              dish: val,
              subTag: sr.tag,
              tags: [],
              origDish: val
            });
          }
        });
        return cards;
      });
    });

    const themes = {
      Lunch: [...(rowMap.get("lu_theme") || Array(days.length).fill(""))],
      Dinner: [...(rowMap.get("dn_theme") || Array(days.length).fill(""))]
    };

    return { days, meals, swimlanes, slots, themes, aiAuditFlags: [] };
  }

  const BASELINE_BOARD = buildBoardFromExcelRows(DATA.excelRows, DATA.days);

  // Master Application State
  const state = {
    pgConnected: false,
    camps: [
      {
        camp_id: 1,
        name: "November 2026 Camp (vs. Haiti)",
        subtitle: "Nov 7–18, 2026 • Atlanta, Kingston & Cincinnati",
        board_json: JSON.parse(JSON.stringify(BASELINE_BOARD))
      }
    ],
    activeCampId: 1,
    campName: "November 2026 Camp (vs. Haiti)",
    campSubtitle: "Nov 7–18, 2026 • Atlanta, Kingston & Cincinnati",
    templates: [
      {
        template_id: 1,
        name: "USMNT Standard Training Camp (Atlanta / NTC)",
        location_tag: "Atlanta (Trilith / NTC)",
        meals_json: DEFAULT_MEALS,
        swimlanes_json: DEFAULT_SWIMLANES
      },
      {
        template_id: 2,
        name: "CONCACAF Away Match Setup (Kingston, Jamaica)",
        location_tag: "Kingston, Jamaica",
        meals_json: DEFAULT_MEALS,
        swimlanes_json: DEFAULT_SWIMLANES
      },
      {
        template_id: 3,
        name: "MD+1 Late Arrival Brunch & Regen Cadence (Cincinnati)",
        location_tag: "Cincinnati, OH",
        meals_json: [
          { id: "Breakfast", name: "Late Morning Brunch (10:30 AM)", icon: "🥞", defaultTime: "10:30 AM" },
          { id: "Lunch", name: "Light Post-Regen Lunch / Smoothie Bar (2:30 PM)", icon: "🥤", defaultTime: "02:30 PM" },
          { id: "Dinner", name: "Evening Recovery Dinner (7:30 PM)", icon: "🍽️", defaultTime: "07:30 PM" },
          { id: "Post-Match", name: "Post-Match Recovery", icon: "⚽", defaultTime: "10:30 PM" }
        ],
        swimlanes_json: DEFAULT_SWIMLANES
      }
    ],
    recipes: JSON.parse(JSON.stringify(DATA.recipes || [])),
    tagsCatalog: [
      "Swap Recommendation",
      "Functional Food",
      "MD-1 Safe",
      "Match Day",
      "100% Plant-Based",
      "Low-FODMAP",
      "Athlete Request",
      "High Carb / Glycogen",
      "Lean Protein",
      "Anti-Inflammatory",
      "Gluten-Free",
      "Dairy-Free",
      "Nut-Free"
    ],
    rules: (DATA.rules || []).map((r, i) => ({ ...r, is_active: true, sort_order: i + 1 })),
    // Board UI controls
    activeTab: "planner",
    pivotMode: "days-cols", // 'days-cols' | 'meals-cols' | 'day-focus'
    focusDayIdx: 0,
    cityFilter: "all",
    mealFilter: "all",
    dropMode: "swap", // 'swap' | 'move'
    dockMode: "bottom", // 'bottom' | 'right' | 'hidden'
    showLiveAudit: true,
    // Palette Searcher controls
    paletteSearch: "",
    paletteSection: "all",
    paletteDishType: "all",
    paletteFilter: "all",
    // Current Active Camp Board
    board: JSON.parse(JSON.stringify(BASELINE_BOARD)),
    undoStack: [],
    redoStack: [],
    moveCount: 0,
    dragData: null,
    jumpHighlightSlots: [],
    quickAddTarget: null,
    tagEditTarget: null, // { type: 'card'|'recipe'|'global', laneId, dayIdx, cardIdx, recipeId }
    editingRuleCode: null,
    // Recipe Book Tab
    recipeSearch: "",
    recipeSection: "all",
    recipeTag: "all",
    globalScale: 1,
    modalRecipe: null,
    modalScale: 1,
    // Rules Tab
    rulesSearch: "",
    rulesCat: "all"
  };

  // Normalize board structure so every swimlane has slots for every day
  function ensureBoardIntegrity(b) {
    if (!b.days) b.days = JSON.parse(JSON.stringify(BASELINE_BOARD.days));
    if (!b.meals) b.meals = JSON.parse(JSON.stringify(DEFAULT_MEALS));
    if (!b.swimlanes) b.swimlanes = JSON.parse(JSON.stringify(DEFAULT_SWIMLANES));
    if (!b.slots) b.slots = {};
    if (!b.themes) b.themes = {};
    if (!b.aiAuditFlags) b.aiAuditFlags = [];

    b.days.forEach((d, idx) => {
      d.dayIdx = idx;
      if (!d.eventTime) {
        d.eventTime = d.type === "match" ? "07:30 PM Kickoff" : "11:00 AM Training";
      }
    });

    b.swimlanes.forEach((lane) => {
      if (!Array.isArray(b.slots[lane.laneId])) {
        b.slots[lane.laneId] = Array.from({ length: b.days.length }, () => []);
      }
      while (b.slots[lane.laneId].length < b.days.length) {
        b.slots[lane.laneId].push([]);
      }
      b.slots[lane.laneId].forEach((cardList) => {
        cardList.forEach((c) => {
          if (!Array.isArray(c.tags)) c.tags = [];
        });
      });
    });

    b.meals.forEach((m) => {
      if (!Array.isArray(b.themes[m.id])) {
        b.themes[m.id] = Array(b.days.length).fill("");
      }
    });
  }

  // Build recipe lookup map
  const recipeByNormName = new Map();
  function rebuildRecipeMap() {
    recipeByNormName.clear();
    state.recipes.forEach((r) => {
      recipeByNormName.set(norm(r.name), r);
    });
  }
  rebuildRecipeMap();

  function findRecipeForDish(dishName) {
    if (!dishName) return null;
    const n = norm(dishName);
    if (!n || n === "n a" || n.startsWith("n a ") || n === "no station" || n === "no special") return null;
    if (recipeByNormName.has(n)) return recipeByNormName.get(n);

    const fixed = n
      .replace(/\bthings\b/g, "thighs")
      .replace(/\bhailbut\b/g, "halibut")
      .replace(/\bmanocati\b/g, "manicotti")
      .replace(/\bshels\b/g, "shells")
      .replace(/\blagsana\b/g, "lasagna")
      .replace(/\bveija\b/g, "vieja")
      .replace(/\btajun\b/g, "tajin")
      .replace(/\bstarwberry\b/g, "strawberry")
      .replace(/\bbrussle\b/g, "brussels")
      .replace(/\bqunioa\b/g, "quinoa")
      .replace(/\bomellet\b/g, "omelet")
      .replace(/\bburriots\b/g, "burritos");

    if (recipeByNormName.has(fixed)) return recipeByNormName.get(fixed);

    let best = null;
    let bestScore = 0;
    const words = fixed.split(" ").filter((w) => w.length > 2);
    for (const r of state.recipes) {
      const rn = norm(r.name);
      if (rn.includes(fixed) || fixed.includes(rn)) return r;
      let matches = 0;
      for (const w of words) {
        if (rn.includes(w)) matches++;
      }
      const score = words.length ? matches / words.length : 0;
      if (score > bestScore && score >= 0.6) {
        bestScore = score;
        best = r;
      }
    }
    return best;
  }

  function getOrSynthesizeRecipe(dishName, categoryLabel) {
    const found = findRecipeForDish(dishName);
    if (found) return found;
    return {
      id: 999,
      name: dishName,
      category: categoryLabel || "Custom Menu Item",
      section: "Custom Planner Entry",
      yield: "10–12 Athlete Portions (1 Standard Hotel Pan)",
      ingredients: [
        `2.5 kg primary ingredients for ${dishName} (10–12 athlete portions)`,
        "30 mL 100% Extra-Virgin Olive Oil or Avocado Oil",
        "10 g kosher/sea salt, fresh aromatics, and citrus to taste"
      ],
      steps: [
        `Prepare ${dishName} according to USMNT culinary standards using 100% extra-virgin olive oil or avocado oil (no seed/hydrogenated oils).`,
        "Hold sauces, dressings, and tree nuts/seeds on the side in labeled vessels.",
        "Stage in shallow perforated or standard chafing pans at safe holding temperature (65°C hot / 4°C cold)."
      ],
      notes: "Custom planner item added via the Menu Planning Board.",
      tags: ["Custom Item"]
    };
  }

  // Bootstrap from PostgreSQL `menu` Schema via /api/bootstrap (with localStorage fallback)
  async function bootstrapFromPostgres() {
    try {
      const res = await fetch("/api/bootstrap");
      if (res.ok) {
        const data = await res.json();
        if (data && data.pgConnected) {
          state.pgConnected = true;
          if (Array.isArray(data.camps) && data.camps.length > 0) {
            state.camps = data.camps;
            const first = data.camps[0];
            state.activeCampId = first.camp_id;
            state.campName = first.name;
            state.campSubtitle = first.subtitle || "";
            state.board = first.board_json;
            ensureBoardIntegrity(state.board);
          }
          if (Array.isArray(data.templates) && data.templates.length > 0) {
            state.templates = data.templates;
          }
          if (Array.isArray(data.recipes) && data.recipes.length > 0) {
            state.recipes = data.recipes;
            rebuildRecipeMap();
          }
          if (Array.isArray(data.tags) && data.tags.length > 0) {
            const set = new Set(state.tagsCatalog);
            data.tags.forEach((t) => set.add(t.tag_name));
            state.tagsCatalog = Array.from(set);
          }
          if (Array.isArray(data.rules) && data.rules.length > 0) {
            state.rules = data.rules;
          }
          updateSyncStatus("● Postgres", "menu schema");
          refreshAllViews();
          return;
        }
      }
    } catch (_) {}

    // Fallback to localStorage for GitHub Pages static mode
    try {
      const saved = localStorage.getItem("usmnt_menu_schema_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.camps) state.camps = parsed.camps;
        if (parsed.activeCampId) state.activeCampId = parsed.activeCampId;
        if (parsed.board) {
          state.board = parsed.board;
          ensureBoardIntegrity(state.board);
        }
        if (parsed.templates) state.templates = parsed.templates;
        if (parsed.tagsCatalog) state.tagsCatalog = parsed.tagsCatalog;
        if (parsed.rules) state.rules = parsed.rules;
      }
    } catch (_) {}

    updateSyncStatus("● Browser DB", "Local Saved");
    refreshAllViews();
  }

  async function saveCampState(createNew = false) {
    ensureBoardIntegrity(state.board);
    const elMoves = document.getElementById("statChangesCount");
    if (elMoves) elMoves.textContent = String(state.moveCount);

    // Update current camp in state.camps
    const existing = state.camps.find((c) => c.camp_id === state.activeCampId);
    if (existing && !createNew) {
      existing.name = state.campName;
      existing.subtitle = state.campSubtitle;
      existing.board_json = JSON.parse(JSON.stringify(state.board));
    }

    try {
      localStorage.setItem(
        "usmnt_menu_schema_v3",
        JSON.stringify({
          camps: state.camps,
          activeCampId: state.activeCampId,
          board: state.board,
          templates: state.templates,
          tagsCatalog: state.tagsCatalog,
          rules: state.rules
        })
      );
    } catch (_) {}

    try {
      updateSyncStatus("● Saving...", "menu.camp");
      const res = await fetch("/api/camp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId: state.activeCampId,
          createNew,
          name: state.campName,
          subtitle: state.campSubtitle,
          board: state.board
        })
      });
      if (res.ok) {
        const out = await res.json();
        if (out.pgSaved && out.camp) {
          state.activeCampId = out.camp.camp_id;
          const idx = state.camps.findIndex((c) => c.camp_id === out.camp.camp_id);
          if (idx >= 0) state.camps[idx] = out.camp;
          else state.camps.push(out.camp);
          renderCampDropdown();
          updateSyncStatus("● Postgres", "Saved to menu.camp");
          return;
        }
      }
    } catch (_) {}
    updateSyncStatus("● Local", "Browser Saved");
  }

  function updateSyncStatus(dotText, subText) {
    const d = document.getElementById("syncStatusDot");
    const t = document.getElementById("syncStatusText");
    if (d) d.textContent = dotText;
    if (t) t.textContent = subText;
  }

  function pushUndo() {
    state.undoStack.push({
      board: JSON.parse(JSON.stringify(state.board)),
      moveCount: state.moveCount
    });
    if (state.undoStack.length > 40) state.undoStack.shift();
    state.redoStack = [];
    state.moveCount++;
    updateUndoRedoBtns();
  }

  function updateUndoRedoBtns() {
    const u = document.getElementById("btnUndo");
    const r = document.getElementById("btnRedo");
    if (u) u.disabled = state.undoStack.length === 0;
    if (r) r.disabled = state.redoStack.length === 0;
  }

  function undo() {
    if (!state.undoStack.length) return;
    state.redoStack.push({
      board: JSON.parse(JSON.stringify(state.board)),
      moveCount: state.moveCount
    });
    const prev = state.undoStack.pop();
    state.board = prev.board;
    state.moveCount = prev.moveCount;
    updateUndoRedoBtns();
    saveCampState();
    renderPlanningBoard();
  }

  function redo() {
    if (!state.redoStack.length) return;
    state.undoStack.push({
      board: JSON.parse(JSON.stringify(state.board)),
      moveCount: state.moveCount
    });
    const next = state.redoStack.pop();
    state.board = next.board;
    state.moveCount = next.moveCount;
    updateUndoRedoBtns();
    saveCampState();
    renderPlanningBoard();
  }

  // Render Camp Selector, Template Selector, Meal Filter Pills, Focus Day Selector, and Tag Filter Pills
  function renderCampDropdown() {
    const sel = document.getElementById("campSelect");
    if (sel) {
      sel.innerHTML = state.camps
        .map((c) => `<option value="${c.camp_id}" ${c.camp_id === state.activeCampId ? "selected" : ""}>${escapeHtml(c.name)}</option>`)
        .join("");
    }
    const subEl = document.getElementById("campSubtitleText");
    if (subEl) subEl.textContent = state.campSubtitle || "";
  }

  function renderTemplateDropdown() {
    const sel = document.getElementById("mealTemplateSelect");
    if (!sel) return;
    sel.innerHTML =
      `<option value="">📂 Load Saved Meal Template (${state.templates.length})...</option>` +
      state.templates
        .map((t, i) => `<option value="${i}">📍 [${escapeHtml(t.location_tag || "Universal")}] ${escapeHtml(t.name)}</option>`)
        .join("");
  }

  function renderMealFilterPills() {
    const grp = document.getElementById("mealFilterGroup");
    if (!grp) return;
    const meals = state.board.meals || [];
    let html = `<button class="filter-pill ${state.mealFilter === "all" ? "active" : ""}" data-meal="all">All Meals (${meals.length})</button>`;
    meals.forEach((m) => {
      html += `<button class="filter-pill ${state.mealFilter === m.id ? "active" : ""}" data-meal="${escapeHtml(m.id)}">${escapeHtml(m.icon || "🍴")} ${escapeHtml(m.name)}</button>`;
    });
    grp.innerHTML = html;

    // Also update focusDaySelect for 'day-focus' pivot mode
    const fSel = document.getElementById("focusDaySelect");
    if (fSel) {
      fSel.style.display = state.pivotMode === "day-focus" ? "inline-block" : "none";
      fSel.innerHTML =
        `<option value="-1" ${state.focusDayIdx === -1 ? "selected" : ""}>All Days Stacked</option>` +
        (state.board.days || [])
          .map((d, idx) => `<option value="${idx}" ${state.focusDayIdx === idx ? "selected" : ""}>${escapeHtml(d.short)} (${escapeHtml(d.md)} • ${escapeHtml(d.city)})</option>`)
          .join("");
    }
  }

  function renderTagPillsEverywhere() {
    const pContainer = document.getElementById("paletteFilterPills");
    if (pContainer) {
      let html = `<button class="mini-pill ${state.paletteFilter === "all" ? "active" : ""}" data-pfilter="all">All Tags</button>`;
      state.tagsCatalog.forEach((t) => {
        const isSwap = t === "Swap Recommendation";
        html += `<button class="mini-pill ${isSwap ? "pill-swap" : ""} ${state.paletteFilter === t ? "active" : ""}" data-pfilter="${escapeHtml(t)}">${isSwap ? "★ " : ""}${escapeHtml(t)}</button>`;
      });
      pContainer.innerHTML = html;
    }

    const rTagBar = document.getElementById("recipeTagBar");
    if (rTagBar) {
      let html = `<button class="tag-chip ${state.recipeTag === "all" ? "active" : ""}" data-tag="all">All Items</button>`;
      state.tagsCatalog.forEach((t) => {
        html += `<button class="tag-chip ${state.recipeTag === t ? "active" : ""}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`;
      });
      rTagBar.innerHTML = html;
    }

    const dl = document.getElementById("allRecipesDatalist");
    if (dl) {
      dl.innerHTML = state.recipes
        .map((r) => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.category)}</option>`)
        .join("");
    }
  }

  // Real-time Dynamic USMNT Audit Engine (Driven by Active Rules in Tab 4 + AI Flags)
  function computeCardBadges() {
    const badgeMap = new Map();
    let flagCount = 0;

    function add(laneId, dIdx, cIdx, badge, isWarn = false) {
      const k = `${laneId}:${dIdx}:${cIdx}`;
      if (!badgeMap.has(k)) badgeMap.set(k, []);
      badgeMap.get(k).push(badge);
      if (isWarn) flagCount++;
    }

    const activeRuleCodes = new Set(
      (state.rules || []).filter((r) => r.is_active !== false).map((r) => r.code)
    );

    const days = state.board.days || [];
    const swimlanes = state.board.swimlanes || [];
    const typoRegex = /\b(Things|Hailbut|Manocati|Shels|Lagsana|Veija|Tajun|Starwberry|Brussle|Qunioa|Omellet|Burriots)\b/i;

    // 1. Rule 4.1: Horizontal Streaks (>3 consecutive days)
    if (state.showLiveAudit && activeRuleCodes.has("Rule 4.1")) {
      swimlanes.forEach((lane) => {
        const daySlots = state.board.slots[lane.laneId] || [];
        const dishDays = new Map();
        for (let d = 0; d < days.length; d++) {
          (daySlots[d] || []).forEach((card, cIdx) => {
            const n = norm(card.dish);
            if (!n) return;
            if (!dishDays.has(n)) dishDays.set(n, []);
            dishDays.get(n).push({ dIdx: d, cIdx });
          });
        }
        dishDays.forEach((occurrences) => {
          let run = [occurrences[0]];
          for (let i = 1; i <= occurrences.length; i++) {
            const cur = occurrences[i];
            const prev = occurrences[i - 1];
            if (cur && (cur.dIdx === prev.dIdx + 1 || cur.dIdx === prev.dIdx)) {
              run.push(cur);
            } else {
              const uniqueDays = new Set(run.map((x) => x.dIdx)).size;
              if (uniqueDays > 3) {
                run.forEach((occ) => {
                  add(lane.laneId, occ.dIdx, occ.cIdx, {
                    cls: "b-streak",
                    text: `⚠️ ${uniqueDays}d Streak`,
                    title: `Rule 4.1: Appears ${uniqueDays} consecutive days.`
                  }, true);
                });
              }
              if (cur) run = [cur];
            }
          }
        });
      });
    }

    // 2. Day-level dish list for Same-Day / Back-to-Back Repeat detection
    const dayAllCards = Array.from({ length: days.length }, () => []);
    swimlanes.forEach((lane) => {
      for (let d = 0; d < days.length; d++) {
        (state.board.slots[lane.laneId]?.[d] || []).forEach((card, cIdx) => {
          dayAllCards[d].push({
            laneId: lane.laneId,
            meal: lane.meal,
            cIdx,
            dish: card.dish,
            n: norm(card.dish)
          });
        });
      }
    });

    // 3. Per-card checks (Custom Card Tags + Recipe Tags + Active Tab 4 Rules + Imported AI Flags)
    swimlanes.forEach((lane) => {
      for (let d = 0; d < days.length; d++) {
        const cards = state.board.slots[lane.laneId]?.[d] || [];
        const dayMeta = days[d];

        cards.forEach((card, cIdx) => {
          const val = card.dish || "";
          const low = val.toLowerCase();
          const nVal = norm(val);
          const rec = findRecipeForDish(val);

          // Combine card-specific tags and recipe tags
          const combinedTags = new Set([...(card.tags || []), ...(rec?.tags || [])]);
          combinedTags.forEach((t) => {
            if (t === "Functional Food" && activeRuleCodes.has("Rule 1.1")) {
              add(lane.laneId, d, cIdx, { cls: "b-func", text: "⚡ Functional", title: "Rule 1.1: Functional Food" }, false);
            } else if (t === "Athlete Request" && activeRuleCodes.has("Rule 6.2")) {
              add(lane.laneId, d, cIdx, { cls: "b-req", text: "★ Athlete Req", title: "Rule 6.2: Protected Athlete Request" }, false);
            } else if ((card.tags || []).includes(t)) {
              add(lane.laneId, d, cIdx, { cls: "b-bio", text: `🏷️ ${t}`, title: `Tag: ${t}` }, false);
            }
          });

          if (!combinedTags.has("Functional Food") && activeRuleCodes.has("Rule 1.1") &&
              /(turmeric|salmon|halibut|hailbut|cod|ahi|beet|chia|quinoa|qunioa|kale|acai|açaí|tart cherry|ginger|berry|berries)/i.test(val)) {
            add(lane.laneId, d, cIdx, { cls: "b-func", text: "⚡ Functional", title: "Rule 1.1: Functional Food bioactive compound." }, false);
          }

          if (!state.showLiveAudit) return;

          if (activeRuleCodes.has("Rule 1.2") && low.includes("turmeric") && !low.includes("pepper") && !low.includes("piperine")) {
            add(lane.laneId, d, cIdx, {
              cls: "b-bio",
              text: "🔬 +Black Pepper",
              title: "Rule 1.2: Pair curcumin with black pepper (piperine) + lipid for 2,000% bioavailability."
            }, true);
          }

          if (dayMeta && dayMeta.type === "md-1") {
            if (activeRuleCodes.has("Rule 2.2") && /(pesto|almond|pistachio|pecan|walnut)/i.test(val)) {
              add(lane.laneId, d, cIdx, { cls: "b-md1", text: "⚠️ MD-1 Nuts", title: "Rule 2.2: Tree nuts on MD-1." }, true);
            }
            if (activeRuleCodes.has("Rule 2.1") && /(boursin|cream sauce|alfredo|schnitzel)/i.test(val)) {
              add(lane.laneId, d, cIdx, { cls: "b-md1", text: "⚠️ MD-1 Heavy", title: "Rule 2.1: Heavy fat/cream on MD-1." }, true);
            }
            if (activeRuleCodes.has("Rule 2.3") && /(brussle|brussels|cabbage slaw|broccoli)/i.test(val) && lane.meal === "Dinner") {
              add(lane.laneId, d, cIdx, { cls: "b-md1", text: "⚠️ MD-1 Fiber", title: "Rule 2.3: Cruciferous fiber on MD-1 evening." }, true);
            }
          }

          if (activeRuleCodes.has("Rule 3.2") && dayMeta && dayMeta.type === "match" && lane.meal === "Dinner" && /garlic aioli/i.test(val)) {
            add(lane.laneId, d, cIdx, { cls: "b-md1", text: "⚠️ Aioli on Side?", title: "Rule 3.2: Garlic Aioli at Pre-Match." }, true);
          }

          if (activeRuleCodes.has("Rule 4.3")) {
            const sameDayDups = dayAllCards[d].filter((x) => x.n === nVal && !(x.laneId === lane.laneId && x.cIdx === cIdx));
            if (sameDayDups.length > 0 && !low.includes("pancakes with sliced banana")) {
              add(lane.laneId, d, cIdx, { cls: "b-repeat", text: "⚠️ Duplicate Today", title: "Rule 4.3: Dish appears twice on this day." }, true);
            }
          }

          if (activeRuleCodes.has("Rule 4.2") && d > 0 && (lane.meal === "Lunch" || lane.meal === "Dinner")) {
            const prevMatches = dayAllCards[d - 1].filter((x) => x.n === nVal);
            if (prevMatches.length > 0 && !low.includes("rice pilaf")) {
              add(lane.laneId, d, cIdx, { cls: "b-repeat", text: "⚠️ Back-to-Back", title: "Rule 4.2: Served on consecutive days." }, true);
            }
          }

          if (activeRuleCodes.has("Rule 6.1")) {
            const tm = val.match(typoRegex);
            if (tm) {
              add(lane.laneId, d, cIdx, { cls: "b-typo", text: `✏️ "${tm[1]}"`, title: "Rule 6.1: BEO spelling error." }, true);
            }
          }
        });
      }
    });

    // 4. Overlay any explicit AI Audit Flags stored in state.board.aiAuditFlags
    (state.board.aiAuditFlags || []).forEach((af) => {
      add(af.laneId, af.dayIdx, af.cardIdx || 0, {
        cls: "b-streak",
        text: af.badgeText || `🤖 ${af.ruleCode}`,
        title: af.explanation || "Flagged by Gemini AI Audit"
      }, true);
    });

    const elFlags = document.getElementById("statLiveFlags");
    if (elFlags) elFlags.textContent = String(flagCount);

    return badgeMap;
  }

  function getVisibleDays() {
    return (state.board.days || []).filter((d) => {
      if (state.cityFilter === "all") return true;
      if (state.cityFilter === "match") return d.type === "match" || d.type === "md-1";
      return (d.city || "").toLowerCase().includes(state.cityFilter.toLowerCase());
    });
  }

  function getVisibleSwimlanes() {
    return (state.board.swimlanes || []).filter((lane) => {
      if (state.mealFilter === "all") return true;
      return lane.meal === state.mealFilter;
    });
  }

  // Helper to render a single Planning Slot Cell (`td.planning-slot`) used across ALL 3 Pivot Modes!
  function renderSlotCellHtml(lane, d, cardBadges, jumpSet) {
    const dIdx = d.dayIdx;
    const cards = state.board.slots[lane.laneId]?.[dIdx] || [];
    const slotKey = `${lane.laneId}:${dIdx}`;
    const isJump = jumpSet.has(slotKey);

    const slotCls = [
      "planning-slot",
      d.type === "match" ? "slot-match-col" : "",
      isJump ? "slot-jump-highlight" : ""
    ].filter(Boolean).join(" ");

    const cardsHtml = cards
      .map((card, cIdx) => {
        const badges = cardBadges.get(`${lane.laneId}:${dIdx}:${cIdx}`) || [];
        const badgesHtml = badges.length
          ? `<div class="cell-badges">${badges
              .map((b) => `<span class="c-badge ${b.cls}" title="${escapeHtml(b.title)}">${escapeHtml(b.text)}</span>`)
              .join("")}</div>`
          : "";
        const isEdited = card.origDish && card.origDish !== card.dish;
        return `<div class="slot-recipe-card ${isEdited ? "card-edited" : ""}"
          draggable="true"
          data-laneid="${escapeHtml(lane.laneId)}"
          data-dayidx="${dIdx}"
          data-cardidx="${cIdx}">
          <div class="src-top">
            <span class="src-handle" title="Drag card to swap or move">⋮⋮</span>
            <span class="src-name" data-action="open-recipe" title="Click to open BEO Recipe Card">${escapeHtml(card.dish)}</span>
            <div class="src-card-btns">
              <button class="src-icon-btn" data-action="tag-card" title="Add/Edit tags on this card">🏷️</button>
              <button class="src-icon-btn" data-action="remove-card" title="Remove from slot">&times;</button>
            </div>
          </div>
          <div class="src-subrow">
            <span class="src-rowtag">${escapeHtml(card.subTag || lane.title)}</span>
            ${badgesHtml}
          </div>
        </div>`;
      })
      .join("");

    return `<td class="${slotCls}"
      id="slot-${lane.laneId}-${dIdx}"
      data-laneid="${escapeHtml(lane.laneId)}"
      data-dayidx="${dIdx}">
      <div class="slot-cards-wrap">${cardsHtml}</div>
      <button class="slot-add-btn" data-action="quick-add" data-laneid="${escapeHtml(lane.laneId)}" data-dayidx="${dIdx}">＋ Add Recipe</button>
    </td>`;
  }

  function renderDayHeaderInner(d) {
    const badgeHtml = d.gameHeader
      ? `<span class="th-game-banner">⚽ ${escapeHtml(d.gameHeader)}</span>`
      : `<span class="th-md-badge">${escapeHtml(d.md)}</span>`;
    return `<div class="th-top-row">
        ${badgeHtml}
        <div class="th-actions">
          <button class="th-btn" data-action="edit-day" data-dayidx="${d.dayIdx}" title="Edit date, MD, location, or event times">✎</button>
          <button class="th-btn" data-action="delete-day" data-dayidx="${d.dayIdx}" title="Remove day">&times;</button>
        </div>
      </div>
      <span class="th-date-title">${escapeHtml(d.short)}</span>
      <span class="th-city-sub">📍 ${escapeHtml(d.city)}</span>
      ${d.eventTime ? `<span class="th-time-sub">🕒 ${escapeHtml(d.eventTime)}</span>` : ""}`;
  }

  // Render the Planning Board in whichever Pivot Mode is selected!
  function renderPlanningBoard() {
    ensureBoardIntegrity(state.board);
    renderMealFilterPills();

    const thead = document.getElementById("planningThead");
    const tbody = document.getElementById("planningTbody");
    if (!thead || !tbody) return;

    const visibleDays = getVisibleDays();
    const visibleLanes = getVisibleSwimlanes();
    const cardBadges = computeCardBadges();
    const jumpSet = new Set(state.jumpHighlightSlots);
    const mealMap = new Map((state.board.meals || []).map((m) => [m.id, m]));

    // =========================================================================
    // PIVOT MODE 1: Columns = Days × Rows = Meals & Categories (Default)
    // =========================================================================
    if (state.pivotMode === "days-cols") {
      let headHtml = `<tr class="day-header-row">
        <th class="corner-category-header">MEAL &amp; CATEGORY</th>`;
      visibleDays.forEach((d) => {
        const thCls = d.type === "match" ? "th-match-day" : d.type === "md-1" ? "th-md1-day" : "";
        headHtml += `<th class="${thCls}" data-dayidx="${d.dayIdx}">${renderDayHeaderInner(d)}</th>`;
      });
      headHtml += `</tr>`;
      thead.innerHTML = headHtml;

      let bodyHtml = "";
      let currentMealId = "";

      visibleLanes.forEach((lane) => {
        if (lane.meal !== currentMealId) {
          currentMealId = lane.meal;
          const mObj = mealMap.get(currentMealId) || { id: currentMealId, name: currentMealId, icon: "🍴", defaultTime: "" };
          bodyHtml += `<tr class="meal-section-banner-row">
            <td class="banner-sticky-left">
              <div class="banner-header-flex">
                <span>${escapeHtml(mObj.icon || "🍴")} ${escapeHtml(mObj.name)} ${mObj.defaultTime ? `<small style="opacity:0.75">(${escapeHtml(mObj.defaultTime)})</small>` : ""}</span>
                <div class="th-actions">
                  <button class="th-btn" data-action="add-cat-to-meal" data-mealid="${escapeHtml(currentMealId)}" title="Add category row to ${escapeHtml(mObj.name)}">＋Cat</button>
                  <button class="th-btn" data-action="edit-meal" data-mealid="${escapeHtml(currentMealId)}" title="Rename meal or edit time">✎</button>
                  <button class="th-btn" data-action="delete-meal" data-mealid="${escapeHtml(currentMealId)}" title="Delete meal section">&times;</button>
                </div>
              </div>
            </td>`;

          visibleDays.forEach((d) => {
            const dIdx = d.dayIdx;
            const themeVal = (state.board.themes[currentMealId]?.[dIdx] || "").trim();
            bodyHtml += `<td>
              <span class="day-theme-pill" data-edit-theme="${escapeHtml(currentMealId)}" data-dayidx="${dIdx}" title="Click to set/edit ${escapeHtml(mObj.name)} theme or time note">
                🏷️ ${themeVal ? escapeHtml(themeVal) : "Theme / Note..."}
              </span>
            </td>`;
          });
          bodyHtml += `</tr>`;
        }

        bodyHtml += `<tr data-laneid="${escapeHtml(lane.laneId)}">
          <td class="td-swimlane-header">
            <div class="swimlane-top">
              <span class="swimlane-title">${escapeHtml(lane.title)}</span>
              <div class="th-actions">
                <button class="th-btn" data-action="edit-lane" data-laneid="${escapeHtml(lane.laneId)}" title="Rename category">✎</button>
                <button class="th-btn" data-action="delete-lane" data-laneid="${escapeHtml(lane.laneId)}" title="Delete category row">&times;</button>
              </div>
            </div>
            <span class="swimlane-sub">${escapeHtml(lane.subtitle || "")}</span>
          </td>`;

        visibleDays.forEach((d) => {
          bodyHtml += renderSlotCellHtml(lane, d, cardBadges, jumpSet);
        });
        bodyHtml += `</tr>`;
      });

      tbody.innerHTML = bodyHtml;
    }

    // =========================================================================
    // PIVOT MODE 2: Columns = Meals & Categories × Rows = Days (Transposed!)
    // =========================================================================
    else if (state.pivotMode === "meals-cols") {
      let headHtml = `<tr class="day-header-row">
        <th class="corner-category-header">CAMP DAY &amp; EVENT</th>`;
      visibleLanes.forEach((lane) => {
        const mObj = mealMap.get(lane.meal) || { icon: "🍴", name: lane.meal };
        headHtml += `<th>
          <div class="th-top-row">
            <span class="th-md-badge">${escapeHtml(mObj.icon || "🍴")} ${escapeHtml(mObj.name)}</span>
            <div class="th-actions">
              <button class="th-btn" data-action="edit-lane" data-laneid="${escapeHtml(lane.laneId)}">✎</button>
            </div>
          </div>
          <span class="th-date-title">${escapeHtml(lane.title)}</span>
          <span class="th-city-sub">${escapeHtml(lane.subtitle || "")}</span>
        </th>`;
      });
      headHtml += `</tr>`;
      thead.innerHTML = headHtml;

      let bodyHtml = "";
      visibleDays.forEach((d) => {
        bodyHtml += `<tr>
          <td class="td-swimlane-header">${renderDayHeaderInner(d)}</td>`;
        visibleLanes.forEach((lane) => {
          bodyHtml += renderSlotCellHtml(lane, d, cardBadges, jumpSet);
        });
        bodyHtml += `</tr>`;
      });
      tbody.innerHTML = bodyHtml;
    }

    // =========================================================================
    // PIVOT MODE 3: Columns = Meals Side-by-Side × Rows = Category Slots
    // =========================================================================
    else if (state.pivotMode === "day-focus") {
      const meals = (state.board.meals || []).filter((m) => state.mealFilter === "all" || m.id === state.mealFilter);
      const targetDays = state.focusDayIdx >= 0 && state.board.days[state.focusDayIdx]
        ? [state.board.days[state.focusDayIdx]]
        : visibleDays;

      let headHtml = `<tr class="day-header-row">
        <th class="corner-category-header">DAY / CATEGORY SLOT</th>`;
      meals.forEach((m) => {
        headHtml += `<th>
          <div class="th-top-row">
            <span class="th-md-badge">${escapeHtml(m.defaultTime || "Service")}</span>
            <div class="th-actions">
              <button class="th-btn" data-action="add-cat-to-meal" data-mealid="${escapeHtml(m.id)}">＋Cat</button>
              <button class="th-btn" data-action="edit-meal" data-mealid="${escapeHtml(m.id)}">✎</button>
            </div>
          </div>
          <span class="th-date-title">${escapeHtml(m.icon || "🍴")} ${escapeHtml(m.name)}</span>
        </th>`;
      });
      headHtml += `</tr>`;
      thead.innerHTML = headHtml;

      let bodyHtml = "";
      targetDays.forEach((d) => {
        bodyHtml += `<tr class="meal-section-banner-row">
          <td class="banner-sticky-left" colspan="${meals.length + 1}">
            📅 <strong>${escapeHtml(d.short)}</strong> &bull; ${escapeHtml(d.md)} &bull; 📍 ${escapeHtml(d.city)} &bull; 🕒 ${escapeHtml(d.eventTime || "")}
          </td>
        </tr>`;

        // Group swimlanes by meal
        const mealLanes = meals.map((m) => state.board.swimlanes.filter((l) => l.meal === m.id));
        const maxRows = Math.max(1, ...mealLanes.map((arr) => arr.length));

        for (let rIdx = 0; rIdx < maxRows; rIdx++) {
          const rowLabels = mealLanes.map((arr) => arr[rIdx]?.title).filter(Boolean);
          bodyHtml += `<tr>
            <td class="td-swimlane-header">
              <span class="swimlane-title">Category Line ${rIdx + 1}</span>
              <span class="swimlane-sub">${escapeHtml(rowLabels.join(" / "))}</span>
            </td>`;
          meals.forEach((m, mIdx) => {
            const lane = mealLanes[mIdx][rIdx];
            if (lane) {
              bodyHtml += renderSlotCellHtml(lane, d, cardBadges, jumpSet);
            } else {
              bodyHtml += `<td class="planning-slot" style="opacity:0.4; text-align:center; vertical-align:middle;">
                <button class="slot-add-btn" data-action="add-cat-to-meal" data-mealid="${escapeHtml(m.id)}">＋ Add Category to ${escapeHtml(m.name)}</button>
              </td>`;
            }
          });
          bodyHtml += `</tr>`;
        }
      });
      tbody.innerHTML = bodyHtml;
    }

    const elChanges = document.getElementById("statChangesCount");
    if (elChanges) elChanges.textContent = String(state.moveCount);
  }

  // Upgraded Multi-Facet Recipe & Swap Library Renderer
  function renderPaletteDrawer() {
    const listEl = document.getElementById("paletteList");
    const countEl = document.getElementById("paletteResultCount");
    if (!listEl) return;

    const q = state.paletteSearch.toLowerCase().trim();
    const sec = state.paletteSection;
    const dishTypeRegex = state.paletteDishType !== "all" ? new RegExp(state.paletteDishType, "i") : null;
    const pf = state.paletteFilter;

    const filtered = state.recipes.filter((r) => {
      if (sec !== "all" && r.section !== sec) return false;
      if (dishTypeRegex && !dishTypeRegex.test(`${r.name} ${r.category}`)) return false;
      if (pf !== "all") {
        const inTags = r.tags && r.tags.includes(pf);
        const inCat = `${r.category} ${r.section}`.toLowerCase().includes(pf.toLowerCase());
        if (!inTags && !inCat) return false;
      }
      if (q) {
        const hay = `${r.name} ${r.category} ${r.section} ${(r.tags || []).join(" ")} ${(r.ingredients || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      const aSwap = a.tags && a.tags.includes("Swap Recommendation") ? 1 : 0;
      const bSwap = b.tags && b.tags.includes("Swap Recommendation") ? 1 : 0;
      if (aSwap !== bSwap) return bSwap - aSwap;
      return a.id - b.id;
    });

    if (countEl) countEl.textContent = `(${filtered.length} shown)`;

    listEl.innerHTML = filtered
      .map((r) => {
        const isSwap = r.tags && r.tags.includes("Swap Recommendation");
        const tagsHtml = (r.tags || [])
          .slice(0, 4)
          .map((t) => `<span class="c-badge ${t === "Functional Food" || t === "Swap Recommendation" ? "b-func" : "b-bio"}">${escapeHtml(t)}</span>`)
          .join("");
        return `<div class="palette-card ${isSwap ? "swap-rec-card" : ""}" draggable="true" data-dish="${escapeHtml(r.name)}" data-recipeid="${r.id}">
          <div class="p-card-top">
            <span class="p-card-name">⋮⋮ ${escapeHtml(r.name)}</span>
            <div style="display:flex; gap:2px;">
              <button class="cell-act-btn" data-tagrecipe="${r.id}" title="Add/Edit tags on recipe">🏷️</button>
              <button class="cell-act-btn" data-openrecipe="${r.id}" title="View full BEO recipe">📖</button>
            </div>
          </div>
          <div class="p-card-cat">${escapeHtml(r.category)}</div>
          ${tagsHtml ? `<div class="cell-badges">${tagsHtml}</div>` : ""}
        </div>`;
      })
      .join("");
  }

  // Dynamic Structure Builders: Add/Edit/Delete Day, Meal, Category, and Meal Templates
  function handleAddDay() {
    const days = state.board.days;
    const nextNum = days.length + 1;
    const shortDate = window.prompt("Enter Short Date Label (e.g., 'Thu Nov 19'):", `Day ${nextNum}`);
    if (!shortDate) return;
    const mdCode = window.prompt("Enter Match-Day Code (e.g., 'MD-2', 'MD-1', 'MD', 'MD+1'):", `MD+${nextNum}`);
    const city = window.prompt("Enter City / Venue (e.g., 'Cincinnati, OH'):", days[days.length - 1]?.city || "Camp Venue");
    const eventTime = window.prompt("Enter Training / Kickoff / Flight Time (e.g., '11:00 AM Training'):", "11:00 AM Training");

    pushUndo();
    const isMatch = (mdCode || "").toUpperCase() === "MD" || (mdCode || "").toLowerCase().includes("game");
    const isMd1 = (mdCode || "").toUpperCase() === "MD-1";
    days.push({
      dayIdx: days.length,
      id: `day-${Date.now()}`,
      short: shortDate.trim(),
      fullDate: shortDate.trim(),
      md: (mdCode || `Day ${nextNum}`).trim(),
      city: (city || "Camp Venue").trim(),
      hotel: (city || "Team Hotel").trim(),
      type: isMatch ? "match" : isMd1 ? "md-1" : "training",
      gameHeader: isMatch ? mdCode.trim() : "",
      eventTime: (eventTime || "").trim()
    });
    ensureBoardIntegrity(state.board);
    saveCampState();
    renderPlanningBoard();
  }

  function handleEditDay(dIdx) {
    const d = state.board.days[dIdx];
    if (!d) return;
    const shortDate = window.prompt("Date Header:", d.short);
    if (shortDate === null) return;
    const mdCode = window.prompt("MD Code / Game Banner (e.g. MD-3, MD-1, Game Day: Haiti):", d.gameHeader || d.md);
    if (mdCode === null) return;
    const city = window.prompt("City / Location:", d.city);
    if (city === null) return;
    const eventTime = window.prompt("Event / Training / Kickoff / Arrival Time:", d.eventTime || "");
    if (eventTime === null) return;
    const dayType = window.prompt("Day Type ('training', 'md-1', 'match', 'regen', 'travel'):", d.type || "training");

    pushUndo();
    d.short = shortDate.trim() || d.short;
    d.fullDate = d.short;
    d.md = mdCode.trim() || d.md;
    d.city = city.trim() || d.city;
    d.eventTime = eventTime.trim();
    if (dayType) d.type = dayType.trim().toLowerCase();
    d.gameHeader = d.type === "match" ? d.md : "";
    saveCampState();
    renderPlanningBoard();
  }

  function handleDeleteDay(dIdx) {
    const d = state.board.days[dIdx];
    if (!d || state.board.days.length <= 1) return;
    if (!window.confirm(`Remove day column "${d.short} (${d.city})"?`)) return;
    pushUndo();
    state.board.days.splice(dIdx, 1);
    Object.keys(state.board.slots).forEach((lid) => {
      state.board.slots[lid].splice(dIdx, 1);
    });
    Object.keys(state.board.themes).forEach((m) => {
      state.board.themes[m].splice(dIdx, 1);
    });
    ensureBoardIntegrity(state.board);
    saveCampState();
    renderPlanningBoard();
  }

  function handleAddMeal() {
    const name = window.prompt("Enter New Meal Name (e.g., 'Pre-Training Snack', 'Brunch', 'Late-Night Recovery'):");
    if (!name || !name.trim()) return;
    const timeStr = window.prompt("Default Service Time (e.g., '10:00 AM', '03:30 PM'):", "03:30 PM") || "";
    const firstCat = window.prompt(`First Category Row for "${name.trim()}" (e.g., 'Fruits & Smoothies', 'Proteins', 'Carbs'):`, "Main Offerings") || "Main Offerings";

    const mealId = name.trim().replace(/\s+/g, "_");
    const laneId = `lane_${Date.now()}`;
    pushUndo();
    if (!state.board.meals.find((m) => m.id === mealId)) {
      state.board.meals.push({
        id: mealId,
        name: name.trim(),
        icon: "🍴",
        defaultTime: timeStr.trim()
      });
    }
    state.board.swimlanes.push({
      laneId,
      meal: mealId,
      title: firstCat.trim(),
      subtitle: `${name.trim()} category`,
      sourceRows: []
    });
    ensureBoardIntegrity(state.board);
    saveCampState();
    renderPlanningBoard();
  }

  function handleAddCategory(defaultMealId) {
    const meals = state.board.meals || [];
    const mealNames = meals.map((m) => m.id).join(", ");
    const targetMeal = defaultMealId || window.prompt(`Which Meal should this category belong to? (${mealNames}):`, meals[0]?.id || "Breakfast");
    if (!targetMeal) return;
    const catTitle = window.prompt(`Category Name to add under "${targetMeal}" (e.g., 'Fruits', 'Vegetables', 'Carbs & Grains', 'Hydration'):`);
    if (!catTitle || !catTitle.trim()) return;
    const catSub = window.prompt("Subtitle / Description (optional):", "Custom category line") || "";

    pushUndo();
    const laneId = `cat_${Date.now()}`;
    const newLane = {
      laneId,
      meal: targetMeal.trim(),
      title: catTitle.trim(),
      subtitle: catSub.trim(),
      sourceRows: []
    };

    // Insert right after the last swimlane of that meal
    let lastIdx = -1;
    state.board.swimlanes.forEach((l, i) => {
      if (l.meal === newLane.meal) lastIdx = i;
    });
    if (lastIdx >= 0) {
      state.board.swimlanes.splice(lastIdx + 1, 0, newLane);
    } else {
      state.board.swimlanes.push(newLane);
    }

    ensureBoardIntegrity(state.board);
    saveCampState();
    renderPlanningBoard();
  }

  // Save & Load Reusable Meal Templates in PostgreSQL `menu.meal_template`
  async function handleSaveMealTemplate() {
    const name = window.prompt("Template Name to save in PostgreSQL (e.g., 'MD+1 Recovery Setup', 'CONCACAF Travel Layout'):");
    if (!name || !name.trim()) return;
    const locTag = window.prompt("Location / Venue Tag (e.g., 'Atlanta (Trilith / NTC)', 'Kingston, Jamaica', 'Cincinnati, OH'):", "Universal") || "Universal";

    const newTmpl = {
      name: name.trim(),
      location_tag: locTag.trim(),
      meals_json: JSON.parse(JSON.stringify(state.board.meals)),
      swimlanes_json: JSON.parse(JSON.stringify(state.board.swimlanes))
    };

    try {
      const res = await fetch("/api/meal-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTmpl.name,
          locationTag: newTmpl.location_tag,
          meals: newTmpl.meals_json,
          swimlanes: newTmpl.swimlanes_json
        })
      });
      if (res.ok) {
        const out = await res.json();
        if (out.template) {
          state.templates.push(out.template);
          renderTemplateDropdown();
          return;
        }
      }
    } catch (_) {}

    state.templates.push(newTmpl);
    renderTemplateDropdown();
    saveCampState();
  }

  function handleLoadMealTemplate(tmplIdx) {
    const tmpl = state.templates[tmplIdx];
    if (!tmpl) return;
    pushUndo();
    state.board.meals = JSON.parse(JSON.stringify(tmpl.meals_json || DEFAULT_MEALS));
    state.board.swimlanes = JSON.parse(JSON.stringify(tmpl.swimlanes_json || DEFAULT_SWIMLANES));
    ensureBoardIntegrity(state.board);
    saveCampState();
    renderPlanningBoard();
  }

  // Upload Excel Schedule / Menu File -> AI / Smart Parser
  async function handleExcelUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result).split(",")[1] || "";
      try {
        updateSyncStatus("● Parsing...", file.name);
        const res = await fetch("/api/upload-schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, fileBase64: base64 })
        });
        if (res.ok) {
          const out = await res.json();
          if (out.ok && out.board) {
            pushUndo();
            state.campName = file.name.replace(/\.(xlsx|xls|csv)$/i, "");
            state.campSubtitle = `Imported Schedule (${out.board.days.length} Days • ${out.board.meals.length} Meals)`;
            state.board = out.board;
            ensureBoardIntegrity(state.board);
            await saveCampState(true);
            refreshAllViews();
            return;
          }
        }
      } catch (_) {}

      // Client-side SheetJS fallback for GitHub Pages static deployment
      if (window.XLSX) {
        const data = new Uint8Array(await file.arrayBuffer());
        const wb = window.XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (rows.length > 2) {
          pushUndo();
          state.campName = file.name.replace(/\.(xlsx|xls|csv)$/i, "");
          state.campSubtitle = `Imported via SheetJS (${file.name})`;
          await saveCampState(true);
          refreshAllViews();
        }
      }
    };
    reader.readAsDataURL(file);
  }

  // Tag Manager & Card Tagger Modal
  function openTagModal(target) {
    state.tagEditTarget = target;
    const titleEl = document.getElementById("tagModalTitle");
    const eyeEl = document.getElementById("tagModalEyebrow");

    let activeTags = new Set();
    if (target.type === "card") {
      const card = state.board.slots[target.laneId]?.[target.dayIdx]?.[target.cardIdx];
      const rec = findRecipeForDish(card?.dish);
      (card?.tags || []).forEach((t) => activeTags.add(t));
      (rec?.tags || []).forEach((t) => activeTags.add(t));
      if (titleEl) titleEl.textContent = `Tag Dish: ${card?.dish || ""}`;
      if (eyeEl) eyeEl.textContent = "Card & Recipe Tags";
    } else if (target.type === "recipe") {
      const rec = state.recipes.find((r) => r.id === target.recipeId);
      (rec?.tags || []).forEach((t) => activeTags.add(t));
      if (titleEl) titleEl.textContent = `Tag Recipe: ${rec?.name || ""}`;
      if (eyeEl) eyeEl.textContent = "Master Recipe Tags (`menu.recipe`)";
    } else {
      if (titleEl) titleEl.textContent = "Manage Global Recipe & Card Tags";
      if (eyeEl) eyeEl.textContent = "PostgreSQL `menu.tag_catalog`";
    }

    renderTagCheckboxes(activeTags);
    const modal = document.getElementById("tagModal");
    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }
  }

  function renderTagCheckboxes(activeTagsSet) {
    const grid = document.getElementById("tagCheckboxGrid");
    if (!grid) return;
    grid.innerHTML = state.tagsCatalog
      .map((t) => {
        const checked = activeTagsSet.has(t) ? "checked" : "";
        return `<label class="tag-check-item">
          <input type="checkbox" value="${escapeHtml(t)}" ${checked} />
          <span>${escapeHtml(t)}</span>
        </label>`;
      })
      .join("");
  }

  async function saveTagModalSelection() {
    const target = state.tagEditTarget;
    const grid = document.getElementById("tagCheckboxGrid");
    const selected = Array.from(grid?.querySelectorAll("input[type='checkbox']:checked") || []).map((cb) => cb.value);

    if (target?.type === "card") {
      const card = state.board.slots[target.laneId]?.[target.dayIdx]?.[target.cardIdx];
      if (card) {
        pushUndo();
        card.tags = selected;
        const rec = findRecipeForDish(card.dish);
        if (rec) {
          rec.tags = selected;
          fetch("/api/tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipeId: rec.id, recipeTags: selected })
          }).catch(() => {});
        }
        saveCampState();
      }
    } else if (target?.type === "recipe") {
      const rec = state.recipes.find((r) => r.id === target.recipeId);
      if (rec) {
        rec.tags = selected;
        fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId: rec.id, recipeTags: selected })
        }).catch(() => {});
        if (state.modalRecipe && state.modalRecipe.id === rec.id) {
          renderModalContent();
        }
      }
    }

    const modal = document.getElementById("tagModal");
    if (modal) modal.classList.remove("open");
    renderTagPillsEverywhere();
    renderPlanningBoard();
    renderPaletteDrawer();
    renderRecipeBook();
  }

  // Editable USMNT Audit Rules (Tab 4 -> PostgreSQL `menu.audit_rule` -> AI Audit Engine)
  function renderRulesTable() {
    const tbody = document.getElementById("rulesTableBody");
    if (!tbody) return;
    const q = state.rulesSearch.toLowerCase().trim();
    const cat = state.rulesCat;

    const filtered = (state.rules || []).filter((r) => {
      if (cat !== "all" && r.cat !== cat) return false;
      if (q) {
        const hay = `${r.code} ${r.cat} ${r.name} ${r.trigger} ${r.action} ${r.status}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    tbody.innerHTML = filtered
      .map((r) => {
        let stCls = "ok";
        const sl = (r.status || "").toLowerCase();
        if (sl.includes("flag")) stCls = "flagged";
        else if (sl.includes("action") || sl.includes("question")) stCls = "action";
        const isChecked = r.is_active !== false ? "checked" : "";

        return `<tr style="${r.is_active === false ? "opacity:0.48;" : ""}">
          <td>
            <input type="checkbox" data-toggle-rule="${escapeHtml(r.code)}" ${isChecked} title="Enable/Disable rule in Live & AI Audit" />
          </td>
          <td class="rule-code">${escapeHtml(r.code)}</td>
          <td>${escapeHtml(r.cat)}</td>
          <td><strong>${escapeHtml(r.name)}</strong></td>
          <td>${escapeHtml(r.trigger)}</td>
          <td>${escapeHtml(r.action)}</td>
          <td><span class="status-pill ${stCls}">${escapeHtml(r.status || "Active")}</span></td>
          <td>
            <div style="display:flex; gap:4px;">
              <button class="btn-tool" data-edit-rule="${escapeHtml(r.code)}" title="Edit rule">✎</button>
              <button class="btn-tool" data-delete-rule="${escapeHtml(r.code)}" title="Delete rule">&times;</button>
            </div>
          </td>
        </tr>`;
      })
      .join("");
  }

  function openRuleEditModal(ruleCode) {
    state.editingRuleCode = ruleCode || null;
    const existing = state.rules.find((r) => r.code === ruleCode);
    document.getElementById("ruleModalTitle").textContent = existing ? `Edit ${existing.code}` : "Add New USMNT Audit Rule";
    document.getElementById("ruleCodeInput").value = existing ? existing.code : `Rule 6.${state.rules.length + 1}`;
    document.getElementById("rulePillarInput").value = existing ? existing.cat : "1. Functional Foods";
    document.getElementById("ruleNameInput").value = existing ? existing.name : "";
    document.getElementById("ruleTriggerInput").value = existing ? existing.trigger : "";
    document.getElementById("ruleActionInput").value = existing ? existing.action : "";
    document.getElementById("ruleStatusInput").value = existing ? existing.status : "Active";
    document.getElementById("ruleActiveCheck").checked = existing ? existing.is_active !== false : true;

    const modal = document.getElementById("ruleEditModal");
    if (modal) modal.classList.add("open");
  }

  async function saveEditedRule() {
    const code = document.getElementById("ruleCodeInput").value.trim();
    if (!code) return;
    const ruleObj = {
      code,
      cat: document.getElementById("rulePillarInput").value.trim() || "Custom Pillar",
      name: document.getElementById("ruleNameInput").value.trim() || "Custom Audit Rule",
      trigger: document.getElementById("ruleTriggerInput").value.trim(),
      action: document.getElementById("ruleActionInput").value.trim(),
      status: document.getElementById("ruleStatusInput").value.trim() || "Active",
      is_active: document.getElementById("ruleActiveCheck").checked
    };

    const idx = state.rules.findIndex((r) => r.code === (state.editingRuleCode || code));
    if (idx >= 0) state.rules[idx] = ruleObj;
    else state.rules.push(ruleObj);

    try {
      await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert", rule: ruleObj })
      });
    } catch (_) {}

    document.getElementById("ruleEditModal")?.classList.remove("open");
    saveCampState();
    renderRulesTable();
    renderPlanningBoard();
  }

  // Open AI Audit & Gemini 5 Schema Modal
  async function openAiAuditModal() {
    const modal = document.getElementById("aiAuditModal");
    const txtEl = document.getElementById("geminiSchemaTextarea");
    if (modal) modal.classList.add("open");

    const activeRules = state.rules.filter((r) => r.is_active !== false);

    // Build client-side schema immediately, then enrich from /api/ai-audit if server is running
    const localSchema = {
      model: "gemini-2.5-pro / gemini-5-preview",
      skill: "menu-plan-auditor (USMNT Performance Nutrition & Culinary Auditor)",
      camp_name: state.campName,
      active_audit_rules_count: activeRules.length,
      active_audit_rules: activeRules,
      camp_schedule_and_menu: {
        days: state.board.days,
        meals: state.board.meals,
        swimlanes: state.board.swimlanes.map((l) => ({ laneId: l.laneId, meal: l.meal, title: l.title })),
        slots: state.board.slots
      },
      expected_output_schema: {
        flags: [
          {
            laneId: "string (e.g. bf_eggs, lu_proteins, dn_starches)",
            dayIdx: "integer (0..N)",
            cardIdx: "integer (0..M)",
            dish: "string",
            ruleCode: "string (e.g. Rule 1.2, Rule 2.1, Rule 4.1)",
            severity: "warning | action | bio | positive",
            badgeText: "short badge string to display on card",
            explanation: "non-micromanaging discussion note for chef & dietitian"
          }
        ]
      }
    };

    if (txtEl) txtEl.value = JSON.stringify(localSchema, null, 2);

    try {
      const res = await fetch("/api/ai-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: state.board, rules: state.rules })
      });
      if (res.ok) {
        const out = await res.json();
        if (out.geminiPayloadSchema && txtEl) {
          txtEl.value = JSON.stringify(out.geminiPayloadSchema, null, 2);
        }
      }
    } catch (_) {}
  }

  // Clean Up BEO Typos & Add Black Pepper Cofactor
  function cleanUpBeoTypos() {
    const replacements = [
      [/\bBraised Chicken Things\b/gi, "Braised Chicken Thighs)"],
      [/\bThings\b/g, "Thighs"],
      [/\bHailbut\b/gi, "Halibut"],
      [/\bManocati Shels\b/gi, "Manicotti Shells"],
      [/\bLagsana\b/gi, "Lasagna"],
      [/\bRopa Veija\b/gi, "Ropa Vieja"],
      [/\bTajun\b/gi, "Tajín"],
      [/\bStarwberry\b/gi, "Strawberry"],
      [/\bBrussle\b/gi, "Brussels"],
      [/\bQunioa\b/gi, "Quinoa"],
      [/\bOmellet\b/gi, "Omelet"],
      [/\bBurriots\b/gi, "Burritos"],
      [/\bTurmeric\b(?!\s*(?:&|and|with)\s*(?:Cracked\s*)?Black Pepper)/gi, "Turmeric & Cracked Black Pepper"]
    ];

    pushUndo();
    (state.board.swimlanes || []).forEach((lane) => {
      const daySlots = state.board.slots[lane.laneId] || [];
      daySlots.forEach((cards) => {
        (cards || []).forEach((card) => {
          let updated = card.dish;
          replacements.forEach(([regex, rep]) => {
            updated = updated.replace(regex, rep);
          });
          card.dish = updated;
        });
      });
    });

    const friStarches = state.board.slots["lu_starches"]?.[6] || [];
    if (friStarches.length >= 2 && norm(friStarches[0].dish) === "rice pilaf" && norm(friStarches[1].dish) === "rice pilaf") {
      friStarches[1].dish = "Roasted Sweet Potatoes";
    }

    saveCampState();
    renderPlanningBoard();
  }

  // Export XLSX (Dynamic for any Days / Meals / Categories!)
  function exportXlsx() {
    if (!window.XLSX) return;
    const days = state.board.days || [];
    const aoa = [];
    aoa.push([state.campName, "", ...days.map((d) => d.gameHeader || d.md)]);
    aoa.push(["Meal", "Category", ...days.map((d) => `${d.short} (${d.city}) [${d.eventTime || ""}]`)]);

    let prevMeal = "";
    (state.board.swimlanes || []).forEach((lane) => {
      const mLabel = lane.meal !== prevMeal ? lane.meal : "";
      prevMeal = lane.meal;
      const rowCells = days.map((_, dIdx) => {
        const cards = state.board.slots[lane.laneId]?.[dIdx] || [];
        return cards.map((c) => c.dish).join(" • ");
      });
      aoa.push([mLabel, lane.title, ...rowCells]);
    });

    const ws = window.XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 18 }, { wch: 28 }, ...days.map(() => ({ wch: 32 }))];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Camp Menu Plan");
    window.XLSX.writeFile(wb, `${state.campName.replace(/[^a-z0-9]+/gi, "_")}.xlsx`);
  }

  // Quick Add Recipe Modal
  function openQuickAddModal(laneId, dayIdx) {
    state.quickAddTarget = { laneId, dayIdx };
    const lane = state.board.swimlanes.find((l) => l.laneId === laneId);
    const day = state.board.days[dayIdx];
    const ctxEl = document.getElementById("qaModalContext");
    if (ctxEl) ctxEl.textContent = `${day ? day.short : ""} • ${lane ? lane.title : ""}`;
    const inp = document.getElementById("qaInput");
    if (inp) inp.value = "";
    renderQuickAddSuggestions("");
    const modal = document.getElementById("quickAddModal");
    if (modal) {
      modal.classList.add("open");
      setTimeout(() => inp?.focus(), 50);
    }
  }

  function closeQuickAddModal() {
    document.getElementById("quickAddModal")?.classList.remove("open");
    state.quickAddTarget = null;
  }

  function renderQuickAddSuggestions(query) {
    const container = document.getElementById("qaSuggestions");
    if (!container) return;
    const q = (query || "").toLowerCase().trim();
    const matches = state.recipes
      .filter((r) => !q || `${r.name} ${r.category}`.toLowerCase().includes(q))
      .slice(0, 12);

    container.innerHTML = matches
      .map(
        (r) => `<div class="qa-item" data-pickdish="${escapeHtml(r.name)}">
          <span><strong>${escapeHtml(r.name)}</strong></span>
          <span class="p-card-cat">${escapeHtml(r.category)}</span>
        </div>`
      )
      .join("");
  }

  function confirmQuickAdd(dishName) {
    const target = state.quickAddTarget;
    const clean = (dishName || "").trim();
    if (!target || !clean) return;
    const lane = state.board.swimlanes.find((l) => l.laneId === target.laneId);
    pushUndo();
    state.board.slots[target.laneId][target.dayIdx].push({
      id: `c_${nextCardId++}`,
      dish: clean,
      subTag: lane?.title || "Added",
      tags: [],
      origDish: ""
    });
    saveCampState();
    renderPlanningBoard();
    closeQuickAddModal();
  }

  // Scale ingredient quantities dynamically for 1x, 2x, 3x
  function scaleIngredientText(text, factor) {
    if (factor === 1) return text;
    return text.replace(/(\d+(?:\.\d+)?)/g, (match, numStr, offset, fullStr) => {
      const after = fullStr.slice(offset + match.length, offset + match.length + 4);
      if (after.startsWith("°") || after.startsWith("%")) return match;
      const val = parseFloat(numStr);
      if (isNaN(val)) return match;
      const scaled = val * factor;
      return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, "");
    });
  }

  function openRecipeModal(recipe) {
    if (!recipe) return;
    state.modalRecipe = recipe;
    state.modalScale = state.globalScale || 1;
    renderModalContent();
    document.getElementById("recipeModal")?.classList.add("open");
  }

  function closeRecipeModal() {
    document.getElementById("recipeModal")?.classList.remove("open");
  }

  function renderModalContent() {
    const r = state.modalRecipe;
    if (!r) return;
    const factor = state.modalScale;

    document.getElementById("modalRecipeCategory").textContent = `${r.section} • ${r.category}`;
    document.getElementById("modalRecipeTitle").textContent = `#${r.id}. ${r.name}`;
    document.getElementById("modalYieldLabel").textContent = `${factor * 10} Athlete Portions (${factor}x Batch)`;

    document.querySelectorAll("[data-mscale]").forEach((btn) => {
      btn.classList.toggle("active", parseInt(btn.dataset.mscale, 10) === factor);
    });

    const tagsEl = document.getElementById("modalRecipeTags");
    tagsEl.innerHTML = (r.tags || [])
      .map((t) => `<span class="mini-tag ${t === "Functional Food" ? "func" : ""}">${escapeHtml(t)}</span>`)
      .join("");

    const ingList = document.getElementById("modalIngredientsList");
    ingList.innerHTML = (r.ingredients || [])
      .map((ing) => `<li>${escapeHtml(scaleIngredientText(ing, factor))}</li>`)
      .join("");

    const stepList = document.getElementById("modalStepsList");
    stepList.innerHTML = (r.steps || []).map((st) => `<li>${escapeHtml(st)}</li>`).join("");

    document.getElementById("modalClinicalNotes").textContent = r.notes || "";
  }

  // Render Master Recipe Book Tab
  function renderRecipeBook() {
    const container = document.getElementById("recipeGridContainer");
    const metaEl = document.getElementById("recipeResultsMeta");
    if (!container) return;

    const q = state.recipeSearch.toLowerCase().trim();
    const sec = state.recipeSection;
    const tag = state.recipeTag;
    const factor = state.globalScale;

    const filtered = state.recipes.filter((r) => {
      if (sec !== "all" && r.section !== sec) return false;
      if (tag !== "all" && !(r.tags || []).includes(tag)) return false;
      if (q) {
        const hay = `${r.name} ${r.category} ${r.notes} ${(r.ingredients || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (metaEl) {
      metaEl.textContent = `Showing ${filtered.length} of ${state.recipes.length} recipes (Scaled to ${factor * 10} Athlete Portions / ${factor}x Batch)`;
    }

    container.innerHTML = filtered
      .map((r) => {
        const previewIngs = (r.ingredients || [])
          .slice(0, 3)
          .map((i) => escapeHtml(scaleIngredientText(i, factor)))
          .join(" • ");
        const tagsHtml = (r.tags || [])
          .map((t) => `<span class="mini-tag ${t === "Functional Food" ? "func" : ""}">${escapeHtml(t)}</span>`)
          .join("");

        return `<article class="recipe-card" data-recipeid="${r.id}">
          <div>
            <div class="rc-num">RECIPE #${r.id} &bull; ${factor * 10} PORTIONS</div>
            <h3 class="rc-title">${escapeHtml(r.name)}</h3>
            <div class="rc-cat">${escapeHtml(r.category)}</div>
          </div>
          <div class="rc-ings-preview">${previewIngs}</div>
          <div class="rc-footer">
            <div class="rc-tags">${tagsHtml}</div>
          </div>
        </article>`;
      })
      .join("");
  }

  const rowIdToLaneId = new Map();
  DEFAULT_SWIMLANES.forEach((lane) => {
    (lane.sourceRows || []).forEach((sr) => rowIdToLaneId.set(sr.rowId, lane.laneId));
  });

  function renderAuditView() {
    function renderCardList(items, targetId) {
      const el = document.getElementById(targetId);
      if (!el) return;
      el.innerHTML = items
        .map((item) => {
          const slotKeys = (item.targetCells || []).map((tc) => {
            const lid = rowIdToLaneId.get(tc.rowId) || "bf_eggs";
            return `${lid}:${tc.dayIdx}`;
          });
          const targetsJson = escapeHtml(JSON.stringify(slotKeys));
          return `<div class="audit-card">
            <div class="ac-top">
              <div class="ac-title">${escapeHtml(item.title)}</div>
              <span class="ac-rule-badge">${escapeHtml(item.rule)}</span>
            </div>
            <div class="ac-finding">${escapeHtml(item.finding)}</div>
            <div class="ac-detail">${escapeHtml(item.detail)}</div>
            <div class="ac-question">💬 <strong>Discussion Prompt:</strong> ${escapeHtml(item.question)}</div>
            <div class="ac-days">
              <button class="day-jump-btn" data-jumpslots="${targetsJson}">🎯 Highlight in Planning Board &rarr;</button>
            </div>
          </div>`;
        })
        .join("");
    }

    renderCardList(DATA.audit.dietitian || [], "dietitianAuditList");
    renderCardList(DATA.audit.culinary || [], "culinaryAuditList");
  }

  function refreshAllViews() {
    renderCampDropdown();
    renderTemplateDropdown();
    renderTagPillsEverywhere();
    renderPlanningBoard();
    renderPaletteDrawer();
    renderRecipeBook();
    renderAuditView();
    renderRulesTable();
  }

  function initEvents() {
    // Tab switching
    document.querySelectorAll(".nav-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        state.activeTab = tab;
        document.querySelectorAll(".nav-tab").forEach((b) => b.classList.toggle("active", b === btn));
        document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === `tab-${tab}`));
      });
    });

    // Camp Selector & New Camp / Edit Camp Meta / Upload Excel
    document.getElementById("campSelect")?.addEventListener("change", (e) => {
      const id = parseInt(e.target.value, 10);
      const found = state.camps.find((c) => c.camp_id === id);
      if (found) {
        state.activeCampId = found.camp_id;
        state.campName = found.name;
        state.campSubtitle = found.subtitle || "";
        state.board = JSON.parse(JSON.stringify(found.board_json));
        ensureBoardIntegrity(state.board);
        refreshAllViews();
      }
    });

    document.getElementById("btnNewCamp")?.addEventListener("click", async () => {
      const name = window.prompt("New Camp Name (e.g., 'March 2027 Camp', 'Gold Cup 2027 Prep'):");
      if (!name || !name.trim()) return;
      const sub = window.prompt("Camp Subtitle / Dates & Cities:", "Dates & Locations TBD") || "";
      state.campName = name.trim();
      state.campSubtitle = sub.trim();
      state.board = JSON.parse(JSON.stringify(BASELINE_BOARD));
      ensureBoardIntegrity(state.board);
      state.moveCount = 0;
      await saveCampState(true);
      refreshAllViews();
    });

    document.getElementById("btnEditCampMeta")?.addEventListener("click", () => {
      const name = window.prompt("Camp Name:", state.campName);
      if (name === null) return;
      const sub = window.prompt("Camp Subtitle / Window:", state.campSubtitle);
      if (sub === null) return;
      state.campName = name.trim() || state.campName;
      state.campSubtitle = sub.trim();
      saveCampState();
      renderCampDropdown();
    });

    document.getElementById("excelUploadInput")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) handleExcelUpload(file);
    });

    // Pivot Mode Selector
    document.getElementById("pivotModeSelect")?.addEventListener("change", (e) => {
      state.pivotMode = e.target.value;
      renderPlanningBoard();
    });

    document.getElementById("focusDaySelect")?.addEventListener("change", (e) => {
      state.focusDayIdx = parseInt(e.target.value, 10);
      renderPlanningBoard();
    });

    // Meal Template Load & Save
    document.getElementById("mealTemplateSelect")?.addEventListener("change", (e) => {
      if (e.target.value === "") return;
      const idx = parseInt(e.target.value, 10);
      handleLoadMealTemplate(idx);
      e.target.value = "";
    });

    document.getElementById("btnSaveMealTemplate")?.addEventListener("click", handleSaveMealTemplate);

    // Dynamic Structure Buttons (+Day, +Meal, +Category, Tags)
    document.getElementById("btnAddDay")?.addEventListener("click", handleAddDay);
    document.getElementById("btnAddMeal")?.addEventListener("click", handleAddMeal);
    document.getElementById("btnAddCategory")?.addEventListener("click", () => handleAddCategory());
    document.getElementById("btnManageTags")?.addEventListener("click", () => openTagModal({ type: "global" }));

    // AI Audit & Schema Buttons
    document.getElementById("btnOpenAiAudit")?.addEventListener("click", openAiAuditModal);
    document.getElementById("statLiveFlagsPill")?.addEventListener("click", openAiAuditModal);
    document.getElementById("btnRunAiFromRules")?.addEventListener("click", openAiAuditModal);

    document.getElementById("aiModalCloseBtn")?.addEventListener("click", () => document.getElementById("aiAuditModal")?.classList.remove("open"));
    document.getElementById("aiModalDoneBtn")?.addEventListener("click", () => document.getElementById("aiAuditModal")?.classList.remove("open"));

    document.getElementById("btnCopyGeminiSchema")?.addEventListener("click", () => {
      const txt = document.getElementById("geminiSchemaTextarea")?.value || "";
      navigator.clipboard.writeText(txt).then(() => {
        const b = document.getElementById("btnCopyGeminiSchema");
        b.textContent = "✅ Copied Gemini Schema!";
        setTimeout(() => (b.textContent = "📋 Copy Gemini Schema & Prompt"), 1800);
      });
    });

    document.getElementById("btnDownloadGeminiSchema")?.addEventListener("click", () => {
      const txt = document.getElementById("geminiSchemaTextarea")?.value || "{}";
      const blob = new Blob([txt], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "usmnt_gemini5_audit_schema.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("btnApplyGeminiFlags")?.addEventListener("click", () => {
      const raw = document.getElementById("geminiImportInput")?.value || "";
      try {
        const parsed = JSON.parse(raw);
        const flags = Array.isArray(parsed) ? parsed : parsed.flags || [];
        state.board.aiAuditFlags = flags;
        saveCampState();
        renderPlanningBoard();
        document.getElementById("aiAuditModal")?.classList.remove("open");
      } catch (err) {
        window.alert("Invalid JSON format. Expected { \"flags\": [...] }");
      }
    });

    // Undo / Redo / Clean Up / Save DB / Export
    document.getElementById("btnUndo")?.addEventListener("click", undo);
    document.getElementById("btnRedo")?.addEventListener("click", redo);
    document.getElementById("btnAutoFixTypos")?.addEventListener("click", cleanUpBeoTypos);
    document.getElementById("btnSavePostgres")?.addEventListener("click", () => saveCampState(false));
    document.getElementById("btnExportXlsx")?.addEventListener("click", exportXlsx);

    // Subtoolbar Filters & Library Dock Position
    document.getElementById("cityFilterGroup")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-city]");
      if (!btn) return;
      state.cityFilter = btn.dataset.city;
      document.querySelectorAll("#cityFilterGroup .filter-pill").forEach((b) => b.classList.toggle("active", b === btn));
      renderPlanningBoard();
    });

    document.getElementById("mealFilterGroup")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-meal]");
      if (!btn) return;
      state.mealFilter = btn.dataset.meal;
      renderPlanningBoard();
    });

    document.getElementById("dropModeGroup")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-dropmode]");
      if (!btn) return;
      state.dropMode = btn.dataset.dropmode;
      document.querySelectorAll("#dropModeGroup .filter-pill").forEach((b) => b.classList.toggle("active", b === btn));
    });

    document.getElementById("liveAuditToggle")?.addEventListener("change", (e) => {
      state.showLiveAudit = e.target.checked;
      renderPlanningBoard();
    });

    document.getElementById("dockPositionGroup")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-dock]");
      if (!btn) return;
      state.dockMode = btn.dataset.dock;
      document.querySelectorAll("#dockPositionGroup .filter-pill").forEach((b) => b.classList.toggle("active", b === btn));
      const ws = document.getElementById("plannerWorkspace");
      if (ws) {
        ws.className = `planner-workspace dock-${state.dockMode}`;
      }
    });

    // Planning Grid Header & Body Delegated Clicks + Drag-and-Drop
    const gridEl = document.getElementById("planningGrid");
    if (gridEl) {
      gridEl.addEventListener("click", (e) => {
        const actEl = e.target.closest("[data-action]");
        if (actEl) {
          const act = actEl.dataset.action;
          if (act === "edit-day") {
            handleEditDay(parseInt(actEl.dataset.dayidx, 10));
            return;
          }
          if (act === "delete-day") {
            handleDeleteDay(parseInt(actEl.dataset.dayidx, 10));
            return;
          }
          if (act === "add-cat-to-meal") {
            handleAddCategory(actEl.dataset.mealid);
            return;
          }
          if (act === "edit-meal") {
            const mId = actEl.dataset.mealid;
            const mObj = state.board.meals.find((m) => m.id === mId);
            if (!mObj) return;
            const newName = window.prompt("Meal Name:", mObj.name);
            if (newName === null) return;
            const newTime = window.prompt("Default Service Time:", mObj.defaultTime || "");
            pushUndo();
            mObj.name = newName.trim() || mObj.name;
            if (newTime !== null) mObj.defaultTime = newTime.trim();
            saveCampState();
            renderPlanningBoard();
            return;
          }
          if (act === "delete-meal") {
            const mId = actEl.dataset.mealid;
            if (!window.confirm(`Delete entire "${mId}" meal section and its categories?`)) return;
            pushUndo();
            state.board.meals = state.board.meals.filter((m) => m.id !== mId);
            state.board.swimlanes = state.board.swimlanes.filter((l) => l.meal !== mId);
            saveCampState();
            renderPlanningBoard();
            return;
          }
          if (act === "edit-lane") {
            const lid = actEl.dataset.laneid;
            const lane = state.board.swimlanes.find((l) => l.laneId === lid);
            if (!lane) return;
            const newTitle = window.prompt("Category Row Name:", lane.title);
            if (newTitle === null) return;
            const newSub = window.prompt("Category Subtitle:", lane.subtitle || "");
            pushUndo();
            lane.title = newTitle.trim() || lane.title;
            if (newSub !== null) lane.subtitle = newSub.trim();
            saveCampState();
            renderPlanningBoard();
            return;
          }
          if (act === "delete-lane") {
            const lid = actEl.dataset.laneid;
            const lane = state.board.swimlanes.find((l) => l.laneId === lid);
            if (!lane || !window.confirm(`Remove category row "${lane.title}"?`)) return;
            pushUndo();
            state.board.swimlanes = state.board.swimlanes.filter((l) => l.laneId !== lid);
            saveCampState();
            renderPlanningBoard();
            return;
          }
          if (act === "quick-add") {
            openQuickAddModal(actEl.dataset.laneid, parseInt(actEl.dataset.dayidx, 10));
            return;
          }
        }

        // Edit daily theme pill
        const themePill = e.target.closest("[data-edit-theme]");
        if (themePill) {
          const meal = themePill.dataset.editTheme;
          const dIdx = parseInt(themePill.dataset.dayidx, 10);
          if (!state.board.themes[meal]) state.board.themes[meal] = [];
          const current = state.board.themes[meal][dIdx] || "";
          const next = window.prompt(`Update ${meal} Theme / Service Note for ${state.board.days[dIdx]?.short || ""}:`, current);
          if (next !== null) {
            pushUndo();
            state.board.themes[meal][dIdx] = next.trim();
            saveCampState();
            renderPlanningBoard();
          }
          return;
        }

        const cardEl = e.target.closest(".slot-recipe-card");
        if (!cardEl) return;
        const laneId = cardEl.dataset.laneid;
        const dIdx = parseInt(cardEl.dataset.dayidx, 10);
        const cIdx = parseInt(cardEl.dataset.cardidx, 10);
        const card = state.board.slots[laneId]?.[dIdx]?.[cIdx];
        if (!card) return;

        if (e.target.closest('[data-action="remove-card"]')) {
          e.stopPropagation();
          pushUndo();
          state.board.slots[laneId][dIdx].splice(cIdx, 1);
          saveCampState();
          renderPlanningBoard();
          return;
        }

        if (e.target.closest('[data-action="tag-card"]')) {
          e.stopPropagation();
          openTagModal({ type: "card", laneId, dayIdx: dIdx, cardIdx: cIdx });
          return;
        }

        if (e.target.closest('[data-action="open-recipe"]')) {
          const lane = state.board.swimlanes.find((l) => l.laneId === laneId);
          openRecipeModal(getOrSynthesizeRecipe(card.dish, lane?.title));
        }
      });

      // Drag & Drop inside Planning Grid
      gridEl.addEventListener("dragstart", (e) => {
        const cardEl = e.target.closest(".slot-recipe-card");
        if (!cardEl) return;
        const laneId = cardEl.dataset.laneid;
        const dIdx = parseInt(cardEl.dataset.dayidx, 10);
        const cIdx = parseInt(cardEl.dataset.cardidx, 10);
        const card = state.board.slots[laneId]?.[dIdx]?.[cIdx];
        if (!card) return;

        state.dragData = {
          source: "slot",
          laneId,
          dayIdx: dIdx,
          cardIdx: cIdx,
          dish: card.dish,
          subTag: card.subTag,
          tags: card.tags || []
        };
        cardEl.classList.add("card-dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", card.dish);
        }
      });

      gridEl.addEventListener("dragend", () => {
        document.querySelectorAll(".card-dragging, .card-drop-target, .slot-drag-over").forEach((el) => {
          el.classList.remove("card-dragging", "card-drop-target", "slot-drag-over");
        });
      });

      gridEl.addEventListener("dragover", (e) => {
        const slotEl = e.target.closest(".planning-slot");
        if (!slotEl || !slotEl.dataset.laneid) return;
        e.preventDefault();
        const overCard = e.target.closest(".slot-recipe-card");
        document.querySelectorAll(".card-drop-target").forEach((el) => {
          if (el !== overCard) el.classList.remove("card-drop-target");
        });
        if (overCard && state.dropMode === "swap") {
          overCard.classList.add("card-drop-target");
          slotEl.classList.remove("slot-drag-over");
        } else {
          slotEl.classList.add("slot-drag-over");
        }
      });

      gridEl.addEventListener("dragleave", (e) => {
        const slotEl = e.target.closest(".planning-slot");
        if (slotEl && !slotEl.contains(e.relatedTarget)) {
          slotEl.classList.remove("slot-drag-over");
        }
        const overCard = e.target.closest(".slot-recipe-card");
        if (overCard && !overCard.contains(e.relatedTarget)) {
          overCard.classList.remove("card-drop-target");
        }
      });

      gridEl.addEventListener("drop", (e) => {
        const slotEl = e.target.closest(".planning-slot");
        if (!slotEl || !slotEl.dataset.laneid || !state.dragData) return;
        e.preventDefault();

        document.querySelectorAll(".card-dragging, .card-drop-target, .slot-drag-over").forEach((el) => {
          el.classList.remove("card-dragging", "card-drop-target", "slot-drag-over");
        });

        const dstLaneId = slotEl.dataset.laneid;
        const dstDayIdx = parseInt(slotEl.dataset.dayidx, 10);
        const overCardEl = e.target.closest(".slot-recipe-card");
        const dstCardIdx = overCardEl ? parseInt(overCardEl.dataset.cardidx, 10) : -1;

        const drag = state.dragData;
        state.dragData = null;

        const dstLane = state.board.swimlanes.find((l) => l.laneId === dstLaneId);
        const defaultTag = dstLane?.title || "Item";

        if (drag.source === "slot") {
          if (drag.laneId === dstLaneId && drag.dayIdx === dstDayIdx && drag.cardIdx === dstCardIdx) return;
          pushUndo();
          const srcCards = state.board.slots[drag.laneId][drag.dayIdx];
          const dstCards = state.board.slots[dstLaneId][dstDayIdx];

          if (dstCardIdx >= 0 && state.dropMode === "swap") {
            const srcCard = srcCards[drag.cardIdx];
            const dstCard = dstCards[dstCardIdx];
            const tmpDish = srcCard.dish;
            const tmpTags = srcCard.tags;
            srcCard.dish = dstCard.dish;
            srcCard.tags = dstCard.tags;
            dstCard.dish = tmpDish;
            dstCard.tags = tmpTags;
          } else {
            const [movedCard] = srcCards.splice(drag.cardIdx, 1);
            movedCard.subTag = defaultTag;
            if (dstCardIdx >= 0) dstCards.splice(dstCardIdx, 0, movedCard);
            else dstCards.push(movedCard);
          }
          saveCampState();
          renderPlanningBoard();
        } else if (drag.source === "palette") {
          pushUndo();
          const dstCards = state.board.slots[dstLaneId][dstDayIdx];
          if (dstCardIdx >= 0 && state.dropMode === "swap") {
            dstCards[dstCardIdx].dish = drag.dish;
          } else {
            dstCards.push({
              id: `c_${nextCardId++}`,
              dish: drag.dish,
              subTag: defaultTag,
              tags: [],
              origDish: ""
            });
          }
          saveCampState();
          renderPlanningBoard();
        }
      });
    }

    // Upgraded Palette Searcher & Custom Drag Events
    const pSecSelect = document.getElementById("paletteSectionSelect");
    const rSecSelect = document.getElementById("sectionFilterSelect");
    const sections = Array.from(new Set(state.recipes.map((r) => r.section)));
    sections.forEach((s) => {
      if (pSecSelect) {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        pSecSelect.appendChild(opt);
      }
      if (rSecSelect) {
        const opt2 = document.createElement("option");
        opt2.value = s;
        opt2.textContent = s;
        rSecSelect.appendChild(opt2);
      }
    });

    pSecSelect?.addEventListener("change", () => {
      state.paletteSection = pSecSelect.value;
      renderPaletteDrawer();
    });

    document.getElementById("paletteDishTypeSelect")?.addEventListener("change", (e) => {
      state.paletteDishType = e.target.value;
      renderPaletteDrawer();
    });

    document.getElementById("paletteSearchInput")?.addEventListener("input", (e) => {
      state.paletteSearch = e.target.value;
      renderPaletteDrawer();
    });

    document.getElementById("paletteFilterPills")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pfilter]");
      if (!btn) return;
      state.paletteFilter = btn.dataset.pfilter;
      renderTagPillsEverywhere();
      renderPaletteDrawer();
    });

    document.getElementById("customDishInput")?.addEventListener("input", (e) => {
      const val = e.target.value.trim() || "Chicken Sausage & Fresh Berries";
      const chip = document.getElementById("customDraggableChip");
      const txt = document.getElementById("customChipText");
      if (chip) chip.dataset.dish = val;
      if (txt) txt.textContent = val;
    });

    document.getElementById("customDraggableChip")?.addEventListener("dragstart", (e) => {
      const dish = e.currentTarget.dataset.dish || "Chicken Sausage & Fresh Berries";
      state.dragData = { source: "palette", dish };
      if (e.dataTransfer) e.dataTransfer.setData("text/plain", dish);
    });

    const paletteList = document.getElementById("paletteList");
    if (paletteList) {
      paletteList.addEventListener("dragstart", (e) => {
        const card = e.target.closest(".palette-card");
        if (!card) return;
        const dish = card.dataset.dish;
        state.dragData = { source: "palette", dish };
        if (e.dataTransfer) e.dataTransfer.setData("text/plain", dish);
      });

      paletteList.addEventListener("click", (e) => {
        const tagBtn = e.target.closest("[data-tagrecipe]");
        if (tagBtn) {
          e.stopPropagation();
          openTagModal({ type: "recipe", recipeId: parseInt(tagBtn.dataset.tagrecipe, 10) });
          return;
        }
        const openBtn = e.target.closest("[data-openrecipe]");
        const card = e.target.closest(".palette-card");
        const id = openBtn ? parseInt(openBtn.dataset.openrecipe, 10) : card ? parseInt(card.dataset.recipeid, 10) : null;
        if (id) {
          const rec = state.recipes.find((r) => r.id === id);
          if (rec) openRecipeModal(rec);
        }
      });
    }

    // Tag Manager Modal Events
    document.getElementById("tagModalCloseBtn")?.addEventListener("click", () => document.getElementById("tagModal")?.classList.remove("open"));
    document.getElementById("tagModalDoneBtn")?.addEventListener("click", saveTagModalSelection);
    document.getElementById("btnCreateNewTag")?.addEventListener("click", async () => {
      const inp = document.getElementById("newTagNameInput");
      const val = (inp?.value || "").trim();
      if (!val) return;
      if (!state.tagsCatalog.includes(val)) {
        state.tagsCatalog.push(val);
      }
      inp.value = "";
      try {
        await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagName: val, colorClass: "b-bio", categoryGroup: "Custom" })
        });
      } catch (_) {}
      const checkedNow = new Set(
        Array.from(document.querySelectorAll("#tagCheckboxGrid input:checked")).map((c) => c.value)
      );
      checkedNow.add(val);
      renderTagCheckboxes(checkedNow);
      renderTagPillsEverywhere();
    });

    document.getElementById("btnTagThisRecipe")?.addEventListener("click", () => {
      if (state.modalRecipe) {
        openTagModal({ type: "recipe", recipeId: state.modalRecipe.id });
      }
    });

    // Editable Audit Rules Events (Tab 4)
    document.getElementById("btnAddRule")?.addEventListener("click", () => openRuleEditModal(null));
    document.getElementById("ruleModalCloseBtn")?.addEventListener("click", () => document.getElementById("ruleEditModal")?.classList.remove("open"));
    document.getElementById("ruleModalCancelBtn")?.addEventListener("click", () => document.getElementById("ruleEditModal")?.classList.remove("open"));
    document.getElementById("ruleModalSaveBtn")?.addEventListener("click", saveEditedRule);

    document.getElementById("rulesTableBody")?.addEventListener("click", async (e) => {
      const toggleCb = e.target.closest("[data-toggle-rule]");
      if (toggleCb) {
        const code = toggleCb.dataset.toggleRule;
        const r = state.rules.find((x) => x.code === code);
        if (r) {
          r.is_active = toggleCb.checked;
          fetch("/api/rules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "upsert", rule: r })
          }).catch(() => {});
          saveCampState();
          renderRulesTable();
          renderPlanningBoard();
        }
        return;
      }

      const editBtn = e.target.closest("[data-edit-rule]");
      if (editBtn) {
        openRuleEditModal(editBtn.dataset.editRule);
        return;
      }

      const delBtn = e.target.closest("[data-delete-rule]");
      if (delBtn) {
        const code = delBtn.dataset.deleteRule;
        if (!window.confirm(`Delete audit rule "${code}"?`)) return;
        state.rules = state.rules.filter((x) => x.code !== code);
        fetch("/api/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", code })
        }).catch(() => {});
        saveCampState();
        renderRulesTable();
        renderPlanningBoard();
      }
    });

    document.getElementById("rulesSearchInput")?.addEventListener("input", (e) => {
      state.rulesSearch = e.target.value;
      renderRulesTable();
    });

    document.getElementById("rulesCatFilter")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (!btn) return;
      state.rulesCat = btn.dataset.cat;
      document.querySelectorAll("#rulesCatFilter .filter-pill").forEach((b) => b.classList.toggle("active", b === btn));
      renderRulesTable();
    });

    // Quick Add Modal Events
    document.getElementById("qaCloseBtn")?.addEventListener("click", closeQuickAddModal);
    document.getElementById("qaCancelBtn")?.addEventListener("click", closeQuickAddModal);
    document.getElementById("qaInput")?.addEventListener("input", (e) => renderQuickAddSuggestions(e.target.value));
    document.getElementById("qaInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmQuickAdd(e.target.value);
      }
    });
    document.getElementById("qaConfirmBtn")?.addEventListener("click", () => {
      confirmQuickAdd(document.getElementById("qaInput")?.value || "");
    });
    document.getElementById("qaSuggestions")?.addEventListener("click", (e) => {
      const item = e.target.closest("[data-pickdish]");
      if (item) confirmQuickAdd(item.dataset.pickdish);
    });

    // Master Recipe Book Tab Events
    rSecSelect?.addEventListener("change", () => {
      state.recipeSection = rSecSelect.value;
      renderRecipeBook();
    });
    document.getElementById("recipeSearchInput")?.addEventListener("input", (e) => {
      state.recipeSearch = e.target.value;
      renderRecipeBook();
    });
    document.getElementById("recipeTagBar")?.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-tag]");
      if (!chip) return;
      state.recipeTag = chip.dataset.tag;
      renderTagPillsEverywhere();
      renderRecipeBook();
    });
    document.getElementById("globalScaleGroup")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-scale]");
      if (!btn) return;
      state.globalScale = parseInt(btn.dataset.scale, 10);
      document.querySelectorAll("#globalScaleGroup .filter-pill").forEach((b) => b.classList.toggle("active", b === btn));
      renderRecipeBook();
    });
    document.getElementById("recipeGridContainer")?.addEventListener("click", (e) => {
      const card = e.target.closest(".recipe-card");
      if (!card) return;
      const id = parseInt(card.dataset.recipeid, 10);
      const rec = state.recipes.find((r) => r.id === id);
      if (rec) openRecipeModal(rec);
    });

    // Audit Jump to Slots
    document.getElementById("tab-audit")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-jumpslots]");
      if (!btn) return;
      try {
        const slots = JSON.parse(btn.dataset.jumpslots || "[]");
        state.jumpHighlightSlots = slots;
        state.cityFilter = "all";
        state.mealFilter = "all";
        document.querySelector('.nav-tab[data-tab="planner"]')?.click();
        renderPlanningBoard();
        if (slots.length > 0) {
          const [laneId, dIdx] = slots[0].split(":");
          setTimeout(() => {
            document.getElementById(`slot-${laneId}-${dIdx}`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          }, 80);
        }
      } catch (_) {}
    });

    // Recipe Modal Controls
    document.getElementById("modalCloseBtn")?.addEventListener("click", closeRecipeModal);
    document.getElementById("modalDoneBtn")?.addEventListener("click", closeRecipeModal);
    document.querySelectorAll("[data-mscale]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.modalScale = parseInt(btn.dataset.mscale, 10);
        renderModalContent();
      });
    });

    document.getElementById("copyRecipeBtn")?.addEventListener("click", () => {
      const r = state.modalRecipe;
      if (!r) return;
      const f = state.modalScale;
      const text = [
        `USMNT BEO RECIPE #${r.id}: ${r.name.toUpperCase()}`,
        `Category: ${r.section} | ${r.category}`,
        `Yield: ${f * 10} Athlete Portions (${f}x Batch)`,
        ``,
        `INGREDIENTS:`,
        ...(r.ingredients || []).map((i) => `- ${scaleIngredientText(i, f)}`),
        ``,
        `CULINARY PREPARATION & BEO EXECUTION:`,
        ...(r.steps || []).map((s, idx) => `${idx + 1}. ${s}`),
        ``,
        `PERFORMANCE NUTRITION NOTES:`,
        r.notes
      ].join("\n");
      navigator.clipboard.writeText(text);
    });
  }

  initEvents();
  refreshAllViews();
  bootstrapFromPostgres();
})();
