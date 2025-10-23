import { Button, HorizontalLayout, Icon } from '@vaadin/react-components';

interface SelectedProjectInfoProps {
  projectId: string;
  categoryResults: string[];
  selectedCategoryResult: string | null;
  onSelectCategoryResult: (result: string | null) => void;
}

export default function SelectedProjectInfo({
  projectId,
  categoryResults,
  selectedCategoryResult,
  onSelectCategoryResult
}: SelectedProjectInfoProps) {
  return (
    <div className="border rounded p-m bg-success-10 border-success">
      <h3 className="text-l font-semibold mb-m flex items-center gap-s">
        <Icon icon="vaadin:check" className="text-success" />
        Active Project: {projectId}
      </h3>

      {/* Category Results Selector */}
      {categoryResults.length > 0 && (
        <div className="mb-m">
          <label className="block mb-s font-semibold">
            Select Category Analysis Results:
          </label>
          <select
            className="w-full p-s border rounded"
            value={selectedCategoryResult || ''}
            onChange={(e) => onSelectCategoryResult(e.target.value || null)}
          >
            <option value="">-- Select a category result --</option>
            {categoryResults.map((result) => (
              <option key={result} value={result}>
                {result}
              </option>
            ))}
          </select>
        </div>
      )}

      {categoryResults.length === 0 && (
        <p className="text-secondary mb-m">
          No category analysis results found in this project.
        </p>
      )}

      <HorizontalLayout theme="spacing">
        <Button
          theme="primary success"
          disabled={!selectedCategoryResult}
          onClick={() => {
            if (selectedCategoryResult) {
              // View results will be shown below
            }
          }}
        >
          <Icon icon="vaadin:eye" slot="prefix" />
          View Results
        </Button>
        <Button disabled>
          <Icon icon="vaadin:play" slot="prefix" />
          Run Analysis
        </Button>
      </HorizontalLayout>
    </div>
  );
}
