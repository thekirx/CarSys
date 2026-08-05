# Role and permission matrix

| Permission | Owner | Branch Manager | Sales Agent | Inventory Staff | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| `settings.manage` | ✓ |  |  |  |  |
| `users.manage` | ✓ |  |  |  |  |
| `modules.manage` | ✓ |  |  |  |  |
| `financials.view_sensitive` | ✓ | ✓ |  |  |  |
| `vehicles.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `vehicles.manage` | ✓ | ✓ |  | ✓ |  |
| `reports.read` | ✓ | ✓ |  |  | ✓ |
| `audit_logs.read` | ✓ |  |  |  |  |

## Default scope

- Owner: organization-wide access.
- Branch Manager: assigned branches.
- Sales Agent: assigned branches.
- Inventory Staff: assigned branches.
- Viewer: assigned branches and read-only.

## Navigation outcome

Dashboard is available to every active member. Vehicle Inventory requires `vehicles.read`. Reports requires `reports.read`. Settings appears only when at least one settings child is permitted. Fleet Management and Vehicle Rental never appear in primary navigation while disabled.

## Financial visibility

Owner and Branch Manager can read `vehicle_financials`. Other roles cannot query sensitive acquisition or minimum-price rows, so the values do not enter their React payloads.
