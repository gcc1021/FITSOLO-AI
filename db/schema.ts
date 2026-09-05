/**
 * FITSOLO D1 数据结构说明。
 * 生产数据库的实际变更只由 drizzle/ 下的不可变 SQL 迁移执行。
 */
export const checkInRecordsSchema = {
  table: 'check_in_records',
  columns: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    userId: 'TEXT NOT NULL',
    checkInDate: 'TEXT NOT NULL',
    trainingType: 'TEXT NOT NULL',
    durationMinutes: 'INTEGER NOT NULL',
    note: "TEXT NOT NULL DEFAULT ''",
    createdAt: 'TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP'
  },
  unique: ['user_id', 'check_in_date']
} as const;
