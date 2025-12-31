import { ProjectModel } from "@models/Project.js";
import { Types } from "mongoose";
import { TransitionableManyProjectStatus } from "../rules/projectStatus.js";
 

export const transitionManyProjectsByIds = async (
  projectIds: (Types.ObjectId | string)[],
  userId: Types.ObjectId | string,
  fromStatus: TransitionableManyProjectStatus,
  toStatus: TransitionableManyProjectStatus
) => {
  const normalizedIds = projectIds.map(id => ({
    raw: id,
    isValid: Types.ObjectId.isValid(id),
    objectId: Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null,
  }));

  const validObjectIds = normalizedIds
    .filter(i => i.isValid)
    .map(i => i.objectId!);

  const projects = await ProjectModel.find({
    _id: { $in: validObjectIds },
    userId,
  }).select("_id status");

  const projectMap = new Map(
    projects.map(p => [p._id.toString(), p.status])
  );

  const results: { id: string; message: string }[] = [];
  const idsToUpdate: Types.ObjectId[] = [];

  for (const item of normalizedIds) {
    const idStr = String(item.raw);

    if (!item.isValid) {
      results.push({ id: idStr, message: "Invalid project ID" });
      continue;
    }

    const status = projectMap.get(item.objectId!.toString());

    if (!status) {
      results.push({ id: idStr, message: "Project not found or not accessible" });
      continue;
    }

    if (status !== fromStatus) {
      results.push({
        id: idStr,
        message: `Project not in ${fromStatus} state`,
      });
      continue;
    }

    idsToUpdate.push(item.objectId!);
    results.push({ id: idStr, message: "Updated successfully" });
  }

  if (idsToUpdate.length > 0) {
    await ProjectModel.updateMany(
      { _id: { $in: idsToUpdate } },
      { $set: { status: toStatus } }
    );
  }

  return results;
};
