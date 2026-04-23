const quizQuestions = [
  {
    question: "What matters most in a legging?",
    options: [
      { label: "A sculpted shape", value: "shape" },
      { label: "Soft all-day comfort", value: "comfort" },
      { label: "Gym-to-street styling", value: "versatile" },
      { label: "Feeling more confident instantly", value: "confidence" }
    ]
  },
  {
    question: "What usually ruins leggings for you?",
    options: [
      { label: "They roll down", value: "shape" },
      { label: "They feel too tight", value: "comfort" },
      { label: "They only work for the gym", value: "versatile" },
      { label: "They do nothing for my shape", value: "confidence" }
    ]
  },
  {
    question: "What look are you buying for?",
    options: [
      { label: "Snatched and sculpted", value: "shape" },
      { label: "Clean and effortless", value: "versatile" },
      { label: "Soft and wearable", value: "comfort" },
      { label: "Polished and confident", value: "confidence" }
    ]
  },
  {
    question: "How do you want the waistband to feel?",
    options: [
      { label: "Held in and smooth", value: "shape" },
      { label: "Secure but soft", value: "comfort" },
      { label: "Flattering under layers", value: "versatile" },
      { label: "Confidence-boosting", value: "confidence" }
    ]
  },
  {
    question: "Where will you wear them most?",
    options: [
      { label: "Gym sessions", value: "shape" },
      { label: "All day", value: "comfort" },
      { label: "Gym and errands", value: "versatile" },
      { label: "Any time I want to feel good", value: "confidence" }
    ]
  },
  {
    question: "What would make you buy today?",
    options: [
      { label: "A more flattering silhouette", value: "shape" },
      { label: "Comfort I can trust", value: "comfort" },
      { label: "One pair that works everywhere", value: "versatile" },
      { label: "Feeling amazing as soon as I put them on", value: "confidence" }
    ]
  }
];

