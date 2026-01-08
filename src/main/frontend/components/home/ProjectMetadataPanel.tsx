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
    experimentDescription.casrn ||
    experimentDescription.dsstox ||
    experimentDescription.subjectType ||
    experimentDescription.species ||
    experimentDescription.strain ||
    experimentDescription.sex ||
    experimentDescription.organ ||
    experimentDescription.cellLine ||
    experimentDescription.studyDuration ||
    experimentDescription.articleType ||
    experimentDescription.articleRoute ||
    experimentDescription.articleVehicle ||
    experimentDescription.administrationMeans ||
    experimentDescription.platform ||
    experimentDescription.provider
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

          {/* Test Article Information */}
          {(experimentDescription.testArticle || experimentDescription.casrn || experimentDescription.dsstox) && (
            <div className="mb-s">
              <h5 className="font-medium text-s text-secondary mb-xs">Test Article</h5>
              <div className="grid grid-cols-2 gap-s text-s">
                {experimentDescription.testArticle && (
                  <div className="col-span-2">
                    <span className="text-secondary">Name:</span>
                    <span className="ml-s font-medium">{experimentDescription.testArticle}</span>
                  </div>
                )}
                {experimentDescription.casrn && (
                  <div>
                    <span className="text-secondary">CASRN:</span>
                    <span className="ml-s font-medium">{experimentDescription.casrn}</span>
                  </div>
                )}
                {experimentDescription.dsstox && (
                  <div>
                    <span className="text-secondary">DSSTOX:</span>
                    <span className="ml-s font-medium">{experimentDescription.dsstox}</span>
                  </div>
                )}
                {experimentDescription.articleType && (
                  <div>
                    <span className="text-secondary">Type:</span>
                    <span className="ml-s font-medium">{experimentDescription.articleType}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subject Information */}
          {(experimentDescription.subjectType || experimentDescription.species || experimentDescription.strain ||
            experimentDescription.sex || experimentDescription.organ || experimentDescription.cellLine) && (
            <div className="mb-s">
              <h5 className="font-medium text-s text-secondary mb-xs">Subject</h5>
              <div className="grid grid-cols-2 gap-s text-s">
                {experimentDescription.subjectType && (
                  <div>
                    <span className="text-secondary">Type:</span>
                    <span className="ml-s font-medium">{experimentDescription.subjectType}</span>
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
                {experimentDescription.cellLine && (
                  <div>
                    <span className="text-secondary">Cell Line:</span>
                    <span className="ml-s font-medium">{experimentDescription.cellLine}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Administration Details */}
          {(experimentDescription.articleRoute || experimentDescription.articleVehicle ||
            experimentDescription.administrationMeans || experimentDescription.studyDuration) && (
            <div className="mb-s">
              <h5 className="font-medium text-s text-secondary mb-xs">Administration</h5>
              <div className="grid grid-cols-2 gap-s text-s">
                {experimentDescription.articleRoute && (
                  <div>
                    <span className="text-secondary">Route:</span>
                    <span className="ml-s font-medium">{experimentDescription.articleRoute}</span>
                  </div>
                )}
                {experimentDescription.articleVehicle && (
                  <div>
                    <span className="text-secondary">Vehicle:</span>
                    <span className="ml-s font-medium">{experimentDescription.articleVehicle}</span>
                  </div>
                )}
                {experimentDescription.administrationMeans && (
                  <div>
                    <span className="text-secondary">Means:</span>
                    <span className="ml-s font-medium">{experimentDescription.administrationMeans}</span>
                  </div>
                )}
                {experimentDescription.studyDuration && (
                  <div>
                    <span className="text-secondary">Duration:</span>
                    <span className="ml-s font-medium">{experimentDescription.studyDuration}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Platform Information */}
          {(experimentDescription.platform || experimentDescription.provider) && (
            <div>
              <h5 className="font-medium text-s text-secondary mb-xs">Platform</h5>
              <div className="grid grid-cols-2 gap-s text-s">
                {experimentDescription.platform && (
                  <div className="col-span-2">
                    <span className="text-secondary">Platform:</span>
                    <span className="ml-s font-medium">{experimentDescription.platform}</span>
                  </div>
                )}
                {experimentDescription.provider && (
                  <div>
                    <span className="text-secondary">Provider:</span>
                    <span className="ml-s font-medium">{experimentDescription.provider}</span>
                  </div>
                )}
              </div>
            </div>
          )}
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
