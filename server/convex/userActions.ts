import { v } from "convex/values";
import { mutation } from "./_generated/server.js";

export const upsert = mutation({
  args: {
    id: v.string(),
    email: v.string(),
    name: v.string(),
    image: v.optional(v.union(v.string(), v.null())),
    role: v.union(
      v.literal("USER"),
      v.literal("ADMIN"),
      v.literal("SUBCOMMITTEE")
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    // TODO: Add proper authentication mechanism
    // For now, this mutation is open - consider adding auth for production

    const users = ctx.db
      .query("users")
      .withIndex("by_externalId", (q: any) => q.eq("externalId", args.id));
    const existing = await users.first();

    const doc = {
      externalId: args.id,
      email: args.email.toLowerCase(),
      name: args.name,
      image: args.image ?? undefined,
      role: args.role,
      createdAt: new Date(args.createdAt).getTime(),
      updatedAt: new Date(args.updatedAt).getTime(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return { status: "updated" };
    } else {
      await ctx.db.insert("users", doc);
      return { status: "inserted" };
    }
  },
});
