const stages = [
  { id: "applied", title: "지원 접수" },
  { id: "screening", title: "서류 검토" },
  { id: "first", title: "1차 면접" },
  { id: "final", title: "최종 면접" },
  { id: "result", title: "합격/불합격" }
];

let candidates = [
  {
    id: 1,
    name: "김지원",
    role: "백엔드 개발 · 5년차",
    date: "지원일 2026.05.20",
    stage: "applied",
    originalStage: "applied",
    color: "purple"
  },
  {
    id: 2,
    name: "이민수",
    role: "프론트엔드 개발 · 3년차",
    date: "지원일 2026.05.19",
    stage: "applied",
    originalStage: "applied",
    color: "mint"
  },
  {
    id: 3,
    name: "박철수",
    role: "백엔드 개발 · 6년차",
    date: "지원일 2026.05.17",
    stage: "screening",
    originalStage: "screening",
    color: "green"
  },
  {
    id: 4,
    name: "소지연",
    role: "프론트엔드 개발 · 2년차",
    date: "지원일 2026.05.16",
    stage: "screening",
    originalStage: "screening",
    color: "orange"
  },
  {
    id: 5,
    name: "정하늘",
    role: "백엔드 개발 · 7년차",
    date: "지원일 2026.05.14",
    stage: "first",
    originalStage: "first",
    color: "blue"
  },
  {
    id: 6,
    name: "지수연",
    role: "프론트엔드 개발 · 3년차",
    date: "지원일 2026.05.13",
    stage: "first",
    originalStage: "first",
    color: "pink"
  },
  {
    id: 7,
    name: "성민규",
    role: "백엔드 개발 · 8년차",
    date: "지원일 2026.05.10",
    stage: "final",
    originalStage: "final",
    color: "purple"
  },
  {
    id: 8,
    name: "유나리",
    role: "프론트엔드 개발 · 4년차",
    date: "지원일 2026.05.09",
    stage: "final",
    originalStage: "final",
    color: "mint"
  },
  {
    id: 9,
    name: "이준호",
    role: "백엔드 개발 · 6년차",
    date: "합격일 2026.05.08",
    stage: "result",
    originalStage: "result",
    color: "blue",
    result: "합격"
  },
  {
    id: 10,
    name: "하민지",
    role: "프론트엔드 개발 · 3년차",
    date: "불합격일 2026.05.07",
    stage: "result",
    originalStage: "result",
    color: "orange",
    result: "불합격"
  }
];

const board = document.getElementById("board");

function renderBoard() {
  board.innerHTML = "";

  stages.forEach(stage => {
    const column = createColumn(stage);
    board.appendChild(column);
  });

  renderPendingBar();
}

function createColumn(stage) {
  const column = document.createElement("div");
  column.className = "column";
  column.dataset.stage = stage.id;

  const stageCandidates = candidates.filter(candidate => candidate.stage === stage.id);

  column.innerHTML = `
    <h2>
      ${stage.title}
      <span class="count">${stageCandidates.length}</span>
    </h2>
  `;

  stageCandidates.forEach(candidate => {
    const card = createCandidateCard(candidate);
    column.appendChild(card);
  });

  const addButton = document.createElement("button");
  addButton.className = "add";
  addButton.textContent = "+ 지원자 추가";
  column.appendChild(addButton);

  addColumnDragEvents(column);

  return column;
}

function createCandidateCard(candidate) {
  const card = document.createElement("div");
  const isPending = candidate.stage !== candidate.originalStage;

  card.className = isPending ? "card pending" : "card";
  card.draggable = true;
  card.dataset.id = candidate.id;

  card.innerHTML = `
    <div class="name">
      <span class="avatar ${candidate.color}">${candidate.name[0]}</span>
      ${candidate.name}
      ${createResultBadge(candidate)}
    </div>
    <div class="info">
      ${candidate.role}<br>
      ${candidate.date}
    </div>
    ${createPendingInfo(candidate)}
    <div class="more">...</div>
  `;

  addCardDragEvents(card);

  return card;
}

function createResultBadge(candidate) {
  if (!candidate.result) return "";

  const statusClass = candidate.result === "합격" ? "pass" : "fail";

  return `
    <span class="status ${statusClass}">
      ${candidate.result}
    </span>
  `;
}

function createPendingInfo(candidate) {
  if (candidate.stage === candidate.originalStage) return "";

  return `
    <div class="pending-info">
      <span class="pending-badge">변경 예정</span>
      <span>${getStageTitle(candidate.originalStage)} → ${getStageTitle(candidate.stage)}</span>
    </div>
  `;
}

