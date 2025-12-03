import { Icon } from '@vaadin/react-components';
import type ExperimentDescriptionDto from 'Frontend/generated/com/sciome/dto/ExperimentDescriptionDto';

interface ExperimentDescriptionRequiredProps {
  experimentDesc?: ExperimentDescriptionDto | null;
  showCurrentStatus?: boolean;
}

/**
 * Empty state component shown when experiment descriptions are missing or incomplete.
 * Displays required fields, current status (optional), and administrator contact info.
 */
export default function ExperimentDescriptionRequired({
  experimentDesc,
  showCurrentStatus = false
}: ExperimentDescriptionRequiredProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center" style={{ maxWidth: '700px', padding: '2rem' }}>
        <Icon
          icon="vaadin:warning"
          style={{ fontSize: '4rem', color: '#faad14' }}
          className="mb-m"
        />
        <h2 className="text-2xl font-bold mb-m">
          Experiment Description Required
        </h2>
        <p className="text-secondary text-l mb-l">
          This analysis requires experiment metadata to be set.
          {!experimentDesc ? (
            <> No experiment description found.</>
          ) : (
            <> The experiment description is missing required fields.</>
          )}
        </p>

        {/* Required fields list */}
        <div style={{
          background: '#f0f0f0',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
            Experiment descriptors are required to use BMD Express Web:
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>Sex (e.g., Male, Female)</li>
            <li>Organ (e.g., Liver, Kidney)</li>
            <li>Species (e.g., Rat, Mouse)</li>
            <li>Strain (e.g., Fischer 344, Sprague Dawley)</li>
            <li>Test Article (e.g., Chemical name)</li>
          </ul>
        </div>

        {/* Current status panel (optional) */}
        {showCurrentStatus && (
          <div style={{
            background: '#fff7e6',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'left',
            border: '1px solid #ffd591'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Current status:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {experimentDesc?.sex ? (
                  <span style={{ color: '#52c41a' }}>✓ Sex: {experimentDesc.sex}</span>
                ) : (
                  <span style={{ color: '#faad14' }}>✗ Sex: Not set</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {experimentDesc?.organ ? (
                  <span style={{ color: '#52c41a' }}>✓ Organ: {experimentDesc.organ}</span>
                ) : (
                  <span style={{ color: '#faad14' }}>✗ Organ: Not set</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {experimentDesc?.species ? (
                  <span style={{ color: '#52c41a' }}>✓ Species: {experimentDesc.species}</span>
                ) : (
                  <span style={{ color: '#faad14' }}>✗ Species: Not set</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {experimentDesc?.strain ? (
                  <span style={{ color: '#52c41a' }}>✓ Strain: {experimentDesc.strain}</span>
                ) : (
                  <span style={{ color: '#faad14' }}>✗ Strain: Not set</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {experimentDesc?.testArticle ? (
                  <span style={{ color: '#52c41a' }}>✓ Test Article: {experimentDesc.testArticle}</span>
                ) : (
                  <span style={{ color: '#faad14' }}>✗ Test Article: Not set</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact administrator panel */}
        <div style={{
          background: '#e6f7ff',
          padding: '1rem',
          borderRadius: '8px',
          textAlign: 'left',
          border: '1px solid #91d5ff'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Contact Administrator:</p>
          <p style={{ margin: 0 }}>
            Inform the BMD Express Web administrator that required experiment descriptors are missing from the .bm2 file.
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500 }}>
            email: <a href="mailto:auerbachs@niehs.nih.gov" style={{ color: '#1890ff' }}>auerbachs@niehs.nih.gov</a>
          </p>
        </div>
      </div>
    </div>
  );
}
