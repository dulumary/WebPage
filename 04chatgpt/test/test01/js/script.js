
"use strict";

/* ==============================
   주문 옵션 및 가격 설정

   가격을 변경하고 싶다면
   아래 숫자만 수정하세요.
============================== */

const prices = {
  size: {
    medium: {
      name: "미디움",
      price: 18000
    },
    large: {
      name: "라지",
      price: 22000
    }
  },

  dough: {
    original: {
      name: "오리지널",
      price: 0
    },
    thin: {
      name: "씬",
      price: 0
    },
    cheese: {
      name: "치즈 크러스트",
      price: 3000
    }
  },

  topping: {
    cheese: {
      name: "모짜렐라 치즈",
      price: 2000
    },
    pepperoni: {
      name: "페퍼로니",
      price: 1500
    },
    bacon: {
      name: "베이컨",
      price: 2000
    },
    olive: {
      name: "올리브",
      price: 1000
    }
  }
};

/* ==============================
   HTML 요소 가져오기
============================== */

const orderForm = document.getElementById("order-form");

const quantityElement = document.getElementById("quantity");
const minusBtn = document.getElementById("minus-btn");
const plusBtn = document.getElementById("plus-btn");

const totalPriceElement = document.getElementById("total-price");
const requestInput = document.getElementById("request");

const orderModal = document.getElementById("order-modal");
const closeModalBtn = document.getElementById("close-modal");

const orderBtn = orderForm.querySelector(".order-btn");

/* 기본 주문 수량 */

let quantity = 1;

/* ==============================
   금액 표시 형식
   예: 18000 → 18,000원
============================== */

function formatPrice(price) {
  return price.toLocaleString("ko-KR") + "원";
}

/* ==============================
   HTML에 옵션별 가격 표시

   JavaScript의 가격 정보가 변경되면
   화면에 표시되는 가격도 자동 변경
============================== */

function renderOptionPrices() {
  const priceElements = document.querySelectorAll("[data-price]");

  priceElements.forEach(function (element) {
    const [category, option] = element.dataset.price.split(".");

    const price = prices[category][option].price;

    if (category === "size") {
      element.textContent = formatPrice(price);
    } else if (price === 0) {
      element.textContent = "기본";
    } else {
      element.textContent = "+" + formatPrice(price);
    }
  });

  // 기본 판매 가격 표시
  document.getElementById("base-price").textContent =
    formatPrice(prices.size.medium.price);
}

/* ==============================
   현재 선택한 주문 정보 가져오기
============================== */

function getOrderData() {

  // 선택한 사이즈
  const selectedSize = orderForm.querySelector(
    'input[name="size"]:checked'
  ).value;

  // 선택한 도우
  const selectedDough = orderForm.querySelector(
    'input[name="dough"]:checked'
  ).value;

  // 선택한 추가 토핑
  const selectedToppings = Array.from(
    orderForm.querySelectorAll('input[name="topping"]:checked')
  ).map(function (input) {
    return prices.topping[input.value];
  });

  const size = prices.size[selectedSize];
  const dough = prices.dough[selectedDough];

  // 추가 토핑 가격 합계
  const toppingTotal = selectedToppings.reduce(
    function (sum, topping) {
      return sum + topping.price;
    },
    0
  );

  // 피자 한 판의 금액
  const unitPrice =
    size.price +
    dough.price +
    toppingTotal;

  // 최종 주문 금액
  const totalPrice = unitPrice * quantity;

  return {
    size: size,
    dough: dough,
    toppings: selectedToppings,
    quantity: quantity,
    request: requestInput.value.trim(),
    unitPrice: unitPrice,
    totalPrice: totalPrice
  };
}

/* ==============================
   총 주문 금액 업데이트
============================== */

function updateTotalPrice() {
  const order = getOrderData();

  totalPriceElement.textContent =
    formatPrice(order.totalPrice);
}

/* ==============================
   수량 및 버튼 상태 업데이트
============================== */

function updateQuantity() {
  quantityElement.textContent = quantity;

  // 수량이 1개일 때 감소 버튼 비활성화
  minusBtn.disabled = quantity <= 1;

  updateTotalPrice();
}

/* ==============================
   옵션 변경 이벤트
============================== */

orderForm.addEventListener("change", function (event) {

  if (
    event.target.matches('input[type="radio"]') ||
    event.target.matches('input[type="checkbox"]')
  ) {
    updateTotalPrice();
  }

});

/* ==============================
   수량 증가 및 감소
============================== */

plusBtn.addEventListener("click", function () {
  quantity += 1;
  updateQuantity();
});

minusBtn.addEventListener("click", function () {

  if (quantity > 1) {
    quantity -= 1;
    updateQuantity();
  }

});

/* ==============================
   선택 초기화

   사이즈: 미디움
   도우: 오리지널
   토핑: 선택 없음
   수량: 1개
   요청사항: 빈 상태
============================== */

orderForm.addEventListener("reset", function () {

  // HTML의 기본 초기화가 끝난 뒤 실행
  setTimeout(function () {
    quantity = 1;
    updateQuantity();
  }, 0);

});

/* ==============================
   주문 결과 팝업 표시
============================== */

function showOrderModal() {
  const order = getOrderData();

  // 피자 이름
  document.getElementById("result-name").textContent =
    document.getElementById("pizza-name").textContent;

  // 사이즈
  document.getElementById("result-size").textContent =
    order.size.name +
    " (" + formatPrice(order.size.price) + ")";

  // 도우
  document.getElementById("result-dough").textContent =
    order.dough.name +
    (
      order.dough.price > 0
        ? " (+" + formatPrice(order.dough.price) + ")"
        : ""
    );

  // 추가 토핑
  const toppingNames = order.toppings.map(
    function (topping) {
      return topping.name;
    }
  );

  document.getElementById("result-toppings").textContent =
    toppingNames.length > 0
      ? toppingNames.join(", ")
      : "선택 없음";

  // 수량
  document.getElementById("result-quantity").textContent =
    order.quantity + "개";

  // 주문 요청사항
  document.getElementById("result-request").textContent =
    order.request || "요청사항 없음";

  // 총 주문 금액
  document.getElementById("result-total").textContent =
    formatPrice(order.totalPrice);

  // 팝업 열기
  orderModal.showModal();

  // 팝업이 열려 있는 동안 배경 스크롤 방지
  document.body.style.overflow = "hidden";

  closeModalBtn.focus();
}

/* ==============================
   주문하기 버튼
============================== */

orderForm.addEventListener("submit", function (event) {

  // 페이지 새로고침 및 실제 주문 전송 방지
  event.preventDefault();

  showOrderModal();

});

/* ==============================
   팝업 닫기
============================== */

closeModalBtn.addEventListener("click", function () {
  orderModal.close();
});

// 팝업 바깥 영역 클릭 시 닫기
orderModal.addEventListener("click", function (event) {

  if (event.target === orderModal) {

    const rect = orderModal.getBoundingClientRect();

    const isOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (isOutside) {
      orderModal.close();
    }

  }

});

// 닫기 버튼 또는 ESC 키로 팝업을 닫았을 때
orderModal.addEventListener("close", function () {

  document.body.style.overflow = "";

  // 기존 주문 선택 상태 유지
  orderBtn.focus();

});

/* ==============================
   페이지 최초 실행
============================== */

renderOptionPrices();
updateQuantity();
