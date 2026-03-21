import { useState, useRef, useEffect, useCallback } from 'react';
import waterTreatmentImg from '../../assets/water-treatment.png';
import './WaterTreatmentView.css';

interface Stage {
  id: number;
  title: string;
  subtitle: string;
  hotspot: { left: string; top: string; width: string; height: string };
  qualityWidth: string;
  qualityColor: string;
  qualityLabel: string;
  leftHeading: string;
  leftText: string;
  rightHeading: string;
  rightItems: string[];
}

const stages: Stage[] = [
  {
    id: 1,
    title: 'Water Intake',
    subtitle: 'Pulling in the raw data',
    hotspot: { left: '24.7%', top: '14.9%', width: '12.0%', height: '25.9%' },
    qualityWidth: '12%',
    qualityColor: '#7EC8C8',
    qualityLabel: 'Raw, unprocessed',
    leftHeading: 'What Happens with Water',
    leftText:
      'Raw water is pumped from a natural source \u2014 a river, lake, or mountain reservoir. It contains sediment, bacteria, organic matter, and dissolved chemicals. Nothing has been treated yet. This is the rawest possible form of the supply.',
    rightHeading: 'What We Do with Data',
    rightItems: [
      '<strong>Source discovery:</strong> Every health insurer and hospital in the U.S. is required to publish their negotiated prices in machine-readable files \u2014 often hundreds of gigabytes each.',
      '<strong>File acquisition:</strong> We systematically discover, download, and catalog these files from hundreds of insurers and thousands of hospitals nationwide.',
      '<strong>Format normalization:</strong> Files come in different formats, compression types, and structures. We bring them all into a common staging environment.',
      'This is pure \u201Craw water\u201D \u2014 massive, messy, and completely unusable without significant processing.',
    ],
  },
  {
    id: 2,
    title: 'Coagulation',
    subtitle: 'Reconciling identities and surfacing problems',
    hotspot: { left: '42.1%', top: '19.5%', width: '11.6%', height: '21.1%' },
    qualityWidth: '30%',
    qualityColor: '#4BA3C3',
    qualityLabel: 'Errors becoming visible',
    leftHeading: 'What Happens with Water',
    leftText:
      'Chemical coagulants are added to the water. These carry a positive charge that neutralizes dissolved contaminants, causing tiny particles to bind together into larger clumps called \u201Cfloc.\u201D The water is stirred so these clumps can form. Problems that were invisible are now visible and removable.',
    rightHeading: 'What We Do with Data',
    rightItems: [
      '<strong>Provider identity reconciliation:</strong> We validate every provider\u2019s National Provider Identifier (NPI) and cross-reference against provider directories to confirm who they are, where they practice, and what they specialize in.',
      '<strong>Service code extraction:</strong> We pull out every billing code and place-of-service code, then break bundled records into individual, queryable entries.',
      '<strong>Taxonomy-based flagging:</strong> We check whether each rate makes sense for that provider\u2019s specialty. A surgical billing code linked to a primary care doctor? That\u2019s an error \u2014 flag it.',
      '<strong>Place-of-service validation:</strong> Inpatient codes should only appear for hospital facilities. We catch mismatches and mark them for removal.',
      'Like adding coagulants to water \u2014 we\u2019re making the bad data clump together so we can see it and pull it out.',
    ],
  },
  {
    id: 3,
    title: 'Sedimentation',
    subtitle: 'Removing the obvious junk',
    hotspot: { left: '57.3%', top: '21.3%', width: '16.1%', height: '19.8%' },
    qualityWidth: '52%',
    qualityColor: '#00968F',
    qualityLabel: 'Major errors removed',
    leftHeading: 'What Happens with Water',
    leftText:
      'The water sits in a sedimentation basin where gravity does the work. The heavy floc particles that formed during coagulation settle to the bottom as sludge. The clearer water at the top moves forward. This is a brute-force step \u2014 the biggest, most obvious contaminants simply drop out.',
    rightHeading: 'What We Do with Data',
    rightItems: [
      '<strong>Standardization:</strong> Hospital data and carrier data use completely different formats. We transform both into a single common structure so they can be compared and merged.',
      '<strong>Placeholder removal:</strong> Some hospitals use dummy values (like 999,999,999) to indicate missing rates. We catch these and strip them out instead of treating them as real prices.',
      '<strong>Per diem conversion:</strong> Daily hospital rates are converted to total-stay equivalents using average length-of-stay data, so we can compare rates on an apples-to-apples basis.',
      '<strong>Deduplication:</strong> The same rate often appears multiple times in different formats. We consolidate duplicates using proximity scoring against real claims data.',
      'The heavy junk settles out. What\u2019s left is cleaner, but still needs refinement.',
    ],
  },
  {
    id: 4,
    title: 'Filtration',
    subtitle: 'Merging sources and weighting by real-world usage',
    hotspot: { left: '77.5%', top: '13.5%', width: '10.8%', height: '26.1%' },
    qualityWidth: '72%',
    qualityColor: '#009DE0',
    qualityLabel: 'Cross-validated',
    leftHeading: 'What Happens with Water',
    leftText:
      'Water passes through layers of fine filters \u2014 sand, gravel, and activated carbon \u2014 that trap the smaller particles sedimentation missed. This is where precision takes over from brute force. The filters catch what gravity alone could not.',
    rightHeading: 'What We Do with Data',
    rightItems: [
      '<strong>Carrier + hospital merge:</strong> We bring together the insurer\u2019s version of a rate and the hospital\u2019s version. When they agree, confidence goes up. When they don\u2019t, we flag the discrepancy for investigation.',
      '<strong>Utilization weighting:</strong> Not all rates are equally important. A rate at a hospital that sees 10,000 patients matters far more than one at a facility that sees 50. We weight every rate by real claims volume.',
      '<strong>Rate selection:</strong> When multiple sources exist for the same provider and service, we select the most reliable one based on data completeness, source quality, and alignment with what\u2019s actually being paid in practice.',
      'Fine-grained filtering \u2014 only the rates that reflect real market activity survive this stage.',
    ],
  },
  {
    id: 5,
    title: 'Disinfection',
    subtitle: 'Quality scoring and confidence testing',
    hotspot: { left: '76.2%', top: '63.9%', width: '13.3%', height: '21.7%' },
    qualityWidth: '90%',
    qualityColor: '#0077B6',
    qualityLabel: 'Trust-scored',
    leftHeading: 'What Happens with Water',
    leftText:
      'Even after filtration, invisible pathogens can remain. Disinfection \u2014 chlorine, UV light, or ozone treatment \u2014 kills bacteria, viruses, and parasites that made it through every previous step. This is the final safety gate before the water is declared safe.',
    rightHeading: 'What We Do with Data',
    rightItems: [
      '<strong>Claims cross-check:</strong> Every rate is compared against actual paid claims data to verify it reflects reality. If a negotiated rate is wildly different from what\u2019s actually being paid, something is wrong.',
      '<strong>Confidence scoring:</strong> Each data point receives a trust score from 0 to 100, based on completeness, consistency across sources, alignment with benchmarks, and data freshness.',
      '<strong>Outlier detection:</strong> Rates that are dramatically out of line with Medicare benchmarks or market peers get flagged for review or exclusion.',
      'The final safety check. Like killing the last pathogens \u2014 we\u2019re catching the subtle problems that passed through every earlier stage.',
    ],
  },
  {
    id: 6,
    title: 'Storage',
    subtitle: 'The finished national dataset',
    hotspot: { left: '59.3%', top: '60.1%', width: '8.6%', height: '26.3%' },
    qualityWidth: '97%',
    qualityColor: '#003366',
    qualityLabel: 'Production-ready',
    leftHeading: 'What Happens with Water',
    leftText:
      'Clean, treated water is pumped into storage tanks and water towers. It\u2019s been tested, certified safe, and sits ready for delivery on demand. The supply is reliable, the quality is verified, and it can reach users whenever they need it.',
    rightHeading: 'What We Do with Data',
    rightItems: [
      '<strong>Gap filling:</strong> Where coverage gaps remain, we use statistical models to generate estimates \u2014 always clearly flagged so users know what\u2019s directly observed versus modeled.',
      '<strong>National dataset:</strong> The complete, validated dataset covers hundreds of payers, thousands of providers, and millions of rate records across every U.S. market.',
      '<strong>Quarterly refresh:</strong> The dataset is updated every quarter with fresh data, so it always reflects current market conditions \u2014 not stale pricing from a year ago.',
      'Clean, trusted, ready to go. The data equivalent of a full water tower.',
    ],
  },
  {
    id: 7,
    title: 'Distribution',
    subtitle: 'Intelligence delivered to brokers and clients',
    hotspot: { left: '30.8%', top: '62.5%', width: '20.6%', height: '24.8%' },
    qualityWidth: '100%',
    qualityColor: '#001A41',
    qualityLabel: 'In your hands',
    leftHeading: 'What Happens with Water',
    leftText:
      'Clean water flows through the distribution network \u2014 pipes, pumps, and valves \u2014 to reach homes, businesses, and public facilities. The end user turns on the tap and gets safe, clean water without needing to understand the treatment plant behind it.',
    rightHeading: 'How Clients Use Our Data',
    rightItems: [
      '<strong>Community-Based Organizations (foundations, associations, CBOs):</strong> Reveal health care price disparities across hospitals, regions or within health care condition areas to support advocacy for fair pricing.',
      '<strong>Providers (hospitals, behavioral health providers):</strong> Competitive pricing and service line strategy.',
      '<strong>Payers (regional health plans, alternative TPAs, employer plans):</strong> Network optimization and cost management.',
      '<strong>Data &amp; Analytics Vendors:</strong> Infuse market intelligence and analytics products with underlying negotiated contract ($) data.',
      '<strong>Investors:</strong> Investment diligence and health care market intelligence.',
    ],
  },
];

