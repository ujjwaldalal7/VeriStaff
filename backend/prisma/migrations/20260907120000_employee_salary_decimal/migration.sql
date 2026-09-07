ALTER TABLE "Employee"
  ALTER COLUMN "basicSalary" TYPE DECIMAL(12, 2) USING "basicSalary"::numeric,
  ALTER COLUMN "hra" TYPE DECIMAL(12, 2) USING "hra"::numeric,
  ALTER COLUMN "allowances" TYPE DECIMAL(12, 2) USING "allowances"::numeric,
  ALTER COLUMN "deductions" TYPE DECIMAL(12, 2) USING "deductions"::numeric;