function createMetaEventId(eventName) {
  const safeEventName = String(eventName || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const randomPart = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${safeEventName}-${randomPart}`;
}

function getCookieValue(name) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

function sendMetaServerEvent(eventName, payload, eventId) {
  if (!eventId || !navigator.sendBeacon) {
    return;
  }

  const serverPayload = {
    event_name: eventName,
    event_id: eventId,
    event_source_url: window.location.href,
    fbp: getCookieValue("_fbp"),
    fbc: getCookieValue("_fbc"),
    custom_data: payload
  };

  const body = JSON.stringify(serverPayload);
  const sent = navigator.sendBeacon("/.netlify/functions/track-meta-event", new Blob([body], { type: "application/json" }));

  if (!sent) {
    fetch("/.netlify/functions/track-meta-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body,
      keepalive: true
    }).catch(() => {});
  }
}

function trackMetaEvent(eventName, payload = {}, options = {}) {
  const normalisedPayload = { ...payload };
  const eventId = options.eventId || createMetaEventId(eventName);
  const sendServer = options.sendServer === true;

  if (Object.prototype.hasOwnProperty.call(normalisedPayload, "value")) {
    const numericValue = Number(normalisedPayload.value);
    normalisedPayload.value = Number.isFinite(numericValue) ? Number(numericValue.toFixed(2)) : 0;
    console.log("Pixel Value:", normalisedPayload.value);
  }

  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", eventName, normalisedPayload, { eventID: eventId });
  }

  if (sendServer) {
    sendMetaServerEvent(eventName, normalisedPayload, eventId);
  }

  return eventId;
}

const outcomeMap = {
  shape: {
    title: "The Sculpt Fit",
    text: "Your best match is the high-waist sculpt fit: smooth through the waist, flattering through the hips and easy to style.",
    accent: "#ffb48e"
  },
  comfort: {
    title: "The Soft Support Fit",
    text: "Your best match is soft support: gentle stretch, secure hold and an easy feel you can keep on after the gym.",
    accent: "#ffd7c5"
  },
  versatile: {
    title: "The All-Day Fit",
    text: "Your best match is the all-day fit: polished enough for coffee runs, comfortable enough for studio sessions.",
    accent: "#dfff79"
  },
  confidence: {
    title: "The Contour Confidence Fit",
    text: "Your best match is contour confidence: clean lines, soft shape and that instant good-mirror feeling.",
    accent: "#ff8b68"
  }
};

const answers = new Array(quizQuestions.length).fill(null);
let currentStep = 0;

const quizCard = document.getElementById("quiz-card");
const quizNext = document.getElementById("quiz-next");
const quizBack = document.getElementById("quiz-back");
const quizStepLabel = document.getElementById("quiz-step-label");
const quizProgressBar = document.getElementById("quiz-progress-bar");

function computeWinner() {
  const counts = answers.reduce((accumulator, value) => {
    if (!value) {
      return accumulator;
    }

    accumulator[value] = (accumulator[value] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || "shape";
}

function renderQuiz() {
  if (!quizCard || !quizNext || !quizBack || !quizStepLabel || !quizProgressBar) {
    return;
  }

  const isResult = currentStep >= quizQuestions.length;

  if (isResult) {
    const winner = computeWinner();
    const result = outcomeMap[winner] || outcomeMap.shape;

    quizStepLabel.textContent = "Your personalised result";
    quizProgressBar.style.width = "100%";
    quizCard.innerHTML = `
      <div class="quiz-result">
        <span class="result-chip" style="background:${result.accent}22;color:${result.accent};border:1px solid ${result.accent}44;">
          Best-fit path
        </span>
        <h3>${result.title}</h3>
        <p>${result.text}</p>
      </div>
    `;
    quizBack.disabled = false;
    quizNext.textContent = "Restart quiz";
    return;
  }

  const question = quizQuestions[currentStep];
  quizStepLabel.textContent = `Question ${currentStep + 1} of ${quizQuestions.length}`;
  quizProgressBar.style.width = `${((currentStep + 1) / quizQuestions.length) * 100}%`;

  quizCard.innerHTML = `
    <h3>${question.question}</h3>
    <div class="quiz-options">
      ${question.options.map((option) => `
        <button class="quiz-option ${answers[currentStep] === option.value ? "selected" : ""}" type="button" data-value="${option.value}">
          ${option.label}
        </button>
      `).join("")}
    </div>
  `;

  quizCard.querySelectorAll(".quiz-option").forEach((button) => {
    button.addEventListener("click", () => {
      answers[currentStep] = button.dataset.value;
      renderQuiz();
    });
  });

  quizBack.disabled = currentStep === 0;
  quizNext.textContent = currentStep === quizQuestions.length - 1 ? "Show my result" : "Next";
}

quizNext?.addEventListener("click", () => {
  if (currentStep >= quizQuestions.length) {
    currentStep = 0;
    answers.fill(null);
    renderQuiz();
    return;
  }

  if (!answers[currentStep]) {
    const firstOption = quizCard?.querySelector(".quiz-option");
    if (firstOption) {
      answers[currentStep] = firstOption.dataset.value;
    }
  }

  currentStep += 1;
  renderQuiz();
});

quizBack?.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep -= 1;
    renderQuiz();
  }
});

renderQuiz();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");

      if (entry.target.classList.contains("radial-wrap")) {
        entry.target.classList.add("animate");
      }
    }
  });
}, { threshold: 0.16 });

document.querySelectorAll(".reveal, .radial-wrap").forEach((element) => {
  revealObserver.observe(element);
});

const parallaxZone = document.querySelector("[data-parallax]");

if (parallaxZone) {
  const floatingCards = parallaxZone.querySelectorAll(".floating-card");

  document.addEventListener("pointermove", (event) => {
    const offsetX = (event.clientX / window.innerWidth - 0.5) * 24;
    const offsetY = (event.clientY / window.innerHeight - 0.5) * 24;

    parallaxZone.style.transform = `rotateX(${-offsetY * 0.18}deg) rotateY(${offsetX * 0.18}deg) translate3d(${offsetX * 0.25}px, ${offsetY * 0.25}px, 0)`;

    floatingCards.forEach((card, index) => {
      const factor = 0.6 + index * 0.28;
      card.style.transform = `translate3d(${offsetX * factor}px, ${offsetY * factor}px, ${(index + 1) * 10}px)`;
    });
  });
}

document.querySelectorAll(".tilt-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -10;
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

document.querySelectorAll(".magnetic").forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    const rect = button.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${offsetX * 0.08}px, ${offsetY * 0.08}px)`;
  });

  button.addEventListener("pointerleave", () => {
    button.style.transform = "";
  });
});

