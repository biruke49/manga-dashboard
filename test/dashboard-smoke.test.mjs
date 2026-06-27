import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();

async function source(path) {
	return readFile(join(root, path), "utf8");
}

describe("dashboard smoke coverage", () => {
	it("guards dashboard routes and refreshes auth before redirecting to login", async () => {
		const proxy = await source("src/proxy.ts");
		const rootPage = await source("src/app/page.tsx");
		const layout = await source("src/admin/components/layout/admin-layout.tsx");
		const api = await source("src/admin/lib/api.ts");

		assert.match(proxy, /matcher: \["\/", "\/login", "\/admin\/:path\*"\]/);
		assert.match(proxy, /\/auth\/refresh/);
		assert.match(proxy, /\/login/);
		assert.match(proxy, /refreshToken/);
		assert.match(proxy, /secure/);
		assert.match(rootPage, /redirect\(accessToken \? "\/admin" : "\/login"\)/);
		assert.match(api, /localStorage/);
		assert.match(api, /http:\/\/localhost:3000\/api/);
		assert.match(api, /refreshToken\?: string/);
		assert.match(api, /SameSite=Lax\$\{secure\}/);
		assert.match(layout, /getCurrentUser/);
		assert.match(layout, /reason=expired/);
	});

	it("loads dashboard summary data from employees, roles, and activity APIs", async () => {
		const adminPage = await source("src/app/admin/page.tsx");

		for (const endpoint of [
			"/employees/get-employees",
			"/roles/get-roles",
			"/activities/get-activities",
		]) {
			assert.match(adminPage, new RegExp(endpoint.replaceAll("/", "\\/")));
		}
		assert.match(adminPage, /Promise\.all/);
		assert.match(adminPage, /setUsersCount/);
		assert.match(adminPage, /setRolesCount/);
	});

	it("covers user management data loading and role/permission assignment endpoints", async () => {
		const users = await source("src/app/admin/users/page.tsx");

		for (const endpoint of [
			"/employees/get-employees",
			"/employees/create-employee",
			"/employees/update-employee",
			"/employees/delete-employee",
			"/employees/activate-or-block-employee",
			"/roles/get-roles",
			"/accounts/get-user-roles",
			"/accounts/add-account-role",
			"/accounts/remove-account-role",
			"/accounts/add-account-permission",
			"/accounts/remove-account-permission",
		]) {
			assert.match(users, new RegExp(endpoint.replaceAll("/", "\\/")));
		}
		assert.match(users, /Loading users/);
		assert.match(users, /No users yet/);
	});

	it("covers role management and role-permission editing endpoints", async () => {
		const roles = await source("src/app/admin/role-management/page.tsx");

		for (const endpoint of [
			"/roles/get-roles",
			"/roles/create-role",
			"/roles/update-role",
			"/roles/archive-role",
			"/roles/get-role-permissions",
			"/roles/add-role-permission",
			"/roles/remove-role-permission",
		]) {
			assert.match(roles, new RegExp(endpoint.replaceAll("/", "\\/")));
		}
		assert.match(roles, /Loading roles/);
		assert.match(roles, /No roles yet/);
	});

	it("covers fleet vehicle operations", async () => {
		const fleet = await source("src/app/admin/fleet/page.tsx");

		for (const endpoint of [
			"/fleet/get-vehicles",
			"/fleet/create-vehicle",
			"/fleet/update-vehicle",
			"/fleet/delete-vehicle",
			"/fleet/update-vehicle-status",
			"/fleet/lookup-vin",
		]) {
			assert.match(fleet, new RegExp(endpoint.replaceAll("/", "\\/")));
		}
		assert.match(fleet, /Unable to load fleet inventory/);
		assert.match(fleet, /VIN Lookup/);
		assert.match(fleet, /Manual Entry/);
	});

	it("covers booking operations with registered driver dropdowns", async () => {
		const bookings = await source("src/app/admin/bookings/page.tsx");

		for (const endpoint of [
			"/fleet/get-bookings",
			"/fleet/create-booking",
			"/fleet/update-booking-status",
			"/fleet/delete-booking",
			"/fleet/get-drivers",
			"/fleet/get-vehicles",
		]) {
			assert.match(bookings, new RegExp(endpoint.replaceAll("/", "\\/")));
		}
		assert.match(bookings, /Select registered driver/);
		assert.match(bookings, /Unable to load bookings/);
	});

	it("covers driver registration and management endpoints", async () => {
		const drivers = await source("src/app/admin/drivers/page.tsx");

		for (const endpoint of [
			"/fleet/get-drivers",
			"/fleet/create-driver",
			"/fleet/update-driver",
			"/fleet/delete-driver",
		]) {
			assert.match(drivers, new RegExp(endpoint.replaceAll("/", "\\/")));
		}
		assert.match(drivers, /Register Driver/);
		assert.match(drivers, /No drivers yet/);
	});

	it("covers configuration data loading and saving", async () => {
		const configuration = await source("src/app/admin/configuration/page.tsx");

		assert.match(configuration, /\/configurations\/get-configurations/);
		assert.match(configuration, /\/configurations\/update-configuration/);
		assert.match(configuration, /Maintenance Mode/);
		assert.match(configuration, /Unable to load configuration/);
	});
});
