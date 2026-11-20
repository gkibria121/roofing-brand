import type { StepDef } from "../domain/types";

export const PROPERTY_STEPS: Record<"buildingType" | "stories", StepDef> = {
  stories: {
    id: "stories",
    category: "property",
    summaryLabel: "Stories",
    title: "Does your building have multiple stories?",
    options: () => [
      { value: "single", label: "Single story" },
      { value: "multiple", label: "Multiple stories" },
    ],
  },
  buildingType: {
    id: "buildingType",
    category: "property",
    summaryLabel: "Building type",
    title: "What type of building do you have?",
    options: () => [
      { value: "residential", label: "Residential", description: "House, townhome or duplex" },
      { value: "commercial", label: "Commercial", description: "Office, retail, warehouse or multi-family" },
    ],
  },
};
