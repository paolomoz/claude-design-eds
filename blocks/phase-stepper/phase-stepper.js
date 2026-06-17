/**
 * phase-stepper — 5-phase progress stepper (band role).
 *
 * Authoring shape (one row per phase, in order):
 *   <label cell> | <status cell>
 *     label  — the phase name (e.g. "extract", "prototype x3", "migrate")
 *     status — one of: done | now | pending  (case-insensitive)
 *
 * Tolerant of the DA-flattened single-cell-per-row shape too: when a row holds
 * only one cell, the trailing status keyword (done/now/pending) is stripped off
 * the end of the line and the remainder is the label
 * (e.g. "migrate now" -> label "migrate", status "now").
 *
 * Per #61, the done/now visual state is reconstructed from the authored status
 * cell — the prototype's structural .step-done / .step-now classes do not
 * survive into DA content. JS builds the dot (a check SVG for done, the 1-based
 * phase number for now/pending) and the connector rhythm flows from the
 * reapplied classes via CSS (.step-done::after gradient + the
 * .step-done:nth-last-child(2) done->now blend).
 */

const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

const STATUS_RE = /^(done|now|pending)$/i;

/**
 * Cell-level cascade collector (#62/#68/#71): one entry per authored ROW.
 * Each entry is { label, status } derived from that row's cells, recovering
 * bare-text cells the naive `> *` collector would drop.
 */
function collectPhases(block) {
  const phases = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    let label = '';
    let status = '';

    if (cells.length >= 2) {
      // label | status
      label = cells[0].textContent.trim();
      status = cells[cells.length - 1].textContent.trim();
    } else {
      // single flattened cell: "<label> <status>"
      const raw = cells[0].textContent.trim();
      const parts = raw.split(/\s+/);
      const last = parts[parts.length - 1];
      if (parts.length > 1 && STATUS_RE.test(last)) {
        status = last;
        label = parts.slice(0, -1).join(' ');
      } else {
        label = raw;
      }
    }

    if (!STATUS_RE.test(status)) status = 'pending';
    if (label) phases.push({ label, status: status.toLowerCase() });
  });
  return phases;
}

export default async function decorate(block) {
  const phases = collectPhases(block);
  if (!phases.length) return;

  const stepper = document.createElement('div');
  stepper.className = 'stepper';

  phases.forEach((phase, i) => {
    const step = document.createElement('div');
    step.className = 'step';
    if (phase.status === 'done') step.classList.add('step-done');
    else if (phase.status === 'now') step.classList.add('step-now');

    const dot = document.createElement('span');
    dot.className = 'step-dot';
    if (phase.status === 'done') {
      dot.innerHTML = CHECK_SVG;
    } else {
      // number for the current/upcoming phase (1-based)
      dot.textContent = String(i + 1);
    }

    step.append(dot, document.createTextNode(phase.label));
    stepper.append(step);
  });

  block.replaceChildren(stepper);
}
