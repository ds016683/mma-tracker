import { useState, useEffect, useCallback } from 'react';
import './AnalyticTestsView.css';

interface SlideData {
  label: string;
  slug: string;
}

const SLIDES: SlideData[] = [
  { label: 'Title slide', slug: 'title' },
  { label: 'Test A: The Modifier Trap', slug: 'modifier-trap' },
  { label: 'Test B: The Site of Service Trap', slug: 'site-of-service-trap' },
  { label: 'Test C: The Ghost Rate Check', slug: 'ghost-rate-check' },
  { label: 'Test D: The Inpatient Outlier Check', slug: 'inpatient-outlier-check' },
  { label: 'Summary and next steps', slug: 'next-steps' },
];

export function AnalyticTestsView() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const totalSlides = SLIDES.length;

  const navigateTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSlides) return;
      setCurrentSlideIndex(index);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    },
    [totalSlides]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateTo(currentSlideIndex + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateTo(currentSlideIndex - 1);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [currentSlideIndex, navigateTo]);

  return (
    <>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="at-sr-only"
      >
        {SLIDES[currentSlideIndex].label}. Slide {currentSlideIndex + 1} of {totalSlides}.
      </div>

      <div
        className="at-deck"
        role="region"
        aria-roledescription="presentation"
        aria-label="4 Analytic Tests Your Price Transparency Data Should Pass"
      >
        {/* ──── SLIDE 0: TITLE ──── */}
        <section
          className={`at-slide at-title-slide${currentSlideIndex === 0 ? ' active' : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label="Title slide"
          aria-hidden={currentSlideIndex !== 0 ? true : undefined}
        >
          <h1>4 Tests Your Price Transparency Data Should Pass</h1>
          <p className="at-subtitle">
            How do you know your rate data is real, complete, and trustworthy?
          </p>
          <p className="at-setup">
            Transparency in Coverage data is now publicly available from every major health insurer. But raw MRF files
            are massive, messy, and full of traps that produce misleading results if not treated properly. These four
            analytic tests represent the most common data quality challenges we encounter &mdash; and how Third Horizon
            addresses each one to deliver intelligence you can act on with confidence.
          </p>
          <p className="at-attribution">Third Horizon</p>
        </section>

        {/* ──── SLIDE 1: TEST A ──── */}
        <section
          className={`at-slide at-test-slide${currentSlideIndex === 1 ? ' active' : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label="Test A: The Modifier Trap"
          aria-hidden={currentSlideIndex !== 1 ? true : undefined}
        >
          <div className="at-slide-header">
            <span className="at-test-label">Test A</span>
            <h2>The Modifier Trap</h2>
            <p className="at-hook-question">
              Can your data vendor actually separate the professional and technical components of a radiology charge?
            </p>
          </div>
          <div className="at-split-panel">
            <div className="at-panel-card at-challenge-card">
              <h3>The Challenge</h3>
              <p>
                A CT Head/Brain (CPT 70450) has two distinct cost components: the physician&rsquo;s interpretation (Modifier -26)
                and the facility&rsquo;s technical work (Modifier -TC). Many data sources return a single blended rate with no
                modifier separation, making it impossible to compare professional fees independently or understand the true facility cost.
              </p>
            </div>
            <div className="at-panel-card at-solution-card">
              <h3>How We Address It</h3>
              <p>
                Our Transparency in Coverage data preserves every modifier and place-of-service combination published in the
                payer files. For each provider and billing code, we separate the global rate, professional component (-26),
                and technical component (-TC) as distinct records, enabling accurate comparison at each level.
              </p>
            </div>
          </div>
          <div className="at-evidence-section">
            <p className="at-section-label">The Evidence</p>
            <div className="at-evidence-wrap">
              <table className="at-evidence-table">
                <caption>
                  CPT 70450 (CT Head/Brain) &mdash; New York, Aetna Choice POS &mdash; Selected providers by volume
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Provider</th>
                    <th scope="col">Type</th>
                    <th scope="col">Modifier</th>
                    <th scope="col" className="num">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Crouse Health Hospital</td>
                    <td>Hospital</td>
                    <td>Global</td>
                    <td className="num">$144.64</td>
                  </tr>
                  <tr>
                    <td>Crouse Health Hospital</td>
                    <td>Hospital</td>
                    <td>-26 (Professional)</td>
                    <td className="num">$53.86</td>
                  </tr>
                  <tr>
                    <td>Crouse Health Hospital</td>
                    <td>Hospital</td>
                    <td>-TC (Technical)</td>
                    <td className="num">$90.79 &ndash; $163.44</td>
                  </tr>
                  <tr className="highlight-row">
                    <td>Albany Medical Center</td>
                    <td>Hospital</td>
                    <td>Global</td>
                    <td className="num">$243.79</td>
                  </tr>
                  <tr>
                    <td>Albany Medical Center</td>
                    <td>Hospital</td>
                    <td>-26 (Professional)</td>
                    <td className="num">$90.57</td>
                  </tr>
                  <tr>
                    <td>Albany Medical Center</td>
                    <td>Hospital</td>
                    <td>-TC (Technical)</td>
                    <td className="num">$153.22</td>
                  </tr>
                  <tr>
                    <td>Steven Lev, MD</td>
                    <td>Radiologist</td>
                    <td>-26 (Professional)</td>
                    <td className="num">$48.16</td>
                  </tr>
                  <tr>
                    <td>Empire State Radiology</td>
                    <td>Radiologist</td>
                    <td>-26 (Professional)</td>
                    <td className="num">$42.55 &ndash; $58.84</td>
                  </tr>
                </tbody>
              </table>
              <div className="at-table-footer">
                <span>Source: Third Horizon TiC data, Aetna Choice POS</span>
                <span>Data as of Q4 2025</span>
              </div>
            </div>
          </div>
          <div className="at-implication">
            <h3>Why It Matters</h3>
            <p>
              Without modifier separation, brokers cannot isolate the physician interpretation fee from the facility cost.
              This matters for network comparison, fee schedule benchmarking, and any analysis where professional and
              technical costs need to be evaluated independently.
            </p>
          </div>
          <div className="at-expandable-section" aria-label="Additional detail for Test A">
            <details>
              <summary>See full data</summary>
              <p style={{ padding: '14px', color: '#5A6A7A' }}>
                Full evidence panel will be available in a future update.
              </p>
            </details>
          </div>
        </section>

        {/* ──── SLIDE 2: TEST B ──── */}
        <section
          className={`at-slide at-test-slide${currentSlideIndex === 2 ? ' active' : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label="Test B: The Site of Service Trap"
          aria-hidden={currentSlideIndex !== 2 ? true : undefined}
        >
          <div className="at-slide-header">
            <span className="at-test-label">Test B</span>
            <h2>The Site of Service Trap</h2>
            <p className="at-hook-question">
              Does your data reflect the negotiated rate difference when the same surgeon operates at a hospital versus an ambulatory surgery center?
            </p>
          </div>
          <div className="at-split-panel">
            <div className="at-panel-card at-challenge-card">
              <h3>The Challenge</h3>
              <p>
                A total knee arthroplasty (CPT 27447) performed by the same surgeon can cost dramatically different amounts
                depending on where it takes place. If a data source ignores place-of-service codes or conflates hospital and
                ASC settings, the rate comparison is meaningless and the cost-saving opportunity in site-of-service steering is invisible.
              </p>
            </div>
            <div className="at-panel-card at-solution-card">
              <h3>How We Address It</h3>
              <p>
                Our data preserves the place-of-service code for every rate record, as required by the CMS Transparency in
                Coverage schema. For each provider, we maintain separate rate entries for Hospital (POS 21/22) and ASC (POS 24),
                enabling direct facility-type comparison for the same surgeon and procedure.
              </p>
            </div>
          </div>
          <div className="at-evidence-section">
            <p className="at-section-label">The Evidence</p>
            <div className="at-evidence-wrap">
              <table className="at-evidence-table">
                <caption>
                  CPT 27447 (Total Knee Arthroplasty) &mdash; Michigan, BCBS Blue Preferred &amp; Cigna PPO &mdash; Top orthopedic surgeons by volume
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Surgeon</th>
                    <th scope="col">Carrier</th>
                    <th scope="col">POS 21/22 (Hospital)</th>
                    <th scope="col">POS 24 (ASC)</th>
                    <th scope="col">Rate Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Jeffrey W. Devitt, MD</td>
                    <td>BCBS MI</td>
                    <td className="num">$2,274.87</td>
                    <td className="num">$2,274.87</td>
                    <td>Facility</td>
                  </tr>
                  <tr>
                    <td>Jeffrey W. Devitt, MD</td>
                    <td>Cigna PPO</td>
                    <td className="num">$1,677.10</td>
                    <td className="num">$1,677.10</td>
                    <td>Facility</td>
                  </tr>
                  <tr className="highlight-row">
                    <td>Eric T. Silberg, MD</td>
                    <td>BCBS MI</td>
                    <td className="num">$2,274.87</td>
                    <td className="num">$2,274.87</td>
                    <td>Facility</td>
                  </tr>
                  <tr>
                    <td>Creg A. Carpenter, MD</td>
                    <td>BCBS MI</td>
                    <td className="num">$2,274.87</td>
                    <td className="num">$2,274.87</td>
                    <td>Facility</td>
                  </tr>
                  <tr>
                    <td>Ortho Assoc. of Muskegon</td>
                    <td>BCBS MI</td>
                    <td className="num">$2,274.87</td>
                    <td className="num">$2,274.87</td>
                    <td>Facility</td>
                  </tr>
                </tbody>
              </table>
              <div className="at-table-footer">
                <span>Source: Third Horizon TiC data, BCBS MI Blue Preferred &amp; Cigna PPO</span>
                <span>Data as of Q4 2025</span>
              </div>
            </div>
          </div>
          <div className="at-implication">
            <h3>Why It Matters</h3>
            <p>
              In this sample, professional rates are identical across all three facility-based settings &mdash; which is
              consistent with how facility rates work in the Medicare fee schedule. The key insight is not the rate difference
              here, but that the data <em>captures the distinction</em>. When rates do differ by site of service (as they
              frequently do for facility fees), our data makes that visible rather than hiding it behind a single blended number.
            </p>
          </div>
          <div className="at-expandable-section" aria-label="Additional detail for Test B">
            <details>
              <summary>See full data</summary>
              <p style={{ padding: '14px', color: '#5A6A7A' }}>
                Full evidence panel will be available in a future update.
              </p>
            </details>
          </div>
        </section>

        {/* ──── SLIDE 3: TEST C ──── */}
        <section
          className={`at-slide at-test-slide${currentSlideIndex === 3 ? ' active' : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label="Test C: The Ghost Rate Check"
          aria-hidden={currentSlideIndex !== 3 ? true : undefined}
        >
          <div className="at-slide-header">
            <span className="at-test-label">Test C</span>
            <h2>The Ghost Rate Check</h2>
            <p className="at-hook-question">
              If you pull a rate for heart surgery from a psychiatrist&rsquo;s file, should you trust it?
            </p>
          </div>
          <div className="at-split-panel">
            <div className="at-panel-card at-challenge-card">
              <h3>The Challenge</h3>
              <p>
                Raw MRF files often contain &ldquo;ghost rates&rdquo; &mdash; negotiated rates listed for services a provider
                would never actually perform. A pathologist with a CABG surgery rate or a psychiatrist with an orthopedic fee
                creates noise that pollutes network comparisons. Blindly pulling rates without specialty context produces data
                of questionable validity.
              </p>
            </div>
            <div className="at-panel-card at-solution-card">
              <h3>How We Address It</h3>
              <p>
                Third Horizon cross-references every rate against national claims data (Komodo) to validate that
                sufficient billing volume or provider-taxonomy prevalence exists. Rates for services with no claims-based
                evidence for that provider type are filtered out. Rare but legitimate services are retained &mdash; the system
                is calibrated to eliminate the impossible without discarding the uncommon.
              </p>
            </div>
          </div>
          <div className="at-evidence-section">
            <p className="at-section-label">The Evidence</p>
            <div className="at-evidence-wrap">
              <table className="at-evidence-table">
                <caption>
                  Pathologists &amp; Psychiatrists in California &mdash; rates for 99213 (Office Visit) and 33533 (CABG Surgery)
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Provider</th>
                    <th scope="col">Specialty</th>
                    <th scope="col">99213 (Office Visit)</th>
                    <th scope="col">33533 (CABG Surgery)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pathology Associates</td>
                    <td>Pathology</td>
                    <td className="num present">$56.53 &ndash; $133.31</td>
                    <td className="absent">No rates found</td>
                  </tr>
                  <tr>
                    <td>Roberto A. Novoa, MD</td>
                    <td>Pathology</td>
                    <td className="num present">$70.00 &ndash; $335.85</td>
                    <td className="absent">No rates found</td>
                  </tr>
                  <tr>
                    <td>Kristine Astvatsaturyan, MD</td>
                    <td>Pathology</td>
                    <td className="num present">$54.86 &ndash; $351.44</td>
                    <td className="absent">No rates found</td>
                  </tr>
                  <tr className="highlight-row">
                    <td>Pacific Pathology Inc</td>
                    <td>Pathology</td>
                    <td className="num present">$81.33</td>
                    <td className="absent">No rates found</td>
                  </tr>
                </tbody>
              </table>
              <div className="at-table-footer">
                <span>Source: Third Horizon TiC data, multiple carriers in CA</span>
                <span>Data as of Q4 2025</span>
              </div>
            </div>
          </div>
          <div className="at-implication">
            <h3>Why It Matters</h3>
            <p>
              The CABG rates are completely absent &mdash; correctly filtered out by claims-based validation. The 99213 office
              visit rates are present because, while uncommon for pathologists, real billing volume exists (65% of psychiatrists
              bill 99213 at least once). This is the difference between a system that blindly reports whatever the payer file
              contains and one that applies clinical and actuarial logic to ensure the data reflects reality.
            </p>
          </div>
          <div className="at-expandable-section" aria-label="Additional detail for Test C">
            <details>
              <summary>See full data</summary>
              <p style={{ padding: '14px', color: '#5A6A7A' }}>
                Full evidence panel will be available in a future update.
              </p>
            </details>
          </div>
        </section>

        {/* ──── SLIDE 4: TEST D ──── */}
        <section
          className={`at-slide at-test-slide${currentSlideIndex === 4 ? ' active' : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label="Test D: The Inpatient Outlier Check"
          aria-hidden={currentSlideIndex !== 4 ? true : undefined}
        >
          <div className="at-slide-header">
            <span className="at-test-label">Test D</span>
            <h2>The Inpatient Outlier Check</h2>
            <p className="at-hook-question">
              Does your data contain DRG-based inpatient payments for facility comparisons?
            </p>
          </div>
          <div className="at-split-panel">
            <div className="at-panel-card at-challenge-card">
              <h3>The Challenge</h3>
              <p>
                There is variance in how price transparency machine-readable files (MRF) report inpatient rates. Carrier MRF
                rates often reflect base DRG payments. The tell is there is consistency in % of Medicare. Hospital MRF rates
                may or may not reflect base DRG payments, and may include the outlier amount. This creates inconsistent DRG
                rates and distorted apples-to-apples comparisons across hospitals and carriers.
              </p>
            </div>
            <div className="at-panel-card at-solution-card">
              <h3>How We Address It</h3>
              <p>
                Third Horizon uses multiple data layers and statistical controls to normalize DRG rates to the base
                DRG rate. Komodo claims data provides a reference layer, since real claims include both base payments and
                outlier adjustments. We also apply median and percentile-based filtering to remove extreme values.
              </p>
            </div>
          </div>
          <div className="at-evidence-section">
            <p className="at-section-label">The Evidence</p>
            <div className="at-evidence-wrap">
              <table className="at-evidence-table at-grouped-table">
                <caption>
                  MS-DRG 470 (Major Joint Replacement, Lower Extremity) &mdash; Carrier MRF vs. Hospital MRF rate comparison
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Medical Center</th>
                    <th scope="col">Source</th>
                    <th scope="col" className="num">Rate</th>
                    <th scope="col" className="num">% of Medicare</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="group-start">
                    <td rowSpan={4}>NYP / Columbia University Irving</td>
                    <td>Carrier MRF (Aetna)</td>
                    <td className="num">$76,186</td>
                    <td className="num">310%</td>
                  </tr>
                  <tr>
                    <td>Carrier MRF (Cigna)</td>
                    <td className="num">$77,939</td>
                    <td className="num">317%</td>
                  </tr>
                  <tr className="highlight-row">
                    <td>Hospital MRF</td>
                    <td className="num">$94,044</td>
                    <td className="num">383%</td>
                  </tr>
                  <tr className="normalized-row">
                    <td><strong>SA Normalized</strong></td>
                    <td className="num"><strong>$77,100</strong></td>
                    <td className="num"><strong>314%</strong></td>
                  </tr>
                  <tr className="group-start">
                    <td rowSpan={4}>UCI Medical Center</td>
                    <td>Carrier MRF (Aetna)</td>
                    <td className="num">$23,778</td>
                    <td className="num">185%</td>
                  </tr>
                  <tr>
                    <td>Carrier MRF (Cigna)</td>
                    <td className="num">$25,100</td>
                    <td className="num">195%</td>
                  </tr>
                  <tr className="highlight-row">
                    <td>Hospital MRF</td>
                    <td className="num">$97,873</td>
                    <td className="num">762%</td>
                  </tr>
                  <tr className="normalized-row">
                    <td><strong>SA Normalized</strong></td>
                    <td className="num"><strong>$24,400</strong></td>
                    <td className="num"><strong>190%</strong></td>
                  </tr>
                  <tr className="group-start">
                    <td rowSpan={4}>Duke University Hospital</td>
                    <td>Carrier MRF (Aetna)</td>
                    <td className="num">$35,010</td>
                    <td className="num">252%</td>
                  </tr>
                  <tr>
                    <td>Carrier MRF (BCBS NC)</td>
                    <td className="num">$38,222</td>
                    <td className="num">275%</td>
                  </tr>
                  <tr className="highlight-row">
                    <td>Hospital MRF</td>
                    <td className="num">$13,800</td>
                    <td className="num">99%</td>
                  </tr>
                  <tr className="normalized-row">
                    <td><strong>SA Normalized</strong></td>
                    <td className="num"><strong>$36,600</strong></td>
                    <td className="num"><strong>263%</strong></td>
                  </tr>
                </tbody>
              </table>
              <div className="at-table-footer">
                <span>Source: Illustrative data &mdash; not verified, pending team review</span>
                <span>MS-DRG 470, selected academic medical centers</span>
              </div>
            </div>
          </div>
          <div className="at-implication">
            <h3>Why It Matters</h3>
            <p>
              Outlier-driven values have minimal influence, ensuring the captured DRG rate accurately represents the base
              DRG payment for comparison purposes.
            </p>
          </div>
          <div className="at-expandable-section" aria-label="Additional detail for Test D">
            <details>
              <summary>See full data</summary>
              <p style={{ padding: '14px', color: '#5A6A7A' }}>
                Full evidence panel will be available in a future update.
              </p>
            </details>
          </div>
        </section>

        {/* ──── SLIDE 5: CTA ──── */}
        <section
          className={`at-slide at-cta-slide${currentSlideIndex === 5 ? ' active' : ''}`}
          role="group"
          aria-roledescription="slide"
          aria-label="Summary and next steps"
          aria-hidden={currentSlideIndex !== 5 ? true : undefined}
        >
          <h2>Your Data Should Survive These Tests</h2>
          <ul className="at-summary-list">
            <li>
              <strong>Modifier Separation</strong> &mdash; Professional and technical components distinguished, not blended
            </li>
            <li>
              <strong>Site of Service</strong> &mdash; Place-of-service captured per CMS schema for facility-type comparison
            </li>
            <li>
              <strong>Ghost Rate Filtering</strong> &mdash; Claims-validated to eliminate impossible provider-service combinations
            </li>
            <li>
              <strong>Inpatient DRG Rates</strong> &mdash; Real facility case rates with payer-level variation visible
            </li>
          </ul>
          <p className="at-cta-prompt">Want to see your markets run through these tests?</p>
          <p className="at-contact-placeholder">[Contact information]</p>
          <p className="at-attribution">Third Horizon &mdash; Price Transparency Intelligence</p>
        </section>
      </div>

      {/* ──── SLIDE NAV BAR ──── */}
      <nav className="at-slide-nav" aria-label="Presentation navigation">
        <button
          type="button"
          className="at-nav-btn"
          aria-label="Previous slide"
          disabled={currentSlideIndex === 0}
          onClick={() => navigateTo(currentSlideIndex - 1)}
        >
          &#8592;
        </button>
        <div className="at-nav-dots" role="tablist" aria-label="Slide selection">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.slug}
              type="button"
              className={`at-nav-dot${i === currentSlideIndex ? ' active' : ''}`}
              role="tab"
              aria-label={slide.label}
              aria-selected={i === currentSlideIndex}
              onClick={() => navigateTo(i)}
            />
          ))}
        </div>
        <span className="at-slide-counter">
          {currentSlideIndex + 1} / {totalSlides}
        </span>
        <button
          type="button"
          className="at-nav-btn"
          aria-label="Next slide"
          disabled={currentSlideIndex === totalSlides - 1}
          onClick={() => navigateTo(currentSlideIndex + 1)}
        >
          &#8594;
        </button>
      </nav>
    </>
  );
}
