import { useContext } from "react";
import { PlanContext } from "../context/PlanContext";

export function usePlan() {
  return useContext(PlanContext);
}