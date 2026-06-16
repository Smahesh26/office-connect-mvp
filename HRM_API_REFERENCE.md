# HRM Employee Engine API Reference

## Base URL
```
http://localhost:3000/api/hrm
```

## Authentication
All endpoints require:
- JWT token in `Authorization: Bearer <token>` header
- Active organization subscription
- "HRM" module enabled on subscription

---

## 📋 Employee Endpoints

### 1. Create Employee
**POST** `/employees`

**Request:**
```json
{
  "employeeCode": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "departmentId": "dept_id",
  "designationId": "desig_id",
  "teamId": "team_id",
  "locationId": "loc_id",
  "managerId": "manager_id",           // Optional
  "joinDate": "2025-01-01",
  "employmentType": "FULL_TIME",
  "workMode": "OFFICE",
  "salary": 50000,
  "phone": "+1-555-1234",              // Optional
  "address": "123 Main St",            // Optional
  "bankAccountNumber": "12345678",     // Optional
  "bankIFSC": "BANK0001",              // Optional
  "taxId": "TAX123456",                // Optional
  "confirmationDate": "2025-03-01",    // Optional
  "dateOfBirth": "1990-01-15",         // Optional
  "gender": "MALE",                    // Optional
  "emergencyContactName": "Jane Doe",  // Optional
  "emergencyContactPhone": "+1-555-5678" // Optional
}
```

**Response (201):**
```json
{
  "id": "emp_123",
  "employeeCode": "EMP001",
  "user": {
    "id": "user_123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "department": {
    "id": "dept_id",
    "name": "Engineering"
  },
  "designation": {
    "id": "desig_id",
    "title": "Senior Developer"
  },
  "team": {
    "id": "team_id",
    "name": "Backend"
  },
  "location": {
    "id": "loc_id",
    "name": "HQ"
  },
  "manager": null,
  "status": "ACTIVE",
  "joinDate": "2025-01-01T00:00:00Z",
  "createdAt": "2025-02-26T10:00:00Z",
  "updatedAt": "2025-02-26T10:00:00Z"
}
```

**Error Cases:**
- `400` - Employee code already exists
- `400` - Invalid relations
- `400` - Circular manager assignment
- `404` - Department/Designation/Team/Location not found
- `403` - Relation doesn't belong to organization

---

### 2. List All Employees
**GET** `/employees`

**Query Parameters:**
- None required

**Response (200):**
```json
[
  {
    "id": "emp_123",
    "employeeCode": "EMP001",
    "user": {
      "id": "user_123",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "department": { "id": "dept_id", "name": "Engineering" },
    "designation": { "id": "desig_id", "title": "Senior Developer" },
    "team": { "id": "team_id", "name": "Backend" },
    "location": { "id": "loc_id", "name": "HQ" },
    "manager": {
      "id": "emp_456",
      "employeeCode": "EMP000",
      "user": { "firstName": "Boss", "lastName": "Man", "email": "boss@company.com" }
    },
    "subordinates": [
      {
        "id": "emp_789",
        "employeeCode": "EMP002",
        "user": { "firstName": "Jane", "lastName": "Smith", "email": "jane@company.com" }
      }
    ],
    "status": "ACTIVE"
  }
]
```

---

### 3. Get Single Employee
**GET** `/employees/:employeeId`

**Response (200):**
```json
{
  "id": "emp_123",
  "employeeCode": "EMP001",
  "user": { "id": "...", "email": "...", "firstName": "...", "lastName": "..." },
  "department": { "id": "...", "name": "..." },
  "designation": { "id": "...", "title": "..." },
  "team": { "id": "...", "name": "..." },
  "location": { "id": "...", "name": "..." },
  "manager": { "id": "...", "employeeCode": "...", "user": { "firstName": "...", "lastName": "..." } },
  "subordinates": [ /* array of reports */ ],
  "status": "ACTIVE",
  "joinDate": "2025-01-01T00:00:00Z"
}
```

**Error Cases:**
- `404` - Employee not found
- `403` - Employee doesn't belong to organization

