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

const outcomeMap = {
  shape: {
    title: "The Sculpt Fit",
    text: "You are buying for silhouette first. Lead with the high-waist contour story and the shape-enhancing payoff.",
    accent: "#ffb48e"
  },
  comfort: {
    title: "The Soft Support Fit",
    text: "You want a legging that feels easy to wear for hours. Sell softness, stretch and zero-fuss comfort.",
    accent: "#ffd7c5"
  },
  versatile: {
    title: "The All-Day Fit",
    text: "You want one pair that works in the gym and still looks elevated outside it. Sell versatility hard.",
    accent: "#dfff79"
  },
  confidence: {
    title: "The Contour Confidence Fit",
    text: "You are shopping for that instant good-feeling mirror moment. Sell confidence, support and clean lines.",
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
    const firstOption = quizCard.querySelector(".quiz-option");
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

if (ugcStrip) {
  let autoScroll;

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

document.querySelectorAll(".review-photo").forEach((card) => {
  card.addEventListener("click", () => openReviewModal(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openReviewModal(card);
    }
  });
});

reviewModalBackdrop?.addEventListener("click", closeReviewModal);
reviewModalClose?.addEventListener("click", closeReviewModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && reviewModal?.classList.contains("is-open")) {
    closeReviewModal();
  }
});

const productConfigImage = document.getElementById("product-config-image");
const colorSwatches = document.querySelectorAll(".color-swatch");
const sizeChips = document.querySelectorAll(".size-chip");
const qtyDecrease = document.getElementById("qty-decrease");
const qtyIncrease = document.getElementById("qty-increase");
const qtyValue = document.getElementById("qty-value");
const selectionSummary = document.getElementById("selection-summary");
const selectionTotal = document.getElementById("selection-total");
const checkoutButton = document.getElementById("checkout-button");
let selectedColour = document.querySelector(".color-swatch.active")?.dataset.label || "Mocha Taupe";
let selectedSize = document.querySelector(".size-chip.active")?.textContent?.trim() || "S";
let selectedQuantity = 1;
const unitPrice = 22.99;

function formatPrice(value) {
  return `£${value.toFixed(2).replace(".", ",")}`;
}

function updateSelectionSummary() {
  if (selectionSummary) {
    selectionSummary.textContent = `Colour: ${selectedColour} | Size: ${selectedSize} | Qty: ${selectedQuantity}`;
  }

  if (selectionTotal) {
    selectionTotal.textContent = `Total: ${formatPrice(unitPrice * selectedQuantity)}`;
  }

  if (checkoutButton) {
    checkoutButton.textContent = `Buy ${selectedQuantity} now`;
  }
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
    });
  });
}

qtyDecrease?.addEventListener("click", () => {
  selectedQuantity = Math.max(1, selectedQuantity - 1);
  if (qtyValue) {
    qtyValue.textContent = String(selectedQuantity);
  }
  updateSelectionSummary();
});

qtyIncrease?.addEventListener("click", () => {
  selectedQuantity = Math.min(9, selectedQuantity + 1);
  if (qtyValue) {
    qtyValue.textContent = String(selectedQuantity);
  }
  updateSelectionSummary();
});

updateSelectionSummary();

formatPrice = (value) => `£${value.toFixed(2)}`;
updateSelectionSummary();

document.querySelectorAll(".star-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const selectedRating = Number(button.dataset.rating || 5);

    document.querySelectorAll(".star-btn").forEach((starButton) => {
      const starRating = Number(starButton.dataset.rating || 0);
      starButton.classList.toggle("active", starRating <= selectedRating);
    });
  });
});

document.getElementById("review-photo-input")?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  const reviewPreview = document.getElementById("review-preview");
  const reviewPreviewImage = document.getElementById("review-preview-image");

  if (!file || !reviewPreview || !reviewPreviewImage) {
    return;
  }

  reviewPreviewImage.src = URL.createObjectURL(file);
  reviewPreview.hidden = false;
});

checkoutButton?.addEventListener("click", async () => {
  const checkoutNote = document.getElementById("checkout-note");

  try {
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
        quantity: selectedQuantity
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
      checkoutNote.textContent = "Checkout is not configured yet. Add your Stripe secret key and restart the store server.";
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
