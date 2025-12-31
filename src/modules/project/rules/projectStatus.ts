export const ACTIVE_STATUSES: ["active", "draft"] = ["active", "draft"];
export const NON_DELETED_STATUSES: ["active", "draft", "archive"] = [
  "active",
  "draft",
  "archive",
];

export type ProjectStatus = "draft" | "active" | "archive" | "delete";
export type TransitionableManyProjectStatus = Exclude<
  ProjectStatus,
  "draft"
>;


export function canTransition(
  from: "draft" | "active" | "archive" | "delete",
  to: "draft" | "active" | "archive" | "delete"
) {
  const allowed = {
    draft: ["active", "delete"],
    active: ["archive", "delete"],
    archive: ["active", "delete"],
    delete: ["active"],
  };
  return allowed[from]?.includes(to);
}
 

// When Deleting or Archiving a project, set visibility to private
// Additional status rules can be added here as needed
