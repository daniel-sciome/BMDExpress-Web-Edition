import { Icon } from '@vaadin/react-components';
import type ProjectMetadataDto from 'Frontend/generated/com/sciome/dto/ProjectMetadataDto';

interface ProjectMetadataPanelProps {
  metadata: ProjectMetadataDto | null;
}

export default function ProjectMetadataPanel({ metadata }: ProjectMetadataPanelProps) {
  if (!metadata) {
    return (
      <div className="border rounded p-m bg-contrast-5">
        <p className="text-secondary">No metadata available. Select a project to view details.</p>
      </div>
    );
  }

  const { experimentDescription } = metadata;
  const hasExpDesc = experimentDescription && (
    experimentDescription.testArticle ||
    experimentDescription.species ||
    experimentDescription.strain ||
    experimentDescription.sex ||
    experimentDescription.organ
  );

  return (
    <div className="border rounded p-m bg-contrast-5">
      <h3 className="text-l font-semibold mb-m flex items-center gap-s">
        <Icon icon="vaadin:info-circle" className="text-primary" />
        Project Metadata
      </h3>

      {/* Project Information */}
      <div className="mb-m">
        <h4 className="font-semibold text-m mb-s">Project Information</h4>
        <div className="grid grid-cols-2 gap-s text-s">
          <div>
            <span className="text-secondary">Name:</span>
            <span className="ml-s font-medium">{metadata.projectName || 'Unnamed'}</span>
          </div>
          <div>
            <span className="text-secondary">File:</span>
            <span className="ml-s font-medium">{metadata.originalFilename}</span>
          </div>
          <div>
            <span className="text-secondary">Experiments:</span>
            <span className="ml-s font-medium">{metadata.experimentCount}</span>
          </div>
          <div>
            <span className="text-secondary">Probes:</span>
            <span className="ml-s font-medium">{metadata.probeCount || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Experimental Description (if available) */}
      {hasExpDesc && (
        <div className="mb-m p-s bg-primary-10 rounded">
          <h4 className="font-semibold text-m mb-s flex items-center gap-s">
            <Icon icon="vaadin:flask" className="text-primary" />
            Experimental Description
          </h4>
          <div className="grid grid-cols-2 gap-s text-s">
            {experimentDescription.testArticle && (
              <div>
                <span className="text-secondary">Test Article:</span>
                <span className="ml-s font-medium">{experimentDescription.testArticle}</span>
              </div>
            )}
            {experimentDescription.species && (
              <div>
                <span className="text-secondary">Species:</span>
                <span className="ml-s font-medium">{experimentDescription.species}</span>
              </div>
            )}
            {experimentDescription.strain && (
              <div>
                <span className="text-secondary">Strain:</span>
                <span className="ml-s font-medium">{experimentDescription.strain}</span>
              </div>
            )}
            {experimentDescription.sex && (
              <div>
                <span className="text-secondary">Sex:</span>
                <span className="ml-s font-medium">{experimentDescription.sex}</span>
              </div>
            )}
            {experimentDescription.organ && (
              <div>
                <span className="text-secondary">Organ/Tissue:</span>
                <span className="ml-s font-medium">{experimentDescription.organ}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dose Information */}
      {(metadata.minDose !== null || metadata.maxDose !== null) && (
        <div className="mb-m">
          <h4 className="font-semibold text-m mb-s">Dose Information</h4>
          <div className="grid grid-cols-2 gap-s text-s">
            <div>
              <span className="text-secondary">Min Dose:</span>
              <span className="ml-s font-medium">{metadata.minDose !== null ? metadata.minDose : 'N/A'}</span>
            </div>
            <div>
              <span className="text-secondary">Max Dose:</span>
              <span className="ml-s font-medium">{metadata.maxDose !== null ? metadata.maxDose : 'N/A'}</span>
            </div>
            <div>
              <span className="text-secondary">Treatments:</span>
              <span className="ml-s font-medium">{metadata.treatmentCount || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results Summary */}
      <div>
        <h4 className="font-semibold text-m mb-s">Analysis Results</h4>
        <div className="grid grid-cols-3 gap-s text-s">
          <div>
            <span className="text-secondary">ANOVA:</span>
            <span className="ml-s font-medium">{metadata.anovaResultsCount || 0}</span>
          </div>
          <div>
            <span className="text-secondary">Williams Trend:</span>
            <span className="ml-s font-medium">{metadata.williamsTrendResultsCount || 0}</span>
          </div>
          <div>
            <span className="text-secondary">Curve Fit:</span>
            <span className="ml-s font-medium">{metadata.curveFitResultsCount || 0}</span>
          </div>
          <div>
            <span className="text-secondary">Oriogen:</span>
            <span className="ml-s font-medium">{metadata.oriogenResultsCount || 0}</span>
          </div>
          <div>
            <span className="text-secondary">BMD:</span>
            <span className="ml-s font-medium">{metadata.bmdResultsCount || 0}</span>
          </div>
          <div>
            <span className="text-secondary">Category:</span>
            <span className="ml-s font-medium">{metadata.categoryResultsCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
