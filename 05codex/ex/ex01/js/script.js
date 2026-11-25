"use strict";

const converters = {
  length: {
    baseUnit: "m",
    // Factors are exact counts of micrometers.
    units: [
      { symbol: "mm", name: "밀리미터", factor: 1000n },
      { symbol: "cm", name: "센티미터", factor: 10000n },
      { symbol: "m", name: "미터", factor: 1000000n },
      { symbol: "km", name: "킬로미터", factor: 1000000000n },
      { symbol: "in", name: "인치", factor: 25400n },
      { symbol: "ft", name: "피트", factor: 304800n },
      { symbol: "yd", name: "야드", factor: 914400n },
      { symbol: "mi", name: "마일", factor: 1609344000n },
    ],
  },
  weight: {
    baseUnit: "kg",
    // Factors are exact counts of picograms.
    units: [
      { symbol: "mg", name: "밀리그램", factor: 1_000_000_000n },
      { symbol: "g", name: "그램", factor: 1_000_000_000_000n },
      { symbol: "kg", name: "킬로그램", factor: 1_000_000_000_000_000n },
      { symbol: "t", name: "톤", factor: 1_000_000_000_000_000_000n },
      { symbol: "oz", name: "온스", factor: 28_349_523_125_000n },
      { symbol: "lb", name: "파운드", factor: 453_592_370_000_000n },
      { symbol: "st", name: "스톤", factor: 6_350_293_180_000_000n },
      { symbol: "근", name: "근", factor: 600_000_000_000_000n },
    ],
  },
};
function initializeTheme() {
  const root = document.documentElement;
  const button = document.querySelector("#theme");
  const links = document.querySelectorAll(".converter-card, .home-link");
  const storageKey = "unit-converter-theme";
  const pageTheme = new URLSearchParams(location.search).get("theme");
  let savedTheme;

  try {
    savedTheme = localStorage.getItem(storageKey);
  } catch {
    // Local files and restricted browser settings can disable storage.
  }

  function applyTheme(theme) {
    const dark = theme === "dark";
    root.dataset.theme = dark ? "dark" : "light";
    button.setAttribute("aria-pressed", String(dark));
    button.querySelector(".theme-icon").textContent = dark ? "☀" : "☾";

    for (const link of links) {
      const destination = new URL(link.href);
      destination.searchParams.set("theme", root.dataset.theme);
      link.href = destination.href;
    }
  }

  applyTheme(pageTheme === "dark" || pageTheme === "light" ? pageTheme : savedTheme);

  button.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Navigation links still carry the selected theme.
    }
    try {
      const current = new URL(location.href);
      current.searchParams.set("theme", theme);
      history.replaceState(history.state, "", current.href);
    } catch {
      // Some browsers restrict history updates for local files.
    }
  });
}

