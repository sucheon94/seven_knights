(function () {
  const typeMeta = {
    attack: {
      label: "공격형",
      mark: "칼",
      color: "#c9483f",
      colors: ["#351822", "#b83f35", "#ffb077"]
    },
    magic: {
      label: "마법형",
      mark: "마",
      color: "#3d83bd",
      colors: ["#152b42", "#3d83bd", "#a8d9ff"]
    },
    defense: {
      label: "방어형",
      mark: "방",
      color: "#9a7a52",
      colors: ["#2c261d", "#9a7a52", "#e5cf9d"]
    },
    support: {
      label: "지원형",
      mark: "지",
      color: "#c6ad39",
      colors: ["#332d16", "#c6ad39", "#fff0a7"]
    },
    universal: {
      label: "만능형",
      mark: "만",
      color: "#6d58bf",
      colors: ["#241c3d", "#6d58bf", "#d7c5ff"]
    }
  };

  const heroRows = [
    ["pi", "파이", "attack"],
    ["julie", "쥬리", "magic"],
    ["gelidus", "겔리두스", "universal"],
    ["milia", "밀리아", "magic"],
    ["rosie", "로지", "support"],
    ["sylvester", "실베스타", "magic"],
    ["clemys", "클레미스", "support"],
    ["teo", "태오", "attack"],
    ["kyle", "카일", "attack"],
    ["rachel", "레이첼", "universal"],
    ["son-ogong", "손오공", "universal"],
    ["ludgride", "라드그리드", "defense"],
    ["platin", "플라튼", "magic"],
    ["kris", "크리스", "universal"],
    ["karma", "카르마", "universal"],
    ["colt", "콜트", "attack"],
    ["ryan", "라이언", "attack"],
    ["kagura", "카구라", "magic"],
    ["branz-bransel", "브란즈&브란셀", "attack"],
    ["yeopo", "여포", "attack"],
    ["karl-heron", "칼 헤론", "attack"],
    ["yeonhee", "연희", "magic"],
    ["vanessa", "바네사", "magic"],
    ["melkir", "멜키르", "magic"],
    ["freya", "프레이야", "magic"],
    ["run", "린", "magic"],
    ["nata", "나타", "magic"],
    ["omok", "오목", "magic"],
    ["rudy", "루디", "defense"],
    ["biscuit", "비스킷", "support"],
    ["eileen", "아일린", "universal"],
    ["jave", "제이브", "universal"],
    ["spike", "스파이크", "universal"],
    ["ellisia", "엘리시아", "universal"],
    ["tuto", "트루드", "universal"],
    ["palanus", "팔라누스", "universal"],
    ["landgride", "란드그리드", "attack"],
    ["sung-jinwoo", "성진우", "magic"],
    ["ace", "에이스", "universal"],
    ["mist", "미스트", "universal"],
    ["delons", "델론즈", "attack"],
    ["kiriel", "키리엘", "magic"],
    ["reginleif", "레긴레이프", "magic"],
    ["skuld", "스쿨드", "magic"],
    ["aquila", "아킬라", "defense"],
    ["orly", "오를리", "support"],
    ["shane", "세인", "attack"],
    ["baekryong", "백룡", "attack"],
    ["espada", "에스파다", "magic"],
    ["pascal", "파스칼", "magic"],
    ["daisy", "데이지", "magic"],
    ["rina", "리나", "support"],
    ["blista", "발리스타", "attack"],
    ["taka", "타카", "attack"],
    ["ruri", "루리", "magic"],
    ["alice", "엘리스", "support"],
    ["miho", "미호", "magic"],
    ["aragon", "아라곤", "defense"],
    ["guan-yu", "관우", "universal"],
    ["daeo", "돼오", "attack"],
    ["bidam", "비담", "attack"],
    ["amelia", "아멜리아", "attack"],
    ["yushin", "유신", "magic"],
    ["velika", "벨리카", "magic"],
    ["shogyo", "소교", "magic"],
    ["nox", "녹스", "defense"],
    ["rook", "룩", "defense"],
    ["choseon", "초선", "support"],
    ["nia", "니아", "universal"],
    ["zig", "지크", "universal"],
    ["chancellor", "챈슬러", "universal"],
    ["baka", "백각", "universal"],
    ["zahin", "차해인", "attack"],
    ["heavenia", "헤브니아", "attack"],
    ["leo", "레오", "attack"],
    ["poongyeon", "풍연", "attack"],
    ["soi", "소이", "attack"],
    ["snipper", "스니퍼", "attack"],
    ["jupy", "쥬피", "attack"],
    ["jane", "제인", "attack"],
    ["may", "메이", "attack"],
    ["blackrose", "블랙로즈", "attack"],
    ["catty", "캐티", "attack"],
    ["jin", "진", "attack"],
    ["zhao-yun", "조운", "attack"],
    ["sao", "샤오", "attack"],
    ["yuri", "유리", "magic"],
    ["cleo", "클레오", "magic"],
    ["ariel", "아리엘", "magic"],
    ["joker", "조커", "magic"],
    ["sera", "세라", "magic"],
    ["noho", "노호", "magic"],
    ["lingling", "링링", "magic"],
    ["kwon", "리", "defense"],
    ["hellenia", "헬레니아", "defense"],
    ["evan", "에반", "defense"],
    ["yujin", "유진호", "defense"],
    ["sarah", "사라", "support"],
    ["karin", "카린", "support"],
    ["karon", "카론", "support"],
    ["lucy", "루시", "support"],
    ["yui", "유이", "support"],
    ["chloe", "클로에", "support"],
    ["lee-jung", "이주희", "support"],
    ["rania", "라니아", "universal"],
    ["victoria", "빅토리아", "universal"],
    ["asura", "아수라", "universal"]
  ];

  function makeHero([id, name, type]) {
    const meta = typeMeta[type];
    return {
      id,
      name,
      type,
      role: meta.label,
      element: "",
      grade: "전설",
      colors: meta.colors,
      tags: [meta.label]
    };
  }

  window.SK_COUNTER_TYPE_META = typeMeta;
  window.SK_COUNTER_DEFAULT_DATA = {
    heroes: heroRows.map(makeHero),
    defenseTeams: [
      {
        id: "julie-clemys-rachel",
        name: "쥬리 보호막 방덱",
        defense: ["julie", "clemys", "rachel"],
        counters: [
          {
            id: "pi-gelidus-teo",
            name: "파이 속공 붕괴",
            offense: ["pi", "gelidus", "teo"],
            formation: "파이 후열, 겔리두스와 태오 전열 압박",
            skillOrder: ["파이 2스킬", "겔리두스 1스킬", "태오 각성기", "파이 1스킬", "겔리두스 2스킬"],
            rings: [
              { hero: "파이", ring: "불사 반지 또는 즉사 저항 반지" },
              { hero: "겔리두스", ring: "속공 반지" },
              { hero: "태오", ring: "불사 반지" }
            ],
            note: "쥬리 보호막이 먼저 빠진 뒤 광역 딜을 겹치는 흐름을 기준으로 잡은 샘플입니다."
          },
          {
            id: "rosie-pi-clemys",
            name: "로지 침묵 진입",
            offense: ["rosie", "pi", "clemys"],
            formation: "로지 선턴, 파이 마무리, 클레미스 보조",
            skillOrder: ["로지 1스킬", "클레미스 2스킬", "파이 2스킬", "로지 각성기"],
            rings: [
              { hero: "로지", ring: "상태이상 적중 반지" },
              { hero: "파이", ring: "불사 반지" },
              { hero: "클레미스", ring: "피해 감소 반지" }
            ],
            note: "면역 타이밍이 꼬이면 안정성이 내려가므로 스킬 예약 순서를 고정하는 편이 좋습니다."
          }
        ]
      },
      {
        id: "teo-kyle-sylvester",
        name: "태오 카일 압박 방덱",
        defense: ["teo", "kyle", "sylvester"],
        counters: [
          {
            id: "rachel-clemys-milia",
            name: "레이첼 약화 운영",
            offense: ["rachel", "clemys", "milia"],
            formation: "레이첼 후열, 클레미스와 밀리아 전열 유지",
            skillOrder: ["클레미스 2스킬", "레이첼 1스킬", "밀리아 2스킬", "레이첼 각성기", "밀리아 1스킬"],
            rings: [
              { hero: "레이첼", ring: "스킬 피해 반지" },
              { hero: "클레미스", ring: "피해 감소 반지" },
              { hero: "밀리아", ring: "상태이상 저항 반지" }
            ],
            note: "태오 불사 타이밍을 레이첼 약화 이후에 빼는 것을 목표로 둡니다."
          },
          {
            id: "eileen-gelidus-pi",
            name: "아일린 전열 버티기",
            offense: ["eileen", "gelidus", "pi"],
            formation: "아일린 전열, 겔리두스 광역, 파이 후열",
            skillOrder: ["아일린 2스킬", "겔리두스 2스킬", "파이 2스킬", "겔리두스 1스킬"],
            rings: [
              { hero: "아일린", ring: "막기 반지" },
              { hero: "겔리두스", ring: "속공 반지" },
              { hero: "파이", ring: "불사 반지" }
            ],
            note: "카일이 먼저 움직이는 판은 아일린 생존 세팅이 중요합니다."
          }
        ]
      },
      {
        id: "rosie-milia-rachel",
        name: "로지 제어 방덱",
        defense: ["rosie", "milia", "rachel"],
        counters: [
          {
            id: "teo-kyle-clemys",
            name: "태오 카일 연타",
            offense: ["teo", "kyle", "clemys"],
            formation: "태오 후열, 카일 추격, 클레미스 보조",
            skillOrder: ["클레미스 2스킬", "태오 1스킬", "카일 2스킬", "태오 각성기", "카일 1스킬"],
            rings: [
              { hero: "태오", ring: "불사 반지" },
              { hero: "카일", ring: "치명타 반지" },
              { hero: "클레미스", ring: "상태이상 저항 반지" }
            ],
            note: "로지 침묵을 저항으로 받아내고 단일 타격으로 후열을 빠르게 정리합니다."
          }
        ]
      }
    ]
  };

  window.SK_COUNTER_DATA = JSON.parse(JSON.stringify(window.SK_COUNTER_DEFAULT_DATA));
})();
