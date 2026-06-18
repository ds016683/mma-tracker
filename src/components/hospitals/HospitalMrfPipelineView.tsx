export function HospitalMrfPipelineView() {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
      <iframe
        src={`${import.meta.env.BASE_URL}pipeline-lineage.html`}
        style={{ flex: 1, border: 'none', width: '100%' }}
        title="Pipeline Lineage Reporting"
      />
    </div>
  );
}
