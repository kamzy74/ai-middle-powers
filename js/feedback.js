// ===== FEEDBACK TAB =====
// No backend: submissions go to an external form service (URL in data/feedback-config.js).
const FEEDBACK_TYPES = [
  { v: "add-source", l: "Add a source" },
  { v: "different-tier", l: "Argue a different tier" },
  { v: "other", l: "Other" }
];
const feedbackConfigured = () => FEEDBACK_FORM_URL && !/^REPLACE_WITH/.test(FEEDBACK_FORM_URL);

// Hook for the future "engagement heat map": feedback counts per country, keyed by COUNTRIES[].name
// (and "EU" for the bloc). Returns {} for now. A later map layer can read it inside fillFor() in js/app.js.
function getFeedbackCounts() { return {}; }

(function initFeedback() {
  const host = document.getElementById("feedbackForm");
  const options = COUNTRIES.slice().sort((a, b) => a.label.localeCompare(b.label)).map(c => `<option value="${c.name}">${c.label}</option>`).join("");
  host.innerHTML = `
    <label for="fbCountry">Country</label>
    <select id="fbCountry" name="country" required>
      <option value="">Choose a country</option>${options}
      <option value="EU">European Union (bloc)</option>
      <option value="Other / not listed">Other / not listed</option>
    </select>
    <label for="fbType">Type</label>
    <select id="fbType" name="type" required>${FEEDBACK_TYPES.map(t => `<option value="${t.v}">${t.l}</option>`).join("")}</select>
    <label for="fbMessage">Message</label>
    <textarea id="fbMessage" name="message" rows="5" maxlength="3000" required placeholder="What should we add or reconsider, and why?"></textarea>
    <label for="fbLink">Link <span class="opt">(optional)</span></label>
    <input id="fbLink" name="link" type="url" placeholder="https://">
    <label for="fbName">Your name <span class="opt">(optional)</span></label>
    <input id="fbName" name="name" type="text" maxlength="120" autocomplete="name">
    <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
    <div class="fbrow"><button type="submit" id="fbSend">Send feedback</button><span id="fbStatus" role="status" aria-live="polite"></span></div>`;
  const status = document.getElementById("fbStatus"), send = document.getElementById("fbSend");
  if (!feedbackConfigured()) {
    send.disabled = true;
    status.textContent = "The form is not connected yet: the team still needs to add the form service URL in data/feedback-config.js.";
  }
  host.onsubmit = async e => {
    e.preventDefault();
    if (!feedbackConfigured()) return;
    const data = Object.fromEntries(new FormData(host).entries());
    if (data._gotcha) return;               // honeypot: bots fill the hidden field
    delete data._gotcha;
    send.disabled = true; status.textContent = "Sending…";
    try {
      const r = await fetch(FEEDBACK_FORM_URL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      host.reset(); status.textContent = "Thank you. Your feedback was sent to the team.";
    } catch (err) {
      status.textContent = "Sorry, that did not send. Please try again later.";
    }
    send.disabled = false;
  };
})();
