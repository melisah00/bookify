"""fix_event_table_schema

Revision ID: [generated_id]
Revises: 217509ad52b8
Create Date: [generated_date]

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '[generated_id]'  # This will be auto-generated
down_revision: Union[str, None] = '217509ad52b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing columns to event table if they don't exist."""
    
    # Create enum type if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'eventformatenum') THEN
                CREATE TYPE eventformatenum AS ENUM ('in_person', 'virtual', 'hybrid');
            END IF;
        END $$;
    """)
    
    # Add columns if they don't exist
    op.execute("""
        DO $$ 
        BEGIN
            -- Add start_date column
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'event' AND column_name = 'start_date') THEN
                ALTER TABLE event ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
            END IF;
            
            -- Add end_date column
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'event' AND column_name = 'end_date') THEN
                ALTER TABLE event ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
            END IF;
            
            -- Add format column
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'event' AND column_name = 'format') THEN
                ALTER TABLE event ADD COLUMN format eventformatenum;
            END IF;
            
            -- Add cover_image column
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'event' AND column_name = 'cover_image') THEN
                ALTER TABLE event ADD COLUMN cover_image VARCHAR;
            END IF;
            
            -- Add created_at column
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'event' AND column_name = 'created_at') THEN
                ALTER TABLE event ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            END IF;
            
            -- Add updated_at column
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'event' AND column_name = 'updated_at') THEN
                ALTER TABLE event ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            END IF;
            
            -- Drop old columns if they exist
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'event' AND column_name = 'event_date') THEN
                ALTER TABLE event DROP COLUMN event_date;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'event' AND column_name = 'is_online') THEN
                ALTER TABLE event DROP COLUMN is_online;
            END IF;
        END $$;
    """)
    
    # Create event_tags table if it doesn't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS event_tags (
            event_id INTEGER NOT NULL REFERENCES event(id),
            tag_id INTEGER NOT NULL REFERENCES event_tag(id),
            PRIMARY KEY (event_id, tag_id)
        );
    """)


def downgrade() -> None:
    """Reverse the migration."""
    # Add back old columns
    op.add_column('event', sa.Column('event_date', postgresql.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('event', sa.Column('is_online', sa.Boolean(), nullable=True))
    
    # Remove new columns
    op.drop_column('event', 'start_date')
    op.drop_column('event', 'end_date')
    op.drop_column('event', 'format')
    op.drop_column('event', 'cover_image')
    op.drop_column('event', 'created_at')
    op.drop_column('event', 'updated_at')
    
    # Drop event_tags table
    op.drop_table('event_tags')
    
    # Drop enum type
    op.execute("DROP TYPE IF EXISTS eventformatenum;")