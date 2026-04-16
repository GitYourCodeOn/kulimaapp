import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  pgEnum,
} from "drizzle-orm/pg-core"

// ─── Enums ───────────────────────────────────────────────────────────────────

export const farmingTypeEnum = pgEnum("farming_type", [
  "dairy",
  "pigs",
  "chickens",
  "crops",
])

export const userRoleEnum = pgEnum("user_role", [
  "manager",
  "worker",
])

export const animalSexEnum = pgEnum("animal_sex", ["M", "F"])

export const animalStatusEnum = pgEnum("animal_status", [
  "Active",
  "Dry",
  "Sick",
  "Heifer",
  "Gilt",
  "Piglet",
  "Sold",
  "Deceased",
])

export const milkSessionEnum = pgEnum("milk_session", ["AM", "PM"])

export const flockTypeEnum = pgEnum("flock_type", [
  "Layer",
  "Broiler",
  "Breeder",
])

export const fieldStatusEnum = pgEnum("field_status", [
  "Growing",
  "Harvesting",
  "Fallow",
  "Prepared",
])

export const inviteRoleEnum = pgEnum("invite_role", ["manager", "worker"])

// ─── Better Auth tables ───────────────────────────────────────────────────────
// Better Auth requires: user, session, account, verification

export const authUser = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const authSession = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => authUser.id, { onDelete: "cascade" }),
})

export const authAccount = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => authUser.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const authVerification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ─── Application tables ───────────────────────────────────────────────────────

export const farms = pgTable("farms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => authUser.id),
  farmingType: farmingTypeEnum("farming_type").notNull(),
  location: text("location"),
  sizeHa: real("size_ha"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .references(() => authUser.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("worker"),
  farmId: text("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const animals = pgTable("animals", {
  id: text("id").primaryKey(),
  farmId: text("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  species: text("species").notNull(),
  breed: text("breed"),
  sex: animalSexEnum("sex"),
  dob: text("dob"),
  role: text("role"),
  status: animalStatusEnum("status").default("Active"),
  // Self-referencing parents — text to allow "EXT_" prefixed external sires/dams
  sireId: text("sire_id"),
  damId: text("dam_id"),
  weight: real("weight"),
  notes: text("notes"),
})

export const breedingRecords = pgTable("breeding_records", {
  id: text("id").primaryKey(),
  farmId: text("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  maleId: text("male_id")
    .notNull()
    .references(() => animals.id),
  femaleId: text("female_id")
    .notNull()
    .references(() => animals.id),
  date: text("date").notNull(),
  outcome: text("outcome"),
  litterSize: integer("litter_size"),
  notes: text("notes"),
})

export const healthRecords = pgTable("health_records", {
  id: text("id").primaryKey(),
  animalId: text("animal_id")
    .notNull()
    .references(() => animals.id, { onDelete: "cascade" }),
  farmId: text("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  treatedBy: text("treated_by"),
})

export const milkRecords = pgTable("milk_records", {
  id: text("id").primaryKey(),
  farmId: text("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  session: milkSessionEnum("session").notNull(),
  totalLitres: real("total_litres").notNull(),
})

export const flocks = pgTable("flocks", {
  id: text("id").primaryKey(),
  farmId: text("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: flockTypeEnum("type").notNull(),
  breed: text("breed"),
  count: integer("count").notNull().default(0),
  henHouseNo: text("hen_house_no"),
  dob: text("dob"),
  status: text("status").default("Active"),
  eggDay: integer("egg_day"),
  avgWeight: real("avg_weight"),
  mortality: integer("mortality").default(0),
})

export const fields = pgTable("fields", {
  id: text("id").primaryKey(),
  farmId: text("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sizeHa: real("size_ha"),
  soilType: text("soil_type"),
  crop: text("crop"),
  variety: text("variety"),
  plantDate: text("plant_date"),
  harvestEst: text("harvest_est"),
  status: fieldStatusEnum("status").default("Fallow"),
  irrigated: boolean("irrigated").default(false),
})

export const harvestRecords = pgTable("harvest_records", {
  id: text("id").primaryKey(),
  fieldId: text("field_id")
    .notNull()
    .references(() => fields.id, { onDelete: "cascade" }),
  farmId: text("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  crop: text("crop").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  pricePerUnit: real("price_per_unit"),
})

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  farmId: text("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type"),
  storageKey: text("storage_key").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
})

export const invites = pgTable("invites", {
  id: text("id").primaryKey(),
  farmId: text("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: inviteRoleEnum("role").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
})

export const platformAdmins = pgTable("platform_admins", {
  userId: text("user_id")
    .primaryKey()
    .references(() => authUser.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const impersonationLogs = pgTable("impersonation_logs", {
  id: text("id").primaryKey(),
  adminId: text("admin_id")
    .notNull()
    .references(() => authUser.id),
  impersonatedUserId: text("impersonated_user_id")
    .notNull()
    .references(() => users.id),
  farmId: text("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  reason: text("reason"),
})
