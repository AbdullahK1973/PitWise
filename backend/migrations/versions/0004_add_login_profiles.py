"""add login profile fields

Revision ID: 0004_add_login_profiles
Revises: 0003_harden_database_constraints
Create Date: 2026-06-29
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_add_login_profiles"
down_revision = "0003_harden_database_constraints"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("app_users") as batch_op:
        batch_op.add_column(sa.Column("email", sa.String(length=254), nullable=True))
        batch_op.add_column(sa.Column("display_name", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("auth_provider", sa.String(length=30), nullable=False, server_default="anonymous"))
        batch_op.add_column(sa.Column("avatar_url", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("google_sub", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.create_index(batch_op.f("ix_app_users_email"), ["email"], unique=True)
        batch_op.create_index(batch_op.f("ix_app_users_google_sub"), ["google_sub"], unique=True)


def downgrade() -> None:
    with op.batch_alter_table("app_users") as batch_op:
        batch_op.drop_index(batch_op.f("ix_app_users_google_sub"))
        batch_op.drop_index(batch_op.f("ix_app_users_email"))
        batch_op.drop_column("last_login_at")
        batch_op.drop_column("google_sub")
        batch_op.drop_column("avatar_url")
        batch_op.drop_column("auth_provider")
        batch_op.drop_column("display_name")
        batch_op.drop_column("email")