const ugcStrip = document.querySelector(".ugc-strip");
const reviewModal = document.getElementById("review-modal");
const reviewModalBackdrop = document.getElementById("review-modal-backdrop");
const reviewModalClose = document.getElementById("review-modal-close");
const reviewModalImage = document.getElementById("review-modal-image");
const reviewModalText = document.getElementById("review-modal-text");

function openReviewModal(card) {
  if (!reviewModal || !reviewModalImage || !reviewModalText) {
    return;
  }

  reviewModalImage.src = card.dataset.reviewImage || "";
  reviewModalImage.alt = card.dataset.reviewAlt || "Customer review photo";
  reviewModalText.textContent = card.dataset.reviewText || "";
  reviewModal.classList.add("is-open");
  reviewModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeReviewModal() {
  if (!reviewModal) {
    return;
  }

  reviewModal.classList.remove("is-open");
  reviewModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function attachReviewCardInteractions(card) {
  card.addEventListener("click", () => openReviewModal(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openReviewModal(card);
    }
  });
}

if (ugcStrip) {
  let autoScroll = null;

  const startAutoScroll = () => {
    if (autoScroll) {
      return;
    }

    autoScroll = window.setInterval(() => {
      const maxScrollLeft = ugcStrip.scrollWidth - ugcStrip.clientWidth;
      const nextScrollLeft = ugcStrip.scrollLeft + 260;
      ugcStrip.scrollTo({
        left: nextScrollLeft >= maxScrollLeft ? 0 : nextScrollLeft,
        behavior: "smooth"
      });
    }, 2200);
  };

  const stopAutoScroll = () => {
    window.clearInterval(autoScroll);
    autoScroll = null;
  };

  const ugcObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        ugcStrip.classList.add("visible");
        startAutoScroll();
      } else {
        stopAutoScroll();
      }
    });
  }, { threshold: 0.35 });

  ugcObserver.observe(ugcStrip);
  ugcStrip.addEventListener("pointerenter", stopAutoScroll);
  ugcStrip.addEventListener("pointerleave", startAutoScroll);
}

document.querySelectorAll(".review-photo").forEach(attachReviewCardInteractions);
reviewModalBackdrop?.addEventListener("click", closeReviewModal);
reviewModalClose?.addEventListener("click", closeReviewModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && reviewModal?.classList.contains("is-open")) {
    closeReviewModal();
  }
});

const productConfigImage = document.getElementById("product-config-image");
const productConfigRoot = document.querySelector(".product-config");
const colorSwatches = document.querySelectorAll(".color-swatch");
const sizeChips = document.querySelectorAll(".size-chip");
const qtyDecrease = document.getElementById("qty-decrease");
const qtyIncrease = document.getElementById("qty-increase");
const qtyValue = document.getElementById("qty-value");
const selectionSummary = document.getElementById("selection-summary");
const selectionTotal = document.getElementById("selection-total");
const checkoutButton = document.getElementById("checkout-button");
const reviewName = document.getElementById("review-name");
const reviewComment = document.getElementById("review-comment");
const reviewStatus = document.getElementById("review-status");
const reviewPhotoInput = document.getElementById("review-photo-input");
const reviewPreview = document.getElementById("review-preview");
const reviewPreviewImage = document.getElementById("review-preview-image");
const reviewSubmit = document.getElementById("review-submit");

let selectedColour = document.querySelector(".color-swatch.active")?.dataset.label || "Mocha Taupe";
let selectedSize = document.querySelector(".size-chip.active")?.textContent?.trim() || "S";
let selectedQuantity = 1;
let selectedReviewRating = 5;
let hasTrackedAddToCart = false;
const productPriceElement = document.querySelector(".price-stack h2");

function parsePrice(value) {
  const numericValue = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 22.99;
}

const selectedProduct = {
  id: productConfigRoot?.dataset.productId || "london-fit-sculpt-flare-legging",
  name: productConfigRoot?.dataset.productName || "London Fit Sculpt Flare Leggings",
  category: "Leggings",
  price: parsePrice(productConfigRoot?.dataset.productPrice || productPriceElement?.textContent)
};

