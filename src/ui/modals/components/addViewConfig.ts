import { DataFieldType, type DataField } from "src/lib/dataframe/dataframe";

/** Same string set the board's view settings offer as a group-by field. */
const GROUP_FIELD_TYPES = new Set<string>([DataFieldType.String, "String", "text"]);

/**
 * Stored string fields a new board can group by. Derived fields are rejected
 * by the board (`derived-status-field`), so they are not offered here.
 */
export function boardGroupFields(
  fields: readonly Pick<DataField, "name" | "type" | "derived">[]
): string[] {
  return fields
    .filter((field) => field.derived !== true && GROUP_FIELD_TYPES.has(field.type))
    .map((field) => field.name);
}

/**
 * When the view name is itself a group field, that field is the grouping.
 * A name that is not a field leaves the choice alone.
 */
export function groupFieldPreset(
  viewName: string,
  fieldNames: readonly string[]
): string | undefined {
  const trimmed = viewName.trim();
  return fieldNames.includes(trimmed) ? trimmed : undefined;
}

/** Board config written at create time. Empty means no grouping was chosen. */
export function boardConfigForCreate(
  groupByField: string
): { groupByField: string } | undefined {
  const name = groupByField.trim();
  if (!name) return undefined;
  return { groupByField: name };
}
