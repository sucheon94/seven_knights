(function () {
  const STORAGE_KEY = "skrb-guild-counter-data-v1";
  const MAX_TEAM_HEROES = 3;
  const SLOT_COUNT = 5;
  const PET_ROLE = "펫";
  const PET_META = { label: "펫", mark: "펫", color: "#d5a936" };
  const HERO_TYPES = window.SK_COUNTER_TYPE_META || {
    attack: { label: "공격형", mark: "칼", color: "#c9483f" },
    magic: { label: "마법형", mark: "마", color: "#3d83bd" },
    defense: { label: "방어형", mark: "방", color: "#9a7a52" },
    support: { label: "지원형", mark: "지", color: "#c6ad39" },
    universal: { label: "만능형", mark: "만", color: "#6d58bf" }
  };
  const TYPE_ORDER = ["attack", "magic", "defense", "support", "universal"];
  const FORMATIONS = {
    basic: {
      label: "기본 진형",
      slots: [
        { x: 52, y: 62 },
        { x: 52, y: 38 },
        { x: 25, y: 74 },
        { x: 25, y: 50 },
        { x: 25, y: 26 }
      ]
    },
    balance: {
      label: "밸런스 진형",
      slots: [
        { x: 52, y: 74 },
        { x: 52, y: 50 },
        { x: 52, y: 26 },
        { x: 25, y: 62 },
        { x: 25, y: 38 }
      ]
    },
    attack: {
      label: "공격 진형",
      slots: [
        { x: 52, y: 50 },
        { x: 25, y: 84 },
        { x: 25, y: 62 },
        { x: 25, y: 40 },
        { x: 25, y: 18 }
      ]
    },
    protect: {
      label: "보호 진형",
      slots: [
        { x: 52, y: 84 },
        { x: 52, y: 62 },
        { x: 52, y: 40 },
        { x: 52, y: 18 },
        { x: 25, y: 50 }
      ]
    }
  };
  const FORMATION_ORDER = ["basic", "balance", "attack", "protect"];
  const defaultData = window.SK_COUNTER_DEFAULT_DATA || { heroes: [], pets: [], defenseTeams: [] };
  let data = normalizeData(readSavedData() || clone(defaultData));

  const state = {
    mode: "defense",
    activeSlot: { side: "defense", kind: "hero", index: 0 },
    attackFormation: "basic",
    defenseFormation: "basic",
    attackTeam: emptyTeam(),
    defenseTeam: emptyTeam(),
    attackPet: "",
    defensePet: "",
    query: "",
    role: "전체",
    activeCounterId: null
  };

  const els = {
    categoryButtons: Array.from(document.querySelectorAll(".category-button")),
    pagePanels: Array.from(document.querySelectorAll("[data-page-panel]")),
    topActions: document.querySelector(".top-actions"),
    attackMode: document.getElementById("attackMode"),
    defenseMode: document.getElementById("defenseMode"),
    formationSideLabel: document.getElementById("formationSideLabel"),
    currentFormationLabel: document.getElementById("currentFormationLabel"),
    excelStatus: document.getElementById("excelStatus"),
    formationOptions: document.getElementById("formationOptions"),
    attackSlots: document.getElementById("attackSlots"),
    defenseSlots: document.getElementById("defenseSlots"),
    clearAttack: document.getElementById("clearAttack"),
    clearDefense: document.getElementById("clearDefense"),
    heroSearch: document.getElementById("heroSearch"),
    roleFilters: document.getElementById("roleFilters"),
    heroRail: document.getElementById("heroRail"),
    defenseSummary: document.getElementById("defenseSummary"),
    counterList: document.getElementById("counterList"),
    deckDetail: document.getElementById("deckDetail"),
    matchBadge: document.getElementById("matchBadge"),
    importExcel: document.getElementById("importExcel"),
    importData: document.getElementById("importData"),
    exportData: document.getElementById("exportData"),
    resetData: document.getElementById("resetData"),
    dataFileInput: document.getElementById("dataFileInput"),
    excelFileInput: document.getElementById("excelFileInput")
  };

  function emptyTeam() {
    return Array(SLOT_COUNT).fill(null);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeData(value) {
    const next = value && typeof value === "object" ? clone(value) : clone(defaultData);
    next.heroes = Array.isArray(next.heroes) ? next.heroes : [];
    next.pets = Array.isArray(next.pets) ? next.pets : [];
    next.defenseTeams = Array.isArray(next.defenseTeams) ? next.defenseTeams : [];
    next.defenseTeams.forEach((team) => {
      team.pet = team.pet || "";
      team.counters = Array.isArray(team.counters) ? team.counters : [];
      team.counters.forEach((counter) => {
        counter.pet = counter.pet || "";
      });
    });
    return next;
  }

  function readSavedData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function setCategory(page) {
    els.categoryButtons.forEach((button) => {
      const isActive = button.dataset.page === page;
      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
    els.pagePanels.forEach((panel) => {
      const isActive = panel.dataset.pagePanel === page;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
    });
    if (els.topActions) {
      els.topActions.hidden = page !== "counter";
    }
  }

  function setExcelStatus(message, status = "") {
    if (!els.excelStatus) {
      return;
    }
    els.excelStatus.textContent = message;
    els.excelStatus.classList.toggle("is-loaded", status === "loaded");
    els.excelStatus.classList.toggle("is-error", status === "error");
  }

  function heroById(id) {
    return data.heroes.find((hero) => hero.id === id);
  }

  function petById(id) {
    return (data.pets || []).find((pet) => pet.id === id);
  }

  function heroName(id) {
    return heroById(id)?.name || "미등록";
  }

  function petName(id) {
    return petById(id)?.name || (id ? "미등록" : "");
  }

  function initials(name) {
    return name.slice(0, 1);
  }

  function sideTeam(side) {
    return side === "attack" ? state.attackTeam : state.defenseTeam;
  }

  function sidePet(side) {
    return side === "attack" ? state.attackPet : state.defensePet;
  }

  function setSidePet(side, petId) {
    if (side === "attack") {
      state.attackPet = petId;
    } else {
      state.defensePet = petId;
      state.activeCounterId = null;
    }
  }

  function sideFormationKey(side) {
    return side === "attack" ? state.attackFormation : state.defenseFormation;
  }

  function selectedHeroIds(team) {
    return team.filter(Boolean);
  }

  function typeMeta(hero) {
    return HERO_TYPES[hero?.type] || {
      label: hero?.role || "기타",
      mark: "?",
      color: "#667085"
    };
  }

  function typeBadge(hero, extraClass = "") {
    const meta = typeMeta(hero);
    return `<span class="type-badge ${extraClass}" style="--type-color:${meta.color}" title="${meta.label}" aria-label="${meta.label}">${meta.mark}</span>`;
  }

  function petBadge(extraClass = "") {
    return `<span class="type-badge pet-badge ${extraClass}" style="--type-color:${PET_META.color}" title="${PET_META.label}" aria-label="${PET_META.label}">${PET_META.mark}</span>`;
  }

  function heroGradient(hero) {
    const colors = hero.colors || ["#2b2e42", "#707ca7", "#fff0b3"];
    return `linear-gradient(145deg, ${colors[0]}, ${colors[1]} 58%, ${colors[2]})`;
  }

  function petGradient(pet) {
    const colors = pet?.colors || ["#2c2414", "#d5a936", "#fff1a8"];
    return `linear-gradient(145deg, ${colors[0]}, ${colors[1]} 58%, ${colors[2]})`;
  }

  function teamKey(team) {
    return selectedHeroIds(team).slice().sort().join("-");
  }

  function sameTeam(a, b, teamPet = "", selectedPet = "") {
    if (teamKey(a) !== teamKey(b)) {
      return false;
    }
    return !selectedPet || teamPet === selectedPet;
  }

  function setMode(mode) {
    state.mode = mode;
    state.activeSlot.side = mode;
    state.activeSlot.kind = "hero";
    const team = sideTeam(mode);
    const nextEmpty = team.findIndex((id) => !id);
    state.activeSlot.index = nextEmpty >= 0 ? nextEmpty : 0;
    render();
  }

  function setFormation(side, formationKey) {
    if (side === "attack") {
      state.attackFormation = formationKey;
    } else {
      state.defenseFormation = formationKey;
    }
    state.mode = side;
    state.activeSlot.side = side;
    state.activeSlot.kind = "hero";
    render();
  }

  function selectSlot(side, index) {
    state.mode = side;
    state.activeSlot = { side, kind: "hero", index };
    if (state.role === PET_ROLE) {
      state.role = "전체";
    }
    render();
  }

  function selectPetSlot(side) {
    state.mode = side;
    state.activeSlot = { side, kind: "pet", index: null };
    state.role = PET_ROLE;
    render();
  }

  function placeHero(heroId) {
    const side = state.activeSlot.side;
    const team = sideTeam(side);
    if (state.activeSlot.kind === "pet") {
      const nextEmpty = team.findIndex((id) => !id);
      state.activeSlot = { side, kind: "hero", index: nextEmpty >= 0 ? nextEmpty : 0 };
    }
    const targetIndex = state.activeSlot.index;
    const previousIndex = team.indexOf(heroId);
    const targetHero = team[targetIndex];

    if (previousIndex === targetIndex) {
      return;
    }

    if (previousIndex >= 0) {
      team[previousIndex] = targetHero || null;
      team[targetIndex] = heroId;
    } else if (!targetHero && selectedHeroIds(team).length >= MAX_TEAM_HEROES) {
      window.alert("한 팀에는 3명까지만 배치할 수 있어요. 교체할 칸을 먼저 선택해주세요.");
      return;
    } else {
      team[targetIndex] = heroId;
    }

    if (side === "defense") {
      state.activeCounterId = null;
    }

    const nextEmpty = team.findIndex((id, index) => !id && index !== targetIndex);
    if (nextEmpty >= 0 && selectedHeroIds(team).length < MAX_TEAM_HEROES) {
      state.activeSlot.index = nextEmpty;
    }
    render();
  }

  function placePet(petId) {
    const side = state.activeSlot.side;
    setSidePet(side, sidePet(side) === petId ? "" : petId);
    state.activeSlot = { side, kind: "pet", index: null };
    render();
  }

  function clearTeam(side) {
    if (side === "attack") {
      state.attackTeam = emptyTeam();
      state.attackPet = "";
      state.activeSlot = { side: "attack", kind: "hero", index: 0 };
    } else {
      state.defenseTeam = emptyTeam();
      state.defensePet = "";
      state.activeCounterId = null;
      state.activeSlot = { side: "defense", kind: "hero", index: 0 };
    }
    state.mode = side;
    render();
  }

  function teamFromIds(ids) {
    const team = emptyTeam();
    ids.slice(0, MAX_TEAM_HEROES).forEach((id, index) => {
      team[index] = id;
    });
    return team;
  }

  function roles() {
    const usedTypes = new Set(data.heroes.map((hero) => hero.type).filter(Boolean));
    const orderedLabels = TYPE_ORDER.filter((type) => usedTypes.has(type)).map((type) => HERO_TYPES[type].label);
    const extraLabels = Array.from(new Set(data.heroes.map((hero) => hero.role))).filter(
      (role) => role && !orderedLabels.includes(role)
    );
    return ["전체", ...orderedLabels, ...extraLabels, PET_ROLE];
  }

  function filteredRosterItems() {
    const query = state.query.trim().toLowerCase();
    if (state.role === PET_ROLE) {
      return (data.pets || [])
        .filter((pet) => {
          const text = [pet.name, PET_ROLE, ...(pet.tags || [])].filter(Boolean).join(" ").toLowerCase();
          return !query || text.includes(query);
        })
        .map((pet) => ({ ...pet, kind: "pet" }));
    }
    return data.heroes
      .filter((hero) => {
      const meta = typeMeta(hero);
      const matchesRole = state.role === "전체" || hero.role === state.role || meta.label === state.role;
      const text = [hero.name, hero.role, meta.label, meta.mark, hero.element, ...(hero.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesRole && (!query || text.includes(query));
      })
      .map((hero) => ({ ...hero, kind: "hero" }));
  }

  function findMatches() {
    const selected = selectedHeroIds(state.defenseTeam);
    const selectedPet = state.defensePet;
    if (!selected.length) {
      return [];
    }

    const exact = data.defenseTeams.filter((team) => sameTeam(team.defense, selected, team.pet, selectedPet));
    if (exact.length) {
      return exact.map((team) => ({ team, score: MAX_TEAM_HEROES, heroScore: MAX_TEAM_HEROES, exact: true }));
    }

    return data.defenseTeams
      .map((team) => {
        const heroScore = team.defense.filter((id) => selected.includes(id)).length;
        return {
          team,
          heroScore,
          score: heroScore + (selectedPet && team.pet === selectedPet ? 1 : 0),
          exact: false
        };
      })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score || a.team.name.localeCompare(b.team.name, "ko"));
  }

  function allCounters(matches) {
    return matches.flatMap((match) =>
      match.team.counters.map((counter) => ({
        ...counter,
        sourceTeam: match.team,
        exact: match.exact,
        score: match.score
      }))
    );
  }

  function activeCounter(counters) {
    if (!counters.length) {
      return null;
    }
    return counters.find((counter) => counter.id === state.activeCounterId) || counters[0];
  }

  function applyCounter(counter) {
    state.activeCounterId = counter.id;
    state.attackTeam = Array.isArray(counter.offenseSlots) ? counter.offenseSlots.slice(0, SLOT_COUNT) : teamFromIds(counter.offense);
    state.attackPet = counter.pet || "";
    if (counter.formationKey && FORMATIONS[counter.formationKey]) {
      state.attackFormation = counter.formationKey;
    }
    state.mode = "attack";
    state.activeSlot = { side: "attack", kind: "hero", index: selectedHeroIds(state.attackTeam).length };
    render();
  }

  function render() {
    els.attackMode.classList.toggle("is-active", state.mode === "attack");
    els.defenseMode.classList.toggle("is-active", state.mode === "defense");
    renderFormationOptions();
    renderSlots("attack", els.attackSlots, state.attackTeam);
    renderSlots("defense", els.defenseSlots, state.defenseTeam);
    renderRoleFilters();
    renderHeroes();
    renderCounters();
  }

  function renderFormationOptions() {
    const side = state.activeSlot.side;
    const selectedKey = sideFormationKey(side);
    els.formationSideLabel.textContent = side === "attack" ? "공략덱 진형" : "방어팀 진형";
    els.currentFormationLabel.textContent = FORMATIONS[selectedKey].label;
    els.formationOptions.innerHTML = "";

    FORMATION_ORDER.forEach((key) => {
      const formation = FORMATIONS[key];
      const button = document.createElement("button");
      button.className = "formation-option";
      button.classList.toggle("is-active", key === selectedKey);
      button.type = "button";
      button.addEventListener("click", () => setFormation(side, key));
      button.innerHTML = `
        <span class="formation-mini">
          ${formation.slots
            .map(
              (slot, index) =>
                `<span class="formation-mini-dot ${index === 0 ? "is-front" : ""}" style="--dot-x:${slot.x}%; --dot-y:${slot.y}%">${index + 1}</span>`
            )
            .join("")}
        </span>
        <span>${formation.label}</span>
      `;
      els.formationOptions.appendChild(button);
    });
  }

  function renderSlots(side, target, team) {
    const formation = FORMATIONS[sideFormationKey(side)];
    target.innerHTML = "";
    target.dataset.formation = sideFormationKey(side);

    formation.slots.forEach((position, index) => {
      const heroId = team[index];
      const hero = heroById(heroId);
      const button = document.createElement("button");
      button.className = "slot";
      button.type = "button";
      button.style.setProperty("--slot-x", `${position.x}%`);
      button.style.setProperty("--slot-y", `${position.y}%`);
      button.classList.toggle("is-active", state.activeSlot.side === side && state.activeSlot.kind === "hero" && state.activeSlot.index === index);
      button.classList.toggle("is-empty", !hero);
      button.setAttribute("aria-label", `${side === "attack" ? "공략덱" : "방어팀"} ${index + 1}번 자리`);
      button.addEventListener("click", () => selectSlot(side, index));

      if (hero) {
        const meta = typeMeta(hero);
        button.innerHTML = `
          <span class="slot-index">${index + 1}</span>
          <span class="mini-portrait" style="background:${heroGradient(hero)}">
            <span class="portrait-initial">${initials(hero.name)}</span>
            ${typeBadge(hero, "type-badge-mini")}
          </span>
          <span class="slot-name">${hero.name}</span>
          <span class="slot-role">${meta.label}</span>
        `;
      } else {
        button.innerHTML = `
          <span class="slot-index">${index + 1}</span>
          <span class="slot-empty" aria-hidden="true">+</span>
          <span class="slot-name">빈 자리</span>
        `;
      }

      target.appendChild(button);
    });

    renderPetSlot(side, target);
  }

  function renderPetSlot(side, target) {
    const petId = sidePet(side);
    const pet = petById(petId);
    const button = document.createElement("button");
    button.className = "pet-slot";
    button.type = "button";
    button.classList.toggle("is-active", state.activeSlot.side === side && state.activeSlot.kind === "pet");
    button.classList.toggle("is-empty", !pet);
    button.setAttribute("aria-label", `${side === "attack" ? "공략덱" : "방어팀"} 펫 자리`);
    button.addEventListener("click", () => selectPetSlot(side));

    if (pet) {
      button.innerHTML = `
        <span class="pet-slot-label">펫</span>
        <span class="mini-portrait pet-mini-portrait" style="background:${petGradient(pet)}">
          <span class="portrait-initial">${initials(pet.name)}</span>
          ${petBadge("type-badge-mini")}
        </span>
        <span class="slot-name">${pet.name}</span>
      `;
    } else {
      button.innerHTML = `
        <span class="pet-slot-label">펫</span>
        <span class="slot-empty" aria-hidden="true">+</span>
        <span class="slot-name">펫</span>
      `;
    }

    target.appendChild(button);
  }

  function renderRoleFilters() {
    els.roleFilters.innerHTML = "";
    roles().forEach((role) => {
      const button = document.createElement("button");
      button.className = "filter-button";
      button.type = "button";
      button.textContent = role;
      button.classList.toggle("is-pet", role === PET_ROLE);
      button.classList.toggle("is-active", state.role === role);
      button.addEventListener("click", () => {
        state.role = role;
        if (role === PET_ROLE) {
          state.activeSlot = { side: state.activeSlot.side, kind: "pet", index: null };
        } else if (state.activeSlot.kind === "pet") {
          const team = sideTeam(state.activeSlot.side);
          const nextEmpty = team.findIndex((id) => !id);
          state.activeSlot = { side: state.activeSlot.side, kind: "hero", index: nextEmpty >= 0 ? nextEmpty : 0 };
        }
        render();
      });
      els.roleFilters.appendChild(button);
    });
  }

  function renderHeroes() {
    els.heroRail.innerHTML = "";
    filteredRosterItems().forEach((item) => {
      const selectedTeam = sideTeam(state.activeSlot.side);
      const button = document.createElement("button");
      button.className = `hero-card ${item.kind === "pet" ? "pet-card" : ""}`;
      button.type = "button";
      button.classList.toggle("is-picked", item.kind === "pet" ? sidePet(state.activeSlot.side) === item.id : selectedTeam.includes(item.id));
      button.addEventListener("click", () => {
        if (item.kind === "pet") {
          placePet(item.id);
        } else {
          placeHero(item.id);
        }
      });
      if (item.kind === "pet") {
        button.innerHTML = `
        <span class="hero-portrait pet-portrait" style="background:${petGradient(item)}"><span>${initials(item.name)}</span></span>
        ${petBadge()}
        <span class="hero-nameplate">
          <span class="hero-name">${item.name}</span>
          <span class="hero-sub"><span>펫</span><span>★★★★★</span></span>
        </span>
      `;
      } else {
        const meta = typeMeta(item);
        button.innerHTML = `
        <span class="hero-portrait" style="background:${heroGradient(item)}"><span>${initials(item.name)}</span></span>
        ${typeBadge(item)}
        <span class="hero-nameplate">
          <span class="hero-name">${item.name}</span>
          <span class="hero-sub"><span>${meta.label}</span><span>★★★★★</span></span>
        </span>
      `;
      }
      els.heroRail.appendChild(button);
    });

    if (!els.heroRail.children.length) {
      els.heroRail.innerHTML = `<div class="empty-state">${state.role === PET_ROLE ? "등록된 펫 없음" : "검색 결과 없음"}</div>`;
    }
  }

  function renderCounters() {
    const matches = findMatches();
    const counters = allCounters(matches);
    const selectedCounter = activeCounter(counters);
    if (selectedCounter && !state.activeCounterId) {
      state.activeCounterId = selectedCounter.id;
    }

    els.matchBadge.textContent = `${counters.length}개`;
    renderDefenseSummary(matches);
    renderCounterList(counters, selectedCounter);
    renderDeckDetail(selectedCounter);
  }

  function renderDefenseSummary(matches) {
    const selected = selectedHeroIds(state.defenseTeam);
    els.defenseSummary.innerHTML = Array.from({ length: MAX_TEAM_HEROES })
      .map((_, index) => {
        const hero = selected[index] ? heroById(selected[index]) : null;
        return `<span class="summary-chip ${hero ? "is-filled" : ""}">${hero ? hero.name : "빈 슬롯"}</span>`;
      })
      .join("");

    const selectedPet = petById(state.defensePet);
    if (selectedPet) {
      const petChip = document.createElement("span");
      petChip.className = "summary-chip is-filled is-pet";
      petChip.textContent = `펫 ${selectedPet.name}`;
      els.defenseSummary.appendChild(petChip);
    }

    if (matches.length && !matches[0].exact) {
      const partial = document.createElement("span");
      partial.className = "summary-chip is-filled";
      partial.textContent = `${matches[0].heroScore}/3 유사`;
      els.defenseSummary.appendChild(partial);
    }
  }

  function renderCounterList(counters, selectedCounter) {
    els.counterList.innerHTML = "";

    if (!counters.length) {
      els.counterList.innerHTML = `<div class="empty-state">등록된 공략덱 없음</div>`;
      return;
    }

    counters.forEach((counter) => {
      const button = document.createElement("button");
      button.className = "counter-card";
      button.type = "button";
      button.classList.toggle("is-active", selectedCounter && selectedCounter.id === counter.id);
      button.addEventListener("click", () => applyCounter(counter));
      button.innerHTML = `
        <span class="counter-title-row">
          <strong>${counter.name}</strong>
        </span>
        <span class="mini-team">
          ${counter.offense.map((id) => `<span class="mini-token">${heroName(id)}</span>`).join("")}
          ${counter.pet ? `<span class="mini-token is-pet">${petName(counter.pet)}</span>` : ""}
        </span>
        <p class="counter-note">${counter.exact ? counter.sourceTeam.name : `${counter.sourceTeam.name} 유사 매칭`}</p>
      `;
      els.counterList.appendChild(button);
    });
  }

  function renderDeckDetail(counter) {
    if (!counter) {
      els.deckDetail.innerHTML = `<div class="detail-empty">공략덱 상세 정보 없음</div>`;
      return;
    }

    els.deckDetail.innerHTML = `
      <section class="detail-section">
        <h3>${counter.name}</h3>
        <p class="detail-line">${counter.offense.map(heroName).join(" / ")}${counter.pet ? ` / 펫 ${petName(counter.pet)}` : ""}</p>
      </section>
      ${
        counter.pet
          ? `<section class="detail-section">
        <h3>펫</h3>
        <p class="detail-line">${petName(counter.pet)}</p>
      </section>`
          : ""
      }
      <section class="detail-section">
        <h3>진형</h3>
        <p class="detail-line">${counter.formation}</p>
      </section>
      <section class="detail-section">
        <h3>스킬 순서</h3>
        <ol class="skill-list">
          ${counter.skillOrder.map((skill, index) => `<li><span class="step-index">${index + 1}</span><span>${skill}</span></li>`).join("")}
        </ol>
      </section>
      <section class="detail-section">
        <h3>반지</h3>
        <ul class="ring-list">
          ${counter.rings.map((item) => `<li><span class="ring-hero">${item.hero}</span><span>${item.ring}</span></li>`).join("")}
        </ul>
      </section>
      <section class="detail-section">
        <h3>비고</h3>
        <p class="detail-line">${counter.note}</p>
      </section>
    `;
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "seven-knights-counter-data.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed.heroes) || !Array.isArray(parsed.defenseTeams)) {
          throw new Error("invalid schema");
        }
        data = normalizeData(parsed);
        saveData();
        state.attackTeam = emptyTeam();
        state.defenseTeam = emptyTeam();
        state.attackPet = "";
        state.defensePet = "";
        state.activeCounterId = null;
        state.activeSlot = { side: "defense", kind: "hero", index: 0 };
        state.mode = "defense";
        render();
      } catch (error) {
        window.alert("데이터 형식이 맞지 않습니다.");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function applyWorkbookData(workbookData, sourceLabel) {
    data = normalizeData(workbookData);
    saveData();
    state.attackTeam = emptyTeam();
    state.defenseTeam = emptyTeam();
    state.attackPet = "";
    state.defensePet = "";
    state.attackFormation = "basic";
    state.defenseFormation = "basic";
    state.activeCounterId = null;
    state.activeSlot = { side: "defense", kind: "hero", index: 0 };
    state.mode = "defense";
    setExcelStatus(`${sourceLabel} 로드됨`, "loaded");
    render();
  }

  async function loadExcelFromUrl() {
    if (!window.SK_EXCEL_COUNTER_LOADER) {
      setExcelStatus("엑셀 파서 없음", "error");
      return;
    }
    if (window.location.protocol === "file:") {
      setExcelStatus("XL 버튼으로 엑셀 선택", "");
      return;
    }
    try {
      const workbookData = await window.SK_EXCEL_COUNTER_LOADER.loadCounterWorkbookFromUrl("./counter-template.xlsx", defaultData);
      applyWorkbookData(workbookData, "counter-template.xlsx");
    } catch (error) {
      console.info("Excel auto-load skipped:", error);
      setExcelStatus("엑셀 자동 로드 대기", "");
    }
  }

  async function importExcel(file) {
    if (!window.SK_EXCEL_COUNTER_LOADER) {
      window.alert("엑셀 파서가 로드되지 않았습니다.");
      return;
    }
    try {
      const workbookData = await window.SK_EXCEL_COUNTER_LOADER.parseCounterWorkbook(await file.arrayBuffer(), defaultData);
      applyWorkbookData(workbookData, file.name);
    } catch (error) {
      console.error(error);
      setExcelStatus("엑셀 로드 실패", "error");
      window.alert(error.message || "엑셀 파일을 읽지 못했습니다.");
    }
  }

  els.categoryButtons.forEach((button) => {
    button.addEventListener("click", () => setCategory(button.dataset.page));
  });
  els.attackMode.addEventListener("click", () => setMode("attack"));
  els.defenseMode.addEventListener("click", () => setMode("defense"));
  els.clearAttack.addEventListener("click", () => clearTeam("attack"));
  els.clearDefense.addEventListener("click", () => clearTeam("defense"));
  els.heroSearch.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderHeroes();
  });
  els.exportData.addEventListener("click", exportData);
  els.importExcel.addEventListener("click", () => els.excelFileInput.click());
  els.importData.addEventListener("click", () => els.dataFileInput.click());
  els.resetData.addEventListener("click", () => {
    data = normalizeData(defaultData);
    localStorage.removeItem(STORAGE_KEY);
    state.attackTeam = emptyTeam();
    state.defenseTeam = emptyTeam();
    state.attackPet = "";
    state.defensePet = "";
    state.attackFormation = "basic";
    state.defenseFormation = "basic";
    state.activeCounterId = null;
    state.activeSlot = { side: "defense", kind: "hero", index: 0 };
    render();
  });
  els.dataFileInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) {
      importData(file);
    }
    event.target.value = "";
  });
  els.excelFileInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) {
      importExcel(file);
    }
    event.target.value = "";
  });

  setCategory("counter");
  render();
  loadExcelFromUrl();
})();