---

### 4. Update Employee
**PUT** `/employees/:employeeId`

**Request (Partial Update):**
```json
{
  "phone": "+1-555-9999",
  "address": "New Address",
  "departmentId": "new_dept_id",
  "managerId": "new_manager_id"  // Optional - validates hierarchy
}
```

**Response (200):**
```json
{
  "id": "emp_123",
  "employeeCode": "EMP001",
  "user": { ... },
  "department": { ... },
  "designation": { ... },
  "team": { ... },
  "location": { ... },
  "manager": { ... }
  // All fields including updated ones
}
```

**Error Cases:**
- `400` - Invalid relations
- `400` - Circular manager assignment
- `404` - Resource not found
- `403` - Resource doesn't belong to organization

---

### 5. Change Employee Status
**PUT** `/employees/:employeeId/status`

**Request:**
```json
{
  "status": "RESIGNED"  // ACTIVE | RESIGNED | TERMINATED | ON_LEAVE
}
```

**Response (200):**
```json
{
  "id": "emp_123",
  "status": "RESIGNED",
  "user": { ... },
  "department": { ... }
  // All employee fields
}
```

**Error Cases:**
- `400` - Invalid status value
- `400` - TERMINATED employees cannot be re-activated
- `404` - Employee not found
- `403` - Employee doesn't belong to organization

---

### 6. Assign Manager
**PUT** `/employees/:employeeId/manager`

**Request:**
```json
{
  "managerId": "emp_manager_id"
}
```

**Response (200):**
```json
{
  "id": "emp_123",
  "manager": {
    "id": "emp_manager_id",
    "employeeCode": "EMP_MGR",
    "user": {
      "firstName": "Boss",
      "lastName": "Figure",
      "email": "boss@company.com"
    }
  },
  "subordinates": [ /* updated list */ ]
  // All employee fields
}
```

**Error Cases:**
- `400` - Employee cannot be their own manager
- `400` - Circular manager assignment detected (includes depth info)
- `400` - Manager chain exceeds maximum depth (10 levels)
- `404` - Employee/Manager not found
- `403` - Resources don't belong to organization

**Circular Assignment Examples:**
```
Scenario 1: Self-assignment
PUT /api/hrm/employees/emp1/manager
{ "managerId": "emp1" }
→ 400 "Employee cannot be their own manager"

Scenario 2: A → B → A (2-level loop)
→ 400 "Circular manager assignment detected at depth 1"

Scenario 3: A → B → C → ... → K → ? (exceeds 10 levels)
→ 400 "Manager chain exceeds maximum depth (10 levels)"
```

---

### 7. Assign Shift
**POST** `/employees/:employeeId/shifts`

**Request:**
```json
{
  "shiftId": "shift_id"
}
```

**Response (201):**
```json
{
  "id": "emp_shift_123",
  "employee": {
    "id": "emp_123",
    "employeeCode": "EMP001",
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  },
  "shift": {
    "id": "shift_id",
    "name": "Morning Shift",
    "startTime": "09:00",
    "endTime": "17:00"
  }
}
```

**Error Cases:**
- `400` - Employee already assigned to this shift
- `403` - Shift doesn't belong to organization
- `404` - Employee/Shift not found
- `403` - Employee doesn't belong to organization

---

## 📊 Organization Structure Endpoints

### 8. Create Department
**POST** `/departments`

**Request:**
```json
{
  "name": "Engineering"
}
```

**Response (201):**
```json
{
  "id": "dept_123",
  "organizationId": "org_123",
  "name": "Engineering"
}
```

---

### 9. Create Designation
**POST** `/designations`

**Request:**
```json
{
  "title": "Senior Developer"
}
```

**Response (201):**
```json
{
  "id": "desig_123",
  "organizationId": "org_123",
  "title": "Senior Developer"
}
```

---

### 10. Create Team
**POST** `/teams`

**Request:**
```json
{
  "name": "Backend"
}
```