export function WaterTreatmentView() {
  const [activeStageIndex, setActiveStageIndex] = useState<number | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  const handleHotspotClick = useCallback((index: number) => {
    setActiveStageIndex((prev) => (prev === index ? null : index));
  }, []);

  // Scroll detail panel into view when a stage is selected
  useEffect(() => {
    if (activeStageIndex !== null && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeStageIndex]);

  // Click outside to dismiss
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        diagramRef.current &&
        !diagramRef.current.contains(target) &&
        detailRef.current &&
        !detailRef.current.contains(target)
      ) {
        setActiveStageIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeStage = activeStageIndex !== null ? stages[activeStageIndex] : null;

  return (
    <div>
      {/* Header */}
      <div className="wt-header">
        <h1>How We Turn Raw Data Into Trusted Intelligence</h1>
        <p>
          Third Horizon processes millions of healthcare data points the same way a
          treatment plant purifies water — through a rigorous, multi-stage pipeline that removes
          noise, reconciles sources, and delivers a single, reliable product.
        </p>
      </div>

      {/* Diagram */}
      <div className="wt-diagram-wrapper" ref={diagramRef}>
        <div className="wt-diagram">
          <img src={waterTreatmentImg} alt="Water treatment process diagram" />
          {stages.map((stage, i) => (
            <div
              key={stage.id}
              className={`wt-hotspot${activeStageIndex === i ? ' active' : ''}`}
              style={stage.hotspot}
              onClick={() => handleHotspotClick(i)}
              role="button"
              tabIndex={0}
              aria-label={`Stage ${stage.id}: ${stage.title}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleHotspotClick(i); }}
            />
          ))}
        </div>
        <div className="wt-click-hint">Click a numbered stage to explore</div>
      </div>

      {/* Detail Panel */}
      {activeStage && (
        <div className="wt-detail" ref={detailRef} key={activeStage.id}>
          <div className="wt-detail-card">
            <div className="wt-detail-header">
              <div className="wt-detail-number">{activeStage.id}</div>
              <div className="wt-detail-titles">
                <h2>{activeStage.title}</h2>
                <p>{activeStage.subtitle}</p>
              </div>
            </div>

            <div className="wt-detail-body">
              <div className="wt-detail-col">
                <h3>{activeStage.leftHeading}</h3>
                <p>{activeStage.leftText}</p>
              </div>
              <div className="wt-detail-col">
                <h3>{activeStage.rightHeading}</h3>
                <ul>
                  {activeStage.rightItems.map((item, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ul>
              </div>

              <div className="wt-quality">
                <div className="wt-quality-heading">Data Quality at This Stage</div>
                <div className="wt-quality-track">
                  <div
                    className="wt-quality-fill"
                    style={{
                      width: activeStage.qualityWidth,
                      background: activeStage.qualityColor,
                    }}
                  />
                </div>
                <div className="wt-quality-labels">
                  <span>{activeStage.qualityLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="wt-footer">
        &copy; {new Date().getFullYear()} Third Horizon. All rights reserved.
      </div>
    </div>
  );
}