function initializeConverter({ baseUnit, units }) {
  const baseScale = units.find((unit) => unit.symbol === baseUnit).factor;
  const input = document.querySelector("#amount");
  const select = document.querySelector("#unit");
  const reset = document.querySelector("#reset");
  const list = document.querySelector("#result-list");
  const template = document.querySelector("#result-template");
  const inputError = document.querySelector("#input-error");
  const copyStatus = document.querySelector("#copy-status");
  const wholeNumberFormat = new Intl.NumberFormat("en-US");
  const editableDecimal = /^[0-9]*\.?[0-9]*$/;
  const significantDigits = 12;
  let lastInput = "";
  let revision = 0;

  for (const unit of units) {
    const label = unit.name === unit.symbol ? unit.name : unit.name + " (" + unit.symbol + ")";
    select.add(new Option(label, unit.symbol));
  }
  select.value = baseUnit;

  function parseBaseAmount(value, factor) {
    if (value === "" || value === ".") return null;
    const [integer, fraction = ""] = value.split(".");
    return {
      numerator: BigInt(integer + fraction) * factor,
      denominator: 10n ** BigInt(fraction.length) * baseScale,
    };
  }

  function formatResult(numerator, denominator) {
    if (numerator === 0n) return { display: "0", copy: "0" };

    let exponent = numerator.toString().length - denominator.toString().length;
    const magnitude = 10n ** BigInt(Math.abs(exponent));
    const belowMagnitude = exponent < 0
      ? numerator * magnitude < denominator
      : numerator < denominator * magnitude;
    if (belowMagnitude) exponent--;

    const shift = significantDigits - 1 - exponent;
    const scale = 10n ** BigInt(Math.abs(shift));
    const scaledNumerator = shift < 0 ? numerator : numerator * scale;
    const scaledDenominator = shift < 0 ? denominator * scale : denominator;
    const rounded = (scaledNumerator * 2n + scaledDenominator) / (scaledDenominator * 2n);
    const digits = rounded.toString();
    if (digits.length > significantDigits) exponent++;
    const trimmed = digits.replace(/0+$/, "");

    if (exponent >= 15 || exponent < -6) {
      const coefficient = trimmed.length > 1 ? trimmed[0] + "." + trimmed.slice(1) : trimmed;
      const scientific = coefficient + "e" + (exponent >= 0 ? "+" : "") + exponent;
      return { display: scientific, copy: scientific };
    }

    const decimalPosition = exponent + 1;
    const integer = decimalPosition > 0 ? trimmed.slice(0, decimalPosition).padEnd(decimalPosition, "0") : "0";
    const fraction = decimalPosition > 0 ? trimmed.slice(decimalPosition) : "0".repeat(-decimalPosition) + trimmed;
    const suffix = fraction ? "." + fraction : "";
    return { display: wholeNumberFormat.format(BigInt(integer)) + suffix, copy: integer + suffix };
  }

  function updateResults() {
    revision++;
    copyStatus.textContent = "";
    const from = units.find((unit) => unit.symbol === select.value);
    const baseAmount = parseBaseAmount(lastInput, from.factor);
    const rows = document.createDocumentFragment();

    for (const unit of units) {
      if (unit === from) continue;
      const row = template.content.cloneNode(true);
      row.querySelector(".unit-symbol").textContent = unit.symbol;
      row.querySelector(".unit-name").textContent = unit.name;
      const button = row.querySelector(".copy-button");
      button.setAttribute("aria-label", unit.name + " 변환값 복사");

      if (baseAmount) {
        const result = formatResult(baseAmount.numerator * baseScale, baseAmount.denominator * unit.factor);
        row.querySelector(".result-value").textContent = result.display;
        button.disabled = false;
        button.dataset.value = result.copy;
        button.dataset.unit = unit.name;
      }
      rows.append(row);
    }
    list.replaceChildren(rows);
  }

  function setInputError(show) {
    if (show) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    inputError.textContent = show ? "0 이상의 숫자를 소수점 하나까지 입력할 수 있습니다." : "";
    inputError.hidden = !show;
  }

  function validateInput() {
    if (!editableDecimal.test(input.value)) {
      input.value = lastInput;
      setInputError(true);
      return;
    }
    lastInput = input.value;
    setInputError(false);
    updateResults();
  }

  function copyWithSelection(value, button) {
    const field = document.createElement("textarea");
    field.value = value;
    field.readOnly = true;
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.append(field);
    field.select();
    try {
      return document.execCommand("copy");
    } finally {
      field.remove();
      if (button.isConnected) button.focus({ preventScroll: true });
    }
  }

  input.addEventListener("input", (event) => {
    if (!event.isComposing) validateInput();
  });
  input.addEventListener("compositionend", validateInput);
  select.addEventListener("change", updateResults);
  reset.addEventListener("click", () => {
    input.value = "";
    select.value = baseUnit;
    validateInput();
    input.focus();
  });

  list.addEventListener("click", async (event) => {
    const button = event.target.closest(".copy-button");
    if (!button || button.disabled) return;
    const currentRevision = revision;
    const { value, unit } = button.dataset;
    let copied = false;

    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch {
      if (currentRevision !== revision) return;
      try {
        copied = copyWithSelection(value, button);
      } catch {
        copied = false;
      }
    }

    if (currentRevision === revision) {
      copyStatus.textContent = copied ? unit + " 값 복사 완료" : "복사할 수 없습니다.";
    }
  });

  updateResults();
}

initializeTheme();
const converter = converters[document.documentElement.dataset.converter];
if (converter) initializeConverter(converter);
