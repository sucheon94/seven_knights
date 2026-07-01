(function () {
  const DEFENSE_SHEET = "방어팀";
  const COUNTER_SHEET = "공략덱";
  const PET_SHEET = "참조_펫";
  const PET_COLORS = ["#2c2414", "#d5a936", "#fff1a8"];
  const FORMATION_MAP = new Map([
    ["기본", "basic"],
    ["기본진형", "basic"],
    ["기본 진형", "basic"],
    ["basic", "basic"],
    ["밸런스", "balance"],
    ["밸런스진형", "balance"],
    ["밸런스 진형", "balance"],
    ["balance", "balance"],
    ["공격", "attack"],
    ["공격진형", "attack"],
    ["공격 진형", "attack"],
    ["attack", "attack"],
    ["보호", "protect"],
    ["보호진형", "protect"],
    ["보호 진형", "protect"],
    ["protect", "protect"]
  ]);

  function trim(value) {
    return String(value ?? "").trim();
  }

  function normalize(value) {
    return trim(value).replace(/\s+/g, "").toLowerCase();
  }

  function activeRow(value) {
    const normalized = normalize(value);
    return !["n", "no", "false", "0", "미사용", "아니오"].includes(normalized);
  }

  function normalizeFormation(value) {
    const raw = trim(value);
    return FORMATION_MAP.get(raw) || FORMATION_MAP.get(normalize(raw)) || "basic";
  }

  function colToIndex(cellRef) {
    const letters = cellRef.replace(/[^A-Z]/gi, "").toUpperCase();
    return letters.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  }

  function collectText(node) {
    return elements(node, "t")
      .map((item) => item.textContent || "")
      .join("");
  }

  function elements(node, localName) {
    const byNamespace = Array.from(node.getElementsByTagNameNS("*", localName));
    return byNamespace.length ? byNamespace : Array.from(node.getElementsByTagName(localName));
  }

  async function loadXml(zip, path) {
    const file = zip.file(path);
    if (!file) {
      return null;
    }
    const text = await file.async("text");
    return new DOMParser().parseFromString(text, "application/xml");
  }

  async function loadSharedStrings(zip) {
    const xml = await loadXml(zip, "xl/sharedStrings.xml");
    if (!xml) {
      return [];
    }
    return elements(xml, "si").map(collectText);
  }

  async function loadSheetPaths(zip) {
    const workbook = await loadXml(zip, "xl/workbook.xml");
    const rels = await loadXml(zip, "xl/_rels/workbook.xml.rels");
    if (!workbook || !rels) {
      throw new Error("엑셀 통합문서 구조를 읽을 수 없습니다.");
    }

    const relMap = new Map();
    elements(rels, "Relationship").forEach((rel) => {
      const target = rel.getAttribute("Target") || "";
      const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
      relMap.set(rel.getAttribute("Id"), path.replace(/\\/g, "/"));
    });

    const sheetMap = new Map();
    elements(workbook, "sheet").forEach((sheet) => {
      const name = sheet.getAttribute("name");
      const relId = sheet.getAttribute("r:id");
      if (name && relId && relMap.has(relId)) {
        sheetMap.set(name, relMap.get(relId));
      }
    });
    return sheetMap;
  }

  function readCellValue(cell, sharedStrings) {
    const type = cell.getAttribute("t");
    if (type === "inlineStr") {
      return collectText(cell);
    }
    const valueNode = elements(cell, "v")[0];
    const value = valueNode ? valueNode.textContent || "" : "";
    if (type === "s") {
      return sharedStrings[Number(value)] || "";
    }
    return value;
  }

  async function readSheetRows(zip, sheetPath, sharedStrings) {
    const xml = await loadXml(zip, sheetPath);
    if (!xml) {
      throw new Error(`${sheetPath} 시트를 읽을 수 없습니다.`);
    }

    const rows = [];
    elements(xml, "row").forEach((row) => {
      const rowIndex = Number(row.getAttribute("r") || rows.length + 1) - 1;
      rows[rowIndex] = rows[rowIndex] || [];
      elements(row, "c").forEach((cell) => {
        const ref = cell.getAttribute("r") || "";
        rows[rowIndex][colToIndex(ref)] = readCellValue(cell, sharedStrings);
      });
    });
    return rows.map((row) => row || []);
  }

  function headerMap(rows) {
    const header = rows[0] || [];
    const map = new Map();
    header.forEach((name, index) => {
      if (trim(name)) {
        map.set(trim(name), index);
      }
    });
    return map;
  }

  function value(row, headers, name) {
    return trim(row[headers.get(name)]);
  }

  function buildHeroMap(defaultData) {
    const map = new Map();
    defaultData.heroes.forEach((hero) => {
      map.set(normalize(hero.name), hero.id);
      map.set(normalize(hero.id), hero.id);
    });
    return map;
  }

  function petIdFromName(name, index) {
    const normalized = normalize(name);
    return normalized ? `pet-${normalized}` : `pet-${index + 1}`;
  }

  function buildPetMap(defaultData) {
    const pets = clone(defaultData.pets || []);
    const map = new Map();
    pets.forEach((pet) => {
      map.set(normalize(pet.name), pet.id);
      map.set(normalize(pet.id), pet.id);
    });
    return { pets, map };
  }

  function addPet(pets, petMap, name, id) {
    const petName = trim(name);
    if (!petName) {
      return "";
    }
    const existing = petMap.get(normalize(id)) || petMap.get(normalize(petName));
    if (existing) {
      return existing;
    }
    const petId = trim(id) || petIdFromName(petName, pets.length);
    const pet = {
      id: petId,
      name: petName,
      role: "펫",
      colors: PET_COLORS,
      tags: ["펫"]
    };
    pets.push(pet);
    petMap.set(normalize(pet.id), pet.id);
    petMap.set(normalize(pet.name), pet.id);
    return pet.id;
  }

  function parsePets(rows, defaultData) {
    const { pets, map } = buildPetMap(defaultData);
    const headers = headerMap(rows);
    rows.slice(1).forEach((row, index) => {
      if (!activeRow(value(row, headers, "사용여부") || "Y")) {
        return;
      }
      const name = value(row, headers, "펫명") || value(row, headers, "펫");
      const id = value(row, headers, "펫ID");
      addPet(pets, map, name, id || petIdFromName(name, index));
    });
    return { pets, petMap: map };
  }

  function heroId(heroMap, name) {
    return heroMap.get(normalize(name)) || "";
  }

  function petId(petMap, pets, name) {
    const found = petMap.get(normalize(name));
    return found || addPet(pets, petMap, name, "");
  }

  function buildSlots(ids, positions) {
    const slots = Array(5).fill(null);
    ids.forEach((id, index) => {
      if (!id) {
        return;
      }
      const parsedPosition = Number(positions[index]);
      const slotIndex = parsedPosition >= 1 && parsedPosition <= 5 ? parsedPosition - 1 : slots.findIndex((item) => !item);
      if (slotIndex >= 0) {
        slots[slotIndex] = id;
      }
    });
    return slots;
  }

  function splitLines(valueText) {
    return trim(valueText)
      .split(/\r?\n|>/)
      .map((item) => trim(item))
      .filter(Boolean);
  }

  function parseRings(valueText) {
    return splitLines(valueText).map((line) => {
      const [hero, ...rest] = line.split(/[:：]/);
      return {
        hero: trim(rest.length ? hero : ""),
        ring: trim(rest.length ? rest.join(":") : line)
      };
    });
  }

  function parseDefenseTeams(rows, heroMap, petMap, pets) {
    const headers = headerMap(rows);
    const teams = new Map();

    rows.slice(1).forEach((row, index) => {
      const id = value(row, headers, "방어팀ID") || `defense-${index + 1}`;
      if (!trim(id) || !activeRow(value(row, headers, "사용여부") || "Y")) {
        return;
      }
      const names = ["방어1영웅", "방어2영웅", "방어3영웅"].map((name) => value(row, headers, name));
      const ids = names.map((name) => heroId(heroMap, name)).filter(Boolean);
      if (!ids.length) {
        return;
      }
      const positions = ["방어1위치", "방어2위치", "방어3위치"].map((name) => value(row, headers, name));
      const pet = petId(petMap, pets, value(row, headers, "펫"));
      teams.set(id, {
        id,
        name: value(row, headers, "방어팀명") || names.filter(Boolean).join(" / "),
        formationKey: normalizeFormation(value(row, headers, "방어진형")),
        defense: ids,
        defenseSlots: buildSlots(ids, positions),
        pet,
        note: value(row, headers, "비고"),
        counters: []
      });
    });

    return teams;
  }

  function parseCounters(rows, heroMap, petMap, pets, teams) {
    const headers = headerMap(rows);
    rows.slice(1).forEach((row, index) => {
      const defenseId = value(row, headers, "방어팀ID");
      const team = teams.get(defenseId);
      if (!team || !activeRow(value(row, headers, "사용여부") || "Y")) {
        return;
      }

      const names = ["공략1영웅", "공략2영웅", "공략3영웅"].map((name) => value(row, headers, name));
      const ids = names.map((name) => heroId(heroMap, name)).filter(Boolean);
      if (!ids.length) {
        return;
      }
      const positions = ["공략1위치", "공략2위치", "공략3위치"].map((name) => value(row, headers, name));
      const formationKey = normalizeFormation(value(row, headers, "공략진형"));
      const formationName = value(row, headers, "공략진형") || "기본 진형";
      const positionSummary = positions.filter(Boolean).join(", ");
      const pet = petId(petMap, pets, value(row, headers, "펫"));
      team.counters.push({
        id: value(row, headers, "공략덱ID") || `${defenseId}-counter-${index + 1}`,
        name: value(row, headers, "공략덱명") || names.filter(Boolean).join(" / "),
        offense: ids,
        offenseSlots: buildSlots(ids, positions),
        pet,
        formationKey,
        formation: positionSummary ? `${formationName} ${positionSummary}번 배치` : formationName,
        skillOrder: splitLines(value(row, headers, "스킬순서")),
        rings: parseRings(value(row, headers, "반지")),
        note: value(row, headers, "비고")
      });
    });
  }

  async function parseCounterWorkbook(arrayBuffer, defaultData) {
    if (!window.JSZip) {
      throw new Error("JSZip이 로드되지 않았습니다.");
    }

    const zip = await window.JSZip.loadAsync(arrayBuffer);
    const sharedStrings = await loadSharedStrings(zip);
    const sheetPaths = await loadSheetPaths(zip);
    const defensePath = sheetPaths.get(DEFENSE_SHEET);
    const counterPath = sheetPaths.get(COUNTER_SHEET);
    const petPath = sheetPaths.get(PET_SHEET);
    if (!defensePath || !counterPath) {
      throw new Error("엑셀에 방어팀/공략덱 시트가 필요합니다.");
    }

    const heroMap = buildHeroMap(defaultData);
    const petRows = petPath ? await readSheetRows(zip, petPath, sharedStrings) : [];
    const { pets, petMap } = parsePets(petRows, defaultData);
    const defenseRows = await readSheetRows(zip, defensePath, sharedStrings);
    const counterRows = await readSheetRows(zip, counterPath, sharedStrings);
    const teams = parseDefenseTeams(defenseRows, heroMap, petMap, pets);
    parseCounters(counterRows, heroMap, petMap, pets, teams);

    const defenseTeams = Array.from(teams.values()).filter((team) => team.counters.length);
    if (!defenseTeams.length) {
      throw new Error("엑셀에서 사용 가능한 공략덱을 찾지 못했습니다.");
    }

    return {
      heroes: clone(defaultData.heroes),
      pets,
      defenseTeams
    };
  }

  async function loadCounterWorkbookFromUrl(url, defaultData) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${url} 파일을 불러오지 못했습니다.`);
    }
    return parseCounterWorkbook(await response.arrayBuffer(), defaultData);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  window.SK_EXCEL_COUNTER_LOADER = {
    loadCounterWorkbookFromUrl,
    parseCounterWorkbook
  };
})();
