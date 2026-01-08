import { Icon } from '@vaadin/react-components';

export default function EmptyState() {
  return (
    <div className="text-center py-xl">
      <Icon
        icon="vaadin:folder-open-o"
        style={{ fontSize: '4rem' }}
        className="text-secondary mb-m"
      />
      <h3 className="text-xl font-semibold mb-s">No Projects Loaded</h3>
      <p className="text-secondary">
        Upload a .bm2 project file to get started
      </p>
    </div>
  );
}
