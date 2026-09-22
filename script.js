"use strict";

const body = document.body;
const themeButton = document.getElementById("themeButton");
const themeIcon = document.getElementById("themeIcon");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const panel = document.querySelector(".links-panel");
const typed = document.getElementById("typed");
const shareButton = document.getElementById("shareButton");
const toast = document.getElementById("toast");

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

const finePointer = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
);

const desktop = window.matchMedia("(min-width: 801px)");

// Automatically update the footer year.
document.getElementById("year").textContent =
  new Date().getFullYear();

// -----------------------
// 1. LIGHT / DARK THEME
// -----------------------

function applyTheme(theme) {
  const isLight = theme === "light";

  body.classList.toggle("light", isLight);
  themeIcon.textContent = isLight ? "☾" : "☀";

  themeButton.setAttribute(
    "aria-label",
    isLight ? "Switch to dark theme" : "Switch to light theme"
  );

  themeMeta.setAttribute(
    "content",
    isLight ? "#f2f4fc" : "#080b16"
  );
}

let savedTheme;

try {
  savedTheme = localStorage.getItem("social-space-theme");
} catch {
  // The page also works when storage is blocked.
}

const initialTheme =
  savedTheme === "light" || savedTheme === "dark"
    ? savedTheme
    : window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";

applyTheme(initialTheme);

themeButton.addEventListener("click", () => {
  const nextTheme = body.classList.contains("light")
    ? "dark"
    : "light";

  applyTheme(nextTheme);

  try {
    localStorage.setItem("social-space-theme", nextTheme);
  } catch {
    // Changing the theme does not require storage.
  }
});

// -----------------------
// 2. TYPING ANIMATION
// -----------------------

// Change these sentences to suit you.
const phrases = [
  "A curious creator.",
  "Learning something new.",
  "Turning ideas into reality.",
  "Find me around the internet."
];

let phraseIndex = 0;
let characterIndex = 0;
let deleting = false;
let typingTimer;

function typeNextCharacter() {
  const phrase = phrases[phraseIndex];

  characterIndex += deleting ? -1 : 1;
  typed.textContent = phrase.slice(0, characterIndex);

  let delay = deleting ? 35 : 75;

  if (!deleting && characterIndex === phrase.length) {
    deleting = true;
    delay = 1700;
  } else if (deleting && characterIndex === 0) {
    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    delay = 350;
  }

  typingTimer = window.setTimeout(typeNextCharacter, delay);
}

function syncTyping() {
  window.clearTimeout(typingTimer);

  if (reducedMotion.matches) {
    typed.textContent = phrases[0];
    return;
  }

  // Pause the animation while the tab is hidden.
  if (document.hidden) return;

  phraseIndex = 0;
  characterIndex = 0;
  deleting = false;
  typed.textContent = "";

  typeNextCharacter();
}

syncTyping();

document.addEventListener("visibilitychange", syncTyping);

// -----------------------
// 3. DESKTOP CARD TILT
// -----------------------

let tiltFrame;

function resetTilt() {
  cancelAnimationFrame(tiltFrame);
  panel.style.setProperty("--rx", "0deg");
  panel.style.setProperty("--ry", "0deg");
}

panel.addEventListener("pointermove", (event) => {
  if (
    reducedMotion.matches ||
    !finePointer.matches ||
    !desktop.matches ||
    event.pointerType === "touch"
  ) {
    return;
  }

  // offsetWidth/Height give the panel's untransformed dimensions.
  const rect = panel.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;

  const rotateX = Math.max(-4, Math.min(4, -y * 7));
  const rotateY = Math.max(-4, Math.min(4, x * 7));

  cancelAnimationFrame(tiltFrame);

  tiltFrame = requestAnimationFrame(() => {
    panel.style.setProperty("--rx", `${rotateX}deg`);
    panel.style.setProperty("--ry", `${rotateY}deg`);
  });
});

panel.addEventListener("pointerleave", resetTilt);
panel.addEventListener("pointercancel", resetTilt);

desktop.addEventListener("change", resetTilt);
finePointer.addEventListener("change", resetTilt);

reducedMotion.addEventListener("change", () => {
  resetTilt();
  syncTyping();
});

// -----------------------
// 4. TOAST NOTIFICATIONS
// -----------------------

let toastTimer;

function showToast(message) {
  clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// -----------------------
// 5. SHARE / COPY LINK
// -----------------------

shareButton.addEventListener("click", async () => {
  if (!["https:", "http:"].includes(location.protocol)) {
    showToast("Publish your website first to share its link.");
    return;
  }

  const pageUrl = new URL(location.href);
  pageUrl.hash = "";

  const shareData = {
    title: document.title,
    text: "Here’s my little space on the internet!",
    url: pageUrl.href
  };

  // Use the native share menu where supported.
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      // Closing the share menu should not trigger a copy.
      if (error.name === "AbortError") return;
    }
  }

  // Otherwise, try copying the URL.
  try {
    await navigator.clipboard.writeText(pageUrl.href);
    showToast("Link copied! Ready to share ✨");
  } catch {
    showToast("Copy your page link from the browser address bar.");
  }
});

// Keep the displayed link count in sync with the HTML.
document.querySelector(".link-count").textContent =
  String(document.querySelectorAll(".social").length).padStart(2, "0");