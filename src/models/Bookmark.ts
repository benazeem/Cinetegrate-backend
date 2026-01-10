 import { Schema,model,  type Types } from "mongoose";

export type Bookmark = {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    targetType: "Story" | "Project" | "AudioAsset" | "FinalVideo" | "SceneAsset";
    targetId: Types.ObjectId;
    createdAt: Date;
}

const BookmarkSchema = new Schema<Bookmark>(
  {
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    }   ,
    targetType: {
        type: String,
        enum: ["Story", "Project", "AudioAsset", "FinalVideo", "SceneAsset"],
        required: true,
    }   , 
    targetId: {
        type: Schema.Types.ObjectId,
        refPath: "targetType",
        required: true,
        index: true,
    }   ,
    createdAt: {
        type: Date,
        default: Date.now,
    }
} )

BookmarkSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
BookmarkSchema.index({userId:1,targetType:1,  createdAt:-1}); 



export const BookmarkModel =  model<Bookmark>("Bookmark", BookmarkSchema);