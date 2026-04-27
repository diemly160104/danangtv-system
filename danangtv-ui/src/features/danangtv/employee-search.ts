import type { EmployeeDepartment, EmployeeView } from "./types";

export function searchEmployees(
  employees: EmployeeView[],
  search: string,
  department: EmployeeDepartment | "all" = "all",
  limit = 5
) {
  const q = search.trim().toLowerCase();

  if (q.length < 2) return [];

  return employees
    .filter((emp) => {
      const matchDepartment =
        department === "all" || emp.department === department;

      const searchText = `${emp.employee_code} ${emp.name}`.toLowerCase();

      return matchDepartment && searchText.includes(q);
    })
    .slice(0, limit);
}

export function formatEmployeeSuggestion(emp: EmployeeView) {
  return `${emp.employee_code} • ${emp.name}`;
}

export function formatEmployeeSuggestionWithDepartment(
  emp: EmployeeView,
  departmentLabel: (value: EmployeeDepartment) => string
) {
  return `${emp.employee_code} • ${emp.name} • ${departmentLabel(emp.department)}`;
}