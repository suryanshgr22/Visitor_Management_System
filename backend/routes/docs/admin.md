

---

# Admin API Documentation

**Base URL**: `/api/admin`  
**Note**: All routes (except `/login`) require JWT token in the `Authorization` header:  
`Authorization: Bearer <token>`

---

## 1. Login Admin

- **Method**: `POST`  
- **URL**: `/api/admin/login`  
- **Description**: Logs in an admin and returns a JWT token.

### Request Body
```json
{
  "username": "admin123",
  "password": "adminpass"
}
```

### Response
```json
{
  "token": "jwt_token_here",
  "admin": {
    "_id": "123",
    "name": "Admin",
    "username": "admin123"
  }
}
```

---

## 2. Add Admin

- **Method**: `POST`  
- **URL**: `/api/admin/addAdmin`  
- **Description**: Adds a new admin.

### Request Body
```json
{
  "name": "New Admin",
  "username": "admin456",
  "password": "securePass123"
}
```

### Response
```json
{
  "message": "Admin created successfully",
  "admin": {
    "_id": "...",
    "name": "New Admin",
    "username": "admin456"
  }
}
```

---

## 3. Add Host

- **Method**: `POST`  
- **URL**: `/api/admin/addHost`  
- **Description**: Adds a new host (employee).

### Request Body
```json
{
  "name": "Host Name",
  "department": "IT",
  "employeeId": "EMP001",
  "username": "host123",
  "password": "hostpass",
  "contact": "9999999999"
}
```

### Response
```json
{
  "message": "Host added successfully",
  "host": { ... }
}
```

---

## 4. Delete Host

- **Method**: `DELETE`  
- **URL**: `/api/admin/deleteHost`  
- **Description**: Deletes a host by username.

### Request Body
```json
{
  "username": "host123"
}
```

### Response
```json
{
  "message": "Host deleted successfully",
  "host": { ... }
}
```

---

## 5. Add Gate

- **Method**: `POST`  
- **URL**: `/api/admin/addGate`  
- **Description**: Adds a new gate/security login.

### Request Body
```json
{
  "name": "Main Gate",
  "loginId": "main123",
  "password": "securepass"
}
```

### Response
```json
{
  "message": "Gate added successfully",
  "gate": { ... }
}
```

---

## 6. Delete Gate

- **Method**: `DELETE`  
- **URL**: `/api/admin/deleteGate`  
- **Description**: Deletes a gate by `loginId`.

### Request Body
```json
{
  "loginId": "main123"
}
```

### Response
```json
{
  "message": "Gate deleted successfully",
  "gate": { ... }
}
```

---

## 7. Set Pre-Approval Limit


### **PUT /api/admin/setLimit**

**Description:** Set a custom approval limit for an individual host.

**Request Body:**
```json
{
  "hostId": "643d21f4c981f30012a8e000",
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Approval limit set for host"
}
```

---

### **PUT /api/admin/setLimitAll**

**Description:** Set a common approval limit for **all** hosts.

**Request Body:**
```json
{
  "limit": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Approval limit set for all hosts"
}
```


---

## 8. Get All Hosts

- **Method**: `GET`  
- **URL**: `/api/admin/hosts`  
- **Description**: Returns a list of all host accounts.

### Response
```json
{
  "hosts": [ { ... }, { ... } ]
}
```

---

## 9. Get All Gates

- **Method**: `GET`  
- **URL**: `/api/admin/gates`  
- **Description**: Returns a list of all gate accounts.

### Response
```json
{
  "gates": [ { ... }, { ... } ]
}
```

--- 

