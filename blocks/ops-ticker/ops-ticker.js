/**
 * ops-ticker — full-bleed dark live-stats marquee strip.
 *
 * Authoring contract: each block row is one stat with two cells:
 *   | label | value |
 * The label is the lead-in text; the value is emphasised. Either cell may be
 * empty. JS rebuilds each stat as an inline `.item` (re-creating the <b> emphasis
 * EDS strips with <span>), prepends a LIVE pulse indicator, wraps the run in a
 * `.row.marquee__track`, and duplicates the items so the loop seams seamlessly.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Build the list of stat items from the authored rows.
  const items = [];
  rows.forEach((row) => {
    const cells = [...row.children];
    const label = (cells[0]?.textContent || '').trim();
    const value = (cells[1]?.textContent || '').trim();
    if (!label && !value) return;

    const item = document.createElement('span');
    item.className = 'item';
    if (label) {
      item.append(document.createTextNode(value ? `${label} ` : label));
    }
    if (value) {
      const b = document.createElement('b');
      b.textContent = value;
      item.append(b);
    }
    items.push(item);
  });

  // LIVE pulse indicator that leads the run.
  const makeLive = () => {
    const live = document.createElement('span');
    live.className = 'item';

    const pulse = document.createElement('span');
    pulse.className = 'pulse';
    pulse.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'live-label';
    label.textContent = 'LIVE';

    live.append(pulse, label);
    return live;
  };

  // One full run = LIVE indicator + all stats.
  const buildRun = () => {
    const frag = document.createDocumentFragment();
    frag.append(makeLive());
    items.forEach((item) => frag.append(item.cloneNode(true)));
    return frag;
  };

  const track = document.createElement('div');
  track.className = 'row marquee__track';
  // First run is visible; the duplicate (aria-hidden) makes the loop seamless.
  track.append(buildRun());
  const dupe = buildRun();
  [...dupe.children].forEach((el) => el.setAttribute('aria-hidden', 'true'));
  track.append(dupe);

  block.replaceChildren(track);
}
