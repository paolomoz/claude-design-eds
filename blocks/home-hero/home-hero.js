/**
 * home-hero — Evergreen Bank marketing hero.
 *
 * A 3-part flex row over a cream→green gradient:
 *   left   — a sign-on .eb-card form (heading + sub, Username, Password with a
 *            Show toggle, a "Sign on" primary button → dashboard, Forgot/Enroll)
 *   middle — the promo (eyebrow, h1 headline, paragraph, "Get started" primary
 *            CTA, "See offer details" link)
 *   right  — a "$300" badge ("Enjoy" + big number with accent top/bottom rules)
 *
 * Author shape — one cell per row, in order (all optional, fall back to copy):
 *   row 1: form heading          ("Good morning")
 *   row 2: form sub              ("Sign on to manage your accounts.")
 *   row 3: eyebrow               ("Limited-time offer")
 *   row 4: headline              ("$300 checking bonus, on us")
 *   row 5: paragraph             (promo body)
 * The badge ("Enjoy" / "$300") and form fields are fixed in JS.
 * The form's "Sign on" button links to /snowflake-blocks/test-5.
 */

const DASHBOARD = '/snowflake-blocks/test-5';

const DEFAULTS = {
  formHeading: 'Good morning',
  formSub: 'Sign on to manage your accounts.',
  eyebrow: 'Limited-time offer',
  headline: '$300 checking bonus, on us',
  paragraph: 'New customers: open an Everyday Checking account with qualifying direct deposits and the bonus is yours.',
};

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children].map((row) => row.textContent.trim());
  const [formHeading, formSub, eyebrow, headline, paragraph] = rows;
  const c = {
    formHeading: formHeading || DEFAULTS.formHeading,
    formSub: formSub || DEFAULTS.formSub,
    eyebrow: eyebrow || DEFAULTS.eyebrow,
    headline: headline || DEFAULTS.headline,
    paragraph: paragraph || DEFAULTS.paragraph,
  };

  block.textContent = '';
  block.innerHTML = `
    <div class="eb-container home-hero-inner">
      <form class="eb-card home-hero-form">
        <div class="home-hero-form-head">
          <h3 class="home-hero-form-title">${c.formHeading}</h3>
          <p class="home-hero-form-sub">${c.formSub}</p>
        </div>
        <div class="eb-field">
          <label for="home-hero-username">Username</label>
          <input id="home-hero-username" class="eb-input" autocomplete="off" value="">
        </div>
        <div class="eb-field">
          <div class="home-hero-pwd-row">
            <label for="home-hero-password">Password</label>
            <button type="button" class="home-hero-show" aria-pressed="false">Show</button>
          </div>
          <input id="home-hero-password" type="password" class="eb-input" value="">
        </div>
        <a class="eb-btn eb-btn-primary home-hero-submit" href="${DASHBOARD}">Sign on</a>
        <div class="home-hero-form-links">
          <a class="eb-link" href="#forgot">Forgot username or password?</a>
          <a class="eb-link" href="#enroll">Enroll in online banking</a>
        </div>
      </form>

      <div class="home-hero-promo">
        <span class="home-hero-eyebrow">${c.eyebrow}</span>
        <h1 class="home-hero-headline">${c.headline}</h1>
        <p class="home-hero-paragraph">${c.paragraph}</p>
        <span class="home-hero-cta">
          <a class="eb-btn eb-btn-primary" href="#get-started">Get started</a>
          <a class="eb-link" href="#offer-details">See offer details</a>
        </span>
      </div>

      <div class="home-hero-badge" aria-hidden="true">
        <span class="home-hero-badge-label">Enjoy</span>
        <span class="home-hero-badge-amount">$300</span>
      </div>
    </div>`;

  // Password Show/Hide toggle.
  const pwd = block.querySelector('#home-hero-password');
  const toggle = block.querySelector('.home-hero-show');
  toggle.addEventListener('click', () => {
    const show = pwd.type === 'password';
    pwd.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Hide' : 'Show';
    toggle.setAttribute('aria-pressed', String(show));
  });
}
