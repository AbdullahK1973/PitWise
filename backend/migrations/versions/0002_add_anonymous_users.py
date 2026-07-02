"""add anonymous users

Revision ID: 0002_add_anonymous_users
Revises: 0001_initial_schema
Create Date: 2026-06-29
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_add_anonymous_users"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "app_users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("external_id", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_app_users_external_id"), "app_users", ["external_id"], unique=True)

    bind = op.get_bind()
    now = sa.func.current_timestamp()
    app_users = sa.table(
        "app_users",
        sa.column("id", sa.Integer),
        sa.column("external_id", sa.String),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )
    bind.execute(
        app_users.insert().values(
            id=1,
            external_id="legacy-local-user",
            created_at=now,
            updated_at=now,
        )
    )

    with op.batch_alter_table("vehicles") as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f("ix_vehicles_user_id"), ["user_id"], unique=False)
        batch_op.create_foreign_key("fk_vehicles_user_id_app_users", "app_users", ["user_id"], ["id"])

    with op.batch_alter_table("scans") as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f("ix_scans_user_id"), ["user_id"], unique=False)
        batch_op.create_foreign_key("fk_scans_user_id_app_users", "app_users", ["user_id"], ["id"])

    bind.execute(sa.text("UPDATE vehicles SET user_id = 1 WHERE user_id IS NULL"))
    bind.execute(sa.text("UPDATE scans SET user_id = 1 WHERE user_id IS NULL"))

    with op.batch_alter_table("vehicles") as batch_op:
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=False)

    with op.batch_alter_table("scans") as batch_op:
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("scans") as batch_op:
        batch_op.drop_constraint("fk_scans_user_id_app_users", type_="foreignkey")
        batch_op.drop_index(batch_op.f("ix_scans_user_id"))
        batch_op.drop_column("user_id")

    with op.batch_alter_table("vehicles") as batch_op:
        batch_op.drop_constraint("fk_vehicles_user_id_app_users", type_="foreignkey")
        batch_op.drop_index(batch_op.f("ix_vehicles_user_id"))
        batch_op.drop_column("user_id")

    op.drop_index(op.f("ix_app_users_external_id"), table_name="app_users")
    op.drop_table("app_users")
