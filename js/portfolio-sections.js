/* =========================================================
   PEDRO PIMENTA — ABOUT / NOTES / CONTACT
   ========================================================= */

(() => {
  document.documentElement.classList.add("js");

  if (window.location.hash) {
    document.documentElement.classList.add("has-deep-link");
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* Section reveals */
  const revealItems = [...document.querySelectorAll("[data-reveal]")];

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -7% 0px"
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));

    /* Keep deep links such as /#about visible during and after hash scrolling. */
    const revealVisibleItems = () => {
      revealItems.forEach((item) => {
        const rect = item.getBoundingClientRect();

        if (rect.top < window.innerHeight * 1.05 && rect.bottom > 0) {
          item.classList.add("is-visible");
          revealObserver.unobserve(item);
        }
      });
    };

    requestAnimationFrame(revealVisibleItems);
    window.setTimeout(revealVisibleItems, 900);
  }

  /* Accessible notes accordion */
  const notes = [...document.querySelectorAll(".note")];

  notes.forEach((note) => {
    const trigger = note.querySelector(".note__trigger");
    const body = note.querySelector(".note__body");

    if (!trigger || !body) return;

    trigger.addEventListener("click", () => {
      const willOpen = !note.classList.contains("is-open");

      notes.forEach((otherNote) => {
        const otherTrigger = otherNote.querySelector(".note__trigger");
        const otherBody = otherNote.querySelector(".note__body");

        otherNote.classList.remove("is-open");
        otherTrigger?.setAttribute("aria-expanded", "false");

        if (otherBody) otherBody.inert = true;
      });

      if (willOpen) {
        note.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        body.inert = false;
      }
    });
  });

  /* Mobile navigation */
  const menuButton = document.querySelector(".menu-btn");
  const navigation = document.querySelector(".pill-nav");

  const closeMenu = () => {
    document.body.classList.remove("is-menu-open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "Abrir menu");
  };

  menuButton?.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("is-menu-open");

    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  });

  navigation?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 760) closeMenu();
    },
    { passive: true }
  );
})();
