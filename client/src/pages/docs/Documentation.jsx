import { FiInfo, FiHelpCircle, FiCompass } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';

function FieldTable({ fields }) {
  if (!fields || !fields.length) return null;
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Required</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.label}>
              <td>
                <code>{f.label}</code>
              </td>
              <td>{f.required ? <span className="docs-required">Required</span> : <span className="docs-optional">Optional</span>}</td>
              <td>{f.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Steps({ steps }) {
  if (!steps || !steps.length) return null;
  return (
    <ol className="docs-steps">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

function Tips({ tips }) {
  if (!tips || !tips.length) return null;
  return (
    <div className="docs-callout">
      <div className="docs-callout__title">
        <FiInfo /> Good to know
      </div>
      <ul>
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}

function Troubleshooting({ items }) {
  if (!items || !items.length) return null;
  return (
    <div className="docs-troubleshoot">
      <div className="docs-troubleshoot__title">
        <FiHelpCircle /> Troubleshooting
      </div>
      {items.map((item) => (
        <div className="docs-troubleshoot__item" key={item.issue}>
          <div className="docs-troubleshoot__issue">{item.issue}</div>
          <div className="docs-troubleshoot__solution">{item.solution}</div>
        </div>
      ))}
    </div>
  );
}

function Workflow({ workflow }) {
  if (!workflow) return null;
  return (
    <div className="docs-workflow">
      <div className="docs-workflow__title">
        <FiCompass /> Worked example: {workflow.title}
      </div>
      <ol className="docs-workflow__steps">
        {workflow.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

function Screenshots({ screenshots }) {
  if (!screenshots || !screenshots.length) return null;
  return (
    <div className="docs-screenshots">
      {screenshots.map((shot) => (
        <figure className="docs-screenshot" key={shot.src}>
          <img src={shot.src} alt={shot.alt} loading="lazy" />
          {shot.caption && <figcaption>{shot.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

function Subsection({ sub, depth = 3 }) {
  const Heading = depth === 3 ? 'h3' : 'h4';
  return (
    <div className="docs-subsection">
      <Heading>{sub.title}</Heading>
      {sub.summary && <p className="docs-summary">{sub.summary}</p>}
      <FieldTable fields={sub.fields} />
      <Steps steps={sub.steps} />
      <Tips tips={sub.tips} />
      <Troubleshooting items={sub.troubleshooting} />
      <Screenshots screenshots={sub.screenshots} />
      {sub.subsections && sub.subsections.map((s2) => <Subsection sub={s2} depth={4} key={s2.title} />)}
    </div>
  );
}

// Shared renderer for all three role-specific documentation pages. Each role
// page (AdminDocs/StaffDocs/StudentDocs) just supplies its own content
// module. A content module is an array of sections, where each section can
// have: summary, a field-reference table, numbered steps, sub-sections (for
// tabbed pages like Academic Structure/Examinations), a worked end-to-end
// example, tips, a troubleshooting Q&A list, and screenshots captured by
// scripts/captureDocs.mjs.
function Documentation({ roleLabel, intro, sections }) {
  return (
    <div className="docs-page">
      <PageHeader title={`${roleLabel} Documentation`} subtitle="A complete, field-by-field guide to every feature available to you" />

      <div className="docs-layout">
        <nav className="docs-toc" aria-label="Table of contents">
          <div className="docs-toc__title">On this page</div>
          <a href="#overview">Overview</a>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.title}
            </a>
          ))}
        </nav>

        <div className="docs-content">
          <section id="overview" className="docs-section">
            <h2>Overview</h2>
            <p>{intro}</p>
          </section>

          {sections.map((s) => (
            <section id={s.id} key={s.id} className="docs-section">
              <h2>
                {s.icon && <s.icon aria-hidden />} {s.title}
              </h2>
              {s.summary && <p className="docs-summary">{s.summary}</p>}

              <FieldTable fields={s.fields} />
              <Steps steps={s.steps} />

              {s.subsections && s.subsections.map((sub) => <Subsection sub={sub} key={sub.title} />)}

              <Workflow workflow={s.workflow} />
              <Tips tips={s.tips} />
              <Troubleshooting items={s.troubleshooting} />
              <Screenshots screenshots={s.screenshots} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Documentation;