function addCardDragEvents(card) {
  card.addEventListener("dragstart", event => {
    card.classList.add("dragging");
    event.dataTransfer.setData("candidateId", card.dataset.id);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });
}

function addColumnDragEvents(column) {
  column.addEventListener("dragover", event => {
    event.preventDefault();
    column.classList.add("drag-over");
  });

  column.addEventListener("dragleave", () => {
    column.classList.remove("drag-over");
  });

  column.addEventListener("drop", event => {
    event.preventDefault();

    const candidateId = Number(event.dataTransfer.getData("candidateId"));
    const targetStage = column.dataset.stage;
    const result = moveCandidate(candidateId, targetStage);

    column.classList.remove("drag-over");

    if (!result.ok) {
      showToast(result.message);
      shakeCard(candidateId);
      return;
    }

    renderBoard();
  });
}

function moveCandidate(candidateId, targetStage) {
  const candidate = candidates.find(item => item.id === candidateId);
  if (!candidate) {
    return { ok: false, message: "지원자를 찾을 수 없습니다." };
  }

  if (candidate.stage === targetStage) {
    return { ok: true };
  }

  const originalIndex = getStageIndex(candidate.originalStage);
  const targetIndex = getStageIndex(targetStage);

  // 저장 전에는 원래 단계 또는 원래 단계의 바로 다음 단계까지만 허용합니다.
  const canMoveToOriginalStage = targetIndex === originalIndex;
  const canMoveToNextStage = targetIndex === originalIndex + 1;

  if (!canMoveToOriginalStage && !canMoveToNextStage) {
    if (targetIndex < originalIndex) {
      return { ok: false, message: "이전 단계로는 이동할 수 없습니다." };
    }

    return { ok: false, message: "다음 단계로만 이동할 수 있습니다." };
  }

  candidate.stage = targetStage;

  if (targetStage === "result") {
    candidate.result = candidate.result || "합격";
  }

  if (targetStage !== "result" && candidate.originalStage !== "result") {
    delete candidate.result;
  }

  return { ok: true };
}

function renderPendingBar() {
  let pendingBar = document.getElementById("pendingBar");
  const pendingCandidates = candidates.filter(candidate => candidate.stage !== candidate.originalStage);

  if (!pendingBar) {
    pendingBar = document.createElement("div");
    pendingBar.id = "pendingBar";
    pendingBar.className = "pending-bar";
    document.body.appendChild(pendingBar);
  }

  if (pendingCandidates.length === 0) {
    pendingBar.classList.remove("show");
    pendingBar.innerHTML = "";
    return;
  }

  pendingBar.innerHTML = `
    <div>
      <strong>변경사항 ${pendingCandidates.length}건</strong>
      <span>저장 전까지 실제 채용 단계에는 반영되지 않습니다.</span>
    </div>
    <div class="pending-actions">
      <button class="btn" type="button" onclick="cancelPendingChanges()">취소</button>
      <button class="btn primary" type="button" onclick="savePendingChanges()">변경사항 저장</button>
    </div>
  `;

  pendingBar.classList.add("show");
}

function savePendingChanges() {
  candidates = candidates.map(candidate => ({
    ...candidate,
    originalStage: candidate.stage,
    result: candidate.stage === "result" ? candidate.result || "합격" : candidate.result
  }));

  showToast("변경사항이 저장되었습니다.");
  renderBoard();
}

function cancelPendingChanges() {
  candidates = candidates.map(candidate => {
    const restoredCandidate = {
      ...candidate,
      stage: candidate.originalStage
    };

    if (restoredCandidate.stage !== "result") {
      delete restoredCandidate.result;
    }

    return restoredCandidate;
  });

  showToast("변경사항을 취소했습니다.");
  renderBoard();
}

function getStageIndex(stageId) {
  return stages.findIndex(stage => stage.id === stageId);
}

function getStageTitle(stageId) {
  const stage = stages.find(item => item.id === stageId);
  return stage ? stage.title : "";
}

function showToast(message) {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function shakeCard(candidateId) {
  const card = document.querySelector(`.card[data-id="${candidateId}"]`);
  if (!card) return;

  card.classList.remove("shake");
  void card.offsetWidth;
  card.classList.add("shake");

  setTimeout(() => {
    card.classList.remove("shake");
  }, 420);
}

renderBoard();
