import { Button, HorizontalLayout, Icon } from '@vaadin/react-components';

interface ProjectsListProps {
  projects: string[];
  selectedProject: string | null;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function ProjectsList({
  projects,
  selectedProject,
  onSelectProject,
  onDeleteProject
}: ProjectsListProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="border rounded p-m">
      <h2 className="text-xl font-semibold mb-m flex items-center gap-s">
        <Icon icon="vaadin:folder" />
        Loaded Projects ({projects.length})
      </h2>

      <div className="space-y-s">
        {projects.map((projectId) => (
          <div
            key={projectId}
            className={`border rounded p-m flex items-center justify-between cursor-pointer transition-colors ${
              selectedProject === projectId
                ? 'bg-primary-10 border-primary'
                : 'bg-contrast-5 hover:bg-contrast-10'
            }`}
            onClick={() => onSelectProject(projectId)}
          >
            <div className="flex items-center gap-m flex-1">
              <Icon
                icon={selectedProject === projectId ? "vaadin:check-circle" : "vaadin:circle-thin"}
                className={selectedProject === projectId ? "text-primary" : "text-secondary"}
              />
              <div>
                <div className="font-semibold">{projectId}</div>
                <div className="text-s text-secondary">
                  Click to select project
                </div>
              </div>
            </div>

            <HorizontalLayout theme="spacing-s">
              <Button
                theme="icon error tertiary"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(projectId);
                }}
              >
                <Icon icon="vaadin:trash" />
              </Button>
            </HorizontalLayout>
          </div>
        ))}
      </div>
    </div>
  );
}