function getSelectedVariant() {
  const activeSwatch = document.querySelector(".color-swatch.active");
  const variantPrice = parsePrice(activeSwatch?.dataset.price || selectedProduct.price);

  return {
    id: `${selectedProduct.id}-${selectedColour.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${selectedSize.toLowerCase()}`,
    name: `${selectedProduct.name} - ${selectedColour} / ${selectedSize}`,
    colour: selectedColour,
    size: selectedSize,
    price: variantPrice
  };
}

function getSelectedQuantity() {
  const domQuantity = Number.parseInt(qtyValue?.textContent || "", 10);
  const quantity = Number.isFinite(domQuantity) && domQuantity > 0 ? domQuantity : selectedQuantity;
  return Math.min(9, Math.max(1, quantity));
}

function getTotalPrice(quantity = getSelectedQuantity(), variant = getSelectedVariant()) {
  return Number((variant.price * quantity).toFixed(2));
}

function buildPixelProductPayload({ value, quantity = getSelectedQuantity(), variant = getSelectedVariant() } = {}) {
  const pixelValue = Number(value ?? getTotalPrice(quantity, variant));

  return {
    content_name: variant.name,
    content_category: selectedProduct.category,
    content_type: "product",
    content_ids: [variant.id],
    value: Number.isFinite(pixelValue) ? Number(pixelValue.toFixed(2)) : selectedProduct.price,
    currency: "GBP",
    contents: [
      {
        id: variant.id,
        quantity,
        item_price: Number(variant.price.toFixed(2))
      }
    ]
  };
}

trackMetaEvent("ViewContent", buildPixelProductPayload({
  value: getSelectedVariant().price,
  quantity: 1
}), { sendServer: false });

function formatPrice(value) {
  return `\u00A3${value.toFixed(2)}`;
}

function updateSelectionSummary() {
  const currentVariant = getSelectedVariant();
  const currentQuantity = getSelectedQuantity();

  if (selectionSummary) {
    selectionSummary.textContent = `Colour: ${currentVariant.colour} | Size: ${currentVariant.size} | Qty: ${currentQuantity}`;
  }

  if (selectionTotal) {
    selectionTotal.textContent = `Total: ${formatPrice(getTotalPrice(currentQuantity, currentVariant))}`;
  }

  if (checkoutButton) {
    checkoutButton.textContent = currentQuantity > 1
      ? `Buy ${currentQuantity} Now - Limited Stock`
      : "Buy Now - Limited Stock";
  }
}

function trackConfiguredSelection() {
  if (hasTrackedAddToCart) {
    return;
  }

  hasTrackedAddToCart = true;
  trackMetaEvent("AddToCart", buildPixelProductPayload(), { sendServer: false });
}

if (productConfigImage && colorSwatches.length) {
  colorSwatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      colorSwatches.forEach((item) => item.classList.remove("active"));
      swatch.classList.add("active");

      const nextImage = swatch.dataset.image;
      const nextLabel = swatch.dataset.label || "Selected colour";
      selectedColour = nextLabel;
      updateSelectionSummary();
      trackConfiguredSelection();

      if (!nextImage || productConfigImage.getAttribute("src") === nextImage) {
        productConfigImage.setAttribute("alt", `Model wearing the ${nextLabel} sculpt leggings`);
        return;
      }

      productConfigImage.classList.add("is-switching");

      window.setTimeout(() => {
        productConfigImage.setAttribute("src", nextImage);
        productConfigImage.setAttribute("alt", `Model wearing the ${nextLabel} sculpt leggings`);
      }, 140);

      window.setTimeout(() => {
        productConfigImage.classList.remove("is-switching");
      }, 280);
    });
  });
}

if (sizeChips.length) {
  sizeChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      sizeChips.forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      selectedSize = chip.textContent.trim();
      updateSelectionSummary();
      trackConfiguredSelection();
    });
  });
}

qtyDecrease?.addEventListener("click", () => {
  selectedQuantity = Math.max(1, selectedQuantity - 1);
  if (qtyValue) {
    qtyValue.textContent = String(selectedQuantity);
  }
  updateSelectionSummary();
  trackConfiguredSelection();
});

qtyIncrease?.addEventListener("click", () => {
  selectedQuantity = Math.min(9, selectedQuantity + 1);
  if (qtyValue) {
    qtyValue.textContent = String(selectedQuantity);
  }
  updateSelectionSummary();
  trackConfiguredSelection();
});

