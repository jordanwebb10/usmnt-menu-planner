(function () {
  const DATA = window.MENU_DATA || { days: [], excelRows: [], recipes: [], audit: { dietitian: [], culinary: [] }, rules: [] };

  // Normalize string for recipe lookup
  function norm(s) {
    return (s || "")
      .toLowerCase()
      .replace(/\(.*?\)/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  const recipeByNormName = new Map();
  DATA.recipes.forEach((r) => {
    recipeByNormName.set(norm(r.name), r);
  });

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
    for (const r of DATA.recipes) {
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

  // Define the clean Category Swimlanes (Rows of our Planning Grid)
  const SWIMLANES = [
    // BREAKFAST
    {
      laneId: "bf_eggs",
      meal: "Breakfast",
      title: "Eggs & Specialty Eggs",
      subtitle: "Scrambles & Specialty Egg Dishes",
      sourceRows: [
        { rowId: "bf_scramble", tag: "Scramble" },
        { rowId: "bf_spec_egg", tag: "Specialty Egg" }
      ]
    },
    {
      laneId: "bf_vegan",
      meal: "Breakfast",
      title: "Breakfast Vegan",
      subtitle: "Plant-Based Morning Entree",
      sourceRows: [{ rowId: "bf_vegan", tag: "Vegan" }]
    },
    {
      laneId: "bf_sides",
      meal: "Breakfast",
      title: "Meats & Potato Sides",
      subtitle: "Bacon/Sausage & Roasted Potatoes/Hash",
      sourceRows: [
        { rowId: "bf_side_meat", tag: "Meat" },
        { rowId: "bf_side_potato", tag: "Potato" }
      ]
    },
    {
      laneId: "bf_griddle",
      meal: "Breakfast",
      title: "Griddle Specials",
      subtitle: "Pancakes, Waffles & French Toast",
      sourceRows: [{ rowId: "bf_special", tag: "Griddle" }]
    },
    {
      laneId: "bf_oats",
      meal: "Breakfast",
      title: "Overnight Oats, Chia & Bakery",
      subtitle: "Cold Oats, Chia Puddings & Breads",
      sourceRows: [
        { rowId: "bf_oats_1", tag: "Oats/Chia" },
        { rowId: "bf_oats_2", tag: "Bakery/Oats" }
      ]
    },

    // LUNCH
    {
      laneId: "lu_proteins",
      meal: "Lunch",
      title: "Lunch Proteins",
      subtitle: "Poultry, Fish/Seafood & Meat Entrees",
      sourceRows: [
        { rowId: "lu_prot_1", tag: "Protein 1" },
        { rowId: "lu_prot_2", tag: "Protein 2" },
        { rowId: "lu_prot_3", tag: "Protein 3" }
      ]
    },
    {
      laneId: "lu_vegan",
      meal: "Lunch",
      title: "Lunch Plant-Based",
      subtitle: "Vegan Entree",
      sourceRows: [{ rowId: "lu_vegan", tag: "Vegan" }]
    },
    {
      laneId: "lu_veggies",
      meal: "Lunch",
      title: "Lunch Vegetables",
      subtitle: "Hot Vegetable Sides",
      sourceRows: [
        { rowId: "lu_veg_1", tag: "Veg 1" },
        { rowId: "lu_veg_2", tag: "Veg 2" }
      ]
    },
    {
      laneId: "lu_starches",
      meal: "Lunch",
      title: "Lunch Starches & Grains",
      subtitle: "Rice, Risotto, Farro & Potatoes",
      sourceRows: [
        { rowId: "lu_starch_1", tag: "Starch 1" },
        { rowId: "lu_starch_2", tag: "Starch 2" }
      ]
    },
    {
      laneId: "lu_salad_soup",
      meal: "Lunch",
      title: "Lunch Salad & Soup",
      subtitle: "Composed Salad & Daily Soup",
      sourceRows: [
        { rowId: "lu_salad", tag: "Salad" },
        { rowId: "lu_soup", tag: "Soup" }
      ]
    },
    {
      laneId: "lu_station_special",
      meal: "Lunch",
      title: "Lunch Station & Special",
      subtitle: "Action Station & Chef Special",
      sourceRows: [
        { rowId: "lu_station", tag: "Action Station" },
        { rowId: "lu_special", tag: "Chef Special" }
      ]
    },

    // DINNER / PRE-MATCH
    {
      laneId: "dn_proteins",
      meal: "Dinner",
      title: "Dinner / Pre-Match Proteins",
      subtitle: "Poultry, Fish/Seafood & Meat Entrees",
      sourceRows: [
        { rowId: "dn_prot_1", tag: "Protein 1" },
        { rowId: "dn_prot_2", tag: "Protein 2" },
        { rowId: "dn_prot_3", tag: "Protein 3" }
      ]
    },
    {
      laneId: "dn_vegan",
      meal: "Dinner",
      title: "Dinner Plant-Based",
      subtitle: "Vegan Entree",
      sourceRows: [{ rowId: "dn_vegan", tag: "Vegan" }]
    },
    {
      laneId: "dn_veggies",
      meal: "Dinner",
      title: "Dinner Vegetables",
      subtitle: "Hot Vegetable Sides",
      sourceRows: [
        { rowId: "dn_veg_1", tag: "Veg 1" },
        { rowId: "dn_veg_2", tag: "Veg 2" }
      ]
    },
    {
      laneId: "dn_starches",
      meal: "Dinner",
      title: "Dinner Starches & Grains",
      subtitle: "Rice, Noodles, Risotto & Potatoes",
      sourceRows: [
        { rowId: "dn_starch_1", tag: "Starch 1" },
        { rowId: "dn_starch_2", tag: "Starch 2" }
      ]
    },
    {
      laneId: "dn_salad_soup",
      meal: "Dinner",
      title: "Dinner Salad & Soup",
      subtitle: "Composed Salad & Evening Soup",
      sourceRows: [
        { rowId: "dn_salad", tag: "Salad" },
        { rowId: "dn_soup", tag: "Soup" }
      ]
    },
    {
      laneId: "dn_station_special",
      meal: "Dinner",
      title: "Dinner Station, Special & Dessert",
      subtitle: "Action Station, Chef Special & Dessert",
      sourceRows: [
        { rowId: "dn_station", tag: "Action Station" },
        { rowId: "dn_special", tag: "Chef Special" },
        { rowId: "dn_dessert", tag: "Dessert" }
      ]
    },

    // POST-MATCH
    {
      laneId: "pm_mains",
      meal: "Post-Match",
      title: "Post-Match Mains & Stations",
      subtitle: "Recovery Proteins, Pizza/Sushi & Açaí Station",
      sourceRows: [
        { rowId: "pm_prot_1", tag: "Main 1" },
        { rowId: "pm_prot_2", tag: "Main 2" },
        { rowId: "pm_prot_3", tag: "Main 3" },
        { rowId: "pm_station", tag: "Station" },
        { rowId: "pm_dessert", tag: "Recovery Station" }
      ]
    },
    {
      laneId: "pm_sides",
      meal: "Post-Match",
      title: "Post-Match Sides & Salads",
      subtitle: "Recovery Starches, Vegetables & Salad",
      sourceRows: [
        { rowId: "pm_veg_1", tag: "Side" },
        { rowId: "pm_veg_2", tag: "Side" },
        { rowId: "pm_starch_1", tag: "Starch" },
        { rowId: "pm_starch_2", tag: "Starch" },
        { rowId: "pm_salad", tag: "Salad" }
      ]
    }
  ];

  // Build initial board state from DATA.excelRows
  // board.slots[laneId][dayIdx] = Array of { cardId, dish, subTag, isOriginal }
  // board.themes.Lunch[dayIdx], board.themes.Dinner[dayIdx]
  let nextCardId = 1;
  function buildBoardFromExcelRows(excelRows) {
    const rowMap = new Map();
    excelRows.forEach((r) => rowMap.set(r.rowId, r.cells));

    const slots = {};
    SWIMLANES.forEach((lane) => {
      slots[lane.laneId] = Array.from({ length: 12 }, (_, dIdx) => {
        const cards = [];
        lane.sourceRows.forEach((sr) => {
          const val = (rowMap.get(sr.rowId)?.[dIdx] || "").trim();
          if (val && val !== "No Station" && val !== "No Special" && !val.startsWith("N/A")) {
            cards.push({
              id: `c_${nextCardId++}`,
              dish: val,
              subTag: sr.tag,
              origDish: val
            });
          }
        });
        return cards;
      });
    });

    const themes = {
      Lunch: [...(rowMap.get("lu_theme") || Array(12).fill(""))],
      Dinner: [...(rowMap.get("dn_theme") || Array(12).fill(""))]
    };

    return { slots, themes };
  }

  // Convert board state back into excelRows format for .XLSX export and server persistence
  function syncBoardToExcelRows(board, templateRows) {
    const updatedRows = JSON.parse(JSON.stringify(templateRows));
    const rowById = new Map();
    updatedRows.forEach((r) => rowById.set(r.rowId, r));

    // Update themes
    if (rowById.has("lu_theme")) rowById.get("lu_theme").cells = [...board.themes.Lunch];
    if (rowById.has("dn_theme")) rowById.get("dn_theme").cells = [...board.themes.Dinner];

    // Map swimlane cards back into their sourceRows
    SWIMLANES.forEach((lane) => {
      const srList = lane.sourceRows;
      for (let d = 0; d < 12; d++) {
        const cards = board.slots[lane.laneId][d] || [];
        srList.forEach((sr, idx) => {
          const rObj = rowById.get(sr.rowId);
          if (!rObj) return;
          if (idx < cards.length) {
            if (idx === srList.length - 1 && cards.length > srList.length) {
              // Join any extra cards added to the slot with " / "
              rObj.cells[d] = cards.slice(idx).map((c) => c.dish).join(" / ");
            } else {
              rObj.cells[d] = cards[idx].dish;
            }
          } else {
            rObj.cells[d] = "";
          }
        });
      }
    });

    return updatedRows;
  }

  const BASELINE_BOARD = buildBoardFromExcelRows(DATA.excelRows);

  const state = {
    activeTab: "planner",
    cityFilter: "all",
    mealFilter: "all",
    dropMode: "swap", // 'swap' or 'move'
    showLiveAudit: true,
    paletteOpen: true,
    paletteSearch: "",
    paletteFilter: "all",
    board: JSON.parse(JSON.stringify(BASELINE_BOARD)),
    undoStack: [],
    redoStack: [],
    moveCount: 0,
    dragData: null, // { source: 'slot'|'palette', laneId, dayIdx, cardIdx, dish, subTag }
    jumpHighlightSlots: [], // Array of `${laneId}:${dayIdx}`
    quickAddTarget: null, // { laneId, dayIdx }
    // Recipe Book tab state
    recipeSearch: "",
    recipeSection: "all",
    recipeTag: "all",
    globalScale: 1,
    modalRecipe: null,
    modalScale: 1,
    // Rules tab state
    rulesSearch: "",
    rulesCat: "all"
  };

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initDatalist() {
    const dl = document.getElementById("allRecipesDatalist");
    if (!dl) return;
    dl.innerHTML = DATA.recipes
      .map((r) => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.category)}</option>`)
      .join("");
  }

  // Persistence (Server + LocalStorage)
  async function loadSavedState() {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        if (data && data.board && data.board.slots) {
          state.board = data.board;
          state.moveCount = data.moveCount || 0;
          renderPlanningBoard();
          updateSyncStatus("● Live", "Server Synced");
          return;
        } else if (data && Array.isArray(data.excelRows)) {
          state.board = buildBoardFromExcelRows(data.excelRows);
          state.moveCount = data.editCount || 0;
          renderPlanningBoard();
          updateSyncStatus("● Live", "Server Synced");
          return;
        }
      }
    } catch (_) {}

    try {
      const local = localStorage.getItem("usmnt_nov2026_board_v2");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && parsed.board && parsed.board.slots) {
          state.board = parsed.board;
          state.moveCount = parsed.moveCount || 0;
          renderPlanningBoard();
        }
      }
    } catch (_) {}
  }

  async function persistState() {
    const elChanges = document.getElementById("statChangesCount");
    if (elChanges) elChanges.textContent = String(state.moveCount);

    const syncedExcelRows = syncBoardToExcelRows(state.board, DATA.excelRows);
    const payload = {
      days: DATA.days,
      board: state.board,
      excelRows: syncedExcelRows,
      moveCount: state.moveCount,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem("usmnt_nov2026_board_v2", JSON.stringify(payload));
    } catch (_) {}

    try {
      updateSyncStatus("● Saving...", "Syncing");
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) updateSyncStatus("● Live", "Saved");
    } catch (_) {
      updateSyncStatus("● Local", "Browser Saved");
    }
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
    persistState();
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
    persistState();
    renderPlanningBoard();
  }

  // Real-time Dynamic USMNT Audit Badges on Cards
  function computeCardBadges() {
    // Returns Map: `${laneId}:${dayIdx}:${cardIdx}` -> array of badge objects
    const badgeMap = new Map();
    let flagCount = 0;

    function add(laneId, dIdx, cIdx, badge, isWarn = false) {
      const k = `${laneId}:${dIdx}:${cIdx}`;
      if (!badgeMap.has(k)) badgeMap.set(k, []);
      badgeMap.get(k).push(badge);
      if (isWarn) flagCount++;
    }

    const typoRegex = /\b(Things|Hailbut|Manocati|Shels|Lagsana|Veija|Tajun|Starwberry|Brussle|Qunioa|Omellet|Burriots)\b/i;

    // 1. Check horizontal streaks (>3 consecutive days of identical dish in same swimlane)
    SWIMLANES.forEach((lane) => {
      const daySlots = state.board.slots[lane.laneId];
      // Collect all distinct normalized dishes in this lane
      const dishDays = new Map(); // normDish -> array of { dIdx, cIdx }
      for (let d = 0; d < 12; d++) {
        (daySlots[d] || []).forEach((card, cIdx) => {
          const n = norm(card.dish);
          if (!n) return;
          if (!dishDays.has(n)) dishDays.set(n, []);
          dishDays.get(n).push({ dIdx: d, cIdx });
        });
      }

      dishDays.forEach((occurrences) => {
        // Find consecutive day runs
        let run = [occurrences[0]];
        for (let i = 1; i <= occurrences.length; i++) {
          const cur = occurrences[i];
          const prev = occurrences[i - 1];
          if (cur && cur.dIdx === prev.dIdx + 1) {
            run.push(cur);
          } else if (cur && cur.dIdx === prev.dIdx) {
            run.push(cur);
          } else {
            const uniqueDays = new Set(run.map((x) => x.dIdx)).size;
            if (uniqueDays > 3 && state.showLiveAudit) {
              run.forEach((occ) => {
                add(lane.laneId, occ.dIdx, occ.cIdx, {
                  cls: "b-streak",
                  text: `⚠️ ${uniqueDays}d Streak`,
                  title: `Rule 4.1: Appears ${uniqueDays} days in a row. Drag another item here to rotate.`
                }, true);
              });
            }
            if (cur) run = [cur];
          }
        }
      });
    });

    // 2. Build day-level dish list for Same-Day / Back-to-Back Repeat detection
    const dayAllCards = Array.from({ length: 12 }, () => []);
    SWIMLANES.forEach((lane) => {
      for (let d = 0; d < 12; d++) {
        (state.board.slots[lane.laneId][d] || []).forEach((card, cIdx) => {
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

    // 3. Per-card checks
    SWIMLANES.forEach((lane) => {
      for (let d = 0; d < 12; d++) {
        const cards = state.board.slots[lane.laneId][d] || [];
        const dayMeta = DATA.days[d];

        cards.forEach((card, cIdx) => {
          const val = card.dish || "";
          const low = val.toLowerCase();
          const nVal = norm(val);

          // Functional Food badge
          const rec = findRecipeForDish(val);
          if ((rec && rec.tags && rec.tags.includes("Functional Food")) ||
              /(turmeric|salmon|halibut|hailbut|cod|ahi|beet|chia|quinoa|qunioa|kale|acai|açaí|tart cherry|ginger|berry|berries)/i.test(val)) {
            add(lane.laneId, d, cIdx, {
              cls: "b-func",
              text: "⚡ Functional",
              title: "Rule 1.1: Functional Food bioactive ingredient."
            }, false);
          }

          // Protected Athlete Request
          if (low.includes("pancakes with sliced banana") && dayMeta && dayMeta.type === "match") {
            add(lane.laneId, d, cIdx, {
              cls: "b-req",
              text: "★ Athlete Req",
              title: "Rule 6.2: Protected Match-Day Athlete Request."
            }, false);
          }

          if (!state.showLiveAudit) return;

          // Turmeric bioavailability
          if (low.includes("turmeric") && !low.includes("pepper") && !low.includes("piperine")) {
            add(lane.laneId, d, cIdx, {
              cls: "b-bio",
              text: "🔬 +Black Pepper",
              title: "Rule 1.2: Pair curcumin with black pepper (piperine) + lipid for 2,000% bioavailability."
            }, true);
          }

          // MD-1 Checks
          if (dayMeta && dayMeta.type === "md-1") {
            if (/(pesto|almond|pistachio|pecan|walnut)/i.test(val)) {
              add(lane.laneId, d, cIdx, {
                cls: "b-md1",
                text: "⚠️ MD-1 Nuts",
                title: "Rule 2.1/2.2: Tree nuts on MD-1. Serve on side or swap for clean carb/protein."
              }, true);
            }
            if (/(boursin|cream sauce|alfredo|schnitzel)/i.test(val)) {
              add(lane.laneId, d, cIdx, {
                cls: "b-md1",
                text: "⚠️ MD-1 Heavy",
                title: "Rule 2.1/2.3: Heavy cream/cheese on MD-1 slows glycogen loading."
              }, true);
            }
            if (/(brussle|brussels|cabbage slaw|broccoli)/i.test(val) && lane.meal === "Dinner") {
              add(lane.laneId, d, cIdx, {
                cls: "b-md1",
                text: "⚠️ MD-1 Fiber",
                title: "Rule 2.3: Cruciferous vegetable on MD-1 evening."
              }, true);
            }
          }

          // Pre-Match Garlic Aioli
          if (dayMeta && dayMeta.type === "match" && lane.meal === "Dinner" && /garlic aioli/i.test(val)) {
            add(lane.laneId, d, cIdx, {
              cls: "b-md1",
              text: "⚠️ Aioli on Side?",
              title: "Rule 3.2: Garlic Aioli on Pre-Match sandwich."
            }, true);
          }

          // Same-day duplicate
          const sameDayDups = dayAllCards[d].filter(
            (x) => x.n === nVal && !(x.laneId === lane.laneId && x.cIdx === cIdx)
          );
          if (sameDayDups.length > 0 && !low.includes("pancakes with sliced banana")) {
            add(lane.laneId, d, cIdx, {
              cls: "b-repeat",
              text: "⚠️ Duplicate Today",
              title: "Rule 4.3: Dish appears more than once on this same day."
            }, true);
          }

          // Back-to-back day repeat (Lunch/Dinner)
          if (d > 0 && (lane.meal === "Lunch" || lane.meal === "Dinner")) {
            const prevMatches = dayAllCards[d - 1].filter((x) => x.n === nVal);
            if (prevMatches.length > 0 && !low.includes("rice pilaf")) {
              add(lane.laneId, d, cIdx, {
                cls: "b-repeat",
                text: "⚠️ Back-to-Back",
                title: "Rule 4.2/4.3: Served on two consecutive days."
              }, true);
            }
          }

          // BEO Typos
          const tm = val.match(typoRegex);
          if (tm) {
            add(lane.laneId, d, cIdx, {
              cls: "b-typo",
              text: `✏️ "${tm[1]}"`,
              title: "Rule 6.1: BEO typo — click '✨ Clean Up BEOs' to fix."
            }, true);
          }
        });
      }
    });

    const elFlags = document.getElementById("statLiveFlags");
    if (elFlags) elFlags.textContent = String(flagCount);

    return badgeMap;
  }

  function getVisibleDays() {
    return DATA.days.filter((d) => {
      if (state.cityFilter === "all") return true;
      if (state.cityFilter === "match") return d.type === "match" || d.type === "md-1";
      return d.city.toLowerCase().includes(state.cityFilter.toLowerCase());
    });
  }

  function getVisibleSwimlanes() {
    return SWIMLANES.filter((lane) => {
      if (state.mealFilter === "all") return true;
      return lane.meal === state.mealFilter;
    });
  }

  // Render the Visual Drag-and-Drop Menu Planning Grid
  function renderPlanningBoard() {
    const thead = document.getElementById("planningThead");
    const tbody = document.getElementById("planningTbody");
    if (!thead || !tbody) return;

    const visibleDays = getVisibleDays();
    const visibleLanes = getVisibleSwimlanes();
    const cardBadges = computeCardBadges();
    const jumpSet = new Set(state.jumpHighlightSlots);

    // 1. Render Sticky Day Column Headers
    let headHtml = `<tr class="day-header-row">
      <th class="corner-category-header">MEAL &amp; CATEGORY</th>`;

    visibleDays.forEach((d) => {
      const thCls = d.type === "match" ? "th-match-day" : d.type === "md-1" ? "th-md1-day" : "";
      const badgeHtml = d.gameHeader
        ? `<span class="th-game-banner">⚽ ${escapeHtml(d.gameHeader)}</span>`
        : `<span class="th-md-badge">${escapeHtml(d.md)}</span>`;

      headHtml += `<th class="${thCls}" data-dayidx="${d.dayIdx}">
        <div class="th-top-row">${badgeHtml}</div>
        <span class="th-date-title">${escapeHtml(d.short)}</span>
        <span class="th-city-sub">📍 ${escapeHtml(d.city)}</span>
      </th>`;
    });
    headHtml += `</tr>`;
    thead.innerHTML = headHtml;

    // 2. Render Meal Section Banners + Swimlane Rows
    let bodyHtml = "";
    let currentMeal = "";

    const mealIcons = {
      Breakfast: "🍳 BREAKFAST",
      Lunch: "🥗 LUNCH",
      Dinner: "🍽️ DINNER / PRE-MATCH MEAL",
      "Post-Match": "⚽ POST-MATCH RECOVERY MEAL"
    };

    visibleLanes.forEach((lane) => {
      if (lane.meal !== currentMeal) {
        currentMeal = lane.meal;
        bodyHtml += `<tr class="meal-section-banner-row banner-${escapeHtml(currentMeal)}">
          <td class="banner-sticky-left">${mealIcons[currentMeal] || escapeHtml(currentMeal)}</td>`;

        visibleDays.forEach((d) => {
          const dIdx = d.dayIdx;
          if (currentMeal === "Lunch" || currentMeal === "Dinner") {
            const themeVal = (state.board.themes[currentMeal]?.[dIdx] || "").trim();
            bodyHtml += `<td>
              <span class="day-theme-pill" data-edit-theme="${currentMeal}" data-dayidx="${dIdx}" title="Click to change daily ${currentMeal} theme">
                🏷️ ${themeVal ? escapeHtml(themeVal) : "Set Theme..."}
              </span>
            </td>`;
          } else {
            bodyHtml += `<td></td>`;
          }
        });
        bodyHtml += `</tr>`;
      }

      bodyHtml += `<tr data-laneid="${lane.laneId}">
        <td class="td-swimlane-header">
          <span class="swimlane-title">${escapeHtml(lane.title)}</span>
          <span class="swimlane-sub">${escapeHtml(lane.subtitle)}</span>
        </td>`;

      visibleDays.forEach((d) => {
        const dIdx = d.dayIdx;
        const cards = state.board.slots[lane.laneId]?.[dIdx] || [];
        const slotKey = `${lane.laneId}:${dIdx}`;
        const isJump = jumpSet.has(slotKey);

        const slotCls = [
          "planning-slot",
          d.type === "match" ? "slot-match-col" : "",
          isJump ? "slot-jump-highlight" : ""
        ]
          .filter(Boolean)
          .join(" ");

        const cardsHtml = cards
          .map((card, cIdx) => {
            const badges = cardBadges.get(`${lane.laneId}:${dIdx}:${cIdx}`) || [];
            const badgesHtml = badges.length
              ? `<div class="cell-badges">${badges
                  .map((b) => `<span class="c-badge ${b.cls}" title="${escapeHtml(b.title)}">${escapeHtml(b.text)}</span>`)
                  .join("")}</div>`
              : "";

            const isEdited = card.origDish !== card.dish;
            return `<div class="slot-recipe-card ${isEdited ? "card-edited" : ""}"
              draggable="true"
              data-laneid="${lane.laneId}"
              data-dayidx="${dIdx}"
              data-cardidx="${cIdx}">
              <div class="src-top">
                <span class="src-handle" title="Drag recipe card to any day or category">⋮⋮</span>
                <span class="src-name" data-action="open-recipe" title="Click to view BEO Recipe Card">${escapeHtml(card.dish)}</span>
                <button class="src-remove-btn" data-action="remove-card" title="Remove from slot">&times;</button>
              </div>
              <div class="src-subrow">
                <span class="src-rowtag">${escapeHtml(card.subTag || lane.meal)}</span>
                ${badgesHtml}
              </div>
            </div>`;
          })
          .join("");

        bodyHtml += `<td class="${slotCls}"
          id="slot-${lane.laneId}-${dIdx}"
          data-laneid="${lane.laneId}"
          data-dayidx="${dIdx}">
          <div class="slot-cards-wrap">${cardsHtml}</div>
          <button class="slot-add-btn" data-action="quick-add" data-laneid="${lane.laneId}" data-dayidx="${dIdx}">＋ Add Recipe</button>
        </td>`;
      });

      bodyHtml += `</tr>`;
    });

    tbody.innerHTML = bodyHtml;
    const elChanges = document.getElementById("statChangesCount");
    if (elChanges) elChanges.textContent = String(state.moveCount);
  }

  // Render Right-Hand Recipe Library Drawer
  function renderPaletteDrawer() {
    const listEl = document.getElementById("paletteList");
    if (!listEl) return;

    const q = state.paletteSearch.toLowerCase().trim();
    const pf = state.paletteFilter;

    const filtered = DATA.recipes.filter((r) => {
      if (pf !== "all") {
        const inTags = r.tags && r.tags.includes(pf);
        const inCat = (r.category + " " + r.section).toLowerCase().includes(pf.toLowerCase());
        if (!inTags && !inCat) return false;
      }
      if (q) {
        const hay = `${r.name} ${r.category} ${r.section} ${(r.ingredients || []).join(" ")}`.toLowerCase();
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

    listEl.innerHTML = filtered
      .map((r) => {
        const isSwap = r.tags && r.tags.includes("Swap Recommendation");
        const tagsHtml = (r.tags || [])
          .slice(0, 3)
          .map((t) => `<span class="c-badge ${t === "Functional Food" || t === "Swap Recommendation" ? "b-func" : "b-bio"}">${escapeHtml(t)}</span>`)
          .join("");
        return `<div class="palette-card ${isSwap ? "swap-rec-card" : ""}" draggable="true" data-dish="${escapeHtml(r.name)}" data-recipeid="${r.id}">
          <div class="p-card-top">
            <span class="p-card-name">⋮⋮ ${escapeHtml(r.name)}</span>
            <button class="cell-act-btn" data-openrecipe="${r.id}" title="View full BEO recipe">📖</button>
          </div>
          <div class="p-card-cat">${escapeHtml(r.category)}</div>
          ${tagsHtml ? `<div class="cell-badges">${tagsHtml}</div>` : ""}
        </div>`;
      })
      .join("");
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
    SWIMLANES.forEach((lane) => {
      for (let d = 0; d < 12; d++) {
        const cards = state.board.slots[lane.laneId][d] || [];
        cards.forEach((card) => {
          let updated = card.dish;
          replacements.forEach(([regex, rep]) => {
            updated = updated.replace(regex, rep);
          });
          card.dish = updated;
        });
      }
    });

    // Deduplicate Rice Pilaf on Fri Nov 13 Lunch Starches
    const friStarches = state.board.slots["lu_starches"]?.[6] || [];
    if (friStarches.length >= 2 && norm(friStarches[0].dish) === "rice pilaf" && norm(friStarches[1].dish) === "rice pilaf") {
      friStarches[1].dish = "Roasted Sweet Potatoes";
    }

    persistState();
    renderPlanningBoard();
  }

  // Export XLSX (works 100% client-side on GitHub Pages via SheetJS, with server fallback)
  async function exportXlsx() {
    const syncedExcelRows = syncBoardToExcelRows(state.board, DATA.excelRows);

    if (window.XLSX) {
      const aoa = [];
      aoa.push(["MNT November 2026 Camp", "", ...DATA.days.map((d) => d.gameHeader || d.md)]);
      aoa.push(["Section", "Category / Line", ...DATA.days.map((d) => `${d.fullDate} (${d.city})`)]);
      let prevSec = "";
      syncedExcelRows.forEach((r) => {
        const secLabel = r.section !== prevSec ? r.section : "";
        prevSec = r.section;
        aoa.push([secLabel, r.label, ...r.cells.map((c) => c || "")]);
      });

      const ws = window.XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [
        { wch: 16 },
        { wch: 28 },
        ...DATA.days.map(() => ({ wch: 30 }))
      ];
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "MNT Nov 2026 Menu");
      window.XLSX.writeFile(wb, "USMNT_Nov_2026_Menu_Plan.xlsx");
      return;
    }

    try {
      const res = await fetch("/api/export.xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: DATA.days, excelRows: syncedExcelRows })
      });
      if (!res.ok) throw new Error("XLSX export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "USMNT_Nov_2026_Menu_Plan.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {}
  }

  // Quick Add Recipe Modal
  function openQuickAddModal(laneId, dayIdx) {
    state.quickAddTarget = { laneId, dayIdx };
    const lane = SWIMLANES.find((l) => l.laneId === laneId);
    const day = DATA.days[dayIdx];
    const ctxEl = document.getElementById("qaModalContext");
    if (ctxEl) ctxEl.textContent = `${day ? day.short : ""} • ${lane ? lane.title : ""}`;
    const inp = document.getElementById("qaInput");
    if (inp) inp.value = "";
    renderQuickAddSuggestions("");
    const modal = document.getElementById("quickAddModal");
    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      setTimeout(() => inp?.focus(), 50);
    }
  }

  function closeQuickAddModal() {
    const modal = document.getElementById("quickAddModal");
    if (modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
    state.quickAddTarget = null;
  }

  function renderQuickAddSuggestions(query) {
    const container = document.getElementById("qaSuggestions");
    if (!container) return;
    const q = (query || "").toLowerCase().trim();
    const matches = DATA.recipes
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
    const lane = SWIMLANES.find((l) => l.laneId === target.laneId);
    pushUndo();
    state.board.slots[target.laneId][target.dayIdx].push({
      id: `c_${nextCardId++}`,
      dish: clean,
      subTag: lane?.sourceRows?.[0]?.tag || "Added",
      origDish: ""
    });
    persistState();
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

  // Open Recipe Modal
  function openRecipeModal(recipe) {
    if (!recipe) return;
    state.modalRecipe = recipe;
    state.modalScale = state.globalScale || 1;
    renderModalContent();
    const modal = document.getElementById("recipeModal");
    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }
  }

  function closeRecipeModal() {
    const modal = document.getElementById("recipeModal");
    if (modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
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

    const filtered = DATA.recipes.filter((r) => {
      if (sec !== "all" && r.section !== sec) return false;
      if (tag !== "all" && !(r.tags || []).includes(tag)) return false;
      if (q) {
        const hay = `${r.name} ${r.category} ${r.notes} ${(r.ingredients || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (metaEl) {
      metaEl.textContent = `Showing ${filtered.length} of ${DATA.recipes.length} recipes (Scaled to ${factor * 10} Athlete Portions / ${factor}x Batch)`;
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

  // Map CSV rowId to Swimlane laneId for Audit Jump buttons
  const rowIdToLaneId = new Map();
  SWIMLANES.forEach((lane) => {
    lane.sourceRows.forEach((sr) => rowIdToLaneId.set(sr.rowId, lane.laneId));
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

  function renderRulesTable() {
    const tbody = document.getElementById("rulesTableBody");
    if (!tbody) return;
    const q = state.rulesSearch.toLowerCase().trim();
    const cat = state.rulesCat;

    const filtered = (DATA.rules || []).filter((r) => {
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
        const sl = r.status.toLowerCase();
        if (sl.includes("flag")) stCls = "flagged";
        else if (sl.includes("action") || sl.includes("question")) stCls = "action";

        return `<tr>
          <td class="rule-code">${escapeHtml(r.code)}</td>
          <td>${escapeHtml(r.cat)}</td>
          <td><strong>${escapeHtml(r.name)}</strong></td>
          <td>${escapeHtml(r.trigger)}</td>
          <td>${escapeHtml(r.action)}</td>
          <td><span class="status-pill ${stCls}">${escapeHtml(r.status)}</span></td>
        </tr>`;
      })
      .join("");
  }

  // Wire up Event Listeners & Card Drag-and-Drop
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

    // City filter
    document.getElementById("cityFilterGroup")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-city]");
      if (!btn) return;
      state.cityFilter = btn.dataset.city;
      document.querySelectorAll("#cityFilterGroup .filter-pill").forEach((b) => b.classList.toggle("active", b === btn));
      renderPlanningBoard();
    });

    // Meal filter
    document.getElementById("mealFilterGroup")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-meal]");
      if (!btn) return;
      state.mealFilter = btn.dataset.meal;
      document.querySelectorAll("#mealFilterGroup .filter-pill").forEach((b) => b.classList.toggle("active", b === btn));
      renderPlanningBoard();
    });

    // Drop mode toggle (Swap on Card vs Add to Slot)
    document.getElementById("dropModeGroup")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-dropmode]");
      if (!btn) return;
      state.dropMode = btn.dataset.dropmode;
      document.querySelectorAll("#dropModeGroup .filter-pill").forEach((b) => b.classList.toggle("active", b === btn));
    });

    // Live Audit toggle
    document.getElementById("liveAuditToggle")?.addEventListener("change", (e) => {
      state.showLiveAudit = e.target.checked;
      renderPlanningBoard();
    });

    // Toolbar actions
    document.getElementById("btnUndo")?.addEventListener("click", undo);
    document.getElementById("btnRedo")?.addEventListener("click", redo);
    document.getElementById("btnAutoFixTypos")?.addEventListener("click", cleanUpBeoTypos);
    document.getElementById("btnExportXlsx")?.addEventListener("click", exportXlsx);

    document.getElementById("btnResetSheet")?.addEventListener("click", async () => {
      pushUndo();
      state.board = JSON.parse(JSON.stringify(BASELINE_BOARD));
      state.moveCount = 0;
      localStorage.removeItem("usmnt_nov2026_board_v2");
      try {
        await fetch("/api/reset", { method: "POST" });
      } catch (_) {}
      persistState();
      renderPlanningBoard();
    });

    function toggleDrawer(forceState) {
      state.paletteOpen = typeof forceState === "boolean" ? forceState : !state.paletteOpen;
      document.getElementById("plannerWorkspace")?.classList.toggle("drawer-closed", !state.paletteOpen);
      document.getElementById("btnTogglePalette")?.classList.toggle("active", state.paletteOpen);
    }

    document.getElementById("btnTogglePalette")?.addEventListener("click", () => toggleDrawer());
    document.getElementById("btnClosePalette")?.addEventListener("click", () => toggleDrawer(false));

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeRecipeModal();
        closeQuickAddModal();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (document.activeElement?.tagName !== "INPUT") {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        if (document.activeElement?.tagName !== "INPUT") {
          e.preventDefault();
          redo();
        }
      }
    });

    // Planning Grid Click & Drag-and-Drop Events
    const tbody = document.getElementById("planningTbody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        // Edit daily theme pill
        const themePill = e.target.closest("[data-edit-theme]");
        if (themePill) {
          const meal = themePill.dataset.editTheme;
          const dIdx = parseInt(themePill.dataset.dayidx, 10);
          const current = state.board.themes[meal]?.[dIdx] || "";
          const next = window.prompt(`Update ${meal} Theme for ${DATA.days[dIdx]?.short || ""}:`, current);
          if (next !== null && next.trim() !== current.trim()) {
            pushUndo();
            state.board.themes[meal][dIdx] = next.trim();
            persistState();
            renderPlanningBoard();
          }
          return;
        }

        // Quick Add button
        const qaBtn = e.target.closest('[data-action="quick-add"]');
        if (qaBtn) {
          openQuickAddModal(qaBtn.dataset.laneid, parseInt(qaBtn.dataset.dayidx, 10));
          return;
        }

        const cardEl = e.target.closest(".slot-recipe-card");
        if (!cardEl) return;
        const laneId = cardEl.dataset.laneid;
        const dIdx = parseInt(cardEl.dataset.dayidx, 10);
        const cIdx = parseInt(cardEl.dataset.cardidx, 10);
        const card = state.board.slots[laneId]?.[dIdx]?.[cIdx];
        if (!card) return;

        // Remove card button
        if (e.target.closest('[data-action="remove-card"]')) {
          e.stopPropagation();
          pushUndo();
          state.board.slots[laneId][dIdx].splice(cIdx, 1);
          persistState();
          renderPlanningBoard();
          return;
        }

        // Open BEO Recipe modal on clicking card title
        if (e.target.closest('[data-action="open-recipe"]')) {
          const lane = SWIMLANES.find((l) => l.laneId === laneId);
          openRecipeModal(getOrSynthesizeRecipe(card.dish, lane?.title));
        }
      });

      // Drag Start from a Recipe Card inside the Planning Grid
      tbody.addEventListener("dragstart", (e) => {
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
          subTag: card.subTag
        };
        cardEl.classList.add("card-dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", card.dish);
        }
      });

      tbody.addEventListener("dragend", () => {
        document.querySelectorAll(".card-dragging, .card-drop-target, .slot-drag-over").forEach((el) => {
          el.classList.remove("card-dragging", "card-drop-target", "slot-drag-over");
        });
      });

      tbody.addEventListener("dragover", (e) => {
        const slotEl = e.target.closest(".planning-slot");
        if (!slotEl) return;
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

      tbody.addEventListener("dragleave", (e) => {
        const slotEl = e.target.closest(".planning-slot");
        if (slotEl && !slotEl.contains(e.relatedTarget)) {
          slotEl.classList.remove("slot-drag-over");
        }
        const overCard = e.target.closest(".slot-recipe-card");
        if (overCard && !overCard.contains(e.relatedTarget)) {
          overCard.classList.remove("card-drop-target");
        }
      });

      tbody.addEventListener("drop", (e) => {
        const slotEl = e.target.closest(".planning-slot");
        if (!slotEl || !state.dragData) return;
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

        const dstLane = SWIMLANES.find((l) => l.laneId === dstLaneId);
        const defaultTag = dstLane?.sourceRows?.[0]?.tag || dstLane?.meal || "Item";

        if (drag.source === "slot") {
          // Ignore dropping card onto itself
          if (drag.laneId === dstLaneId && drag.dayIdx === dstDayIdx && drag.cardIdx === dstCardIdx) {
            return;
          }

          pushUndo();
          const srcCards = state.board.slots[drag.laneId][drag.dayIdx];
          const dstCards = state.board.slots[dstLaneId][dstDayIdx];

          if (dstCardIdx >= 0 && state.dropMode === "swap") {
            // Swap the two cards directly!
            const srcCard = srcCards[drag.cardIdx];
            const dstCard = dstCards[dstCardIdx];
            const tmpDish = srcCard.dish;
            srcCard.dish = dstCard.dish;
            dstCard.dish = tmpDish;
          } else {
            // Move card from source slot to destination slot
            const [movedCard] = srcCards.splice(drag.cardIdx, 1);
            movedCard.subTag = defaultTag;
            if (dstCardIdx >= 0) {
              dstCards.splice(dstCardIdx, 0, movedCard);
            } else {
              dstCards.push(movedCard);
            }
          }

          persistState();
          renderPlanningBoard();
        } else if (drag.source === "palette") {
          pushUndo();
          const dstCards = state.board.slots[dstLaneId][dstDayIdx];
          if (dstCardIdx >= 0 && state.dropMode === "swap") {
            // Replace the target card's dish with the palette recipe
            dstCards[dstCardIdx].dish = drag.dish;
          } else {
            // Add new card to slot
            dstCards.push({
              id: `c_${nextCardId++}`,
              dish: drag.dish,
              subTag: defaultTag,
              origDish: ""
            });
          }
          persistState();
          renderPlanningBoard();
        }
      });
    }

    // Palette Drawer Events
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

    document.getElementById("paletteSearchInput")?.addEventListener("input", (e) => {
      state.paletteSearch = e.target.value;
      renderPaletteDrawer();
    });

    document.getElementById("paletteFilterPills")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pfilter]");
      if (!btn) return;
      state.paletteFilter = btn.dataset.pfilter;
      document.querySelectorAll("#paletteFilterPills .mini-pill").forEach((b) => b.classList.toggle("active", b === btn));
      renderPaletteDrawer();
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
        const openBtn = e.target.closest("[data-openrecipe]");
        const card = e.target.closest(".palette-card");
        const id = openBtn ? parseInt(openBtn.dataset.openrecipe, 10) : card ? parseInt(card.dataset.recipeid, 10) : null;
        if (id) {
          const rec = DATA.recipes.find((r) => r.id === id);
          if (rec) openRecipeModal(rec);
        }
      });
    }

    // Quick Add Modal Events
    document.getElementById("qaCloseBtn")?.addEventListener("click", closeQuickAddModal);
    document.getElementById("qaCancelBtn")?.addEventListener("click", closeQuickAddModal);
    document.getElementById("qaInput")?.addEventListener("input", (e) => {
      renderQuickAddSuggestions(e.target.value);
    });
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

    // Master Recipe Book tab events
    const secSelect = document.getElementById("sectionFilterSelect");
    if (secSelect) {
      const sections = Array.from(new Set(DATA.recipes.map((r) => r.section)));
      sections.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        secSelect.appendChild(opt);
      });
      secSelect.addEventListener("change", () => {
        state.recipeSection = secSelect.value;
        renderRecipeBook();
      });
    }

    document.getElementById("recipeSearchInput")?.addEventListener("input", (e) => {
      state.recipeSearch = e.target.value;
      renderRecipeBook();
    });

    document.getElementById("recipeTagBar")?.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-tag]");
      if (!chip) return;
      state.recipeTag = chip.dataset.tag;
      document.querySelectorAll("#recipeTagBar .tag-chip").forEach((c) => c.classList.toggle("active", c === chip));
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
      const rec = DATA.recipes.find((r) => r.id === id);
      if (rec) openRecipeModal(rec);
    });

    // Audit Jump to Slots in Planning Board
    document.getElementById("tab-audit")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-jumpslots]");
      if (!btn) return;
      try {
        const slots = JSON.parse(btn.dataset.jumpslots || "[]");
        state.jumpHighlightSlots = slots;
        state.cityFilter = "all";
        state.mealFilter = "all";
        document.querySelectorAll("#cityFilterGroup .filter-pill").forEach((b) => b.classList.toggle("active", b.dataset.city === "all"));
        document.querySelectorAll("#mealFilterGroup .filter-pill").forEach((b) => b.classList.toggle("active", b.dataset.meal === "all"));

        document.querySelector('.nav-tab[data-tab="planner"]')?.click();
        renderPlanningBoard();

        if (slots.length > 0) {
          const [laneId, dIdx] = slots[0].split(":");
          setTimeout(() => {
            const slotEl = document.getElementById(`slot-${laneId}-${dIdx}`);
            slotEl?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          }, 80);
        }
      } catch (_) {}
    });

    // Rules tab events
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

    // Modal controls
    document.getElementById("modalCloseBtn")?.addEventListener("click", closeRecipeModal);
    document.getElementById("modalDoneBtn")?.addEventListener("click", closeRecipeModal);
    document.getElementById("recipeModal")?.addEventListener("click", (e) => {
      if (e.target.id === "recipeModal") closeRecipeModal();
    });

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

      navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById("copyRecipeBtn");
        const orig = copyBtn.textContent;
        copyBtn.textContent = "✅ Copied BEO Spec!";
        setTimeout(() => {
          copyBtn.textContent = orig;
        }, 1800);
      });
    });
  }

  // Initialize Everything
  initDatalist();
  initEvents();
  renderPlanningBoard();
  renderPaletteDrawer();
  renderRecipeBook();
  renderAuditView();
  renderRulesTable();
  loadSavedState();
})();
