"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-06-29
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "obd_codes",
        sa.Column("code", sa.String(length=12), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("urgency", sa.String(length=20), nullable=False),
        sa.Column("drive_safety", sa.String(length=30), nullable=False),
        sa.Column("likely_causes", sa.Text(), nullable=False),
        sa.Column("repair_paths", sa.Text(), nullable=False),
        sa.Column("cost_range", sa.String(length=80), nullable=False),
        sa.Column("mechanic_questions", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.PrimaryKeyConstraint("code"),
    )
    op.create_table(
        "vehicles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("make", sa.String(length=80), nullable=False),
        sa.Column("model", sa.String(length=80), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("engine", sa.String(length=80), nullable=True),
        sa.Column("mileage", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "scans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=12), nullable=False),
        sa.Column("symptoms", sa.Text(), nullable=True),
        sa.Column("urgency", sa.String(length=20), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("result_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("scans")
    op.drop_table("vehicles")
    op.drop_table("obd_codes")
