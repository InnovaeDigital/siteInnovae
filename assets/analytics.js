/* Configure a measurement ID in the hosting template to enable Google Analytics.
   Events are always dispatched locally, so another analytics provider can listen too. */
window.innovaeTrack = function innovaeTrack(name, params = {}) {
  const detail = { name, ...params };
  window.dispatchEvent(new CustomEvent("innovae:conversion", { detail }));
  if (typeof window.gtag === "function") window.gtag("event", name, detail);
  if (typeof window.fbq === "function") window.fbq("trackCustom", name, detail);
};

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-track]");
  if (target) window.innovaeTrack(target.dataset.track, { page: location.pathname });
});
