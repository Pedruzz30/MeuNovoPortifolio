/* =========================================================
   PEDRO PIMENTA — SELECTED WORK
   Interactions for the selected-work section.
   ========================================================= */

(() => {

  /* =======================================================
     ELEMENTS
     ======================================================= */

  const work = document.querySelector("#work");

  if (!work) return;


  const projects = [
    ...work.querySelectorAll(".project")
  ];

  const workHeader = work.querySelector(".work__header");

  const workTitle = work.querySelector(".work__title");

  const orb = work.querySelector(".work__orb");

  const caseLinks = [
    ...work.querySelectorAll(".case-link")
  ];

  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  const finePointer =
    window.matchMedia(
      "(pointer: fine)"
    ).matches;


  /* =======================================================
     JS ACTIVE
     ======================================================= */

  document.documentElement.classList.add("js");

  work.classList.add("work--js");


  /* =======================================================
     IFRAME PREVIEW — VIEWPORT VIRTUAL DESKTOP

     Cada preview roda o site real dentro de uma
     viewport virtual fixa de 1440 x 900.

     O iframe NUNCA recebe a largura física do card:
     ele continua tendo 1440px de viewport e é
     reduzido proporcionalmente por transform: scale(),
     como uma miniatura de monitor.

     scale = larguraDoFrame / 1440

     Isso roda ANTES do early return de reduced motion,
     porque o scale não é animação — é layout.
     ======================================================= */

  const PREVIEW_WIDTH = 1440;
  const PREVIEW_HEIGHT = 900;


  const iframeFrames = [
    ...work.querySelectorAll(".project__iframe-frame")
  ];


  /*
    Recebe a largura já medida quando ela vem
    do ResizeObserver (valor pré-transform,
    imune à rotação sutil dos previews).
  */

  function updateIframeScale(frame, measuredWidth) {

    if (!frame) return;


    const width =
      typeof measuredWidth === "number" &&
      measuredWidth > 0
        ? measuredWidth
        : frame.clientWidth;


    /*
      Frame ainda sem layout (display:none,
      aba em background, etc.) — mantém o
      último valor válido.
    */

    if (!width) return;


    const scale = width / PREVIEW_WIDTH;


    frame.style.setProperty(
      "--iframe-scale",
      scale.toFixed(6)
    );

  }


  if (iframeFrames.length) {

    /*
      Expõe a viewport virtual para o CSS,
      mantendo uma única fonte de verdade.
    */

    iframeFrames.forEach((frame) => {

      frame.style.setProperty(
        "--iframe-viewport-w",
        String(PREVIEW_WIDTH)
      );

      frame.style.setProperty(
        "--iframe-viewport-h",
        String(PREVIEW_HEIGHT)
      );

      updateIframeScale(frame);

    });


    if ("ResizeObserver" in window) {

      /*
        Um único observer para os três previews.
        Cobre resize de janela, mudança de
        breakpoint, reflow e zoom — sem
        requestAnimationFrame contínuo e sem
        listener de resize pesado.
      */

      const previewObserver =
        new ResizeObserver((entries) => {

          entries.forEach((entry) => {

            let width = 0;


            /*
              contentBoxSize é fracionário e
              pré-transform; contentRect é o
              fallback para browsers antigos.
            */

            if (entry.contentBoxSize) {

              const box =
                Array.isArray(entry.contentBoxSize)
                  ? entry.contentBoxSize[0]
                  : entry.contentBoxSize;

              width = box ? box.inlineSize : 0;

            }


            if (!width && entry.contentRect) {
              width = entry.contentRect.width;
            }


            updateIframeScale(
              entry.target,
              width
            );

          });

        });


      iframeFrames.forEach((frame) => {
        previewObserver.observe(frame);
      });

    } else {

      /*
        Fallback: só entra em browsers sem
        ResizeObserver.
      */

      let scaleRaf = null;


      const recalcAllScales = () => {

        scaleRaf = null;

        iframeFrames.forEach((frame) => {
          updateIframeScale(frame);
        });

      };


      window.addEventListener(
        "resize",
        () => {

          if (scaleRaf) return;

          scaleRaf =
            requestAnimationFrame(
              recalcAllScales
            );

        },
        {
          passive: true
        }
      );

    }

  }


  /* =======================================================
     REDUCED MOTION
     ======================================================= */

  if (prefersReducedMotion) {

    work.classList.add("work--reduced-motion");

    projects.forEach((project) => {
      project.classList.add("is-visible");
    });

    workHeader?.classList.add("is-visible");

    return;
  }


  /* =======================================================
     HEADER REVEAL
     ======================================================= */

  if (workHeader) {

    const headerObserver =
      new IntersectionObserver(

        (entries, observer) => {

          entries.forEach((entry) => {

            if (!entry.isIntersecting) return;

            workHeader.classList.add(
              "is-visible"
            );

            observer.unobserve(entry.target);

          });

        },

        {
          threshold: 0.18
        }

      );

    headerObserver.observe(workHeader);

  }


  /* =======================================================
     PROJECT REVEAL
     ======================================================= */

  const projectObserver =
    new IntersectionObserver(

      (entries, observer) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) return;

          const project = entry.target;

          project.classList.add(
            "is-visible"
          );

          observer.unobserve(project);

        });

      },

      {
        threshold: 0.16,
        rootMargin:
          "0px 0px -8% 0px"
      }

    );


  projects.forEach((project) => {

    projectObserver.observe(project);

  });


  /* =======================================================
     WORK ORB — CURSOR REACTION
     ======================================================= */

  if (
    orb &&
    finePointer
  ) {

    let orbX = 0;
    let orbY = 0;

    let targetOrbX = 0;
    let targetOrbY = 0;

    let orbRaf = null;


    const animateOrb = () => {

      orbX +=
        (targetOrbX - orbX) * 0.06;

      orbY +=
        (targetOrbY - orbY) * 0.06;


      orb.style.transform = `
        translate3d(
          ${orbX}px,
          ${orbY}px,
          0
        )
      `;


      if (
        Math.abs(targetOrbX - orbX) >
          0.02 ||
        Math.abs(targetOrbY - orbY) >
          0.02
      ) {

        orbRaf =
          requestAnimationFrame(
            animateOrb
          );

      } else {

        orbRaf = null;

      }

    };


    const requestOrbAnimation =
      () => {

        if (orbRaf) return;

        orbRaf =
          requestAnimationFrame(
            animateOrb
          );

      };


    work.addEventListener(
      "pointermove",
      (event) => {

        const rect =
          work.getBoundingClientRect();


        const nx =
          (
            event.clientX -
            rect.left
          ) /
          rect.width -
          0.5;


        const ny =
          (
            event.clientY -
            rect.top
          ) /
          rect.height -
          0.5;


        targetOrbX =
          nx * 20;

        targetOrbY =
          ny * 15;


        requestOrbAnimation();

      }
    );


    work.addEventListener(
      "pointerleave",
      () => {

        targetOrbX = 0;
        targetOrbY = 0;

        requestOrbAnimation();

      }
    );

  }


  /* =======================================================
     MAGNETIC CASE LINKS
     ======================================================= */

  if (
    finePointer &&
    window.innerWidth > 760
  ) {

    caseLinks.forEach(
      (link) => {

        const circle =
          link.querySelector(
            ".case-link__circle"
          );

        if (!circle) return;


        link.addEventListener(
          "pointermove",
          (event) => {

            const rect =
              link.getBoundingClientRect();


            const x =
              event.clientX -
              rect.left -
              rect.width / 2;


            const y =
              event.clientY -
              rect.top -
              rect.height / 2;


            circle.style.transform = `
              translate3d(
                ${x * 0.12}px,
                ${y * 0.12}px,
                0
              )
              scale(1.08)
            `;

          }
        );


        link.addEventListener(
          "pointerleave",
          () => {

            circle.style.transform =
              "";

          }
        );

      }
    );

  }


  /* =======================================================
     SCROLL-BASED SUBTLE MOVEMENT
     ======================================================= */

  let scrollRaf = null;


  const updateScrollMotion = () => {

    scrollRaf = null;


    const rect =
      work.getBoundingClientRect();


    const viewportHeight =
      window.innerHeight;


    const total =
      rect.height +
      viewportHeight;


    const progress =
      Math.min(
        1,
        Math.max(
          0,
          (
            viewportHeight -
            rect.top
          ) / total
        )
      );


    work.style.setProperty(
      "--work-progress",
      progress.toFixed(4)
    );


    /*
      Movimento extremamente sutil
      no título da section.
    */

    if (workTitle) {

      const offset =
        (progress - 0.25) * -18;


      workTitle.style.setProperty(
        "--work-title-shift",
        `${offset}px`
      );

    }

  };


  const requestScrollMotion =
    () => {

      if (scrollRaf) return;

      scrollRaf =
        requestAnimationFrame(
          updateScrollMotion
        );

    };


  window.addEventListener(
    "scroll",
    requestScrollMotion,
    {
      passive: true
    }
  );


  window.addEventListener(
    "resize",
    requestScrollMotion,
    {
      passive: true
    }
  );


  updateScrollMotion();


  /* =======================================================
     PROJECT HOVER STATE
     ======================================================= */

  projects.forEach(
    (project) => {

      const visual =
        project.querySelector(
          ".project__visual"
        );

      if (!visual) return;


      visual.addEventListener(
        "pointerenter",
        () => {

          project.classList.add(
            "is-hovered"
          );

        }
      );


      visual.addEventListener(
        "pointerleave",
        () => {

          project.classList.remove(
            "is-hovered"
          );

        }
      );

    }
  );


})();
