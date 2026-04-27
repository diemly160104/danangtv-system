import type { EmployeeView } from "../../types";
import { apiRequest } from "./http";
import { danangTvApiEndpoints } from "./endpoints";

function isUuid(value?: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || ""
  );
}

export async function getEmployeesApi() {
  return apiRequest<EmployeeView[]>(danangTvApiEndpoints.employees, {
    method: "GET",
  });
}

export async function createEmployeeApi(
  payload: Omit<EmployeeView, "employee_id">
) {
  return apiRequest<EmployeeView>(danangTvApiEndpoints.employees, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEmployeeApi(
  employeeId: string,
  payload: EmployeeView
) {
  return apiRequest<EmployeeView>(
    danangTvApiEndpoints.employeeById(employeeId),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export async function saveEmployeeApi(payload: EmployeeView) {
  if (isUuid(payload.employee_id)) {
    return updateEmployeeApi(payload.employee_id, payload);
  }

  const { employee_id, ...createPayload } = payload;
  return createEmployeeApi(createPayload);
}

export async function deleteEmployeeApi(employeeId: string) {
  return apiRequest<{ employee_id: string }>(
    danangTvApiEndpoints.employeeById(employeeId),
    {
      method: "DELETE",
    }
  );
}