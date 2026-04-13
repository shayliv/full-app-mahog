#!/usr/bin/env python3
"""
Script to drop all tables and recreate an empty database.
"""

from sqlalchemy import text
from app.db.session import engine
from app.db.init_db import init_db_and_seed


def reset_database():
    """Drop all tables and recreate empty schema."""
    # Disable foreign key checks and drop all tables
    with engine.connect() as conn:
        print('Disabling foreign key checks...')
        conn.execute(text('SET FOREIGN_KEY_CHECKS = 0'))

        # Get all table names
        result = conn.execute(text('SHOW TABLES'))
        tables = [row[0] for row in result]

        if tables:
            print(f'Dropping {len(tables)} tables...')
            for table in tables:
                print(f'  - {table}')
                conn.execute(text(f'DROP TABLE IF EXISTS `{table}`'))
        else:
            print('No tables to drop')

        conn.execute(text('SET FOREIGN_KEY_CHECKS = 1'))
        conn.commit()
        print('✓ All tables dropped')

    print("\nCreating empty database schema...")
    init_db_and_seed()
    print("✓ Empty database schema created")
    print("\n✅ Database reset complete - ready for data import!")


if __name__ == "__main__":
    reset_database()