**Response (201):**
```json
{
  "id": "team_123",
  "organizationId": "org_123",
  "name": "Backend"
}
```

---

### 11. Create Location
**POST** `/locations`

**Request:**
```json
{
  "name": "HQ"
}
```

**Response (201):**
```json
{
  "id": "loc_123",
  "organizationId": "org_123",
  "name": "HQ"
}
```

---

### 12. Get Organization Structure Summary
**GET** `/structure`

**Response (200):**
```json
{
  "departments": [
    { "id": "dept_123", "name": "Engineering", "employeeCount": 15 },
    { "id": "dept_456", "name": "Sales", "employeeCount": 8 }
  ],
  "designations": [
    { "id": "desig_123", "title": "Senior Developer", "employeeCount": 5 },
    { "id": "desig_456", "title": "Junior Developer", "employeeCount": 10 }
  ],
  "teams": [
    { "id": "team_123", "name": "Backend", "employeeCount": 7 },
    { "id": "team_456", "name": "Frontend", "employeeCount": 6 }
  ],
  "locations": [
    { "id": "loc_123", "name": "HQ", "employeeCount": 20 },
    { "id": "loc_456", "name": "Remote", "employeeCount": 3 }
  ]
}
```

---

## 🔒 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success - GET, PUT |
| 201 | Created - POST |
| 400 | Bad Request - Invalid data, circular reference, duplicate |
| 403 | Forbidden - Organization isolation violation |
| 404 | Not Found - Resource doesn't exist |
| 401 | Unauthorized - Invalid/missing JWT |
| 500 | Server Error |

---

## 🛡️ Error Response Format

```json
{
  "message": "Error description"
}
```

**Example:**
```json
{
  "message": "Circular manager assignment detected. Cannot assign because this would create a reporting loop at depth 2"
}
```

---

## 🧪 Example Workflows

### Workflow 1: Create Complete Team Structure

```bash
# 1. Create Department
POST /api/hrm/departments
{ "name": "Engineering" }
→ Returns dept_123

# 2. Create Designation
POST /api/hrm/designations
{ "title": "Senior Developer" }
→ Returns desig_123

# 3. Create Team
POST /api/hrm/teams
{ "name": "Backend" }
→ Returns team_123

# 4. Create Location
POST /api/hrm/locations
{ "name": "HQ" }
→ Returns loc_123

# 5. Create Manager
POST /api/hrm/employees
{
  "employeeCode": "EMP000",
  "firstName": "Manager",
  "lastName": "Person",
  "email": "manager@company.com",
  "departmentId": "dept_123",
  "designationId": "desig_123",
  "teamId": "team_123",
  "locationId": "loc_123",
  "joinDate": "2024-01-01",
  "employmentType": "FULL_TIME",
  "workMode": "OFFICE",
  "salary": 80000
}
→ Returns emp_manager_123

# 6. Create Team Member
POST /api/hrm/employees
{
  "employeeCode": "EMP001",
  "firstName": "Developer",
  "lastName": "Person",
  "email": "dev@company.com",
  "departmentId": "dept_123",
  "designationId": "desig_123",
  "teamId": "team_123",
  "locationId": "loc_123",
  "managerId": "emp_manager_123",
  "joinDate": "2025-01-01",
  "employmentType": "FULL_TIME",
  "workMode": "OFFICE",
  "salary": 50000
}
→ Returns emp_dev_123
```

### Workflow 2: Test Circular Manager Prevention

```bash
# Setup: emp_A has emp_B as manager
# Setup: emp_B exists without manager

# Attempt to create circle: emp_B → emp_A
PUT /api/hrm/employees/emp_B/manager
{ "managerId": "emp_A" }
→ 400 "Circular manager assignment detected. Cannot assign because this would create a reporting loop at depth 1"
```

---

## 📞 Rate Limiting

- ⏰ Future implementation
- Currently: No rate limits enforced

---

## 🔄 Pagination

- ⏰ Future implementation
- Currently: Returns all results (max ~10,000 employees)

---

**API Documentation v1.0 - Generated 2025-02-26**
