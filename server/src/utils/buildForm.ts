import {z} from "zod";
import { evaluateConditionalVisibility } from "./conditionalVisibility.js";

export function buildZodSchema(fields: any[]) {
  const shape: Record<string, any> = {};

  for (const f of fields) {
    let fieldSchema: any;

    switch (f.type) {
      case "text":
      case "textarea":
      case "email":
      case "url":
      case "phone":
        fieldSchema = z.string();
        if (f.type === "email") fieldSchema = fieldSchema.email("Invalid email");
        if (f.type === "url") fieldSchema = fieldSchema.url("Invalid URL");
        if (f.min) fieldSchema = fieldSchema.min(f.min);
        if (f.max) fieldSchema = fieldSchema.max(f.max);
        if (f.pattern) fieldSchema = fieldSchema.regex(new RegExp(f.pattern), "Invalid format");
        break;
      case "number":
        fieldSchema = z.number();
        if (f.min) fieldSchema = fieldSchema.min(f.min);
        if (f.max) fieldSchema = fieldSchema.max(f.max);
        break;
      case "select":
      case "radio":
        fieldSchema = z.enum(f.options as [string, ...string[]]);
        break;
      case "multiselect":
      case "checkbox":
        fieldSchema = z.array(z.enum(f.options as [string, ...string[]]));
        break;
      case "date":
        fieldSchema = z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date");
        break;
      case "file":
        fieldSchema = z.object({
          name: z.string(),
          size: z.number().max(f.maxSize ?? 10_000_000),
          type: z.string().refine(
            (v) => !f.mimeTypes || f.mimeTypes.includes(v),
            "Invalid file type"
          ),
          url: z.string().url(),
        });
        break;
      default:
        fieldSchema = z.any();
    }

    if (!f.required) fieldSchema = fieldSchema.optional();
    shape[f.name] = fieldSchema;
  }

  return z.object(shape).superRefine((data, ctx) => {
    for (const f of fields) {
      if (f.visibleIf && !evaluateConditionalVisibility(f.visibleIf, data)) {
        if (f.required && data[f.name]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${f.label} should not be present when condition not met`,
            path: [f.name],
          });
        }
      }
    }
  });
}
