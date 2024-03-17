export const selectOptions = {
  "newtabbehavior": [{ id: "0", value: "Open as Child" }, { id: "1", value: "Open as Sibling" }],
} as const;

export const selectOptionNames: Record<keyof typeof selectOptions, string> = {
  "newtabbehavior": "New Tab Behavior",
}