updateSelectionSummary();

const starButtons = Array.from(document.querySelectorAll(".star-btn"));

function updateStarButtons() {
  starButtons.forEach((starButton) => {
    const starRating = Number(starButton.dataset.rating || 0);
    const isActive = starRating <= selectedReviewRating;
    starButton.classList.toggle("active", isActive);
    starButton.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

starButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedReviewRating = Number(button.dataset.rating || 5);
    updateStarButtons();

    starButtons.forEach((starButton) => {
      const starRating = Number(starButton.dataset.rating || 0);
      starButton.classList.remove("is-popping");

      if (starRating <= selectedReviewRating) {
        void starButton.offsetWidth;
        starButton.classList.add("is-popping");
      }
    });
  });
});

updateStarButtons();

reviewPhotoInput?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file || !reviewPreview || !reviewPreviewImage) {
    return;
  }

  reviewPreviewImage.src = URL.createObjectURL(file);
  reviewPreview.hidden = false;
});

reviewSubmit?.addEventListener("click", () => {
  const file = reviewPhotoInput?.files?.[0];
  const name = reviewName?.value.trim() || "London Fit customer";
  const comment = reviewComment?.value.trim();

  if (!comment) {
    if (reviewStatus) {
      reviewStatus.classList.remove("is-success");
      reviewStatus.classList.add("is-error");
      reviewStatus.textContent = "Add a short comment before submitting your review.";
    }
    return;
  }

  if (!file) {
    if (reviewStatus) {
      reviewStatus.classList.remove("is-success");
      reviewStatus.classList.add("is-error");
      reviewStatus.textContent = "Please upload a photo so your review can appear in the gallery.";
    }
    return;
  }

  if (!ugcStrip) {
    return;
  }

  const imageUrl = URL.createObjectURL(file);
  const filledStars = "\u2605".repeat(selectedReviewRating);
  const emptyStars = "\u2606".repeat(Math.max(0, 5 - selectedReviewRating));
  const reviewCard = document.createElement("article");
  reviewCard.className = "ugc-card tilt-card review-photo";
  reviewCard.tabIndex = 0;
  reviewCard.setAttribute("role", "button");
  reviewCard.setAttribute("aria-label", `Open customer review from ${name}`);
  reviewCard.dataset.reviewImage = imageUrl;
  reviewCard.dataset.reviewAlt = `Customer review photo from ${name}`;
  reviewCard.dataset.reviewText = `${filledStars}${emptyStars} ${name}: ${comment}`;
  reviewCard.innerHTML = `
    <img src="${imageUrl}" alt="Customer review photo from ${name}">
    <div class="ugc-user-note">
      <span class="ugc-user-stars">${filledStars}${emptyStars}</span>
      <strong>${name}</strong>
      <p>${comment}</p>
    </div>
  `;

  attachReviewCardInteractions(reviewCard);
  ugcStrip.prepend(reviewCard);
  ugcStrip.classList.add("visible");
  ugcStrip.scrollTo({ left: 0, behavior: "smooth" });

  if (reviewName) {
    reviewName.value = "";
  }

  if (reviewComment) {
    reviewComment.value = "";
  }

  if (reviewPhotoInput) {
    reviewPhotoInput.value = "";
  }

  if (reviewPreview) {
    reviewPreview.hidden = true;
  }

  if (reviewPreviewImage) {
    reviewPreviewImage.src = "";
  }

  selectedReviewRating = 5;
  updateStarButtons();

  if (reviewStatus) {
    reviewStatus.classList.remove("is-error");
    reviewStatus.classList.add("is-success");
    reviewStatus.textContent = "Your review, stars and photo were added to the reviews section on this page.";
  }
});

const urlState = new URLSearchParams(window.location.search);

if (urlState.get("checkout") === "success") {
  const checkoutSessionId = urlState.get("session_id") || "unknown-session";
  const purchaseStorageKey = `london-fit-purchase-${checkoutSessionId}`;

  if (!window.sessionStorage.getItem(purchaseStorageKey)) {
    const purchasedQuantity = Math.max(1, Number.parseInt(urlState.get("qty"), 10) || selectedQuantity);
    const purchasedVariant = getSelectedVariant();
    const purchaseValue = Number.parseFloat(urlState.get("total")) || getTotalPrice(purchasedQuantity, purchasedVariant);
    const purchaseEventId = urlState.get("purchase_event_id") || createMetaEventId("Purchase");

    trackMetaEvent("Purchase", buildPixelProductPayload({
      value: purchaseValue,
      quantity: purchasedQuantity,
      variant: purchasedVariant
    }), { eventId: purchaseEventId, sendServer: false });

    window.sessionStorage.setItem(purchaseStorageKey, "tracked");
  }
}

