/* Hero-only pointer effects. */
const hero = document.querySelector("#hero");
const glow = document.querySelector(".cursor-glow");
const portrait = document.querySelector(".hero__figure");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (
  hero &&
  glow &&
  portrait &&
  window.matchMedia("(pointer: fine)").matches
) {
  const resetPointerEffects = () => {
    glow.style.opacity = "0";
    portrait.style.transform = "translateX(-50%)";
  };

  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) resetPointerEffects();
  });

  hero.addEventListener("pointerenter", () => {
    if (!reducedMotion.matches) glow.style.opacity = "1";
  });

  hero.addEventListener("pointerleave", resetPointerEffects);

  hero.addEventListener("pointermove", (event) => {
    if (reducedMotion.matches) return;

    const rect = hero.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    glow.style.left = `${x}px`;
    glow.style.top = `${y}px`;

    const nx = (x / rect.width - 0.5) * 2;
    const ny = (y / rect.height - 0.5) * 2;

    portrait.style.transform = `
      translateX(-50%)
      translate3d(${nx * -7}px, ${ny * -5}px, 0)
      scale(1.015)
    `;
  });
}
