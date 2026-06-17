/**
 * Audience Tabs block.
 *
 * Authored shape (#62): ONE row with ONE cell holding the audience labels as
 * flat sibling elements (one <p> per label). We flatten and read each text
 * node as a tab label, render a <button role="tab"> per label, select the
 * first, and wire clicks to toggle aria-selected. Rendered tab count MUST
 * equal the authored label count.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Flatten: collect every leaf element under the block, segment by text.
  const labels = [...block.querySelectorAll(':scope > div > div > *')]
    .map((el) => el.textContent.trim())
    .filter((text) => text.length > 0);

  // Fallback: if authors put each label in its own row/cell, or the cell
  // held bare text, recover labels from any non-empty descendant text lines.
  if (labels.length === 0) {
    const raw = block.textContent.split('\n').map((s) => s.trim()).filter(Boolean);
    labels.push(...raw);
  }

  block.textContent = '';
  block.setAttribute('role', 'tablist');
  block.setAttribute('aria-label', 'Audience');

  labels.forEach((label, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.textContent = label;
    tab.addEventListener('click', () => {
      block.querySelectorAll('button[role="tab"]').forEach((t) => {
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
    });
    block.append(tab);
  });
}
