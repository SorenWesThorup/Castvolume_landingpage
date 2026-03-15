document.documentElement.classList.add("js");

const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear().toString();
}

const revealNodes = document.querySelectorAll(".reveal");
if (revealNodes.length > 0) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.15
    }
  );

  revealNodes.forEach((node) => observer.observe(node));
}
