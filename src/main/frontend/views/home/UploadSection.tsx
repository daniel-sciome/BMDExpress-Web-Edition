import { Button, Upload, Icon } from '@vaadin/react-components';
import { UploadBeforeEvent } from '@vaadin/upload';

interface UploadSectionProps {
  loading: boolean;
  onUpload: (e: UploadBeforeEvent) => Promise<void>;
}

export default function UploadSection({ loading, onUpload }: UploadSectionProps) {
  return (
    <div className="border rounded p-m bg-contrast-5">
      <h2 className="text-xl font-semibold mb-m flex items-center gap-s">
        <Icon icon="vaadin:upload" />
        Load BMD Project
      </h2>

      <p className="text-secondary mb-m">
        Upload a .bm2 project file to begin analysis
      </p>

      <Upload
        accept=".bm2"
        maxFiles={1}
        onUploadBefore={onUpload}
        style={{ width: '100%' }}
      >
        <Button slot="add-button" theme="primary" disabled={loading}>
          <Icon icon="vaadin:folder-open" slot="prefix" />
          {loading ? 'Loading...' : 'Choose .bm2 File'}
        </Button>
      </Upload>
    </div>
  );
}