checkoutButton?.addEventListener("click", async () => {
  const checkoutNote = document.getElementById("checkout-note");

  try {
    const checkoutQuantity = getSelectedQuantity();
    const purchaseEventId = createMetaEventId("Purchase");

    trackMetaEvent("InitiateCheckout", {
      ...buildPixelProductPayload({
        value: getTotalPrice(checkoutQuantity),
        quantity: checkoutQuantity
      }),
      num_items: checkoutQuantity
    }, { sendServer: false });

    checkoutButton.classList.add("is-loading");
    checkoutButton.textContent = "Opening checkout...";

    if (checkoutNote) {
      checkoutNote.classList.remove("is-error");
      checkoutNote.textContent = "Your checkout will include the selected colour, size and quantity.";
    }

    const response = await fetch("/.netlify/functions/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        colour: selectedColour,
        size: selectedSize,
        quantity: checkoutQuantity,
        purchase_event_id: purchaseEventId
      })
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(data.error || "Unable to create checkout session.");
    }

    window.location.href = data.url;
  } catch (error) {
    checkoutButton.classList.remove("is-loading");
    updateSelectionSummary();

    if (checkoutNote) {
      checkoutNote.classList.add("is-error");
      checkoutNote.textContent = "Checkout could not open just now. Please try again in a moment.";
    }

    console.error(error);
  }
});

const topbar = document.querySelector(".topbar");

if (topbar && window.innerWidth > 820) {
  let lastScrollY = window.scrollY;

  const updateTopbarState = () => {
    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY;
    const passedHeroStart = currentScrollY > 120;

    if (scrollingDown && passedHeroStart) {
      topbar.classList.add("is-hidden");
    } else {
      topbar.classList.remove("is-hidden");
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener("scroll", updateTopbarState, { passive: true });
}

const countdownRoot = document.getElementById("promo-countdown");

if (countdownRoot) {
  const countdownUnits = {
    hours: countdownRoot.querySelector('[data-unit="hours"]'),
    minutes: countdownRoot.querySelector('[data-unit="minutes"]'),
    seconds: countdownRoot.querySelector('[data-unit="seconds"]')
  };

  const promoDeadline = Date.now() + ((7 * 60 * 60) + (42 * 60) + 19) * 1000;

  const updateCountdown = () => {
    const difference = Math.max(0, promoDeadline - Date.now());
    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownUnits.hours.textContent = String(hours).padStart(2, "0");
    countdownUnits.minutes.textContent = String(minutes).padStart(2, "0");
    countdownUnits.seconds.textContent = String(seconds).padStart(2, "0");
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1000);
}

const salesPop = document.getElementById("sales-pop");
const salesPopTitle = document.getElementById("sales-pop-title");
const salesPopText = document.getElementById("sales-pop-text");

if (salesPop && salesPopTitle && salesPopText) {
  const socialMessages = [
    { title: "18 bought today", text: "Someone in Chelsea just placed an order." },
    { title: "7 people are checking out", text: "Shoppers in London are viewing the black and taupe sizes now." },
    { title: "New London order", text: "A customer in Camden just bought size M." },
    { title: "146 people visited recently", text: "This product has been getting strong traffic in the last hour." },
    { title: "Low stock alert", text: "Soft Cream in S and M is moving fastest today." },
    { title: "Another order came in", text: "Someone in Notting Hill just bought Rose Pink." }
  ];

  let socialIndex = 0;

  const showSocialPop = () => {
    const message = socialMessages[socialIndex % socialMessages.length];
    socialIndex += 1;

    salesPopTitle.textContent = message.title;
    salesPopText.textContent = message.text;
    salesPop.classList.add("is-visible");

    window.setTimeout(() => {
      salesPop.classList.remove("is-visible");
    }, 3400);
  };

  showSocialPop();
  window.setInterval(showSocialPop, 6200);
}
