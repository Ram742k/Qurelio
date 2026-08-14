# Qurelio Health — REST API Documentation

Base API Endpoint: `https://app.qureliohealth.com/api`

Authentication: Bearer Token via Laravel Sanctum (`Authorization: Bearer <token>`).

---

## 1. Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/login` | Authenticate user & return Sanctum Bearer Token | No |
| `POST` | `/api/logout` | Revoke current Bearer Token | Yes |
| `GET` | `/api/me` | Fetch active authenticated user profile & tenant details | Yes |

---

## 2. Health & Monitoring

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | System health check (DB, Redis, Queue, Storage) | No |

---

## 3. Patients Module

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/patients` | List patients with pagination & search filter | Yes |
| `POST` | `/api/patients` | Register new patient record | Yes |
| `GET` | `/api/patients/{id}` | Fetch patient details & medical history | Yes |
| `PUT` | `/api/patients/{id}` | Update patient demographic details | Yes |
| `DELETE` | `/api/patients/{id}` | Delete patient record | Yes |

---

## 4. Appointments Module

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/appointments` | List appointments with status & date filters | Yes |
| `POST` | `/api/appointments` | Schedule new appointment | Yes |
| `GET` | `/api/appointments/{id}` | View single appointment details | Yes |
| `PUT` | `/api/appointments/{id}` | Update appointment status/time | Yes |
| `DELETE` | `/api/appointments/{id}` | Cancel appointment | Yes |

---

## 5. OPD Queue Engine

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/queue` | List current active OPD queue tokens | Yes |
| `POST` | `/api/queue/token` | Issue new queue token for patient | Yes |
| `PUT` | `/api/queue/{id}/status` | Transition token status (`waiting` -> `serving` -> `completed`) | Yes |
| `POST` | `/api/queue/call-next` | Call next waiting patient for doctor | Yes |

---

## 6. Prescriptions Module

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/prescriptions` | List prescriptions | Yes |
| `POST` | `/api/prescriptions` | Issue new digital prescription | Yes |
| `GET` | `/api/prescriptions/{id}` | View prescription details | Yes |
| `PUT` | `/api/prescriptions/{id}` | Update prescription | Yes |
| `DELETE` | `/api/prescriptions/{id}` | Delete prescription | Yes |
| `POST` | `/api/prescriptions/{id}/share-whatsapp` | Generate WhatsApp prescription link | Yes |

---

## 7. Invoices & Billing

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices` | List clinic invoices | Yes |
| `POST` | `/api/invoices` | Generate new billing invoice | Yes |
| `POST` | `/api/payments/razorpay/create` | Create Razorpay payment order | Yes |
| `POST` | `/api/payments/phonepe/create` | Initiate PhonePe payment checkout | Yes |
| `POST` | `/api/payments/webhooks/razorpay` | Razorpay payment webhook callback | No |
| `POST` | `/api/payments/webhooks/phonepe` | PhonePe payment webhook callback | No |

---

## 8. Reports & Analytics

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/dashboard` | KPI analytics summary cards | Yes |
| `GET` | `/api/reports/revenue` | Revenue trend & payment method breakdown | Yes |
| `GET` | `/api/reports/appointments` | Doctor appointment metrics | Yes |
| `GET` | `/api/reports/patients` | Patient demographics & top prescribed medicines | Yes |
| `GET` | `/api/reports/prescriptions` | Prescriptions issue analytics | Yes |
| `GET` | `/api/reports/payments` | Paid vs pending payments breakdown | Yes |
| `GET` | `/api/reports/queue` | Queue waiting time & hourly heatmap | Yes |
| `GET` | `/api/reports/doctor-performance` | Doctor leaderboard & performance metrics | Yes |
| `GET` | `/api/reports/export` | Download CSV analytics report | Yes |

---

## 9. Settings & Administration

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings/general` | Get clinic general settings | Yes |
| `PUT` | `/api/settings/general` | Update general settings | Yes |
| `GET` | `/api/settings/clinic` | Get clinic profile | Yes |
| `PUT` | `/api/settings/clinic` | Update clinic profile & logo | Yes |
| `GET` | `/api/settings/working-hours` | Get clinic working hours | Yes |
| `PUT` | `/api/settings/working-hours` | Update clinic working hours | Yes |
| `GET` | `/api/settings/doctors` | List clinic doctors | Yes |
| `POST` | `/api/settings/doctors` | Register new doctor | Yes |
| `GET` | `/api/settings/staff` | List clinic staff members | Yes |
| `POST` | `/api/settings/staff` | Register new staff member | Yes |
| `GET` | `/api/settings/billing` | Get billing settings | Yes |
| `PUT` | `/api/settings/billing` | Update billing settings | Yes |
| `GET` | `/api/settings/notifications` | Get notification toggles | Yes |
| `PUT` | `/api/settings/notifications` | Update notification toggles | Yes |
| `GET` | `/api/settings/integrations` | Get API gateway key statuses | Yes |
| `PUT` | `/api/settings/integrations` | Update API gateway keys | Yes |
| `POST` | `/api/settings/security/password` | Change user password | Yes |
| `GET` | `/api/settings/profile` | Get user profile details | Yes |
| `PUT` | `/api/settings/profile` | Update user profile details | Yes |
| `GET` | `/api/settings/backup` | Get backup status | Yes |
| `POST` | `/api/settings/backup/trigger` | Trigger instant DB backup | Yes |
| `GET` | `/api/settings/audit-logs` | Fetch tenant audit logs | Yes |
