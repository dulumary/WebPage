
// ===================================
// 1. 사진 슬라이드
// HTML의 img 태그를 자동으로 사용
// ===================================

const slides = Array.from(
  document.querySelectorAll(".gallery-slide")
);

let currentPhotoIndex = 0;

const imagePlaceholder = document.getElementById("imagePlaceholder");
const photoCounter = document.getElementById("photoCounter");

const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

// 사진 번호를 01 / 03 형태로 표시
function updatePhotoCounter() {
  const current = String(currentPhotoIndex + 1).padStart(2, "0");
  const total = String(slides.length).padStart(2, "0");

  photoCounter.textContent = `${current} / ${total}`;
}

// 현재 사진 표시
function showPhoto() {
  slides.forEach(function (slide, index) {
    slide.hidden = index !== currentPhotoIndex;
  });

  updatePhotoCounter();
  updateImagePlaceholder();
}

// 현재 사진이 없거나 로딩에 실패한 경우 안내 표시
function updateImagePlaceholder() {
  const currentSlide = slides[currentPhotoIndex];

  if (!currentSlide) {
    imagePlaceholder.hidden = false;
    return;
  }

  const imageLoaded =
    currentSlide.complete &&
    currentSlide.naturalWidth > 0;

  imagePlaceholder.hidden = imageLoaded;
}

// 이미지 로딩 성공 및 실패 감지
slides.forEach(function (slide) {
  slide.addEventListener("load", updateImagePlaceholder);
  slide.addEventListener("error", updateImagePlaceholder);
});

// 이전 사진
prevButton.addEventListener("click", function () {
  if (slides.length === 0) return;

  currentPhotoIndex =
    (currentPhotoIndex - 1 + slides.length) % slides.length;

  showPhoto();
});

// 다음 사진
nextButton.addEventListener("click", function () {
  if (slides.length === 0) return;

  currentPhotoIndex =
    (currentPhotoIndex + 1) % slides.length;

  showPhoto();
});

// ===================================
// 2. 좋아요 기능
// ===================================

const likeButton = document.getElementById("likeButton");

let isLiked = false;

likeButton.addEventListener("click", function () {
  isLiked = !isLiked;

  likeButton.classList.toggle("is-liked", isLiked);
  likeButton.setAttribute("aria-pressed", String(isLiked));
});

// ===================================
// 3. 댓글 입력 및 글자 수 표시
// ===================================

const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");
const charCount = document.getElementById("charCount");
const submitButton = document.getElementById("submitButton");

const MAX_COMMENT_LENGTH = 200;

// 글자 수 계산
function getCharacterCount(text) {
  return Array.from(text).length;
}

// 댓글 상태 갱신
function updateCommentState() {
  let characters = Array.from(commentInput.value);

  if (characters.length > MAX_COMMENT_LENGTH) {
    commentInput.value = characters
      .slice(0, MAX_COMMENT_LENGTH)
      .join("");

    characters = Array.from(commentInput.value);
  }

  charCount.textContent =
    `${characters.length} / ${MAX_COMMENT_LENGTH}자`;

  // 공백만 입력한 경우 등록 불가
  submitButton.disabled =
    commentInput.value.trim().length === 0;
}

commentInput.addEventListener("input", updateCommentState);

// ===================================
// 4. 댓글 안내 팝업
// ===================================

const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const modalConfirm = document.getElementById("modalConfirm");

let previousFocusedElement = null;

// 팝업 열기
function openModal() {
  previousFocusedElement = document.activeElement;

  modalOverlay.hidden = false;
  document.body.classList.add("modal-open");

  modalConfirm.focus();
}

// 팝업 닫기
function closeModal() {
  modalOverlay.hidden = true;
  document.body.classList.remove("modal-open");

  if (previousFocusedElement) {
    previousFocusedElement.focus();
  }
}

// 실제 댓글 저장 없이 안내 팝업만 표시
commentForm.addEventListener("submit", function (event) {
  event.preventDefault();

  updateCommentState();

  if (commentInput.value.trim().length === 0) {
    return;
  }

  openModal();
});

// 확인 버튼
modalConfirm.addEventListener("click", closeModal);

// 닫기 버튼
modalClose.addEventListener("click", closeModal);

// ESC 키 및 팝업 내부 포커스 관리
document.addEventListener("keydown", function (event) {
  if (modalOverlay.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeModal();
    return;
  }

  if (event.key !== "Tab") return;

  const focusableElements = [
    modalClose,
    modalConfirm
  ];

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (
    event.shiftKey &&
    document.activeElement === firstElement
  ) {
    event.preventDefault();
    lastElement.focus();
  } else if (
    !event.shiftKey &&
    document.activeElement === lastElement
  ) {
    event.preventDefault();
    firstElement.focus();
  }
});

// ===================================
// 5. 초기 실행
// ===================================

showPhoto();
updateCommentState();
