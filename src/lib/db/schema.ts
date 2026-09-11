import {
  pgTable,
  serial,
  integer,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const gyms = pgTable('gyms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const climbers = pgTable('climbers', {
  id: uuid('id').primaryKey(),
  nickname: text('nickname').notNull(),
  avatar: text('avatar').notNull(),
  signature: text('signature'),
  secret: text('secret'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable(
  'bookings',
  {
    id: serial('id').primaryKey(),
    climberId: uuid('climber_id')
      .notNull()
      .references(() => climbers.id, { onDelete: 'cascade' }),
    gymId: integer('gym_id')
      .notNull()
      .references(() => gyms.id, { onDelete: 'cascade' }),
    date: text('date').notNull(), // YYYY-MM-DD
    time: text('time').notNull(), // HH:MM
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('bookings_date_idx').on(table.date),
    uniqueIndex('bookings_unique_idx').on(table.climberId, table.date, table.time),
  ],
);

export type Gym = typeof gyms.$inferSelect;
export type Climber = typeof climbers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
